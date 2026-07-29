import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TrackStatus = () => {
  const [incidentId, setIncidentId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (incidentId.trim()) {
      navigate(`/complaint/${incidentId.trim()}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center space-x-2 bg-[#E8EEFB] text-[#2B3A4C] border border-[#C6D8F8] px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>
            <span>Citizen Lookup</span>
          </span>
          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0A0A0A] tracking-tight">
            Track Grievance Status
          </h1>
          <p className="text-xs text-[#4A4A4A]">
            Enter the Incident ID you received when you reported an issue.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="incident-id-input" className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-2">
              Incident ID
            </label>
            <input
              id="incident-id-input"
              type="text"
              required
              placeholder="e.g. INC-EF39C3C9"
              value={incidentId}
              onChange={(e) => setIncidentId(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 rounded-2xl px-4 py-3.5 text-base font-mono text-[#0A0A0A] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors uppercase tracking-wider font-bold"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-4 px-6 rounded-full shadow-lg transition-all text-sm flex items-center justify-center space-x-2 btn-pill"
          >
            <span>Search Complaint Status</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>

      </div>
    </div>
  );
};

export default TrackStatus;
