import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getComplaint } from '../services/api';
import StatusTimeline from '../components/StatusTimeline';
import LetterPreview from '../components/LetterPreview';
import EscalationBanner from '../components/EscalationBanner';

const ComplaintDetail = () => {
  const { incidentId } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchIncident = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getComplaint(incidentId);
        if (isMounted) {
          setIncident(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching complaint:", err);
        if (isMounted) {
          const status = err.response?.status;
          if (status === 404) {
            setError("Complaint not found. Please check the ID and try again.");
          } else {
            setError(err.response?.data?.error || "Failed to load complaint details. Please try again.");
          }
          setLoading(false);
        }
      }
    };

    if (incidentId) {
      fetchIncident();
    }

    return () => {
      isMounted = false;
    };
  }, [incidentId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent"></div>
        <p className="text-sm font-bold text-[#0A0A0A]">Loading Complaint Details ({incidentId})...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-8 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-md">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-[#0A0A0A]">Complaint Not Found</h2>
          <p className="text-sm text-[#4A4A4A] max-w-md mx-auto font-medium">
            {error || "We could not find an incident matching the provided ID."}
          </p>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Top Section: Card 1 + Card 2 (Left) & Resolution Progress (Right, Thinner & Matching Height) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (8 cols): Card 1 (Header Overview) + Card 2 (Key Incident Details) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Card 1: Header section */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center space-x-2 bg-[#E8EEFB] text-[#2B3A4C] border border-[#C6D8F8] px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase mb-2 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>
                  <span>Live Grievance Tracking</span>
                </span>
                
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs font-mono font-bold bg-black text-white px-3 py-1 rounded-full shadow-xs">
                    {incident.incident_id}
                  </span>
                  <span className="text-xs text-[#4A4A4A] font-medium">
                    Created: {new Date(incident.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  escalated
                    ? 'bg-black text-white border-2 border-black'
                    : 'bg-black text-white'
                }`}>
                  {currentStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A0A0A] mt-2 capitalize leading-snug">
              {incident.intake?.description || 'Municipal Complaint Detail'}
            </h1>
          </div>

          {/* Card 2: Key Incident Details */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">
              Key Incident Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              
              <div className="bg-[#F4F7FE] border border-[#D4E2FB] hover:bg-[#E8EEFB] p-4 rounded-2xl transition-colors">
                <span className="text-xs text-[#2B3A4C] block font-medium">Category</span>
                <span className="font-bold text-[#0A0A0A] capitalize text-sm block mt-1">
                  {incident.intake?.issue_category || 'N/A'}
                </span>
              </div>

              <div className="bg-[#F4F7FE] border border-[#D4E2FB] hover:bg-[#E8EEFB] p-4 rounded-2xl transition-colors">
                <span className="text-xs text-[#2B3A4C] block font-medium">Assigned Department</span>
                <span className="font-bold text-[#0A0A0A] text-sm block mt-1">
                  {incident.routing?.department || 'Unassigned'}
                </span>
              </div>

              <div className="bg-[#F4F7FE] border border-[#D4E2FB] hover:bg-[#E8EEFB] p-4 rounded-2xl transition-colors">
                <span className="text-xs text-[#2B3A4C] block font-medium">Severity & SLA</span>
                <span className="font-bold text-[#0A0A0A] capitalize text-sm block mt-1">
                  {incident.routing?.severity || 'Normal'} ({incident.routing?.sla_hours || 48}h)
                </span>
              </div>

              <div className="bg-[#F4F7FE] border border-[#D4E2FB] hover:bg-[#E8EEFB] p-4 rounded-2xl transition-colors">
                <span className="text-xs text-[#2B3A4C] block font-medium">Location</span>
                <span className="font-bold text-[#0A0A0A] text-sm block mt-1 truncate" title={incident.intake?.location?.address}>
                  {incident.intake?.location?.address || 'N/A'}
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Thinner Vertical Resolution Progress matching total height of Card 1 + Card 2 */}
        <div className="lg:col-span-4 flex">
          <StatusTimeline currentStatus={currentStatus} />
        </div>

      </div>

      {/* Escalation Banner */}
      <EscalationBanner
        escalated={escalated}
        escalationText={incident.escalation?.escalation_text}
        escalatedTo={incident.escalation?.escalated_to}
        escalatedAt={incident.escalation?.escalated_at}
      />

      {/* Letter Preview */}
      <LetterPreview
        complaintText={incident.draft?.complaint_text}
        referenceNumber={incident.draft?.reference_number}
      />

    </div>
  );
};

export default ComplaintDetail;
