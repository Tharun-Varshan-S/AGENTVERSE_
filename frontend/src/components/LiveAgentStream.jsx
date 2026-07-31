import React from 'react';

export default function LiveAgentStream({ events = [] }) {
  // Show only the most recent 10 events
  const displayEvents = events.slice(-10).reverse();

  return (
    <div style={{
      background: '#1a1d24',
      border: '1px solid #2d3748',
      borderRadius: '12px',
      padding: '24px',
      marginTop: '20px',
      color: '#fff',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#6366f1' }}>
          ⚡ Multi-Agent Execution Stream
        </h3>
        <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 500 }}>
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-ping mr-2"></span>
          Live Stream
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
        {displayEvents.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
            Waiting for live events...
          </div>
        )}

        {displayEvents.map((evt, idx) => {
          const type = evt.event_type || evt.event || 'Unknown';
          const payload = evt.payload || evt.data || {};
          const actor = evt.actor || payload.agent_type || payload.agent_name || 'system';
          
          let badgeColor = '#374151'; // Default
          let borderStyle = '1px solid #374151';
          let icon = '🔄';

          if (type.includes('Completed') || type === 'agent_step' || type === 'StateTransition') {
            badgeColor = '#065f46';
            borderStyle = '1px solid #10b981';
            icon = '✅';
          } else if (type.includes('Failed') || type === 'agent_error' || type.includes('Denied')) {
            badgeColor = '#991b1b';
            borderStyle = '1px solid #ef4444';
            icon = '❌';
          } else if (type.includes('Started') || type === 'agent_start' || type.includes('Invoked')) {
            badgeColor = '#1e40af';
            borderStyle = '1px solid #3b82f6';
            icon = '⚡';
          }

          return (
            <div
              key={evt.seq || evt.id || idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#0f172a',
                border: borderStyle,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontSize: '1.2rem',
                lineHeight: 1,
                padding: '6px',
                background: '#1e293b',
                borderRadius: '6px'
              }}>
                {icon}
              </div>

              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', textTransform: 'capitalize' }}>
                    {actor.replace(/_/g, ' ')}
                  </h4>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '12px',
                    background: badgeColor,
                    color: '#ffffff'
                  }}>
                    {type}
                  </span>
                </div>
                
                <div style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {evt.workflow_id && <span style={{ fontFamily: 'monospace', background: '#334155', padding: '2px 4px', borderRadius: '4px', fontSize: '0.7rem' }}>{evt.workflow_id}</span>}
                  
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {type === 'StateTransition' ? `Transition: ${payload.from} → ${payload.to}` : 
                     payload.capability ? `Capability: ${payload.capability}` :
                     payload.service ? `Service: ${payload.service}` : 
                     payload.message ? payload.message : 
                     JSON.stringify(payload).substring(0, 80) + '...'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

