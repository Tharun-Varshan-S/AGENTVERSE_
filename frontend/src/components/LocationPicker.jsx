import React from 'react';

const LocationPicker = ({ value = { lat: '', lng: '', address: '' }, onChange }) => {
  const handleChange = (field, val) => {
    onChange({
      ...value,
      [field]: val
    });
  };

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h4 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">Incident Location</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="lat-input" className="block text-xs font-semibold text-[#4A4A4A] mb-1">
            Latitude
          </label>
          <input
            id="lat-input"
            type="number"
            step="any"
            placeholder="e.g. 10.365"
            value={value.lat}
            onChange={(e) => handleChange('lat', e.target.value)}
            className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0A0A0A] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>

        <div>
          <label htmlFor="lng-input" className="block text-xs font-semibold text-[#4A4A4A] mb-1">
            Longitude
          </label>
          <input
            id="lng-input"
            type="number"
            step="any"
            placeholder="e.g. 77.966"
            value={value.lng}
            onChange={(e) => handleChange('lng', e.target.value)}
            className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0A0A0A] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <div>
        <label htmlFor="address-input" className="block text-xs font-semibold text-[#4A4A4A] mb-1">
          Address / Landmark
        </label>
        <input
          id="address-input"
          type="text"
          placeholder="e.g. Market Road, Ward 2, Dindigul"
          value={value.address}
          onChange={(e) => handleChange('address', e.target.value)}
          className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-sm text-[#0A0A0A] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
        />
      </div>
    </div>
  );
};

export default LocationPicker;
