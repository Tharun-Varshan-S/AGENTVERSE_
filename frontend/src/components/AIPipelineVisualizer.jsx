import React, { useState, useEffect } from 'react';

const STAGES = [
  { id: 'intake_agent', humanLabel: 'Understanding your issue...', humanDone: '✓ Complaint Understood', name: 'Intake Agent', desc: 'Parsing intent, urgency & entities' },
  { id: 'routing_agent', humanLabel: 'Finding responsible department...', humanDone: '✓ Department & SLA Matched', name: 'Routing Agent', desc: 'Matching municipal ward & cited resources' },
  { id: 'drafting_agent', humanLabel: 'Preparing official complaint notice...', humanDone: '✓ Official Notice Drafted', name: 'Drafting Agent', desc: 'Formulating legal grievance notice' },
  { id: 'escalation_agent', humanLabel: 'Checking urgency & safety rules...', humanDone: '✓ Urgency & Safety Assessed', name: 'Escalation Agent', desc: 'Evaluating emergency rules & zonal escalation' },
  { id: 'submission_&_tracking_agent', humanLabel: 'Submitting complaint to civic ledger...', humanDone: '✓ Complaint Registered', name: 'Submission & Tracking Agent', desc: 'Assigning Tracking ID & QR code verification' }
];

const AIPipelineVisualizer = ({ isProcessing, agentEvents = [] }) => {
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedPayload, setSelectedPayload] = useState(null);

  if (!isProcessing && agentEvents.length === 0) return null;

  // Extract human-friendly progress events
  const humanProgressEvents = agentEvents.filter(e => e.event === 'human_progress');
  const latestHumanMsg = humanProgressEvents.length > 0 ? humanProgressEvents[humanProgressEvents.length - 1].data?.text : 'Processing complaint...';

  const hasError = agentEvents.some(e => e.event === 'agent_error' || e.event === 'error');
  const isComplete = agentEvents.some(e => e.event === 'complete');
  const pipelineState = hasError ? 'failed' : isComplete ? 'completed' : 'running';

  return (
    <div className="w-full bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="inline-flex items-center space-x-2 bg-black text-white px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-1 shadow-md">
            {pipelineState === 'running' ? (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            )}
            <span>{pipelineState === 'running' ? 'AI Assistant Processing' : 'Pipeline Execution Complete'}</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A0A0A]">Civic AI Assistant Active</h2>
        </div>

        <button
          type="button"
          onClick={() => setPanelOpen(!panelOpen)}
          className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#0A0A0A] rounded-full text-xs font-bold transition-all border border-neutral-200 flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <span>{panelOpen ? 'Collapse AI Processing' : 'View AI Processing'}</span>
        </button>
      </div>

      {/* Split-Screen Layout: Left = Citizen Friendly View, Right = Live AI Engine Processing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-start">
        
        {/* LEFT PANEL: Citizen View (Friendly Progress Updates) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-[#F4F7FE] border border-[#D4E2FB] rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0A0A0A]">Assistant Status</h3>
                <p className="text-xs text-[#2B3A4C] font-semibold">{latestHumanMsg}</p>
              </div>
            </div>

            {/* Human Progress Checklist */}
            <div className="space-y-3 pt-3 border-t border-[#C6D8F8]">
              {STAGES.map((st, idx) => {
                const stepEvent = agentEvents.find(e => e.event === 'agent_step' && (e.data?.stage || '').includes(st.id.split('_')[0]));
                const startEvent = agentEvents.find(e => e.event === 'agent_start' && (e.data?.agent_name || '').toLowerCase().includes(st.id.split('_')[0]));
                
                let isDone = !!stepEvent;
                let isRunning = !isDone && !!startEvent;

                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone ? 'bg-green-600 text-white' :
                        isRunning ? 'bg-black text-white animate-pulse' : 'bg-neutral-200 text-neutral-500'
                      }`}>
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span className={`font-semibold ${isDone ? 'text-black' : isRunning ? 'text-blue-900 font-bold' : 'text-neutral-400'}`}>
                        {isDone ? st.humanDone : st.humanLabel}
                      </span>
                    </div>

                    {isRunning && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">
                        In Progress...
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* RIGHT PANEL: Live AI Processing Node Graph (Technical View) */}
        {panelOpen && (
          <div className="lg:col-span-6 space-y-4 animate-fade-in">
            <div className="bg-neutral-900 text-white rounded-3xl p-6 shadow-2xl space-y-4 border border-neutral-800">
              
              <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping"></span>
                  <h3 className="text-xs font-mono font-bold text-green-400 uppercase tracking-widest">
                    AI Processing Graph
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">Orchestrator v2.4</span>
              </div>

              {/* Animated Node Graph Stack */}
              <div className="space-y-3">
                {STAGES.map((st, idx) => {
                  const stepEvent = agentEvents.find(e => e.event === 'agent_step' && (e.data?.stage || '').includes(st.id.split('_')[0]));
                  const startEvent = agentEvents.find(e => e.event === 'agent_start' && (e.data?.agent_name || '').toLowerCase().includes(st.id.split('_')[0]));
                  const errEvent = agentEvents.find(e => e.event === 'agent_error' && (e.data?.stage || '').includes(st.id.split('_')[0]));

                  let nodeStatus = 'WAITING';
                  if (stepEvent) nodeStatus = 'COMPLETED';
                  else if (errEvent) nodeStatus = 'FAILED';
                  else if (startEvent) nodeStatus = 'RUNNING';

                  const snapshot = stepEvent?.data?.snapshot || startEvent?.data || {};
                  const duration = snapshot.duration_ms ? `${(snapshot.duration_ms / 1000).toFixed(2)}s` : null;
                  const confidence = snapshot.confidence ? `${(snapshot.confidence * 100).toFixed(0)}%` : null;

                  return (
                    <div
                      key={st.id}
                      className={`p-3.5 rounded-2xl border transition-all text-xs font-mono ${
                        nodeStatus === 'COMPLETED' ? 'bg-neutral-800/80 border-green-500/50 text-white' :
                        nodeStatus === 'RUNNING' ? 'bg-black border-blue-500 shadow-lg shadow-blue-500/20 text-white ring-1 ring-blue-500' :
                        nodeStatus === 'FAILED' ? 'bg-red-950/50 border-red-500 text-red-300' : 'bg-neutral-950/40 border-neutral-800 text-neutral-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold opacity-60">0{idx + 1}</span>
                          <span className="font-bold text-white">{st.name}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-[10px]">
                          {confidence && (
                            <span className="text-green-400 bg-green-950/80 px-2 py-0.5 rounded font-bold border border-green-800">
                              {confidence} Conf.
                            </span>
                          )}
                          {duration && (
                            <span className="text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded font-mono border border-blue-800">
                              {duration}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            nodeStatus === 'COMPLETED' ? 'bg-green-600 text-white' :
                            nodeStatus === 'RUNNING' ? 'bg-blue-600 text-white animate-pulse' :
                            nodeStatus === 'FAILED' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-500'
                          }`}>
                            {nodeStatus}
                          </span>
                        </div>
                      </div>

                      {/* Technical Execution Logs */}
                      {snapshot.logs && snapshot.logs.length > 0 && (
                        <div className="mt-2 text-[10px] text-neutral-400 space-y-0.5 pt-2 border-t border-neutral-800">
                          {snapshot.logs.slice(-2).map((l, i) => (
                            <div key={i} className="truncate">➜ {l}</div>
                          ))}
                        </div>
                      )}

                      {/* Payload Toggle */}
                      {nodeStatus === 'COMPLETED' && snapshot.output && (
                        <button
                          onClick={() => setSelectedPayload(selectedPayload === st.id ? null : st.id)}
                          className="mt-2 text-[10px] text-blue-400 hover:underline block"
                        >
                          {selectedPayload === st.id ? 'Hide Structured Output' : 'View Structured Output JSON'}
                        </button>
                      )}

                      {selectedPayload === st.id && (
                        <pre className="mt-2 p-2.5 bg-black text-green-400 rounded-xl text-[9px] overflow-x-auto max-h-40">
                          {JSON.stringify(snapshot.output, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default AIPipelineVisualizer;
