import { describe, it, expect } from 'vitest';
import { buildWorkflowGraph } from '../utils/workflowReducer';

describe('buildWorkflowGraph', () => {
  it('should return empty structures for empty input', () => {
    const { nodes, stateByAgent } = buildWorkflowGraph([]);
    expect(nodes).toEqual([]);
    expect(stateByAgent).toEqual({});
  });

  it('should track agent lifecycle (Start -> Complete)', () => {
    const events = [
      { event_type: 'AgentStarted', payload: { agent_type: 'intake_agent' }, created_at: 'T1' },
      { event_type: 'AgentCompleted', payload: { agent_type: 'intake_agent', result: { foo: 'bar' } }, created_at: 'T2' }
    ];

    const { nodes, stateByAgent } = buildWorkflowGraph(events);
    
    expect(nodes).toHaveLength(2);
    expect(stateByAgent['intake_agent']).toBeDefined();
    expect(stateByAgent['intake_agent'].status).toBe('COMPLETED');
    expect(stateByAgent['intake_agent'].output).toEqual({ foo: 'bar' });
  });

  it('should track capability invocations and denials', () => {
    const events = [
      { event_type: 'AgentStarted', payload: { agent_type: 'routing_agent' }, created_at: 'T1' },
      { event_type: 'CapabilityInvoked', payload: { agent_type: 'routing_agent', capability: 'db_read' }, created_at: 'T2' },
      { event_type: 'CapabilityDenied', payload: { agent_type: 'routing_agent', capability: 'dangerous_write', reason: 'Not allowed' }, created_at: 'T3' }
    ];

    const { stateByAgent, nodes } = buildWorkflowGraph(events);
    
    expect(stateByAgent['routing_agent'].capabilities).toHaveLength(2);
    expect(stateByAgent['routing_agent'].capabilities[0]).toEqual({ type: 'invoked', capability: 'db_read', timestamp: 'T2' });
    expect(stateByAgent['routing_agent'].capabilities[1]).toEqual({ type: 'denied', capability: 'dangerous_write', reason: 'Not allowed', timestamp: 'T3' });
    
    expect(nodes.filter(n => n.type === 'CapabilityInvoked')).toHaveLength(1);
    expect(nodes.filter(n => n.type === 'CapabilityDenied')).toHaveLength(1);
  });

  it('should track StateTransitions', () => {
    const events = [
      { event_type: 'StateTransition', payload: { from: 'CREATED', to: 'INTAKE' }, created_at: 'T1' }
    ];
    
    const { nodes } = buildWorkflowGraph(events);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('StateTransition');
    expect(nodes[0].to).toBe('INTAKE');
  });

  it('should track Failures', () => {
    const events = [
      { event_type: 'AgentStarted', payload: { agent_type: 'drafting_agent' }, created_at: 'T1' },
      { event_type: 'Failed', payload: { agent_type: 'drafting_agent', error: 'Boom' }, created_at: 'T2' }
    ];
    
    const { stateByAgent } = buildWorkflowGraph(events);
    expect(stateByAgent['drafting_agent'].status).toBe('FAILED');
    expect(stateByAgent['drafting_agent'].error).toBe('Boom');
  });
});
