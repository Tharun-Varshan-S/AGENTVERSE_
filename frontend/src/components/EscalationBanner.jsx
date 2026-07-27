import React from 'react';

const EscalationBanner = ({ escalated, escalationText, escalatedTo }) => {
  if (!escalated) return null;

  return (
    <div className="bg-neutral-50 border-2 border-black rounded-3xl p-5 shadow-lg space-y-2 text-[#0A0A0A]">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h4 className="text-base font-extrabold text-[#0A0A0A]">
            This Complaint Has Been Escalated!
          </h4>
          <p className="text-xs text-[#4A4A4A] font-medium">
            SLA target exceeded — ticket escalated to senior officer oversight.
          </p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-4 text-xs space-y-1.5 mt-2">
        {escalationText && (
          <p className="text-[#0A0A0A] font-medium">
            <span className="font-bold">Reason:</span> {escalationText}
          </p>
        )}
        {escalatedTo && (
          <p className="text-[#4A4A4A]">
            <span className="font-bold text-[#0A0A0A]">Escalated To:</span> <span className="font-mono font-bold">{escalatedTo}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default EscalationBanner;
