import React, { useState } from 'react';
import { useCivic } from '../context/CivicContext';

export const AuthModals = ({
  citizenModalOpen,
  adminModalOpen,
  onCloseCitizenModal,
  onCloseAdminModal,
  onOpenCitizenModal,
  onOpenAdminModal
}) => {
  const { loginCitizen, registerCitizen, loginAdmin } = useCivic();

  // Citizen State
  const [citizenMode, setCitizenMode] = useState('login'); // 'login' | 'register'
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cError, setCError] = useState(null);
  const [cLoading, setCLoading] = useState(false);

  // Admin State
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [aError, setAError] = useState(null);
  const [aLoading, setALoading] = useState(false);

  // Handle Citizen Submit
  const handleCitizenSubmit = async (e) => {
    e.preventDefault();
    setCError(null);
    setCLoading(true);

    try {
      if (citizenMode === 'login') {
        await loginCitizen(cEmail, cPassword);
      } else {
        await registerCitizen({ name: cName, email: cEmail, password: cPassword, phone: cPhone, address: cAddress });
      }
      setCLoading(false);
      onCloseCitizenModal();
    } catch (err) {
      setCError(err.response?.data?.error || err.message || 'Authentication failed');
      setCLoading(false);
    }
  };

  // Handle Admin Submit
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAError(null);
    setALoading(true);

    try {
      await loginAdmin(adminId, adminPassword);
      setALoading(false);
      onCloseAdminModal();
    } catch (err) {
      setAError(err.response?.data?.error || err.message || 'Admin authentication failed');
      setALoading(false);
    }
  };

  return (
    <>
      {/* CITIZEN LOGIN / REGISTER MODAL */}
      {citizenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={onCloseCitizenModal}
              className="absolute top-5 right-5 text-neutral-400 hover:text-black transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B3A4C] bg-[#E8EEFB] px-3 py-1 rounded-full">
                Citizen Portal
              </span>
              <h2 className="text-2xl font-extrabold text-[#0A0A0A] mt-2">
                {citizenMode === 'login' ? 'Citizen Login' : 'Register Citizen Account'}
              </h2>
              <p className="text-xs text-[#4A4A4A] mt-1 font-medium">
                {citizenMode === 'login' ? 'Access your reported issues and complaint history.' : 'Create an account to report civic issues and track resolutions.'}
              </p>
            </div>

            {cError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl mb-4">
                {cError}
              </div>
            )}

            <form onSubmit={handleCitizenSubmit} className="space-y-4">
              {citizenMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:ring-2 focus:ring-black"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={cPassword}
                  onChange={(e) => setCPassword(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:ring-2 focus:ring-black"
                />
              </div>

              {citizenMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={cPhone}
                      onChange={(e) => setCPhone(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Ward / Residential Address (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Ward 12, Anna Nagar, Chennai"
                      value={cAddress}
                      onChange={(e) => setCAddress(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A]"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={cLoading}
                className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-3.5 rounded-full text-xs transition-all shadow-md btn-pill"
              >
                {cLoading ? 'Authenticating...' : citizenMode === 'login' ? 'Login' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-neutral-200 text-center text-xs text-[#4A4A4A]">
              {citizenMode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button onClick={() => { setCitizenMode('register'); setCError(null); }} className="font-bold text-black hover:underline">
                    Register
                  </button>
                </p>
              ) : (
                <p>
                  Already registered?{' '}
                  <button onClick={() => { setCitizenMode('login'); setCError(null); }} className="font-bold text-black hover:underline">
                    Login
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ADMIN LOGIN MODAL */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={onCloseAdminModal}
              className="absolute top-5 right-5 text-neutral-400 hover:text-black transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black px-3 py-1 rounded-full">
                Government Officer Portal
              </span>
              <h2 className="text-2xl font-extrabold text-[#0A0A0A] mt-2">Municipal Admin Login</h2>
              <p className="text-xs text-[#4A4A4A] mt-1 font-medium">
                Enter your official Admin ID and security key to access governance controls.
              </p>
            </div>

            {aError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl mb-4">
                {aError}
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Admin ID / Email</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADMIN001"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] font-mono focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Security Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:ring-2 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                disabled={aLoading}
                className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-3.5 rounded-full text-xs transition-all shadow-md btn-pill"
              >
                {aLoading ? 'Authenticating Admin...' : 'Login to Admin Dashboard'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-neutral-200 text-center">
              <span className="text-[10px] text-neutral-400 font-mono">Demo Admin Credentials: ADMIN001 / admin123</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AuthModals;
