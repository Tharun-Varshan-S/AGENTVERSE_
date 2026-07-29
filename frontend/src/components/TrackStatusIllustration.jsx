import React from 'react';

const TrackStatusIllustration = ({ onSelectSampleId }) => {
  return (
    <div className="relative w-full max-w-lg mx-auto flex items-center justify-center p-2 select-none">
      <img
        src="/track_status_illustration.png"
        alt="Track Grievance Status Illustration"
        onClick={() => onSelectSampleId && onSelectSampleId('INC-EF39C3C9')}
        className="w-full max-w-[460px] h-auto object-contain cursor-pointer"
      />
    </div>
  );
};

export default TrackStatusIllustration;
