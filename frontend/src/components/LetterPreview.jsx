import React, { useState, useEffect } from 'react';

const LetterPreview = ({ complaintText, referenceNumber, animated = true }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!complaintText) {
      setDisplayedText('');
      return;
    }

    if (!animated) {
      setDisplayedText(complaintText);
      return;
    }

    // Typewriter effect
    setIsTyping(true);
    let index = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      index += 3; // Type 3 characters per tick for smooth, fast typing feel
      if (index >= complaintText.length) {
        setDisplayedText(complaintText);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setDisplayedText(complaintText.slice(0, index));
      }
    }, 15);

    return () => clearInterval(interval);
  }, [complaintText, animated]);

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
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
              Generated Official Notice
            </h3>
            {isTyping && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                <span>AI Drafting...</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#4A4A4A] mt-0.5 font-medium">
            Auto-drafted formal notice formatted for municipal department filing.
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
          <span>Download Notice (.txt)</span>
        </button>
      </div>

      {/* Letter Body Card */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-[#0A0A0A] text-sm leading-relaxed space-y-4 relative overflow-hidden">
        {/* Watermark Badge */}
        <div className="absolute top-4 right-4 text-[10px] font-mono bg-white border border-neutral-200 px-2.5 py-1 rounded-full text-[#4A4A4A] uppercase tracking-widest font-bold">
          Ref: {referenceNumber || 'N/A'}
        </div>

        <div className="space-y-1 text-xs text-[#4A4A4A] font-bold">
          <p>OFFICIAL MUNICIPAL NOTICE</p>
          <p className="text-neutral-400">CIVIC COMPLAINT SYSTEM / DRAFTING AGENT</p>
        </div>

        <div className="pt-2 text-[#0A0A0A] whitespace-pre-wrap font-sans text-sm font-medium leading-relaxed">
          {displayedText || 'No complaint draft text available.'}
          {isTyping && (
            <span className="w-2 h-4 bg-black inline-block align-middle ml-1 animate-pulse"></span>
          )}
        </div>
      </div>

    </div>
  );
};

export default LetterPreview;
