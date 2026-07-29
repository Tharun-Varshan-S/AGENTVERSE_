import React from 'react';

const EscalationBanner = ({ escalated, escalationText, escalatedTo, escalatedAt }) => {
  if (!escalated) return null;

  const formattedDate = escalatedAt
    ? new Date(escalatedAt).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short'
      })
    : null;

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
            {formattedDate && (
              <span className="block font-bold text-black text-[11px] mt-0.5">
                Escalated on {formattedDate}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-4 text-xs space-y-2 mt-2">
        {escalationText && (
          <div className="text-[#0A0A0A] font-medium whitespace-pre-wrap leading-relaxed">
            <span className="font-bold block mb-1">Reason / Notice:</span>
            {escalationText}
          </div>
        )}
        {escalatedTo && (
          <p className="text-[#4A4A4A] pt-1 border-t border-neutral-100">
            <span className="font-bold text-[#0A0A0A]">Escalated To:</span> <span className="font-mono font-bold text-black">{escalatedTo}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default EscalationBanner;
