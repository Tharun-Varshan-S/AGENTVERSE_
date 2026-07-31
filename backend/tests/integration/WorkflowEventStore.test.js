const mongoose = require('mongoose');
const { appendEvent } = require('../../eventbus/WorkflowEventStore');
const Workflow = require('../../models/Workflow');
const WorkflowEvent = require('../../models/WorkflowEvent');

jest.mock('../../models/Workflow');
jest.mock('../../models/WorkflowEvent');

describe('WorkflowEventStore', () => {
  beforeAll(() => {
    // Mock mongoose connection state for testing
    Object.defineProperty(mongoose, 'connection', {
      value: { readyState: 1 },
      configurable: true
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should append an event and increment the sequence number', async () => {
    Workflow.findOneAndUpdate.mockResolvedValue({
      workflow_id: 'wf-1',
      event_seq: 1
    });

    WorkflowEvent.create.mockResolvedValue({
      workflow_id: 'wf-1',
      seq: 1,
      event_type: 'TestEvent',
      payload: { foo: 'bar' },
      actor: 'system'
    });

    const event = await appendEvent('wf-1', 'TestEvent', { foo: 'bar' });
    
    expect(Workflow.findOneAndUpdate).toHaveBeenCalledWith(
      { workflow_id: 'wf-1' },
      { $inc: { event_seq: 1 }, $set: expect.any(Object), $setOnInsert: { incident_id: 'wf-1' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    expect(WorkflowEvent.create).toHaveBeenCalledWith({
      workflow_id: 'wf-1',
      seq: 1,
      event_type: 'TestEvent',
      payload: { foo: 'bar' },
      actor: 'system'
    });

    expect(event.seq).toBe(1);
    expect(event.event_type).toBe('TestEvent');
  });

  it('should throw if mongo connection is not ready and in-memory is false', async () => {
    const originalReadyState = mongoose.connection.readyState;
    const originalFallback = process.env.ALLOW_INMEMORY_FALLBACK;
    
    Object.defineProperty(mongoose, 'connection', {
      value: { readyState: 0 },
      configurable: true
    });
    process.env.ALLOW_INMEMORY_FALLBACK = 'false';
    
    await expect(appendEvent('wf-1', 'TestEvent')).rejects.toThrow(/no active MongoDB connection/);
    
    Object.defineProperty(mongoose, 'connection', {
      value: { readyState: originalReadyState },
      configurable: true
    });
    process.env.ALLOW_INMEMORY_FALLBACK = originalFallback;
  });
});
