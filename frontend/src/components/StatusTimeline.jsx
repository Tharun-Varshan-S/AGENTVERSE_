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
    <div className="bg-[#FEF9C3]/90 border border-[#FDE047]/70 rounded-3xl p-6 shadow-xl space-y-5 h-fit">
      
      {/* Timeline Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-black/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A] block mb-0.5">
            Workflow Status
          </span>
          <h3 className="text-xs font-extrabold text-[#0A0A0A] uppercase tracking-wider">
            Resolution Progress
          </h3>
        </div>
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF498] border border-[#FACC15] text-[#0A0A0A] shadow-xs">
          Step {currentIndex + 1} of 4
        </span>
      </div>

      {/* Proportional Compact Vertical Steps List */}
      <div className="relative py-1 space-y-6">
        
        {/* Vertical Connecting Line */}
        <div className="absolute top-4 bottom-4 left-4 w-0.5 bg-black/15 -z-0 rounded-full">
          <div
            className="w-full bg-black transition-all duration-500 rounded-full"
            style={{ height: `${(currentIndex / (stages.length - 1)) * 100}%` }}
          />
        </div>

        {stages.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage.id} className="relative z-10 flex items-start space-x-4 group">
              
              {/* Circle Badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs transition-all duration-300 shrink-0 ${
                  isCurrent
                    ? 'bg-black text-white ring-4 ring-black/15 scale-105 shadow-md'
                    : isCompleted
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white border-2 border-black/20 text-black/40'
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

              {/* Step Info Box */}
              <div className="pt-0.5 space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`block text-xs font-extrabold uppercase tracking-wider ${
                      isCurrent
                        ? 'text-[#0A0A0A]'
                        : isCompleted
                        ? 'text-[#2B3A4C]'
                        : 'text-neutral-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-black text-white">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#4A4A4A] font-medium leading-normal">
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
        <span>Real-time SLA monitoring active</span>
      </div>

    </div>
  );
};

export default StatusTimeline;
