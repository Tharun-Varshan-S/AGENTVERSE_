import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-transparent py-4 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Far Left: Logo & Site Name */}
        <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform duration-200 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-xl text-[#0A0A0A] tracking-tight block leading-none">
              CivicResolve AI
            </span>
          </div>
        </Link>

        {/* Center: Floating Capsule Navigation Pill (Desktop) */}
        <nav className="hidden md:flex items-center bg-black text-white px-7 py-2.5 rounded-full shadow-xl shadow-black/10 border border-black/10 space-x-7 text-sm font-medium">
          <Link
            to="/"
            className={`transition-all duration-200 ${
              isActive('/') 
                ? 'text-white underline underline-offset-4 decoration-2 font-bold' 
                : 'text-white/80 hover:text-white'
            }`}
          >
            Home
          </Link>

          <Link
            to="/report"
            className={`transition-all duration-200 ${
              isActive('/report') 
                ? 'text-white underline underline-offset-4 decoration-2 font-bold' 
                : 'text-white/80 hover:text-white'
            }`}
          >
            Report an Issue
          </Link>

          <Link
            to="/track"
            className={`transition-all duration-200 ${
              isActive('/track') || isActive('/complaint')
                ? 'text-white underline underline-offset-4 decoration-2 font-bold' 
                : 'text-white/80 hover:text-white'
            }`}
          >
            Track Status
          </Link>
        </nav>

        {/* Far Right: Admin Portal CTA Button (Desktop) */}
        <div className="hidden md:flex items-center">
          <Link
            to="/admin"
            className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:scale-105 transition-all duration-200 shadow-md shadow-black/10 border border-black/10 inline-flex items-center"
          >
            Admin Portal
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full bg-black text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 bg-black text-white rounded-3xl p-5 shadow-2xl space-y-3 font-medium text-sm border border-black/20">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2 rounded-full ${isActive('/') ? 'bg-white/20 text-white font-bold' : 'text-white/80'}`}
          >
            Home
          </Link>
          <Link
            to="/report"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2 rounded-full ${isActive('/report') ? 'bg-white/20 text-white font-bold' : 'text-white/80'}`}
          >
            Report an Issue
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2 rounded-full ${isActive('/track') || isActive('/complaint') ? 'bg-white/20 text-white font-bold' : 'text-white/80'}`}
          >
            Track Status
          </Link>
          <Link
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-center bg-white text-black py-2.5 rounded-full font-bold mt-2"
          >
            Admin Portal
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
