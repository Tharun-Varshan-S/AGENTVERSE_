import React from 'react';

const stages = [
  { id: 'submitted', label: 'Complaint Submitted', desc: 'Registered in civic ledger' },
  { id: 'received', label: 'Received', desc: 'Grievance cell verified' },
  { id: 'dept_assigned', label: 'Department Assigned', desc: 'Routed to ward engineering team' },
  { id: 'inspection', label: 'Inspection Scheduled', desc: 'Field engineer site audit' },
  { id: 'officer_assigned', label: 'Officer Assigned', desc: 'Lead executive engineer designated' },
  { id: 'in_progress', label: 'Work Started', desc: 'On-site maintenance & repair active' },
  { id: 'resolved', label: 'Resolved', desc: 'Work complete & verified' },
  { id: 'feedback', label: 'Citizen Feedback', desc: 'Verification & rating' }
];

const StatusTimeline = ({ currentStatus, incident }) => {
  const normalizedStatus = (currentStatus || 'submitted').toLowerCase();
  
  let currentIndex = 0;
  if (normalizedStatus === 'acknowledged' || normalizedStatus === 'received') currentIndex = 1;
  else if (normalizedStatus === 'routed' || normalizedStatus === 'dept_assigned') currentIndex = 2;
  else if (normalizedStatus === 'inspection') currentIndex = 3;
  else if (normalizedStatus === 'officer_assigned') currentIndex = 4;
  else if (normalizedStatus === 'in_progress' || normalizedStatus === 'work_started') currentIndex = 5;
  else if (normalizedStatus === 'resolved') currentIndex = 6;
  else if (normalizedStatus === 'feedback' || normalizedStatus === 'closed') currentIndex = 7;

  return (
    <div className="bg-[#FEF9C3]/90 border border-[#FDE047]/70 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between w-full space-y-4">
      
      {/* Timeline Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A4A4A] block mb-0.5">
            Municipal Tracking Ledger
          </span>
          <h3 className="text-xs font-extrabold text-[#0A0A0A] uppercase tracking-wider">
            Swiggy / Amazon Style Live Timeline
          </h3>
        </div>
        <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#FAF498] border border-[#FACC15] text-[#0A0A0A] shadow-xs shrink-0">
          Step {currentIndex + 1} of 8
        </span>
      </div>

      {/* Evenly Distributed Vertical Steps List */}
      <div className="relative py-2 flex-1 flex flex-col space-y-3">
        
        {/* Vertical Connecting Line */}
        <div className="absolute top-4 bottom-4 left-[22px] -translate-x-1/2 w-0.5 bg-black/20 z-0 rounded-full pointer-events-none">
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
              className={`group relative z-10 flex items-center space-x-3.5 p-2 rounded-2xl transition-all duration-200 ${
                isCurrent ? 'bg-white/90 shadow-md border border-[#FACC15]' : 'hover:bg-white/50'
              }`}
            >
              {/* Circle Badge */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[11px] transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-black text-white ring-2 ring-black/20 scale-105 shadow-md'
                    : isCompleted
                    ? 'bg-black text-white'
                    : 'bg-white border-2 border-black/20 text-black/40'
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step Info */}
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`block text-[11px] font-extrabold uppercase tracking-wider truncate ${
                      isCurrent ? 'text-[#0A0A0A]' : isCompleted ? 'text-[#2B3A4C]' : 'text-neutral-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-black text-white shrink-0">
                      Active
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-[#4A4A4A] block font-medium">
                  {stage.desc}
                </span>

                {isCompleted && idx === 0 && incident?.created_at && (
                  <div className="text-[9px] font-mono text-[#4A4A4A] mt-1">
                    Logged: {new Date(incident.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                )}

                {isCompleted && idx === 2 && incident?.routing && (
                  <div className="text-[9px] font-mono text-[#0A0A0A] font-bold mt-1">
                    Dept: {incident.routing.department}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Bottom SLA Note */}
      <div className="pt-2 border-t border-black/10 text-[10px] text-[#4A4A4A] font-semibold flex items-center justify-between">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>Target SLA Active</span>
        </span>
        <span className="font-mono text-[9px] font-bold text-black bg-white px-2 py-0.5 rounded-full border border-neutral-300">
          Target: {incident?.routing?.sla_hours || 48} Hours
        </span>
      </div>

    </div>
  );
};

export default StatusTimeline;
