import React from 'react';

const Logo = ({ className = '', showText = true, iconSize = 'w-10 h-10', textSize = 'text-xl' }) => {
  return (
    <div className={`flex items-center space-x-3 group shrink-0 ${className}`}>
      {/* High Definition Crisp Vector Emblem Badge */}
      <div className={`${iconSize} rounded-full bg-black text-white flex items-center justify-center group-hover:scale-105 transition-all duration-200 shadow-md shrink-0 p-0.5 overflow-hidden`}>
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Solid Black Background */}
          <circle cx="50" cy="50" r="48" fill="#000000" />

          {/* High-Contrast Bold White Graphic Elements */}
          <g stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            
            {/* Top Checkmark Circle */}
            <circle cx="50" cy="21.5" r="7.5" fill="none" strokeWidth="3" />
            <path d="M46 21.5L48.8 24.5L54 18.5" fill="none" strokeWidth="3.2" />

            {/* Top Decorative Arcs */}
            <path d="M35 18.5C38.5 16 41.5 15.5 41.5 15.5" strokeWidth="2.8" />
            <path d="M65 18.5C61.5 16 58.5 15.5 58.5 15.5" strokeWidth="2.8" />

            {/* Center Scales of Justice */}
            <path d="M42 73H58" strokeWidth="3.4" />
            <path d="M45 70H55" strokeWidth="2.8" />
            <path d="M50 70V37" strokeWidth="3.4" />
            <circle cx="50" cy="36" r="2.2" fill="#FFFFFF" stroke="none" />
            
            {/* Balance Beam */}
            <path d="M34 42H66" strokeWidth="3.4" />

            {/* Left Scale Pan */}
            <path d="M34 42L28 54H40L34 42Z" fill="none" strokeWidth="2.8" />
            <path d="M28 54C28 58.5 40 58.5 40 54" strokeWidth="2.8" />

            {/* Right Scale Pan */}
            <path d="M66 42L60 54H72L66 42Z" fill="none" strokeWidth="2.8" />
            <path d="M60 54C60 58.5 72 58.5 72 54" strokeWidth="2.8" />

            {/* Top-Left Person */}
            <circle cx="33" cy="28.5" r="3.8" fill="none" strokeWidth="2.8" />
            <path d="M25 41.5C25 35.5 29 34.5 33 34.5C37 34.5 40 35.5 40 38.5" fill="none" strokeWidth="2.8" />

            {/* Top-Right Person */}
            <circle cx="67" cy="28.5" r="3.8" fill="none" strokeWidth="2.8" />
            <path d="M60 38.5C60 35.5 63 34.5 67 34.5C71 34.5 75 35.5 75 41.5" fill="none" strokeWidth="2.8" />

            {/* Bottom-Left Person & Handshake Arc */}
            <circle cx="30" cy="63.5" r="3.8" fill="none" strokeWidth="2.8" />
            <path d="M24 77.5C24 69.5 28 69.5 33 73.5L46 83.5" fill="none" strokeWidth="3.4" />

            {/* Bottom-Right Person & Handshake Arc */}
            <circle cx="70" cy="63.5" r="3.8" fill="none" strokeWidth="2.8" />
            <path d="M76 77.5C76 69.5 72 69.5 67 73.5L54 83.5" fill="none" strokeWidth="3.4" />

            {/* Joined Hands Handshake Link */}
            <path d="M46 83.5C48 85.5 52 85.5 54 83.5" strokeWidth="3.8" />

            {/* Left Circuit / Tech Nodes */}
            <path d="M17 41.5H23" strokeWidth="2.8" />
            <circle cx="14" cy="41.5" r="2.4" fill="#FFFFFF" stroke="none" />

            <path d="M16 49.5H24" strokeWidth="2.8" />
            <circle cx="13" cy="49.5" r="2.4" fill="#FFFFFF" stroke="none" />

            <path d="M17 57.5H23" strokeWidth="2.8" />
            <circle cx="14" cy="57.5" r="2.4" fill="#FFFFFF" stroke="none" />

            {/* Right Circuit / Tech Nodes */}
            <path d="M83 41.5H77" strokeWidth="2.8" />
            <circle cx="86" cy="41.5" r="2.4" fill="#FFFFFF" stroke="none" />

            <path d="M84 49.5H76" strokeWidth="2.8" />
            <circle cx="87" cy="49.5" r="2.4" fill="#FFFFFF" stroke="none" />

            <path d="M83 57.5H77" strokeWidth="2.8" />
            <circle cx="86" cy="57.5" r="2.4" fill="#FFFFFF" stroke="none" />

          </g>
        </svg>
      </div>

      {showText && (
        <div>
          <span className={`font-extrabold ${textSize} text-[#0A0A0A] tracking-tight block leading-none`}>
            CivicResolve AI
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
