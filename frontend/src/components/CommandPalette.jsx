import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CommandPalette = ({ isOpen, onClose, onToggleDarkMode }) => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const COMMANDS = [
    { title: 'Report a Civic Issue', desc: 'File a new complaint via AI multi-agent system', path: '/report', category: 'Actions' },
    { title: 'Track Status', desc: 'Search and monitor complaint resolution progress', path: '/track', category: 'Actions' },
    { title: 'Municipal Admin Portal', desc: 'Governance control panel, SLA analytics & ticket dispatch', path: '/admin', category: 'Admin' },
    { title: 'Home Overview', desc: 'Return to CivicResolve landing page', path: '/', category: 'Navigation' },
    { title: 'Toggle Dark / Light Mode', desc: 'Switch interface color theme', action: () => { onToggleDarkMode(); onClose(false); }, category: 'Preferences' }
  ];

  const filtered = COMMANDS.filter(cmd => 
    cmd.title.toLowerCase().includes(search.toLowerCase()) || 
    cmd.desc.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (cmd) => {
    if (cmd.action) {
      cmd.action();
    } else if (cmd.path) {
      navigate(cmd.path);
      onClose(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-fade-in">
      <div 
        className="bg-white border border-neutral-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Search Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center space-x-3">
          <svg className="w-5 h-5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search page... (ESC to exit)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm font-medium text-[#0A0A0A] placeholder-neutral-400 focus:outline-none bg-transparent"
          />
          <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded border border-neutral-200">
            ESC
          </span>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-neutral-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-400">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(cmd)}
                className="w-full text-left p-3.5 rounded-2xl hover:bg-neutral-100 flex items-center justify-between transition-colors group"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#0A0A0A] group-hover:underline">{cmd.title}</h4>
                  <p className="text-[11px] text-[#4A4A4A] mt-0.5">{cmd.desc}</p>
                </div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-200">
                  {cmd.category}
                </span>
              </button>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default CommandPalette;
