import React from 'react';

const HeroVisual = () => {
  return (
    <div className="relative w-full max-w-[580px] lg:max-w-none h-[480px] sm:h-[540px] md:h-[580px] mx-auto flex items-center justify-center select-none overflow-visible">
      
      {/* 3D Isometric Scene Layer with Built-in Phone Screen & Pipeline Labels */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <img
          src="/grievance_pipeline_3d.png"
          alt="Isometric Civic Pipeline Scene"
          style={{
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 75%, transparent 98%)',
            maskImage: 'radial-gradient(circle at 50% 50%, black 75%, transparent 98%)'
          }}
          className="w-[94%] sm:w-[90%] h-auto max-h-[520px] object-contain drop-shadow-[0_15px_35px_rgba(217,119,6,0.15)] transition-transform duration-700 hover:scale-[1.01]"
        />
      </div>

      {/* Glowing Neon Flow Line SVG Thread */}
      <svg
        className="absolute inset-0 w-full h-full z-20 pointer-events-none"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="amberGlowStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="1" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
          </linearGradient>
          <filter id="neonGlowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dynamic Curved Flow Line threading across the composition */}
        <path
          d="M 290,165 C 200,230 110,290 165,365 C 225,445 320,380 375,440 C 420,490 475,460 515,360"
          stroke="url(#amberGlowStroke)"
          strokeWidth="4"
          strokeDasharray="9 7"
          strokeLinecap="round"
          filter="url(#neonGlowEffect)"
          className="animate-pulse-glow"
        />
      </svg>

    </div>
  );
};

export default HeroVisual;
