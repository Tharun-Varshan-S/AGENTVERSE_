import React, { useState, useEffect, useRef } from 'react';

const LocationPicker = ({ value = { lat: '', lng: '', address: '' }, onChange }) => {
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(value.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setQuery(value.address || '');
  }, [value.address]);

  // Click outside listener for autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced address search autocomplete using OpenStreetMap Nominatim
  useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
          headers: { 'User-Agent': 'AGENTVERSE-CivicApp/1.0' }
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.warn('Address autocomplete search notice:', err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSuggestion = (sug) => {
    const formatted = sug.display_name;
    setQuery(formatted);
    setShowDropdown(false);
    onChange({
      lat: sug.lat.toString(),
      lng: sug.lon.toString(),
      address: formatted,
      place_id: sug.place_id
    });
  };

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
            headers: { 'User-Agent': 'AGENTVERSE-CivicApp/1.0' }
          });
          const data = await res.json();
          const detectedAddr = data.display_name || `Location near (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

          setQuery(detectedAddr);
          onChange({
            lat: latitude.toString(),
            lng: longitude.toString(),
            address: detectedAddr,
            place_id: data.place_id || null
          });
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setError('Failed to fetch address details. Please type location manually.');
          onChange({
            lat: latitude.toString(),
            lng: longitude.toString(),
            address: query || 'User Detected Coordinates'
          });
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Location permission denied or unavailable. Please type your location.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-4 relative" ref={dropdownRef}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h4 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">Incident Location</h4>
        </div>
        
        <button
          type="button"
          onClick={handleAutoDetect}
          disabled={detecting}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-full text-[10px] font-bold transition-all disabled:opacity-50 btn-pill shadow-md"
        >
          {detecting ? (
            <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          <span>{detecting ? 'Detecting Location...' : 'Auto-Detect Address'}</span>
        </button>
      </div>

      {error && (
        <div className="text-[10px] text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Address Search / Autocomplete Field */}
      <div className="relative">
        <label htmlFor="address-input" className="block text-xs font-semibold text-[#4A4A4A] mb-1">
          Address / Landmark / Ward <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <input
            id="address-input"
            type="text"
            required
            placeholder="Search address e.g. Anna Nagar Main Road, Chennai..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange({ ...value, address: e.target.value });
            }}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
            className="w-full bg-white border border-neutral-300 rounded-xl pl-10 pr-4 py-3 text-sm text-[#0A0A0A] placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
          />
          <div className="absolute left-3 top-3.5 text-neutral-400">
            {searching ? (
              <svg className="animate-spin h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown List */}
        {showDropdown && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-neutral-100 max-h-56 overflow-y-auto">
            {suggestions.map((item, idx) => (
              <li
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                className="p-3 text-xs text-[#0A0A0A] hover:bg-neutral-100 cursor-pointer flex items-start space-x-2 transition-colors"
              >
                <svg className="w-4 h-4 text-black mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="font-medium line-clamp-2">{item.display_name}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-[10px] text-[#4A4A4A] mt-1.5 italic">
          Start typing for live autocomplete suggestions or click Auto-Detect. Coordinates are processed internally.
        </p>
      </div>

    </div>
  );
};

export default LocationPicker;
