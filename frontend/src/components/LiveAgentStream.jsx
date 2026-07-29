import React from 'react';

const STAGES = [
  {
    id: 'intake',
    title: 'Intake Agent',
    description: 'Multimodal LLM classification & OpenStreetMap spatial geocoding',
    icon: '🔍'
  },
  {
    id: 'routing',
    title: 'Routing Agent',
    description: 'LangGraph conditional branching & department SLA assignment',
    icon: '🔀'
  },
  {
    id: 'drafting',
    title: 'Drafting Agent',
    description: 'LLM formal municipal legal notice generation',
    icon: '📝'
  },
  {
    id: 'tracking',
    title: 'Tracking Agent',
    description: 'Ticket audit history initialization & status setup',
    icon: '📌'
  }
];

export default function LiveAgentStream({ activeStage, completedStages, aiError }) {
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
        <span style={{ fontSize: '0.85rem', color: aiError ? '#ef4444' : '#10b981', fontWeight: 500 }}>
          {aiError ? '⚠️ AI Error Detected' : activeStage === 'complete' ? '✅ Workflow Complete' : '🔄 Processing Live...'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {STAGES.map((stage, idx) => {
          const isCompleted = completedStages.includes(stage.id);
          const isActive = activeStage === stage.id;
          const isFailed = aiError && isActive;

          let badgeColor = '#374151'; // Pending
          let badgeText = 'Pending';
          let borderStyle = '1px solid #374151';

          if (isCompleted) {
            badgeColor = '#065f46';
            badgeText = 'Completed';
            borderStyle = '1px solid #10b981';
          } else if (isFailed) {
            badgeColor = '#991b1b';
            badgeText = 'AI Failure';
            borderStyle = '1px solid #ef4444';
          } else if (isActive) {
            badgeColor = '#1e40af';
            badgeText = 'Processing...';
            borderStyle = '1px solid #3b82f6';
          }

          return (
            <div
              key={stage.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '14px 18px',
                borderRadius: '8px',
                background: isActive ? '#1e293b' : '#0f172a',
                border: borderStyle,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontSize: '1.5rem',
                lineHeight: 1,
                padding: '8px',
                background: '#334155',
                borderRadius: '8px'
              }}>
                {stage.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                    {stage.title}
                  </h4>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: badgeColor,
                    color: '#ffffff'
                  }}>
                    {badgeText}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {aiError && (
        <div style={{
          marginTop: '20px',
          padding: '14px 18px',
          background: '#450a0a',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          color: '#fca5a5',
          fontSize: '0.9rem'
        }}>
          <strong>❌ AI Engine Execution Exception:</strong>
          <div style={{ marginTop: '4px', fontFamily: 'monospace' }}>{aiError}</div>
        </div>
      )}
    </div>
  );
}
