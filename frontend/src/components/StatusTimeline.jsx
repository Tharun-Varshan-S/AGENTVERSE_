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
    <div className="bg-[#FEF9C3]/80 border border-[#FDE047]/60 rounded-3xl p-6 shadow-xl h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
          Resolution Progress
        </h3>
        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF498] border border-[#FACC15] text-[#0A0A0A]">
          Step {currentIndex + 1} of 4
        </span>
      </div>

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-0 my-auto">
        
        {/* Connecting Line for Desktop */}
        <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-black/10 -z-0">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
          />
        </div>

        {stages.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage.id} className="relative z-10 flex md:flex-col items-center md:text-center group space-x-4 md:space-x-0 w-full md:w-1/4">
              
              {/* Circle / Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shrink-0 ${
                  isCurrent
                    ? 'bg-black text-white ring-4 ring-black/20 scale-110 shadow-md'
                    : isCompleted
                    ? 'bg-black text-white font-extrabold shadow-xs'
                    : 'bg-white border border-black/20 text-black/40'
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Text Info */}
              <div className="md:mt-3">
                <span
                  className={`block text-xs font-bold uppercase tracking-wider ${
                    isCurrent
                      ? 'text-[#0A0A0A]'
                      : isCompleted
                      ? 'text-[#2B3A4C]'
                      : 'text-neutral-400'
                  }`}
                >
                  {stage.label}
                </span>
                <span className="text-[11px] text-[#4A4A4A] block mt-0.5 font-medium leading-tight">
                  {stage.desc}
                </span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;
