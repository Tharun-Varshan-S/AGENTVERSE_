import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ComplaintForm from '../components/ComplaintForm';
import LiveAgentStream from '../components/LiveAgentStream';

const ReportComplaint = () => {
  const [submittedIncident, setSubmittedIncident] = useState(null);
  const [activeStage, setActiveStage] = useState(null);
  const [completedStages, setCompletedStages] = useState(['intake', 'routing', 'drafting', 'tracking']);
  const [aiError, setAiError] = useState(null);

  const handleSuccess = (incidentData) => {
    setSubmittedIncident(incidentData);
    setActiveStage('complete');
    setAiError(null);
  };

  const handleFileAnother = () => {
    setSubmittedIncident(null);
    setActiveStage(null);
    setAiError(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      
      {/* Header section */}
      <div className="mb-8 text-center sm:text-left space-y-1">
        <span className="inline-flex items-center space-x-2 bg-[#E8EEFB] text-[#2B3A4C] border border-[#C6D8F8] px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-black animate-pulse"></span>
          <span>Intake & AI Routing</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight">
          Report a Civic Issue
        </h1>
        <p className="text-sm text-[#4A4A4A]">
          Submit details about a municipal problem to trigger automated AI routing and grievance drafting.
        </p>
      </div>

      {submittedIncident ? (
        /* Confirmation Panel */
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
          
          {/* Success Header */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-md">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#0A0A0A]">Complaint Filed Successfully!</h2>
              <p className="text-xs text-[#4A4A4A] mt-0.5 font-medium">
                Your complaint has been processed through the LangGraph AI pipeline.
              </p>
            </div>
          </div>

          {/* Reference & Incident Card */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-4">
            <div>
              <span className="text-xs font-semibold text-[#4A4A4A] uppercase tracking-wider block mb-1">
                Official Reference Number
              </span>
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[#0A0A0A] tracking-wider">
                {submittedIncident.draft?.reference_number || 'REF-N/A'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200 text-sm">
              <div>
                <span className="text-xs text-[#4A4A4A] block font-medium">Incident ID</span>
                <span className="font-mono text-[#0A0A0A] font-bold">{submittedIncident.incident_id}</span>
              </div>
              <div>
                <span className="text-xs text-[#4A4A4A] block font-medium">Current Status</span>
                <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold uppercase bg-black text-white">
                  {submittedIncident.status}
                </span>
              </div>
            </div>

            {submittedIncident.routing && (
              <div className="pt-2 border-t border-neutral-200 text-xs space-y-1">
                <div className="flex justify-between text-[#0A0A0A]">
                  <span className="text-[#4A4A4A]">Assigned Dept:</span>
                  <span className="font-bold">{submittedIncident.routing.department}</span>
                </div>
                <div className="flex justify-between text-[#0A0A0A]">
                  <span className="text-[#4A4A4A]">Severity:</span>
                  <span className="font-bold capitalize">{submittedIncident.routing.severity}</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Agent Execution Stream Component */}
          <LiveAgentStream
            activeStage={activeStage}
            completedStages={completedStages}
            aiError={aiError}
          />

          {/* Instruction Note */}
          <div className="text-xs text-[#4A4A4A] bg-neutral-50 p-4 rounded-xl border border-neutral-200 flex items-start space-x-2.5">
            <svg className="w-4 h-4 text-[#0A0A0A] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Save this reference number to track your grievance status. You can copy it or track its live progress below.
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/complaint/${submittedIncident.incident_id}`}
              className="w-full sm:w-1/2 py-3.5 px-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-full text-sm transition-all text-center shadow-md flex items-center justify-center space-x-2 btn-pill"
            >
              <span>Track This Complaint</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={handleFileAnother}
              className="w-full sm:w-1/2 py-3.5 px-4 bg-white hover:bg-black hover:text-white text-[#0A0A0A] font-bold rounded-full text-sm transition-all text-center border border-black btn-pill"
            >
              File Another Complaint
            </button>
          </div>

        </div>
      ) : (
        /* Form Display */
        <ComplaintForm onSuccess={handleSuccess} />
      )}

    </div>
  );
};

export default ReportComplaint;
