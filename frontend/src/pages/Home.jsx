import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const capabilities = [
  {
    num: '01',
    category: 'Automation',
    title: 'Automated Intake',
    description: 'Multi-modal complaint classification (text, photo, voice) with automatic location tagging, removing manual triage entirely.'
  },
  {
    num: '02',
    category: 'Routing',
    title: 'Smart Department Routing',
    description: 'AI matches each grievance to the correct municipal department and assigns severity-based SLA timelines automatically.'
  },
  {
    num: '03',
    category: 'Tracking',
    title: 'Live Status Tracking',
    description: 'Citizens get real-time updates on their complaint\'s progress, with automatic escalation if resolution stalls.'
  },
  {
    num: '04',
    category: 'Governance',
    title: 'Admin Oversight & Reporting',
    description: 'A centralized dashboard lets administrators monitor, prioritize, and act on grievances across departments.'
  }
];

const ScrollAnimatedCapabilities = () => {
  const sectionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let animationFrameId;

    const updateScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress from when section top enters (0.85*height) until section fills screen (0.15*height)
      const startPoint = windowHeight * 0.85;
      const endPoint = windowHeight * 0.15;
      const totalDistance = startPoint - endPoint;
      
      const currentPos = startPoint - rect.top;
      const rawProgress = currentPos / totalDistance;
      const clamped = Math.min(Math.max(rawProgress, 0), 1);
      
      setScrollProgress(clamped);
    };

    const onScroll = () => {
      animationFrameId = requestAnimationFrame(updateScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section ref={sectionRef} className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative z-10 overflow-hidden">
      
      {/* Section Header */}
      <div className="mb-14 text-center md:text-left space-y-2">
        <span className="text-xs font-bold text-[#4A4A4A] uppercase tracking-widest block">
          System Architecture
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-tight">
          Core AI Capabilities
        </h2>
      </div>

      {/* 2-Column Scroll-Driven Lavender Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {capabilities.map((cap, idx) => {
          // Stagger card progress across 0.0 to 1.0 so all cards become visible when section fills screen
          const start = idx * 0.18;
          const cardProgress = Math.min(Math.max((scrollProgress - start) / 0.46, 0), 1);
          
          // Silky horizontal slide from right (70px -> 0px) and fade in
          const translateX = (1 - cardProgress) * (70 + idx * 25);
          const opacity = cardProgress;
          const isInteractable = cardProgress > 0.6;

          return (
            <div
              key={cap.num}
              style={{
                transform: `translateX(${translateX}px)`,
                opacity: opacity,
                transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className={`bg-[#E8EEFB] hover:bg-[#DEE7FA] rounded-3xl p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 group flex flex-col justify-between ${
                isInteractable ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              <div className="space-y-4">
                {/* Eyebrow Label */}
                <div className="text-xs font-semibold text-[#4A4A4A] tracking-wide group-hover:text-[#0A0A0A] transition-colors">
                  <span>{cap.num} {cap.category}</span>
                </div>

                {/* Card Heading */}
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0A0A0A] tracking-tight group-hover:text-black transition-colors leading-tight">
                  {cap.title}
                </h3>

                {/* Description */}
                <p className="text-sm sm:text-base text-[#4A4A4A] font-normal leading-relaxed pt-2">
                  {cap.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-white">
      
      {/* Hero Section with Radial Glow */}
      <section className="w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative hero-radial-glow">
        <div className="max-w-4xl w-full text-center space-y-8 my-auto relative z-10 pt-4">
          
          {/* Minimal Pill Badge */}
          <div className="inline-flex items-center space-x-2 bg-black/5 border border-black/10 px-4 py-1.5 rounded-full text-xs font-semibold text-[#0A0A0A] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
            <span>AI-Powered Municipal Grievance Pipeline</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#0A0A0A] leading-[1.08] max-w-4xl mx-auto">
            Civic Complaint-to-Resolution System
          </h1>

          {/* Hero Description */}
          <p className="text-base sm:text-lg md:text-xl text-[#4A4A4A] max-w-2xl mx-auto leading-relaxed font-normal">
            Report civic issues like potholes, streetlights, or waste overflow instantly. Our automated multi-agent AI pipeline routes, drafts, and tracks your grievance to resolution.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/report"
              className="w-full sm:w-auto px-8 py-3.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-full shadow-lg shadow-black/15 transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 text-sm btn-pill"
            >
              <span>Report an Issue Now</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              to="/track"
              className="w-full sm:w-auto px-7 py-3.5 bg-white border border-black text-[#0A0A0A] hover:bg-black hover:text-white font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 text-sm btn-pill"
            >
              <span>Track Grievance</span>
            </Link>
          </div>

          {/* Downward Dot Arrow Graphic */}
          <div className="pt-10 pb-2 flex justify-center opacity-75">
            <div className="flex flex-col items-center space-y-1.5">
              <div className="flex space-x-6">
                <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
              </div>
              <div className="flex space-x-4">
                <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
              </div>
              <div className="flex space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
              </div>
              <div>
                <span className="w-2.5 h-2.5 rounded-full bg-black block"></span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Capabilities Section (QuantraLogic Lavender Grid Style with Active Scroll Motion) */}
      <ScrollAnimatedCapabilities />

    </div>
  );
};

export default Home;
