import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim() && agreed) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
        setAgreed(false);
      }, 4000);
    }
  };

  return (
    <footer className="w-full bg-gradient-to-b from-[#FFFDF0] via-[#FEF9C3]/70 to-[#FAF498]/80 border-t border-[#FDE047]/50 py-16 sm:py-20 text-[#0A0A0A] relative overflow-hidden">
      
      {/* Background Soft Ambient Radial Glow */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-60"></div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 relative z-10 space-y-16">
        
        {/* Main Grid: Columns & Stay Informed Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* Left Columns (Menu, Social, Legal) - lg:col-span-7 */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-12">
            
            {/* Column 1: Menu */}
            <div className="space-y-4">
              <h4 className="text-xl font-extrabold text-[#0A0A0A] tracking-tight">
                Menu
              </h4>
              <ul className="space-y-3 text-sm font-medium text-[#2B3A4C]">
                <li>
                  <Link to="/" className="hover:text-black hover:underline underline-offset-4 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/report" className="hover:text-black hover:underline underline-offset-4 transition-colors">
                    Report an Issue
                  </Link>
                </li>
                <li>
                  <Link to="/track" className="hover:text-black hover:underline underline-offset-4 transition-colors">
                    Track Grievance Status
                  </Link>
                </li>
                <li>
                  <Link to="/admin" className="hover:text-black hover:underline underline-offset-4 transition-colors">
                    Admin Governance Portal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Governance & Legal */}
            <div className="space-y-4">
              <h4 className="text-xl font-extrabold text-[#0A0A0A] tracking-tight">
                Legal & Policy
              </h4>
              <ul className="space-y-3 text-sm font-medium text-[#2B3A4C]">
                <li>
                  <span className="cursor-pointer hover:text-black hover:underline underline-offset-4 transition-colors">
                    Municipal SLA Protocol
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-black hover:underline underline-offset-4 transition-colors">
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="cursor-pointer hover:text-black hover:underline underline-offset-4 transition-colors">
                    Accessibility Statement
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 3: Social */}
            <div className="space-y-4 sm:col-span-2 pt-2">
              <h4 className="text-xl font-extrabold text-[#0A0A0A] tracking-tight">
                Social
              </h4>
              <ul className="flex flex-wrap gap-6 text-sm font-medium text-[#2B3A4C]">
                <li>
                  <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-black hover:underline underline-offset-4 transition-colors">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-black hover:underline underline-offset-4 transition-colors">
                    X (Twitter)
                  </a>
                </li>
                <li>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-black hover:underline underline-offset-4 transition-colors">
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Right Side: Stay Informed Card - lg:col-span-5 */}
          <div className="lg:col-span-5">
            <div className="bg-[#FFFDF5]/90 border border-[#FACC15]/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
              <div>
                <h4 className="text-2xl font-extrabold text-[#0A0A0A] tracking-tight">
                  Stay Informed
                </h4>
                <p className="text-xs text-[#4A4A4A] mt-1 font-medium leading-relaxed">
                  Receive real-time alerts when municipal departments update status or resolve SLA breaches on reported grievances.
                </p>
              </div>

              {subscribed ? (
                <div className="bg-black text-white p-4 rounded-2xl text-xs font-bold text-center space-y-1 animate-fade-in">
                  <p>✅ Subscribed to Civic Resolution Alerts!</p>
                  <p className="font-normal text-white/80">You will receive live SLA updates for your tickets.</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5">
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#FAF9D8]/50 border border-black/30 rounded-full px-4 py-2.5 text-sm text-[#0A0A0A] placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-black transition-colors"
                    />
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <input
                      type="checkbox"
                      id="footer-agree"
                      required
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-black/30 text-black focus:ring-black accent-black cursor-pointer"
                    />
                    <label htmlFor="footer-agree" className="text-[11px] text-[#4A4A4A] font-medium leading-snug cursor-pointer select-none">
                      Yes, I agree to receive official civic grievance resolution & SLA status notifications. <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="px-8 py-3 bg-black hover:bg-neutral-800 text-white font-extrabold rounded-full text-sm shadow-md transition-all hover:scale-105 btn-pill"
                  >
                    Subscribe Now
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#4A4A4A]">
          <p>© 2026 AGENTVERSE Autonomous Civic Management Platform. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="hover:text-black cursor-pointer transition-colors">Governance Terms</span>
            <span className="hover:text-black cursor-pointer transition-colors">Privacy Policy</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
