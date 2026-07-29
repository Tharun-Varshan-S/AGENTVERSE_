import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { listComplaints, getAdminAnalytics } from '../services/api';

const CivicContext = createContext();

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const CivicProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('civic_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentAdmin, setCurrentAdmin] = useState(() => {
    const saved = localStorage.getItem('civic_admin');
    return saved ? JSON.parse(saved) : null;
  });

  const [complaints, setComplaints] = useState([]);
  const [activeIncident, setActiveIncident] = useState(null);
  const [agentEvents, setAgentEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // Auth Methods
  const loginCitizen = async (email, password) => {
    const res = await axios.post(`${baseURL}/api/auth/citizen/login`, { email, password });
    const { token, user } = res.data;
    localStorage.setItem('civic_citizen_token', token);
    localStorage.setItem('civic_user', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  };

  const registerCitizen = async (userData) => {
    const res = await axios.post(`${baseURL}/api/auth/citizen/register`, userData);
    const { token, user } = res.data;
    localStorage.setItem('civic_citizen_token', token);
    localStorage.setItem('civic_user', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  };

  const loginAdmin = async (admin_id, password) => {
    const res = await axios.post(`${baseURL}/api/auth/admin/login`, { admin_id, password });
    const { token, admin } = res.data;
    localStorage.setItem('civic_admin_token', token);
    localStorage.setItem('civic_admin', JSON.stringify(admin));
    setCurrentAdmin(admin);
    return admin;
  };

  const logoutCitizen = () => {
    localStorage.removeItem('civic_citizen_token');
    localStorage.removeItem('civic_user');
    setCurrentUser(null);
  };

  const logoutAdmin = () => {
    localStorage.removeItem('civic_admin_token');
    localStorage.removeItem('civic_admin');
    setCurrentAdmin(null);
  };

  // Initialize WebSocket Connection
  const connectWebSocket = useCallback(() => {
    const wsHost = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

    try {
      const socket = new WebSocket(wsHost);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        socket.send(JSON.stringify({ action: 'subscribe_admin' }));
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: evtType, data } = payload;

          if (evtType === 'status_updated' || evtType === 'escalation_triggered') {
            const updated = data;
            setComplaints(prev => prev.map(c => c.incident_id === updated.incident_id ? updated : c));
            setActiveIncident(prev => prev && prev.incident_id === updated.incident_id ? updated : prev);
          } else if (evtType === 'agent_start' || evtType === 'agent_step' || evtType === 'human_progress' || evtType === 'agent_error' || evtType === 'complete') {
            setAgentEvents(prev => [...prev, payload]);
            if (evtType === 'complete' && data) {
              setActiveIncident(data);
              setComplaints(prev => [data, ...prev.filter(c => c.incident_id !== data.incident_id)]);
            }
          }
        } catch (err) {
          console.warn('[CivicContext] WebSocket parse notice:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };

      socket.onerror = (err) => {
        console.warn('[CivicContext] WebSocket error:', err);
      };
    } catch (e) {
      console.warn('[CivicContext] Socket init notice:', e);
    }
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWebSocket]);

  const subscribeIncident = useCallback((incidentId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe_incident', incident_id: incidentId }));
    }
  }, []);

  const refreshComplaints = useCallback(async (filter = null) => {
    try {
      const data = await listComplaints(filter);
      setComplaints(data || []);
    } catch (err) {
      console.warn('[CivicContext] Complaints load notice:', err);
    }
  }, []);

  const refreshAnalytics = useCallback(async () => {
    try {
      const data = await getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.warn('[CivicContext] Analytics load notice:', err);
    }
  }, []);

  return (
    <CivicContext.Provider
      value={{
        currentUser,
        currentAdmin,
        loginCitizen,
        registerCitizen,
        loginAdmin,
        logoutCitizen,
        logoutAdmin,
        complaints,
        setComplaints,
        activeIncident,
        setActiveIncident,
        agentEvents,
        setAgentEvents,
        analytics,
        isConnected,
        subscribeIncident,
        refreshComplaints,
        refreshAnalytics
      }}
    >
      {children}
    </CivicContext.Provider>
  );
};

export const useCivic = () => useContext(CivicContext);
