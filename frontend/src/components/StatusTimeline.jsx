import React from 'react';

const stages = [
  { id: 'submitted', label: 'Submitted', desc: 'Incident registered' },
  { id: 'acknowledged', label: 'Acknowledged', desc: 'Received by department' },
  { id: 'in_progress', label: 'In Progress', desc: 'Field team assigned' },
  { id: 'resolved', label: 'Resolved', desc: 'Issue resolved' }
];

const StatusTimeline = ({ currentStatus }) => {
  const normalizedStatus = (currentStatus || 'submitted').toLowerCase();
  let currentIndex = stages.findIndex(s => s.id === normalizedStatus);
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div className="bg-[#FEF9C3]/90 border border-[#FDE047]/70 rounded-3xl p-5 sm:p-6 shadow-xl h-full flex flex-col justify-between w-full space-y-4">
      
      {/* Timeline Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A] block mb-0.5">
            Workflow Status
          </span>
          <h3 className="text-xs font-extrabold text-[#0A0A0A] uppercase tracking-wider">
            Resolution Progress
          </h3>
        </div>
        <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF498] border border-[#FACC15] text-[#0A0A0A] shadow-xs shrink-0">
          Step {currentIndex + 1} of 4
        </span>
      </div>

      {/* Evenly Distributed Vertical Steps List */}
      <div className="relative py-2 my-auto flex-1 flex flex-col justify-around space-y-4">
        
        {/* Vertical Connecting Line */}
        <div className="absolute top-4 bottom-4 left-3.5 w-0.5 bg-black/15 -z-0 rounded-full">
          <div
            className="w-full bg-black transition-all duration-500 rounded-full"
            style={{ height: `${(currentIndex / (stages.length - 1)) * 100}%` }}
          />
        </div>

        {stages.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={stage.id}
              className="group relative z-10 flex items-center space-x-3.5 p-2.5 rounded-2xl cursor-pointer transition-all duration-300 ease-out hover:bg-white/70 hover:scale-[1.04] hover:shadow-lg hover:border hover:border-[#FACC15]/60 active:scale-95"
            >
              
              {/* Circle Badge with Smooth Enlarge Hover Effect */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs transition-all duration-300 ease-out shrink-0 transform group-hover:scale-125 group-hover:shadow-xl ${
                  isCurrent
                    ? 'bg-black text-white ring-3 ring-black/20 scale-105 shadow-md group-hover:ring-4 group-hover:ring-black/30'
                    : isCompleted
                    ? 'bg-black text-white shadow-xs group-hover:bg-neutral-900'
                    : 'bg-white border-2 border-black/20 text-black/40 group-hover:border-black group-hover:text-black'
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step Info Box with Smooth Text Motion */}
              <div className="space-y-0.5 flex-1 min-w-0 transition-transform duration-300 ease-out group-hover:translate-x-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`block text-[11px] font-extrabold uppercase tracking-wider truncate transition-colors duration-300 ${
                      isCurrent
                        ? 'text-[#0A0A0A]'
                        : isCompleted
                        ? 'text-[#2B3A4C] group-hover:text-black'
                        : 'text-neutral-400 group-hover:text-black'
                    }`}
                  >
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-black text-white shrink-0 shadow-xs">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-[#4A4A4A] font-medium leading-tight truncate group-hover:text-neutral-700">
                  {stage.desc}
                </p>
              </div>

            </div>
          );
        })}
      </div>

      {/* Bottom Footer Note */}
      <div className="pt-3 border-t border-black/10 text-[10px] text-[#4A4A4A] font-semibold flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
        <span>Real-time SLA active</span>
      </div>

    </div>
  );
};

export default StatusTimeline;
