import React, { useState, useEffect, useRef } from 'react';

const STAGES = [
  { id: 'intake', humanLabel: 'Understanding your issue...', humanDone: '✓ Complaint Understood', name: 'Intake Agent' },
  { id: 'routing', humanLabel: 'Finding responsible department...', humanDone: '✓ Department Identified', name: 'Routing Agent' },
  { id: 'drafting', humanLabel: 'Preparing official complaint notice...', humanDone: '✓ Official Notice Drafted', name: 'Drafting Agent' },
  { id: 'escalation', humanLabel: 'Checking urgency & safety rules...', humanDone: '✓ Urgency & Priority Assessed', name: 'Escalation Agent' },
  { id: 'submission', humanLabel: 'Submitting complaint to civic ledger...', humanDone: '✓ Complaint Registered', name: 'Submission & Tracking Agent' }
];

const AIPipelineVisualizer = ({ isProcessing, agentEvents = [], onProceed = null }) => {
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedPayload, setSelectedPayload] = useState(null);
  const [typedDraft, setTypedDraft] = useState('');
  const typewriterRef = useRef(null);

  // Extract events by stage
  const getStageSnapshot = (stageId) => {
    const stepEvt = agentEvents.find(e => e.event === 'agent_step' && (e.data?.stage || '').toLowerCase().includes(stageId));
    const startEvt = agentEvents.find(e => e.event === 'agent_start' && (e.data?.agent_name || '').toLowerCase().includes(stageId));
    const errEvt = agentEvents.find(e => e.event === 'agent_error' && (e.data?.stage || '').toLowerCase().includes(stageId));

    let status = 'WAITING';
    if (stepEvt) status = 'COMPLETED';
    else if (errEvt) status = 'FAILED';
    else if (startEvt) status = 'RUNNING';

    const snapshot = stepEvt?.data?.snapshot || startEvt?.data || {};
    return { status, snapshot };
  };

  // Extracted Output Datasets
  const intakeData = getStageSnapshot('intake').snapshot.output;
  const routingData = getStageSnapshot('routing').snapshot.output;
  const draftingData = getStageSnapshot('drafting').snapshot.output;
  const escalationData = getStageSnapshot('escalation').snapshot.output;
  
  const completeEvent = agentEvents.find(e => e.event === 'complete');
  const finalIncident = completeEvent?.data;

  // ChatGPT typewriter effect for notice body
  useEffect(() => {
    const fullText = draftingData?.complaint_text || draftingData?.body || '';
    if (!fullText) return;

    let index = 0;
    setTypedDraft('');
    if (typewriterRef.current) clearInterval(typewriterRef.current);

    typewriterRef.current = setInterval(() => {
      index += 3;
      if (index >= fullText.length) {
        setTypedDraft(fullText);
        clearInterval(typewriterRef.current);
      } else {
        setTypedDraft(fullText.slice(0, index));
      }
    }, 15);

    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, [draftingData]);

  // Overall pipeline progress percentage
  const completedCount = STAGES.filter(st => getStageSnapshot(st.id).status === 'COMPLETED').length;
  const progressPercent = Math.min(100, Math.round((completedCount / STAGES.length) * 100));

  const isComplete = !!completeEvent;
  const hasError = agentEvents.some(e => e.event === 'agent_error' || e.event === 'error');

  return (
    <div className="w-full bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="inline-flex items-center space-x-2 bg-black text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
              {!isComplete && !hasError ? (
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping"></span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              )}
              <span>{!isComplete && !hasError ? 'AI Multi-Agent System Active' : 'Pipeline Execution 100% Complete'}</span>
            </span>
            <span className="text-xs font-bold text-[#4A4A4A] bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
              Progress: {progressPercent}%
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0A0A0A] tracking-tight">👋 Intelligent Civic Assistant</h2>
        </div>

        <button
          type="button"
          onClick={() => setPanelOpen(!panelOpen)}
          className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#0A0A0A] rounded-full text-xs font-bold transition-all border border-neutral-200 flex items-center space-x-1.5 self-start sm:self-auto shadow-xs"
        >
          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <span>{panelOpen ? 'Collapse AI Reasoning' : 'View AI Reasoning'}</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden border border-neutral-200 p-0.5">
        <div
          className="bg-black h-full transition-all duration-700 rounded-full"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Synchronized Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: Citizen View (Conversational Assistant & Step Cards) */}
        <div className={`space-y-5 ${panelOpen ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          
          {/* STEP 1: INTAKE AGENT RESULT */}
          {getStageSnapshot('intake').status !== 'WAITING' && (
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-[#0A0A0A] uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span>✓ Complaint Understood</span>
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Step 1 of 5</span>
              </div>

              {intakeData ? (
                <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-neutral-200 text-xs">
                  <div>
                    <span className="text-[10px] text-[#4A4A4A] block uppercase font-bold">Issue Type</span>
                    <span className="font-extrabold text-[#0A0A0A] capitalize">{intakeData.issue_category || 'Garbage Collection'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#4A4A4A] block uppercase font-bold">Location</span>
                    <span className="font-extrabold text-[#0A0A0A] truncate block">{intakeData.location?.address || 'Gandhi Street, Ward 12'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#4A4A4A] block uppercase font-bold">Urgency Priority</span>
                    <span className="font-extrabold text-[#0A0A0A] uppercase">{intakeData.priority || 'Medium'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#4A4A4A] block uppercase font-bold">Evidence</span>
                    <span className="font-extrabold text-[#0A0A0A]">{intakeData.image_url ? 'Attached Photo' : 'Text Input'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#4A4A4A] italic animate-pulse">Understanding your issue...</p>
              )}
            </div>
          )}

          {/* STEP 2: ROUTING AGENT RESULT */}
          {getStageSnapshot('routing').status !== 'WAITING' && (
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-[#0A0A0A] uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span>✓ Department Identified</span>
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Step 2 of 5</span>
              </div>

              {routingData ? (
                <div className="bg-white p-3.5 rounded-xl border border-neutral-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#4A4A4A] font-medium">Responsible Department:</span>
                    <span className="font-extrabold text-[#0A0A0A] text-right">{routingData.department}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#4A4A4A] font-medium">Jurisdictional Ward:</span>
                    <span className="font-bold text-[#0A0A0A]">{routingData.ward || 'Ward 12'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#4A4A4A] font-medium">Designated Officer:</span>
                    <span className="font-bold text-[#0A0A0A]">{routingData.responsible_authority || 'Sanitation Inspector'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#4A4A4A] italic animate-pulse">Finding responsible department & knowledge base...</p>
              )}
            </div>
          )}

          {/* STEP 3: DRAFTING AGENT RESULT */}
          {getStageSnapshot('drafting').status !== 'WAITING' && (
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-[#0A0A0A] uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span>✓ Official Notice Drafted</span>
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Step 3 of 5</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-2">
                <span className="text-[10px] font-mono text-neutral-400 block uppercase tracking-wider font-bold">
                  AI Auto-Drafting Notice (ChatGPT Typewriter Flow)
                </span>
                <div className="text-xs text-[#0A0A0A] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  {typedDraft || 'Preparing official complaint...'}
                  {typedDraft.length < (draftingData?.complaint_text?.length || 0) && (
                    <span className="inline-block w-2 h-3 bg-black ml-1 animate-pulse"></span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ESCALATION AGENT RESULT */}
          {getStageSnapshot('escalation').status !== 'WAITING' && (
            <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-2xl space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-[#0A0A0A] uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span>✓ Urgency & SLA Assessed</span>
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Step 4 of 5</span>
              </div>

              {escalationData || routingData ? (
                <div className="grid grid-cols-3 gap-2 bg-white p-3.5 rounded-xl border border-neutral-200 text-xs text-center">
                  <div className="p-2 bg-neutral-50 rounded-lg">
                    <span className="text-[10px] text-[#4A4A4A] block font-bold">Priority</span>
                    <span className="font-extrabold text-[#0A0A0A] uppercase">{routingData?.severity || 'Medium'}</span>
                  </div>
                  <div className="p-2 bg-neutral-50 rounded-lg">
                    <span className="text-[10px] text-[#4A4A4A] block font-bold">Target SLA</span>
                    <span className="font-extrabold text-[#0A0A0A]">{routingData?.sla_hours || 48} Hours</span>
                  </div>
                  <div className="p-2 bg-neutral-50 rounded-lg">
                    <span className="text-[10px] text-[#4A4A4A] block font-bold">Escalation</span>
                    <span className={`font-extrabold ${escalationData?.escalated ? 'text-red-600' : 'text-green-700'}`}>
                      {escalationData?.escalated ? 'Triggered' : 'Not Required'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#4A4A4A] italic animate-pulse">Checking priority & emergency rules...</p>
              )}
            </div>
          )}

          {/* STEP 5: FINAL REGISTRATION CONFIRMATION & PROCEED ACTION */}
          {getStageSnapshot('submission').status === 'COMPLETED' && (
            <div className="bg-[#E8EEFB] border border-[#C6D8F8] p-5 rounded-2xl space-y-4 animate-fade-in text-[#2B3A4C]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                  <span>✓ Complaint Registered</span>
                </span>
                <span className="text-[10px] font-bold uppercase">Step 5 of 5</span>
              </div>

              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-[#C6D8F8] text-xs">
                <div>
                  <span className="text-[10px] text-[#4A4A4A] block uppercase font-bold">Official Incident ID</span>
                  <span className="font-mono text-base font-extrabold text-[#0A0A0A]">
                    {finalIncident?.incident_id || 'CR-2026-93827'}
                  </span>
                </div>
                <span className="text-xs font-extrabold bg-black text-white px-3 py-1 rounded-full uppercase shadow-xs">
                  Submitted
                </span>
              </div>

              {onProceed && (
                <button
                  type="button"
                  onClick={() => onProceed(finalIncident)}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-extrabold py-3.5 px-6 rounded-full text-xs transition-all shadow-md flex items-center justify-center space-x-2 btn-pill"
                >
                  <span>Proceed to Grievance Ticket & Tracking →</span>
                </button>
              )}
            </div>
          )}

        </div>

        {/* RIGHT PANEL: Live AI Reasoning & Execution Graph (Perplexity Style) */}
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

              {/* Node Execution Cards */}
              <div className="space-y-3">
                {STAGES.map((st, idx) => {
                  const { status, snapshot } = getStageSnapshot(st.id);
                  const duration = snapshot.duration_ms ? `${(snapshot.duration_ms / 1000).toFixed(2)}s` : null;
                  const confidence = snapshot.confidence ? `${(snapshot.confidence * 100).toFixed(0)}%` : null;

                  return (
                    <div
                      key={st.id}
                      className={`p-3.5 rounded-2xl border transition-all text-xs font-mono ${
                        status === 'COMPLETED' ? 'bg-neutral-800/80 border-green-500/50 text-white' :
                        status === 'RUNNING' ? 'bg-black border-blue-500 shadow-lg shadow-blue-500/20 text-white ring-1 ring-blue-500' :
                        status === 'FAILED' ? 'bg-red-950/50 border-red-500 text-red-300' : 'bg-neutral-950/40 border-neutral-800 text-neutral-500'
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
                            status === 'COMPLETED' ? 'bg-green-600 text-white' :
                            status === 'RUNNING' ? 'bg-blue-600 text-white animate-pulse' :
                            status === 'FAILED' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-500'
                          }`}>
                            {status}
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

                      {/* Structured Output Toggle */}
                      {status === 'COMPLETED' && snapshot.output && (
                        <button
                          onClick={() => setSelectedPayload(selectedPayload === st.id ? null : st.id)}
                          className="mt-2 text-[10px] text-blue-400 hover:underline block"
                        >
                          {selectedPayload === st.id ? 'Hide Structured Output' : 'View Structured Output JSON'}
                        </button>
                      )}

                      {selectedPayload === st.id && (
                        <pre className="mt-2 p-2.5 bg-black text-green-400 rounded-xl text-[9px] overflow-x-auto max-h-40 border border-neutral-800">
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
