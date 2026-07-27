import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listComplaints, advanceStatus, triggerEscalation } from '../services/api';

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Per-row state management
  const [rowLoading, setRowLoading] = useState({});
  const [rowError, setRowError] = useState({});

  const fetchComplaints = async (filter = statusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const filterVal = filter === 'all' ? null : filter;
      const data = await listComplaints(filterVal);
      setComplaints(data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching admin complaints list:", err);
      setError("Failed to load complaints list. Please ensure backend server is running.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(statusFilter);
  }, [statusFilter]);

  const handleAdvanceStatus = async (incidentId, newStatus) => {
    setRowLoading(prev => ({ ...prev, [incidentId]: true }));
    setRowError(prev => ({ ...prev, [incidentId]: null }));

    try {
      const updated = await advanceStatus(incidentId, newStatus);
      setComplaints(prev =>
        prev.map(item => item.incident_id === incidentId ? updated : item)
      );
      setRowLoading(prev => ({ ...prev, [incidentId]: false }));
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
        return 'bg-black text-white border-black font-extrabold';
      default:
        return 'bg-neutral-100 text-[#0A0A0A] border-neutral-300 font-semibold';
    }
  };

  const getStatusBadge = (status) => {
    const st = (status || 'submitted').toLowerCase();
    switch (st) {
      case 'resolved':
        return 'bg-neutral-800 text-white';
      default:
        return 'bg-black text-white';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight">
            Municipal Admin Control Panel
          </h1>
          <p className="text-sm text-[#4A4A4A] mt-1 font-medium">
            Simulate department workflows, advance ticket statuses, and trigger manual escalations.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-neutral-300 text-[#0A0A0A] text-xs font-bold rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
          >
            <option value="all">Filter: All Statuses</option>
            <option value="submitted">Filter: Submitted</option>
            <option value="acknowledged">Filter: Acknowledged</option>
            <option value="in_progress">Filter: In Progress</option>
            <option value="resolved">Filter: Resolved</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchComplaints(statusFilter)}
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

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Complaints Table Container */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
            <p className="text-sm font-bold text-[#0A0A0A]">Loading complaints list...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center space-y-3 text-[#4A4A4A]">
            <svg className="w-12 h-12 text-neutral-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-base font-extrabold text-[#0A0A0A]">No complaints found</p>
            <p className="text-xs text-[#4A4A4A]">There are no complaints matching the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 border-b border-neutral-200 text-[#0A0A0A] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-4">Incident ID</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Department</th>
                  <th className="py-4 px-4">Severity</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Escalation</th>
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
                      
                      {/* Incident ID */}
                      <td className="py-4 px-4 font-mono font-extrabold text-[#0A0A0A]">
                        <Link to={`/complaint/${item.incident_id}`} className="hover:underline">
                          {item.incident_id}
                        </Link>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 capitalize font-semibold">
                        {item.intake?.issue_category || 'N/A'}
                      </td>

                      {/* Department */}
                      <td className="py-4 px-4 max-w-xs truncate font-medium text-[#4A4A4A]" title={item.routing?.department}>
                        {item.routing?.department || 'Unassigned'}
                      </td>

                      {/* Severity */}
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] capitalize ${getSeverityBadge(item.routing?.severity)}`}>
                          {item.routing?.severity || 'Low'}
                        </span>
                      </td>

                      {/* Current Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${getStatusBadge(currentStatus)}`}>
                          {currentStatus.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Escalated Badge */}
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

                      {/* Submitted At */}
                      <td className="py-4 px-4 text-[#4A4A4A] text-[11px] whitespace-nowrap font-medium">
                        {item.tracking?.submitted_at
                          ? new Date(item.tracking.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                          : new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-center space-y-1">
                          
                          {/* Row Busy Spinner */}
                          {isRowBusy && (
                            <div className="text-[10px] text-black font-bold flex items-center space-x-1">
                              <svg className="animate-spin h-3 w-3 text-black" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Updating...</span>
                            </div>
                          )}

                          {/* Row Error Message */}
                          {errMessage && (
                            <span className="text-[10px] text-red-600 font-bold">{errMessage}</span>
                          )}

                          {/* Control Buttons */}
                          <div className="flex items-center space-x-1.5">
                            
                            {/* Contextual Status Advancement */}
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

                            {/* Trigger Escalation Button */}
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

                            {/* View Detail Link */}
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

    </div>
  );
};

export default AdminDashboard;
