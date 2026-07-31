const withAgentRuntime = require('../agents/runtime/withAgentRuntime');
const AllowlistEnforcer = require('../agents/runtime/AllowlistEnforcer');
const AgentPlan = require('../models/AgentPlan');
const AgentMetric = require('../models/AgentMetric');
const eventBus = require('../eventbus/EventBus');
const { getManifest } = require('../agents/runtime/agentManifests');

jest.mock('../agents/runtime/AllowlistEnforcer');
jest.mock('../models/AgentPlan');
jest.mock('../models/AgentMetric');
jest.mock('../eventbus/EventBus');
jest.mock('../agents/runtime/agentManifests');

describe('withAgentRuntime', () => {
  const mockContext = { agentType: 'testAgent', agentName: 'Test Agent', workflowId: 'wf-123' };
  
  beforeEach(() => {
    jest.clearAllMocks();
    getManifest.mockReturnValue({ declaredSteps: ['step1'], budget: { maxWallClockMs: 100, maxRetries: 1 } });
    AllowlistEnforcer.assertAllowed.mockResolvedValue({
      capabilities: ['cap1'], services: ['svc1'], external_apis: ['api1']
    });
    AgentPlan.create.mockResolvedValue({});
    AgentMetric.create.mockResolvedValue({});
    eventBus.publishSafe.mockResolvedValue({});
  });

  it('should execute wrapped agent function and return enriched result', async () => {
    const mockAgentFn = jest.fn().mockResolvedValue({ status: 'COMPLETED', output: 'ok' });
    const wrappedFn = withAgentRuntime(mockAgentFn, mockContext);
    
    const result = await wrappedFn({ input: 'data' });
    
    expect(mockAgentFn).toHaveBeenCalledWith({ input: 'data' });
    expect(result.status).toBe('COMPLETED');
    expect(result.toolsUsed.capabilities).toContain('cap1');
    expect(result.metrics.executionTimeMs).toBeDefined();
    
    expect(AgentPlan.create).toHaveBeenCalled();
    expect(AgentMetric.create).toHaveBeenCalled();
  });

  it('should enforce budget and throw BUDGET_EXCEEDED when wall clock limit is hit', async () => {
    // an agent that takes 200ms, budget is 100ms
    const slowAgentFn = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)));
    const wrappedFn = withAgentRuntime(slowAgentFn, mockContext);
    
    await expect(wrappedFn({})).rejects.toThrow(/budget exceeded/);
    
    expect(eventBus.publishSafe).toHaveBeenCalledWith('wf-123', 'BudgetExceeded', expect.any(Object), 'Test Agent');
    expect(AgentPlan.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'BUDGET_EXCEEDED' }));
  });

  it('should retry on normal errors if under maxRetries', async () => {
    const errorFn = jest.fn()
      .mockRejectedValueOnce(new Error('transient error'))
      .mockResolvedValueOnce({ status: 'COMPLETED' });
      
    const wrappedFn = withAgentRuntime(errorFn, mockContext);
    
    const result = await wrappedFn({});
    expect(result.status).toBe('COMPLETED');
    expect(errorFn).toHaveBeenCalledTimes(2);
    expect(eventBus.publishSafe).toHaveBeenCalledWith('wf-123', 'RetryStarted', expect.any(Object), 'Test Agent');
    expect(eventBus.publishSafe).toHaveBeenCalledWith('wf-123', 'RetrySucceeded', expect.any(Object), 'Test Agent');
  });

  it('should deny execution if AllowlistEnforcer throws', async () => {
    AllowlistEnforcer.assertAllowed.mockRejectedValue(new Error('CAPABILITY_DENIED'));
    const mockAgentFn = jest.fn();
    const wrappedFn = withAgentRuntime(mockAgentFn, mockContext);
    
    await expect(wrappedFn({})).rejects.toThrow('CAPABILITY_DENIED');
    expect(mockAgentFn).not.toHaveBeenCalled();
    expect(eventBus.publishSafe).toHaveBeenCalledWith('wf-123', 'CapabilityDenied', expect.any(Object), 'Test Agent');
  });
});
