import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { 
        threshold: 0.15,
        rootMargin: '0px 0px -25% 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  return (
    <section ref={sectionRef} className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative z-10 overflow-hidden">
      <div 
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(45px)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.15s'
        }}
        className="mb-14 text-center md:text-left space-y-2"
      >
        <span className="text-xs font-bold text-[#4A4A4A] uppercase tracking-widest block">
          System Architecture
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-tight">
          Core AI Capabilities
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {capabilities.map((cap, idx) => {
          const delay = 0.35 + idx * 0.25;

          return (
            <div
              key={cap.num}
              style={{
                transform: isVisible 
                  ? 'translateY(var(--card-hover-lift, 0px))' 
                  : 'translateY(50px)',
                opacity: isVisible ? 1 : 0,
                transition: `transform 1.3s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, opacity 1.3s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.4s ease`
              }}
              className={`bg-[#E8EEFB] hover:bg-[#DEE7FA] rounded-3xl p-8 sm:p-10 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.09)] group flex flex-col justify-between cursor-pointer [--card-hover-lift:0px] hover:[--card-hover-lift:-8px] ${
                isVisible ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              <div className="space-y-4">
                <div className="text-xs font-semibold text-[#4A4A4A] tracking-wide group-hover:text-[#0A0A0A] transition-colors">
                  <span>{cap.num} {cap.category}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0A0A0A] tracking-tight group-hover:text-black transition-colors leading-tight">
                  {cap.title}
                </h3>

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

const WorkflowSection = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { 
        threshold: 0.15,
        rootMargin: '0px 0px -25% 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  const steps = [
    {
      step: 'STEP 01',
      title: 'Multi-Modal Intake & Parsing',
      description: 'We begin by ingesting your raw report—whether text, photo attachment, or voice memo—unifying disparate input sources into a structured, location-tagged complaint architecture.'
    },
    {
      step: 'STEP 02',
      title: 'AI Classification & Smart Routing',
      description: 'Our intelligent Routing Agent categorizes issue severity, identifies the exact municipal department responsible, and automatically assigns strict SLA resolution timelines.'
    },
    {
      step: 'STEP 03',
      title: 'Formal Resolution Notice Drafting',
      description: 'The Drafting Agent constructs an official, standardized municipal notice formatted with unique reference IDs, geo-coordinates, and compliance documentation for city officials.'
    },
    {
      step: 'STEP 04',
      title: 'Continuous Tracking & SLA Escalation',
      description: 'Our system continuously monitors ticket progress against municipal SLAs. If resolution stalls past deadline, the Escalation Agent automatically alerts senior zonal officers.'
    }
  ];

  return (
    <section ref={sectionRef} className="w-full bg-[#D4E4FF] py-24 sm:py-36 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        <div 
          style={{
            transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
            opacity: isVisible ? 1 : 0,
            transition: 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.20s, opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.20s'
          }}
          className="mb-16 sm:mb-24"
        >
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-[#0A0A0A] tracking-tight leading-[1.05]">
            Engineered for actionable resolution
          </h2>
        </div>

        <div className="space-y-0">
          {steps.map((item, idx) => {
            const delay = 0.45 + idx * 0.25;
            return (
              <React.Fragment key={item.step}>
                {idx > 0 && (
                  <div 
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transition: `opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
                    }}
                    className="w-full h-px bg-black/15 my-10 sm:my-14" 
                  />
                )}
                <div 
                  style={{
                    transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                    opacity: isVisible ? 1 : 0,
                    transition: `transform 1.3s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, opacity 1.3s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
                  }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-start py-2"
                >
                  <div className="md:col-span-3 text-xs sm:text-sm font-bold text-[#2B3A4C] uppercase tracking-widest pt-2">
                    <span>{item.step}</span>
                  </div>

                  <div className="md:col-span-9 space-y-3">
                    <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0A0A0A] tracking-tight leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-base sm:text-lg md:text-xl text-[#2B3A4C] font-normal leading-relaxed max-w-3xl pt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [quickInput, setQuickInput] = useState('');

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    localStorage.setItem('civicResolveDraft_desc', quickInput.trim());
    navigate('/report');
  };

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-hidden bg-white">
      
      {/* Hero Section with Conversational Assistant Greeting */}
      <section className="w-full flex flex-col items-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative hero-radial-glow">
        <div className="max-w-4xl w-full text-center space-y-8 my-auto relative z-10 pt-4">
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#0A0A0A] leading-[1.08] max-w-4xl mx-auto">
            Civic Complaint-to-Resolution System
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#4A4A4A] max-w-2xl mx-auto leading-relaxed font-normal">
            Report civic issues like potholes, streetlights, or waste overflow instantly. Our automated multi-agent AI pipeline routes, drafts, and tracks your grievance to resolution.
          </p>

          {/* Conversational Assistant Input Box */}
          <div className="max-w-2xl mx-auto bg-neutral-50 border border-neutral-300/80 p-4 rounded-3xl shadow-xl text-left space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#2B3A4C] uppercase tracking-wider">
              <span>👋 Hello! Tell me what happened.</span>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-3">
              <textarea
                rows={3}
                placeholder="Type naturally (e.g. 'The garbage has not been collected for 6 days near Gandhi Street beside ABC School. Dogs are tearing the waste bags.')..."
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-2xl p-3.5 text-sm text-[#0A0A0A] placeholder-neutral-400 focus:ring-2 focus:ring-black focus:border-black"
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#4A4A4A] font-medium">You can type naturally or upload an image</span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
                >
                  <span>Start AI Processing</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
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

        </div>
      </section>

      <ScrollAnimatedCapabilities />
      <WorkflowSection />
      <Footer />
    </div>
  );
};

export default Home;
