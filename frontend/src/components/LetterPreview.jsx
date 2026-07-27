import React from 'react';

const LetterPreview = ({ complaintText, referenceNumber }) => {
  const handleDownload = () => {
    const textContent = `FORMAL MUNICIPAL COMPLAINT\nRef No: ${referenceNumber || 'N/A'}\nDate: ${new Date().toLocaleDateString()}\n\n${complaintText || ''}`;
    const element = document.createElement("a");
    const file = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${referenceNumber || 'Complaint'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h3 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
            Generated Complaint Letter
          </h3>
          <p className="text-xs text-[#4A4A4A] mt-0.5 font-medium">
            Auto-drafted formal notice formatted for civic department filing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition-all shrink-0 shadow-md btn-pill"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download as .txt</span>
        </button>
      </div>

      {/* Letter Body Card */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-[#0A0A0A] text-sm leading-relaxed space-y-4 relative overflow-hidden">
        {/* Watermark Badge */}
        <div className="absolute top-4 right-4 text-[10px] font-mono bg-white border border-neutral-200 px-2.5 py-1 rounded-full text-[#4A4A4A] uppercase tracking-widest font-bold">
          Ref: {referenceNumber || 'N/A'}
        </div>

        <div className="space-y-1 text-xs text-[#4A4A4A] font-bold">
          <p>OFFICIAL MEMORANDUM</p>
          <p className="text-neutral-400">CIVIC COMPLAINT SYSTEM / DRAFTING AGENT</p>
        </div>

        <div className="pt-2 text-[#0A0A0A] whitespace-pre-wrap font-sans text-sm font-medium">
          {complaintText || 'No complaint draft text available.'}
        </div>
      </div>

    </div>
  );
};

export default LetterPreview;
