import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CivicProvider } from './context/CivicContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ReportComplaint from './pages/ReportComplaint';
import TrackStatus from './pages/TrackStatus';
import ComplaintDetail from './pages/ComplaintDetail';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <CivicProvider>
      <Router>
        <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col font-sans antialiased">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/report" element={<ReportComplaint />} />
              <Route path="/track" element={<TrackStatus />} />
              <Route path="/complaint/:incidentId" element={<ComplaintDetail />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
    </CivicProvider>
  );
}

export default App;
