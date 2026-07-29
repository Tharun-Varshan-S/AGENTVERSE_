import React from 'react';

const CATEGORIES = [
  {
    id: 'garbage',
    title: 'Garbage Overflow',
    description: 'Report overflowing dustbins, uncollected waste and dirty areas.',
    sampleText: 'Overflowing garbage bin and uncollected waste scattered on the sidewalk near the market area.',
    icon: (
      <svg className="w-6 h-6 text-[#0A0A0A] group-hover:scale-105 transition-transform duration-300 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )
  },
  {
    id: 'water',
    title: 'Water Leakage & Pipe Burst',
    description: 'Report water leaks, pipe bursts and drainage overflow.',
    sampleText: 'Major underground pipeline leak causing water logging and low supply pressure in the street.',
    icon: (
      <svg className="w-6 h-6 text-[#0A0A0A] group-hover:scale-105 transition-transform duration-300 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
      </svg>
    )
  },
  {
    id: 'streetlight',
    title: 'Streetlight Not Working',
    description: 'Report faulty, flickering or non-functional streetlights.',
    sampleText: 'Multiple streetlights are flicking and non-functional, creating unsafe dark zones at night.',
    icon: (
      <svg className="w-6 h-6 text-[#0A0A0A] group-hover:scale-105 transition-transform duration-300 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  {
    id: 'road',
    title: 'Potholes & Damaged Roads',
    description: 'Report potholes, broken footpaths and damaged road surfaces.',
    sampleText: 'Deep potholes and broken asphalt causing traffic congestion and severe hazard to commuters.',
    icon: (
      <svg className="w-6 h-6 text-[#0A0A0A] group-hover:scale-105 transition-transform duration-300 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 20L14 4M6 20L10 4M12 6v2m0 4v2m0 4v2" />
      </svg>
    )
  },
  {
    id: 'tree',
    title: 'Tree Fall / Overgrown Vegetation',
    description: 'Report fallen trees, overgrown branches and blocked pathways.',
    sampleText: 'Fallen tree branches blocking the primary road and entangling overhead power lines.',
    icon: (
      <svg className="w-6 h-6 text-[#0A0A0A] group-hover:scale-105 transition-transform duration-300 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19v2m0-2c-3 0-5-2-5-5 0-2 1-3.5 3-4.5C9.5 8 10.5 6 12 6s2.5 2 2 3.5c2 1 3 2.5 3 4.5 0 3-2 5-5 5z" />
      </svg>
    )
  },
  {
    id: 'other',
    title: 'Other Public Infrastructure Issues',
    description: 'Report issues with drains, public toilets, benches, signage and more.',
    sampleText: 'Damaged public park bench and open drain cover posing a safety hazard.',
    icon: (
      <svg className="w-6 h-6 text-[#0A0A0A] group-hover:scale-105 transition-transform duration-300 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  }
];

const CivicIssueGuide = ({ onSelectCategory }) => {
  return (
    <div className="bg-[#F2F6FE] border border-[#DCE7F9] rounded-3xl p-5 sm:p-7 shadow-sm">
      {/* Header */}
      <div className="text-center mb-6 px-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A] tracking-tight">
          Together, Let's Build<br className="hidden sm:inline"/> a Better City
        </h2>
        <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed mt-2.5 max-w-sm mx-auto">
          Report any civic issue you see around you. Your report helps us act faster and keep our city clean, safe and livable for everyone.
        </p>
      </div>

      {/* Categories list */}
      <div className="space-y-3.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory && onSelectCategory(cat)}
            className="w-full bg-white border border-[#E2E8F0] hover:border-[#93C5FD] rounded-2xl p-4 text-left flex items-center justify-between transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1.5 hover:bg-white group cursor-pointer active:scale-[0.995]"
          >
            <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-2">
              {/* Icon Circle - Enlarges smoothly on hover */}
              <div className="w-12 h-12 rounded-full bg-[#EBF3FF] border border-[#DBE8FF] flex items-center justify-center shrink-0 group-hover:bg-[#DCEBFE] group-hover:border-[#93C5FD] group-hover:scale-110 transition-transform duration-300 ease-out shadow-xs">
                {cat.icon}
              </div>
              <div className="min-w-0 flex-1">
                {/* Title Text - Enlarges smoothly on hover */}
                <h3 className="text-sm sm:text-base font-extrabold text-[#0A0A0A] group-hover:text-black group-hover:scale-[1.03] origin-left transition-transform duration-300 ease-out leading-tight">
                  {cat.title}
                </h3>
                <p className="text-xs text-[#525252] group-hover:text-[#1A1A1A] mt-1 leading-snug truncate sm:whitespace-normal transition-colors duration-300 ease-out">
                  {cat.description}
                </p>
              </div>
            </div>
            {/* Arrow - Translates and scales smoothly */}
            <svg
              className="w-5 h-5 text-neutral-400 group-hover:text-black group-hover:translate-x-1.5 group-hover:scale-110 transition-all duration-300 ease-out shrink-0 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Bottom responsibility banner */}
      <div className="mt-5 bg-[#E2EDFF] border border-[#CBE0FF] rounded-2xl p-4 text-center relative overflow-hidden transition-all duration-300 ease-out hover:shadow-md group">
        <div className="w-9 h-9 rounded-full bg-[#BFDBFE] text-[#0A0A0A] flex items-center justify-center mx-auto mb-2 shadow-xs group-hover:scale-110 transition-transform duration-300 ease-out">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <h4 className="font-extrabold text-sm sm:text-base text-[#0F172A] group-hover:scale-[1.02] origin-center transition-transform duration-300 ease-out">
          Your Voice. Our Responsibility.
        </h4>
        <p className="text-xs text-[#475569] font-medium mt-0.5">
          Better City, Better Tomorrow.
        </p>
      </div>
    </div>
  );
};

export default CivicIssueGuide;
