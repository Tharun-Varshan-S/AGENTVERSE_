import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import CommandPalette from './CommandPalette';
import AuthModals from './AuthModals';
import { useCivic } from '../context/CivicContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, currentAdmin, logoutCitizen, logoutAdmin } = useCivic();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [citizenModalOpen, setCitizenModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('civic_theme') === 'dark');

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('civic_theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleAdminPortalClick = () => {
    if (currentAdmin) {
      navigate('/admin');
    } else {
      setAdminModalOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200/80 py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="min-h-[44px] flex items-center">
            <Logo />
          </Link>

          {/* Desktop Capsule Navigation */}
          <nav className="hidden md:flex items-center bg-black text-white px-7 py-2.5 rounded-full shadow-xl space-x-6 text-sm font-medium">
            <Link
              to="/"
              className={`min-h-[44px] inline-flex items-center transition-all duration-200 ${
                isActive('/') 
                  ? 'text-white underline underline-offset-4 decoration-2 font-bold' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Home
            </Link>

            <Link
              to="/report"
              className={`min-h-[44px] inline-flex items-center transition-all duration-200 ${
                isActive('/report') 
                  ? 'text-white underline underline-offset-4 decoration-2 font-bold' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Report Issue
            </Link>

            <Link
              to="/track"
              className={`min-h-[44px] inline-flex items-center transition-all duration-200 ${
                isActive('/track') || isActive('/complaint')
                  ? 'text-white underline underline-offset-4 decoration-2 font-bold' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Track Status
            </Link>

            {/* Citizen Auth State Link */}
            {currentUser ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-white/20">
                <span className="text-xs font-bold text-white/90">Hello, {currentUser.name.split(' ')[0]}</span>
                <button
                  type="button"
                  onClick={logoutCitizen}
                  className="text-xs text-red-300 hover:text-red-100 font-bold transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCitizenModalOpen(true)}
                className="text-xs text-white bg-white/20 hover:bg-white/30 px-3.5 py-1 rounded-full font-bold transition-all"
              >
                Login
              </button>
            )}
          </nav>

          {/* Desktop Right CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Command Palette Trigger */}
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="min-h-[44px] px-3.5 bg-neutral-100 hover:bg-neutral-200 text-[#0A0A0A] rounded-full text-xs font-bold transition-all border border-neutral-200 flex items-center space-x-1.5 shadow-xs"
              title="Search & Quick Actions (Cmd+K)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>⌘K</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="min-h-[44px] min-w-[44px] rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 flex items-center justify-center text-[#0A0A0A] transition-all"
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Admin Portal Button */}
            {currentAdmin ? (
              <div className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-full shadow-md">
                <Link to="/admin" className="text-xs font-extrabold hover:underline">
                  Admin ({currentAdmin.admin_id})
                </Link>
                <button onClick={logoutAdmin} className="text-[10px] text-red-300 hover:text-white font-bold ml-1">
                  Exit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdminPortalClick}
                className="min-h-[44px] bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-all duration-200 shadow-md inline-flex items-center"
              >
                Admin Portal
              </button>
            )}
          </div>

          {/* Mobile Right Action Bar */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="min-h-[44px] min-w-[44px] rounded-full bg-neutral-100 text-[#0A0A0A] flex items-center justify-center text-xs font-bold border border-neutral-200"
            >
              ⌘K
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-[44px] min-w-[44px] rounded-full bg-black text-white flex items-center justify-center focus:outline-none"
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

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-black text-white rounded-3xl p-5 shadow-2xl space-y-3 font-medium text-sm border border-black/20 z-50 animate-fade-in">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`min-h-[44px] flex items-center px-4 rounded-full ${isActive('/') ? 'bg-white/20 text-white font-bold' : 'text-white/80'}`}
            >
              Home
            </Link>
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className={`min-h-[44px] flex items-center px-4 rounded-full ${isActive('/report') ? 'bg-white/20 text-white font-bold' : 'text-white/80'}`}
            >
              Report Issue
            </Link>
            <Link
              to="/track"
              onClick={() => setMobileMenuOpen(false)}
              className={`min-h-[44px] flex items-center px-4 rounded-full ${isActive('/track') || isActive('/complaint') ? 'bg-white/20 text-white font-bold' : 'text-white/80'}`}
            >
              Track Status
            </Link>

            {currentUser ? (
              <div className="flex items-center justify-between px-4 py-2 bg-white/10 rounded-2xl">
                <span className="text-xs font-bold text-white">Logged in: {currentUser.name}</span>
                <button onClick={logoutCitizen} className="text-xs text-red-300 font-bold">Logout</button>
              </div>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); setCitizenModalOpen(true); }}
                className="w-full text-left px-4 py-2.5 bg-white/20 text-white font-bold rounded-full text-xs"
              >
                Citizen Login / Register
              </button>
            )}

            <div className="pt-2 border-t border-white/20 flex items-center justify-between">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="min-h-[44px] px-4 rounded-full bg-white/10 text-xs font-bold flex items-center space-x-2"
              >
                <span>{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
              </button>

              <button
                onClick={() => { setMobileMenuOpen(false); handleAdminPortalClick(); }}
                className="min-h-[44px] bg-white text-black px-6 rounded-full font-bold inline-flex items-center text-xs"
              >
                Admin Portal
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Command Palette Overlay */}
      <CommandPalette 
        isOpen={cmdOpen} 
        onClose={setCmdOpen} 
        onToggleDarkMode={toggleDarkMode} 
      />

      {/* Auth Modals */}
      <AuthModals
        citizenModalOpen={citizenModalOpen}
        adminModalOpen={adminModalOpen}
        onCloseCitizenModal={() => setCitizenModalOpen(false)}
        onCloseAdminModal={() => setAdminModalOpen(false)}
        onOpenCitizenModal={() => setCitizenModalOpen(true)}
        onOpenAdminModal={() => setAdminModalOpen(true)}
      />
    </>
  );
};

export default Navbar;
