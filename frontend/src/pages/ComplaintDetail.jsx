import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getComplaint, getComplaintEvents } from '../services/api';
import { useCivic } from '../context/CivicContext';
import StatusTimeline from '../components/StatusTimeline';
import LetterPreview from '../components/LetterPreview';
import EscalationBanner from '../components/EscalationBanner';

const ComplaintDetail = () => {
  const { incidentId } = useParams();
  const { activeIncident, setActiveIncident, subscribeIncident, isConnected } = useCivic();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (incidentId) {
      subscribeIncident(incidentId);
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getComplaint(incidentId);
        if (isMounted) {
          setActiveIncident(data);
        }

        try {
          const evtData = await getComplaintEvents(incidentId);
          if (isMounted && evtData) {
            setEvents(evtData.agent_logs || []);
          }
        } catch (e) {
          console.warn('Events fetch notice:', e);
        }

        if (isMounted) setLoading(false);
      } catch (err) {
        console.error("Error fetching complaint:", err);
        if (isMounted) {
          setError(err.response?.status === 404 ? "Complaint not found." : "Failed to load complaint details.");
          setLoading(false);
        }
      }
    };

    if (incidentId) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [incidentId, subscribeIncident, setActiveIncident]);

  const incident = activeIncident;

  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent"></div>
        <p className="text-sm font-bold text-[#0A0A0A]">Loading Incident Ledger ({incidentId})...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-md">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-[#0A0A0A]">Incident Record Halted</h2>
          <p className="text-sm text-[#4A4A4A] max-w-md mx-auto font-medium">{error}</p>
          <div className="pt-2">
            <Link
              to="/track"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-black hover:bg-neutral-800 text-white font-bold rounded-full text-sm transition-all shadow-md btn-pill"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Track Status</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = incident.tracking?.current_status || incident.status || 'submitted';
  const escalated = incident.escalation?.escalated || false;
  const qrData = incident.qr_code_data || incident.tracking?.qr_code_data || '';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData || incident.incident_id)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center space-x-2 bg-[#E8EEFB] text-[#2B3A4C] border border-[#C6D8F8] px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>
              <span>Official Civic Ledger</span>
            </span>
            {isConnected && (
              <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                <span>Live Socket Active</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">
            Incident {incident.incident_id}
          </h1>
        </div>

        <button
          type="button"
          onClick={handlePrintReceipt}
          className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-full shadow-md transition-all flex items-center space-x-2 btn-pill"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Download / Print Receipt</span>
        </button>
      </div>

      {/* Main Grid: Details + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header Card */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold bg-black text-white px-3 py-1 rounded-full shadow-xs">
                  REF: {incident.draft?.reference_number || 'REF-N/A'}
                </span>
                <span className="text-xs text-[#4A4A4A] font-medium ml-3">
                  Created: {new Date(incident.created_at).toLocaleString()}
                </span>
              </div>

              <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-extrabold uppercase ${
                escalated ? 'bg-black text-white' : 'bg-black text-white'
              }`}>
                {currentStatus.replace('_', ' ')}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-[#0A0A0A] leading-snug">
              {incident.intake?.description || 'Municipal Grievance Report'}
            </h2>
          </div>

          {/* Details Grid */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
              Incident Metadata & Verification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F4F7FE] border border-[#D4E2FB] p-4 rounded-2xl">
                <span className="text-xs text-[#2B3A4C] block font-medium">Category</span>
                <span className="font-bold text-[#0A0A0A] capitalize text-sm block mt-1">
                  {incident.intake?.issue_category || 'N/A'}
                </span>
              </div>

              <div className="bg-[#F4F7FE] border border-[#D4E2FB] p-4 rounded-2xl">
                <span className="text-xs text-[#2B3A4C] block font-medium">Assigned Department</span>
                <span className="font-bold text-[#0A0A0A] text-sm block mt-1">
                  {incident.routing?.department || 'Unassigned'}
                </span>
              </div>

              <div className="bg-[#F4F7FE] border border-[#D4E2FB] p-4 rounded-2xl">
                <span className="text-xs text-[#2B3A4C] block font-medium">Severity & SLA Deadline</span>
                <span className="font-bold text-[#0A0A0A] capitalize text-sm block mt-1">
                  {incident.routing?.severity || 'Medium'} ({incident.routing?.sla_hours || 48} Hours)
                </span>
              </div>

              <div className="bg-[#F4F7FE] border border-[#D4E2FB] p-4 rounded-2xl">
                <span className="text-xs text-[#2B3A4C] block font-medium">Formatted Address</span>
                <span className="font-bold text-[#0A0A0A] text-sm block mt-1 truncate" title={incident.intake?.location?.address}>
                  {incident.intake?.location?.address || 'Location Not Specified'}
                </span>
              </div>
            </div>

            {/* QR Verification Box */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="w-28 h-28 bg-white p-2 border border-neutral-300 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                <img src={qrImageUrl} alt="QR Verification Code" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">Digital Verification QR</span>
                <p className="text-xs text-[#4A4A4A]">Scan this QR code with any mobile scanner to instantly verify authentic grievance registration on the government portal.</p>
                <span className="text-[10px] font-mono text-neutral-500 block pt-1">ID: {incident.tracking?.tracking_id || incident.incident_id}</span>
              </div>
            </div>

          </div>

          {/* AI Agent Execution History Logs */}
          {events.length > 0 && (
            <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
                Backend Agent Execution Logs
              </h3>
              <div className="space-y-3">
                {events.map((log, idx) => (
                  <div key={idx} className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-[#0A0A0A]">{log.agent_name}</span>
                      <p className="text-[11px] text-[#4A4A4A] mt-0.5">{log.logs?.join(' | ')}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-800 font-bold rounded-full text-[10px] uppercase">
                        {log.status}
                      </span>
                      <span className="text-[10px] text-neutral-400 block mt-1">{(log.duration_ms / 1000).toFixed(2)}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (4 Cols: Status Timeline) */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <StatusTimeline currentStatus={currentStatus} incident={incident} />
        </div>

      </div>

      {/* Escalation Banner */}
      <EscalationBanner
        escalated={escalated}
        escalationText={incident.escalation?.escalation_text}
        escalatedTo={incident.escalation?.escalated_to}
        escalatedAt={incident.escalation?.escalated_at}
      />

      {/* Formal Letter Preview */}
      <LetterPreview
        complaintText={incident.draft?.complaint_text}
        referenceNumber={incident.draft?.reference_number}
      />

    </div>
  );
};

export default ComplaintDetail;
