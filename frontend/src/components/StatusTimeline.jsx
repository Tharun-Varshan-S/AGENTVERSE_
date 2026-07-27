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
    <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-xl">
      <h3 className="text-xs font-bold text-[#0A0A0A] mb-6 uppercase tracking-wider">
        Resolution Progress
      </h3>

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-0">
        
        {/* Connecting Line for Desktop */}
        <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-neutral-200 -z-0">
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
                    ? 'bg-neutral-800 text-white font-extrabold shadow-xs'
                    : 'bg-neutral-100 border border-neutral-300 text-neutral-400'
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
                      ? 'text-[#4A4A4A]'
                      : 'text-neutral-400'
                  }`}
                >
                  {stage.label}
                </span>
                <span className="text-[11px] text-[#4A4A4A] block mt-0.5 font-medium">
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
