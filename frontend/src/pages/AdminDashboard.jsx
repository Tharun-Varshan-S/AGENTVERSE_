import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listComplaints, advanceStatus, triggerEscalation, getAdminAnalytics, exportIncidentsCSV } from '../services/api';
import { useCivic } from '../context/CivicContext';
import LiveAgentStream from '../components/LiveAgentStream';

const AdminDashboard = () => {
  const { complaints, setComplaints, isConnected } = useCivic();
  const [analytics, setAnalytics] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('table');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Per-row states
  const [rowLoading, setRowLoading] = useState({});
  const [rowError, setRowError] = useState({});

  const fetchAnalytics = async () => {
    try {
      const data = await getAdminAnalytics();
      setAnalytics(data);
    } catch (e) {
      console.warn('Analytics fetch notice:', e);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      if (severityFilter !== 'all') filters.severity = severityFilter;
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const data = await listComplaints(statusFilter, filters);
      setComplaints(data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin complaints list:", err);
      setError("Failed to load complaints list. Please ensure backend server is running.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchComplaints();
  }, [statusFilter, categoryFilter, severityFilter, searchQuery]);

  const handleAdvanceStatus = async (incidentId, newStatus) => {
    setRowLoading(prev => ({ ...prev, [incidentId]: true }));
    setRowError(prev => ({ ...prev, [incidentId]: null }));

    try {
      const updated = await advanceStatus(incidentId, newStatus);
      setComplaints(prev =>
        prev.map(item => item.incident_id === incidentId ? updated : item)
      );
      setRowLoading(prev => ({ ...prev, [incidentId]: false }));
      fetchAnalytics();
    } catch (err) {
      console.error(`Error advancing status for ${incidentId}:`, err);
      const msg = err.response?.data?.error || err.message || 'Status update failed';
      setRowError(prev => ({ ...prev, [incidentId]: msg }));
      setRowLoading(prev => ({ ...prev, [incidentId]: false }));
    }
  };

  const handleTriggerEscalation = async (incidentId) => {
    setRowLoading(prev => ({ ...prev, [incidentId]: true }));
    setRowError(prev => ({ ...prev, [incidentId]: null }));

    try {
      const updated = await triggerEscalation(incidentId);
      setComplaints(prev =>
        prev.map(item => item.incident_id === incidentId ? updated : item)
      );
      setRowLoading(prev => ({ ...prev, [incidentId]: false }));
      fetchAnalytics();
    } catch (err) {
      console.error(`Error escalating ticket ${incidentId}:`, err);
      const msg = err.response?.data?.error || err.message || 'Escalation failed';
      setRowError(prev => ({ ...prev, [incidentId]: msg }));
      setRowLoading(prev => ({ ...prev, [incidentId]: false }));
    }
  };

  const getSeverityBadge = (severity) => {
    const s = (severity || 'low').toLowerCase();
    switch (s) {
      case 'critical':
      case 'high':
        return 'bg-black text-white font-extrabold';
      default:
        return 'bg-neutral-100 text-[#0A0A0A] border border-neutral-300 font-semibold';
    }
  };

  const getStatusBadge = (status) => {
    const st = (status || 'submitted').toLowerCase();
    switch (st) {
      case 'resolved':
        return 'bg-[#2B3A4C] text-white';
      default:
        return 'bg-black text-white';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center space-x-2 bg-[#E8EEFB] text-[#2B3A4C] border border-[#C6D8F8] px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>
              <span>Governance Control Panel</span>
            </span>
            {isConnected && (
              <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                <span>Live Socket Stream</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight">
            Municipal Admin Operations
          </h1>
          <p className="text-xs sm:text-sm text-[#4A4A4A] mt-1 font-medium">
            Monitor SLA performance, audit agent execution logs, advance complaint lifecycles, and export ledger data.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={exportIncidentsCSV}
            className="px-4 py-2.5 bg-white hover:bg-black hover:text-white text-[#0A0A0A] text-xs font-bold rounded-full border border-black transition-all flex items-center space-x-1.5 shadow-sm btn-pill"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => { fetchAnalytics(); fetchComplaints(); }}
            disabled={loading}
            className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-full transition-all flex items-center space-x-1.5 shadow-md btn-pill"
          >
            <svg className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-[#4A4A4A] uppercase tracking-wider">Total Complaints</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">{analytics.totalComplaints}</div>
            <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block">100% Logged</span>
          </div>

          <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-[#4A4A4A] uppercase tracking-wider">Active Pending</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">{analytics.activeCount}</div>
            <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block">In Progress</span>
          </div>

          <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-[#4A4A4A] uppercase tracking-wider">SLA Compliance Rate</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">{analytics.slaCompliancePercent}%</div>
            <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block">Target SLA Met</span>
          </div>

          <div className="bg-white border border-neutral-200 p-5 rounded-3xl shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-[#4A4A4A] uppercase tracking-wider">SLA Breaches</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A]">{analytics.escalatedCount}</div>
            <span className="text-[10px] text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full inline-block">Escalated</span>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-neutral-200 space-x-6 text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('table')}
          className={`pb-3 transition-colors ${activeTab === 'table' ? 'text-black border-b-2 border-black' : 'text-neutral-400 hover:text-neutral-600'}`}
        >
          Incident Ledger Table ({complaints.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('monitoring')}
          className={`pb-3 transition-colors ${activeTab === 'monitoring' ? 'text-black border-b-2 border-black' : 'text-neutral-400 hover:text-neutral-600'}`}
        >
          Live Agent Monitoring
        </button>
      </div>

      {activeTab === 'table' ? (
        <>
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white border border-neutral-200 p-4 rounded-3xl shadow-sm">
            <input
              type="text"
              placeholder="Search ID, description, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 rounded-2xl px-3.5 py-2 text-xs text-[#0A0A0A] focus:ring-2 focus:ring-black"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 rounded-2xl px-3.5 py-2 text-xs font-bold text-[#0A0A0A]"
            >
              <option value="all">Status: All</option>
              <option value="submitted">Status: Submitted</option>
              <option value="acknowledged">Status: Acknowledged</option>
              <option value="in_progress">Status: In Progress</option>
              <option value="resolved">Status: Resolved</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 rounded-2xl px-3.5 py-2 text-xs font-bold text-[#0A0A0A]"
            >
              <option value="all">Category: All</option>
              <option value="pothole">Potholes</option>
              <option value="garbage">Garbage</option>
              <option value="streetlight">Streetlight</option>
              <option value="water_leak">Water Leak</option>
              <option value="other">Other</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 rounded-2xl px-3.5 py-2 text-xs font-bold text-[#0A0A0A]"
            >
              <option value="all">Severity: All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-neutral-200/90 rounded-3xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center space-y-3">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
                <p className="text-sm font-bold text-[#0A0A0A]">Fetching civic ledger records...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-12 text-center space-y-3 text-[#4A4A4A]">
                <p className="text-base font-extrabold text-[#0A0A0A]">No complaints match current filters</p>
                <p className="text-xs">Try adjusting your status, category, or search query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F0F4FC] border-b border-[#D4E2FB] text-[#0A0A0A] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-4 px-4">Incident ID</th>
                      <th className="py-4 px-4">Category</th>
                      <th className="py-4 px-4">Department</th>
                      <th className="py-4 px-4">Severity</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4">Escalated</th>
                      <th className="py-4 px-4">Submitted At</th>
                      <th className="py-4 px-4 text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-200 font-medium text-[#0A0A0A]">
                    {complaints.map((item) => {
                      const currentStatus = (item.tracking?.current_status || item.status || 'submitted').toLowerCase();
                      const isEscalated = item.escalation?.escalated || false;
                      const isRowBusy = rowLoading[item.incident_id];
                      const errMessage = rowError[item.incident_id];

                      return (
                        <tr key={item.incident_id} className="hover:bg-neutral-50 transition-colors">
                          
                          <td className="py-4 px-4 font-mono font-extrabold text-[#0A0A0A]">
                            <Link to={`/complaint/${item.incident_id}`} className="hover:underline">
                              {item.incident_id}
                            </Link>
                          </td>

                          <td className="py-4 px-4 capitalize font-semibold">
                            {item.intake?.issue_category || 'N/A'}
                          </td>

                          <td className="py-4 px-4 max-w-xs truncate font-medium text-[#4A4A4A]" title={item.routing?.department}>
                            {item.routing?.department || 'Unassigned'}
                          </td>

                          <td className="py-4 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] capitalize ${getSeverityBadge(item.routing?.severity)}`}>
                              {item.routing?.severity || 'Low'}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${getStatusBadge(currentStatus)}`}>
                              {currentStatus.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            {isEscalated ? (
                              <span className="inline-flex items-center space-x-1 bg-black text-white border border-black px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                <span>Escalated</span>
                              </span>
                            ) : (
                              <span className="text-[#4A4A4A] text-[11px] font-medium">Normal</span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-[#4A4A4A] text-[11px] whitespace-nowrap font-medium">
                            {item.tracking?.submitted_at
                              ? new Date(item.tracking.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                              : new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex flex-col items-center space-y-1">
                              {isRowBusy && (
                                <span className="text-[10px] text-black font-bold animate-pulse">Updating...</span>
                              )}
                              {errMessage && (
                                <span className="text-[10px] text-red-600 font-bold">{errMessage}</span>
                              )}

                              <div className="flex items-center space-x-1.5">
                                {currentStatus === 'submitted' && (
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() => handleAdvanceStatus(item.incident_id, 'acknowledged')}
                                    className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white rounded-full text-[11px] font-bold transition-all disabled:opacity-50 btn-pill"
                                  >
                                    Acknowledge
                                  </button>
                                )}

                                {(currentStatus === 'submitted' || currentStatus === 'acknowledged') && (
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() => handleAdvanceStatus(item.incident_id, 'in_progress')}
                                    className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white rounded-full text-[11px] font-bold transition-all disabled:opacity-50 btn-pill"
                                  >
                                    In Progress
                                  </button>
                                )}

                                {currentStatus !== 'resolved' && (
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() => handleAdvanceStatus(item.incident_id, 'resolved')}
                                    className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white rounded-full text-[11px] font-bold transition-all disabled:opacity-50 btn-pill"
                                  >
                                    Resolve
                                  </button>
                                )}

                                {!isEscalated ? (
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() => handleTriggerEscalation(item.incident_id)}
                                    className="px-2.5 py-1 bg-white border border-black hover:bg-black hover:text-white text-[#0A0A0A] rounded-full text-[11px] font-bold transition-all disabled:opacity-50 btn-pill"
                                  >
                                    Escalate
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-[#4A4A4A] font-bold italic px-1">Escalated</span>
                                )}

                                <Link
                                  to={`/complaint/${item.incident_id}`}
                                  className="p-1 text-[#4A4A4A] hover:text-black rounded transition-colors"
                                  title="View Detail Page"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </Link>

                              </div>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Agent Monitoring Tab */
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-sm font-extrabold text-[#0A0A0A]">Autonomous Agent Fleet Status</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Intake Agent', role: 'Multi-modal Intent & Entity Parser', model: 'gemini-3.6-flash', avgConf: '96.2%' },
              { name: 'Routing Agent', role: 'Ward Matching & Cited Resource Grounding', model: 'gemini-3.6-flash', avgConf: '94.8%' },
              { name: 'Drafting Agent', role: 'Municipal Grievance Document Generator', model: 'gemini-3.6-flash', avgConf: '98.1%' },
              { name: 'Submission & Tracking Agent', role: 'Civic Ledger & QR Encoder', model: 'Ledger Engine', avgConf: '100.0%' },
              { name: 'Escalation Agent', role: 'SLA Monitor & Supervisory Directive', model: 'gemini-3.6-flash', avgConf: '95.4%' }
            ].map((agent, i) => (
              <div key={i} className="bg-neutral-50 border border-neutral-200 p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-sm text-[#0A0A0A]">{agent.name}</h4>
                  <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full uppercase">Healthy</span>
                </div>
                <p className="text-xs text-[#4A4A4A]">{agent.role}</p>
                <div className="flex justify-between text-xs pt-2 border-t border-neutral-200">
                  <span className="text-neutral-500 font-mono text-[10px]">Model: {agent.model}</span>
                  <span className="font-extrabold text-[#0A0A0A]">Avg Confidence: {agent.avgConf}</span>
                </div>
              </div>
            ))}
          </div>

          <LiveAgentStream events={useCivic().workflowEvents || []} />
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
