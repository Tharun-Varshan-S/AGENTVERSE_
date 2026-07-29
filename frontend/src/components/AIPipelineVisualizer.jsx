import React, { useState, useEffect, useRef } from 'react';

const AGENTS = [
  { 
    id: 'intake', 
    name: 'Intake Agent', 
    desc: 'Parsing multi-modal inputs & structured data',
    logs: [
      "Initializing multimodal parser...",
      "Extracting keywords and entities from given forms...",
      "Identifying location markers from coordinates...",
      "Structuring payload for routing engine..."
    ]
  },
  { 
    id: 'routing', 
    name: 'Routing Agent', 
    desc: 'Analyzing severity & matching department',
    logs: [
      "Receiving structured complaint from Intake Agent...",
      "Validating complaint schema...",
      "Extracting complaint metadata...",
      "Running NLP severity analysis...",
      "Severity Score = 0.87 (High)",
      "Detecting complaint category...",
      "Category = Civic Infrastructure",
      "Searching department registry...",
      "Querying Government Department Directory...",
      "Resolving jurisdiction...",
      "Contacting Civic Department Service...",
      "Waiting for department response...",
      "Retrying request (1/3)...",
      "Retrying request (2/3)...",
      "Department endpoint responding slowly...",
      "Performing DNS lookup...",
      "Connection timeout...",
      "Retrying secure connection...",
      "ERROR: Department Registry Service Unreachable",
      "ERROR: DNS_PROBE_FINISHED_NXDOMAIN",
      "Routing process interrupted."
    ]
  },
  { 
    id: 'drafting', 
    name: 'Drafting Agent', 
    desc: 'Formulating official grievance draft',
    logs: [
      "Generating official grievance template..."
    ]
  },
  { 
    id: 'tracking', 
    name: 'Tracking Agent', 
    desc: 'Registering unique incident ID in ledger',
    logs: [
      "Connecting to central civic ledger..."
    ]
  },
  { 
    id: 'escalation', 
    name: 'Escalation Agent', 
    desc: 'Establishing SLA and escalation rules',
    logs: [
      "Evaluating SLA requirements for assigned department..."
    ]
  }
];

const AIPipelineVisualizer = ({ isProcessing }) => {
  const [pipelineState, setPipelineState] = useState('running'); // 'running', 'failed'
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1);
  const [currentLogIndex, setCurrentLogIndex] = useState(-1);
  const [typedChars, setTypedChars] = useState(0);

  const terminalRef = useRef(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [typedChars, currentLogIndex]);

  useEffect(() => {
    if (!isProcessing) {
      setCurrentAgentIndex(-1);
      setCurrentLogIndex(-1);
      setTypedChars(0);
      setPipelineState('running');
      return;
    }

    if (currentAgentIndex === -1) {
      setCurrentAgentIndex(0);
      setCurrentLogIndex(0);
      setTypedChars(0);
      setPipelineState('running');
      return;
    }

    if (pipelineState === 'failed') return;

    const agent = AGENTS[currentAgentIndex];

    if (currentLogIndex < agent.logs.length) {
      const currentLog = agent.logs[currentLogIndex];
      
      if (typedChars < currentLog.length) {
        // Typing effect (faster for standard logs, normal for others)
        const timer = setTimeout(() => {
          setTypedChars(prev => prev + 1);
        }, 15); 
        return () => clearTimeout(timer);
      } else {
        // Line finished typing, pause naturally before next line
        let delay = agent.id === 'routing' ? Math.floor(Math.random() * 500) + 700 : 800;
        
        if (agent.id === 'routing' && currentLogIndex === agent.logs.length - 1) {
          // Final error line reached
          const timer = setTimeout(() => {
            setPipelineState('failed');
          }, 500);
          return () => clearTimeout(timer);
        }

        const timer = setTimeout(() => {
          setCurrentLogIndex(prev => prev + 1);
          setTypedChars(0);
        }, delay);
        return () => clearTimeout(timer);
      }
    } else {
      // Agent finished (Intake Agent)
      const timer = setTimeout(() => {
        setCurrentAgentIndex(prev => prev + 1);
        setCurrentLogIndex(0);
        setTypedChars(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, currentAgentIndex, currentLogIndex, typedChars, pipelineState]);

  const handleRetry = () => {
    setPipelineState('running');
    setCurrentAgentIndex(1); // Restart Routing Agent
    setCurrentLogIndex(0);
    setTypedChars(0);
  };

  if (!isProcessing) return null;

  return (
    <div className="w-full bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl animate-fade-in flex flex-col items-center">
      
      {pipelineState === 'failed' && (
        <div className="w-full max-w-2xl bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6 flex items-start space-x-3 shadow-sm animate-fade-in">
          <svg className="w-6 h-6 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-bold text-sm">AI Pipeline Interrupted</h4>
            <p className="text-xs mt-1">Routing Agent encountered an external service failure.<br/>Awaiting manual retry.</p>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <span className="inline-flex items-center space-x-2 bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-3 shadow-md">
          {pipelineState === 'running' ? (
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
          )}
          <span>{pipelineState === 'running' ? 'AI Pipeline Active' : 'Pipeline Halted'}</span>
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A0A0A] tracking-tight">
          Processing via Autonomous Agents
        </h2>
        <p className="text-sm text-[#4A4A4A] mt-2">
          Your complaint is being analyzed and routed by our multi-agent architecture in real-time.
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {AGENTS.map((agent, index) => {
          let status = 'pending';
          if (index < currentAgentIndex) status = 'completed';
          else if (index === currentAgentIndex) {
            status = pipelineState === 'failed' ? 'failed' : 'processing';
          }

          const isActive = status === 'processing' || status === 'failed';
          
          let cardClasses = 'bg-white border-neutral-100 opacity-60';
          if (status === 'completed') cardClasses = 'bg-[#E8EEFB] border-[#C6D8F8]';
          if (status === 'processing') cardClasses = 'bg-neutral-50 border-neutral-300 shadow-md scale-[1.02]';
          if (status === 'failed') cardClasses = 'bg-red-50 border-red-300 shadow-md scale-[1.02]';

          return (
            <div 
              key={agent.id} 
              className={`flex flex-col p-4 rounded-2xl border transition-all duration-300 ${cardClasses}`}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center mr-4 bg-white shadow-sm border border-neutral-200">
                  {status === 'completed' ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : status === 'processing' ? (
                    <svg className="animate-spin w-5 h-5 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : status === 'failed' ? (
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold text-neutral-400">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <h3 className={`font-bold text-sm ${status === 'completed' || status === 'processing' ? 'text-black' : status === 'failed' ? 'text-red-900' : 'text-neutral-500'}`}>
                      {agent.name}
                    </h3>
                    <p className={`text-xs mt-0.5 ${status === 'failed' ? 'text-red-700' : 'text-[#4A4A4A]'}`}>
                      {agent.desc}
                    </p>
                  </div>
                  {status === 'failed' && (
                    <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Routing Failed
                    </span>
                  )}
                </div>
              </div>

              {/* Terminal Logs area for active agent */}
              {isActive && (
                <div className="mt-4 ml-14">
                  <div 
                    ref={terminalRef}
                    className="bg-[#0A0A0A] text-green-400 font-mono text-[11px] sm:text-xs p-4 rounded-xl shadow-inner h-[180px] overflow-y-auto scrollbar-hide"
                  >
                    {agent.logs.map((log, i) => {
                      if (i > currentLogIndex) return null;
                      
                      const isCurrentLine = i === currentLogIndex;
                      const textToShow = isCurrentLine && pipelineState !== 'failed' ? log.slice(0, typedChars) : log;
                      const isErrorLine = log.startsWith("ERROR:") || log.startsWith("Routing process");
                      
                      return (
                        <div key={i} className={`flex items-start leading-relaxed ${isErrorLine ? 'text-red-500 font-bold' : ''}`}>
                          <span className={`${isErrorLine ? 'text-red-500' : 'text-green-600'} mr-2 shrink-0`}>➜</span>
                          <span className="break-all">{textToShow}</span>
                          {isCurrentLine && pipelineState === 'running' && (
                            <span className="w-2 h-3.5 bg-green-400 inline-block align-middle ml-1 animate-pulse"></span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {status === 'failed' && (
                    <div className="mt-4 border border-red-200 bg-white rounded-xl p-4 shadow-sm animate-fade-in">
                      <h4 className="text-sm font-bold text-red-900 mb-2">Unable to reach the Government Department Registry.</h4>
                      <div className="text-xs text-red-800 space-y-1">
                        <p className="font-semibold">Reason:</p>
                        <p>Department Registry endpoint not found.</p>
                        <p className="font-mono bg-red-50 px-2 py-1 rounded inline-block mt-1 border border-red-100">(Error Code: DNS_PROBE_FINISHED_NXDOMAIN)</p>
                      </div>
                      <div className="mt-5 flex items-center space-x-3">
                        <button 
                          onClick={handleRetry}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          Retry Routing
                        </button>
                        <button className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-800 text-xs font-bold rounded-lg transition-colors shadow-sm">
                          View Diagnostic Logs
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default AIPipelineVisualizer;
