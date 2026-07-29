import React, { useState, useEffect } from 'react';
import LocationPicker from './LocationPicker';
import AIPipelineVisualizer from './AIPipelineVisualizer';

const SMART_SUGGESTIONS = [
  "Water leakage for 3 days near Anna Nagar bus stop. Road flooded.",
  "Overflowing garbage bin near main market entrance causing foul odor.",
  "Streetlights not working on Ward 3 4th Cross Street for 5 nights.",
  "Deep pothole near central school zone posing severe accident hazard."
];

const ComplaintForm = ({ onSuccess, prefilledDescription }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(() => {
    if (prefilledDescription) return prefilledDescription;
    return localStorage.getItem('civicResolveDraft_desc') || '';
  });
  const [category, setCategory] = useState('pothole');
  const [priority, setPriority] = useState('medium');
  const [rawInputType, setRawInputType] = useState('text');
  const [location, setLocation] = useState({ lat: '', lng: '', address: '' });
  const [photo, setPhoto] = useState(null);
  const [citizenName, setCitizenName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agentEvents, setAgentEvents] = useState([]);

  useEffect(() => {
    if (prefilledDescription) {
      setDescription(prefilledDescription);
    }
  }, [prefilledDescription]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('civicResolveDraft_desc', description);
    }, 500);
    return () => clearTimeout(timer);
  }, [description]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setRawInputType('photo');
    } else {
      setPhoto(null);
    }
  };

  const handleApplySuggestion = (sug) => {
    setDescription(sug);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Complaint Description is required.');
      return;
    }
    if (!location.address || !location.address.trim()) {
      setError('Location address is required. Use Auto-Detect or search an address.');
      return;
    }

    setLoading(true);
    setAgentEvents([]);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('raw_input_type', rawInputType);
      if (location.lat) formData.append('lat', location.lat);
      if (location.lng) formData.append('lng', location.lng);
      if (location.address) formData.append('address', location.address.trim());
      if (citizenName) formData.append('citizen_name', citizenName.trim());
      if (contact) formData.append('contact', contact.trim());
      if (notes) formData.append('notes', notes.trim());
      if (photo) formData.append('photo', photo);

      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/complaints/stream`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          if (part.startsWith('data: ')) {
            try {
              const dataStr = part.substring(6);
              const payload = JSON.parse(dataStr);

              setAgentEvents(prev => [...prev, payload]);

              if (payload.event === 'complete' && onSuccess) {
                setLoading(false);
                localStorage.removeItem('civicResolveDraft_desc');
                onSuccess(payload.data);
              } else if (payload.event === 'error') {
                throw new Error(payload.data?.error || 'Streaming error');
              }
            } catch (e) {
              console.error('Failed to parse SSE payload:', part, e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Complaint submission error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to submit complaint. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {loading ? (
        <AIPipelineVisualizer isProcessing={loading} agentEvents={agentEvents} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl">
          
          {/* Header & Tag */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2B3A4C] bg-[#E8EEFB] border border-[#C6D8F8] px-3 py-1 rounded-full shadow-xs">
              AI-Powered Citizen Intake
            </span>
            <h2 className="text-xl font-extrabold text-[#0A0A0A] mt-2">Submit Civic Issue</h2>
            <p className="text-xs text-[#4A4A4A]">Explain your problem naturally. Our multi-agent AI system will parse, route, and draft official notices.</p>
          </div>

          {/* Inline Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 text-red-700 text-sm font-medium">
              <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Title / Headline (Optional) */}
          <div>
            <label htmlFor="title" className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
              Title / Subject Headline (Optional)
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Major water pipe burst near Anna Nagar Bus Stop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-[#0A0A0A] focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>

          {/* Description Textarea */}
          <div>
            <label htmlFor="description" className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
              Issue Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={4}
              required
              maxLength={2000}
              placeholder="Describe the issue in detail (e.g. Water leakage for 3 days near Anna Nagar bus stop. Road completely flooded. Please fix urgently)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 rounded-2xl p-4 text-sm text-[#0A0A0A] placeholder-neutral-400 focus:ring-2 focus:ring-black focus:border-black"
            />
            <div className="flex justify-between items-center mt-1.5 px-1">
              <span className="text-[10px] text-[#4A4A4A] font-medium italic">
                {description.length > 0 ? '✓ Draft saved automatically' : ''}
              </span>
              <span className={`text-[10px] font-bold ${description.length > 1900 ? 'text-red-600' : 'text-[#4A4A4A]'}`}>
                {description.length} / 2000 characters
              </span>
            </div>

            {/* Smart Suggestions Chips */}
            <div className="mt-3">
              <span className="text-[11px] font-bold text-[#4A4A4A] block mb-1.5">Smart Example Prompts:</span>
              <div className="flex flex-wrap gap-1.5">
                {SMART_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplySuggestion(sug)}
                    className="text-[10px] bg-neutral-100 hover:bg-black hover:text-white text-[#0A0A0A] font-medium px-2.5 py-1 rounded-full border border-neutral-200 transition-colors text-left"
                  >
                    "{sug.slice(0, 45)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0A0A0A] focus:ring-2 focus:ring-black"
              >
                <option value="pothole">Roads & Potholes</option>
                <option value="garbage">Garbage & Sanitation</option>
                <option value="streetlight">Streetlight & Electricity</option>
                <option value="water_leak">Water Supply & Leakage</option>
                <option value="other">General Grievance</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
                Perceived Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0A0A0A] focus:ring-2 focus:ring-black"
              >
                <option value="low">Low (Standard SLA)</option>
                <option value="medium">Medium (Moderate SLA)</option>
                <option value="high">High (Urgent Attention)</option>
                <option value="critical">Critical (Emergency Hazard)</option>
              </select>
            </div>
          </div>

          {/* Location Autocomplete Picker */}
          <LocationPicker value={location} onChange={setLocation} />

          {/* Photo File Upload */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
              Upload Photo / Image Evidence (Optional)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="block w-full text-xs text-[#4A4A4A] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-black file:text-white hover:file:bg-neutral-800 file:cursor-pointer border border-neutral-300 rounded-2xl bg-neutral-50 p-2.5"
            />
            {photo && (
              <p className="mt-2 text-xs text-[#0A0A0A] flex items-center space-x-1 font-medium">
                <span>Selected file:</span>
                <span className="font-bold">{photo.name}</span>
              </p>
            )}
          </div>

          {/* Citizen Contact Details (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200">
            <div>
              <label htmlFor="citizenName" className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
                Your Name (Optional)
              </label>
              <input
                id="citizenName"
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0A0A0A]"
              />
            </div>
            <div>
              <label htmlFor="contact" className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
                Phone / Email Contact (Optional)
              </label>
              <input
                id="contact"
                type="text"
                placeholder="e.g. rajesh@example.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0A0A0A]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-4 px-6 rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 btn-pill text-sm"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>File Complaint & Trigger AI Agents</span>
          </button>

        </form>
      )}
    </div>
  );
};

export default ComplaintForm;
