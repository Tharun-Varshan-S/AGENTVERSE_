import React, { useState } from 'react';
import LocationPicker from './LocationPicker';
import { createComplaint } from '../services/api';

const ComplaintForm = ({ onSuccess }) => {
  const [description, setDescription] = useState('');
  const [rawInputType, setRawInputType] = useState('text');
  const [location, setLocation] = useState({ lat: '10.365', lng: '77.966', address: 'Market Road, Ward 2' });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setRawInputType('photo');
    } else {
      setPhoto(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('description', description.trim());
      formData.append('raw_input_type', rawInputType);
      if (location.lat) formData.append('lat', location.lat);
      if (location.lng) formData.append('lng', location.lng);
      if (location.address) formData.append('address', location.address.trim());
      if (photo) formData.append('photo', photo);

      const incidentData = await createComplaint(formData);
      setLoading(false);
      if (onSuccess) {
        onSuccess(incidentData);
      }
    } catch (err) {
      console.error('Complaint submission error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to submit complaint. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-xl">
      {/* Inline Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 text-red-700 text-sm font-medium">
          <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Input Type Selector */}
      <div>
        <label className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-2.5">
          Input Format
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'text', label: 'Text Description', icon: 'M4 6h16M4 12h16M4 18h7' },
            { id: 'photo', label: 'Photo Attachment', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'voice', label: 'Voice Note', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' }
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setRawInputType(type.id)}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                rawInputType === type.id
                  ? 'bg-black text-white border-black shadow-md scale-[1.02]'
                  : 'bg-neutral-50 border-neutral-200 text-[#4A4A4A] hover:border-black hover:text-[#0A0A0A]'
              }`}
            >
              <svg className="w-5 h-5 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={type.icon} />
              </svg>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description Textarea */}
      <div>
        <label htmlFor="description" className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-2">
          Issue Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          rows={4}
          required
          placeholder="Describe the issue in detail (e.g. Overflowing garbage bin near main market entrance)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-neutral-50 border border-neutral-300 rounded-2xl p-4 text-sm text-[#0A0A0A] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
        />
      </div>

      {/* Location Picker */}
      <LocationPicker value={location} onChange={setLocation} />

      {/* Photo File Input */}
      <div>
        <label className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-2">
          Upload Photo (Optional)
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-4 px-6 rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 btn-pill text-sm"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>AI Pipeline Processing...</span>
          </>
        ) : (
          <span>File Complaint</span>
        )}
      </button>
    </form>
  );
};

export default ComplaintForm;
