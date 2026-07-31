const withAgentRuntime = require('../../agents/runtime/withAgentRuntime');
const AllowlistEnforcer = require('../../agents/runtime/AllowlistEnforcer');
const AgentPlan = require('../../models/AgentPlan');
const AgentMetric = require('../../models/AgentMetric');
const eventBus = require('../../eventbus/EventBus');
const { getManifest } = require('../../agents/runtime/agentManifests');

jest.mock('../../agents/runtime/AllowlistEnforcer');
jest.mock('../../models/AgentPlan');
jest.mock('../../models/AgentMetric');
jest.mock('../../eventbus/EventBus');
jest.mock('../../agents/runtime/agentManifests');

describe('Agent Execution Boundaries (Golden Set)', () => {
  const mockContext = { agentType: 'testAgent', agentName: 'Test Agent', workflowId: 'wf-boundary' };

  beforeEach(() => {
    jest.clearAllMocks();
    AgentPlan.create.mockResolvedValue({});
    AgentMetric.create.mockResolvedValue({});
    eventBus.publishSafe.mockResolvedValue({});
    getManifest.mockReturnValue({ declaredSteps: ['step1'], budget: { maxWallClockMs: 50, maxRetries: 0 } });
  });

  it('Boundary: Disallowed operations (CapabilityDenied)', async () => {
    // Mock the enforcer to reject this agent Type entirely
    AllowlistEnforcer.assertAllowed.mockRejectedValue(new Error('CAPABILITY_DENIED'));
    
    const maliciousAgent = jest.fn().mockResolvedValue({ status: 'COMPLETED' });
    const wrapped = withAgentRuntime(maliciousAgent, mockContext);
    
    await expect(wrapped({})).rejects.toThrow('CAPABILITY_DENIED');
    
    // Validate CapabilityDenied was published
    expect(eventBus.publishSafe).toHaveBeenCalledWith('wf-boundary', 'CapabilityDenied', expect.any(Object), 'Test Agent');
    // Ensure agent didn't run
    expect(maliciousAgent).not.toHaveBeenCalled();
  });

  it('Boundary: Budget exhaustion (infinite planner)', async () => {
    AllowlistEnforcer.assertAllowed.mockResolvedValue({ capabilities: [] });
    
    // An agent that loops forever or takes too long
    const infiniteAgent = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)));
    const wrapped = withAgentRuntime(infiniteAgent, mockContext);
    
    await expect(wrapped({})).rejects.toThrow(/budget exceeded/);
    
    // Validate BudgetExceeded event
    expect(eventBus.publishSafe).toHaveBeenCalledWith('wf-boundary', 'BudgetExceeded', expect.any(Object), 'Test Agent');
  });
});
