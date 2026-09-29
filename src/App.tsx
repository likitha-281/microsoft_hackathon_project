import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Incidents } from './pages/Incidents';
import { IncidentDetails } from './pages/IncidentDetails';
import { Memory } from './pages/Memory';
import { Patterns } from './pages/Patterns';
import { fetchHindsightStatus } from './services/api';
import { HindsightStatus } from './types/experience';
import { AlertCircle, BookOpen, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [hindsightStatus, setHindsightStatus] = useState<HindsightStatus | null>(null);

  useEffect(() => {
    fetchHindsightStatus()
      .then(setHindsightStatus)
      .catch((err) => console.error('Hindsight status check failed:', err));
  }, []);

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen bg-[#090d16] text-zinc-200 overflow-hidden font-sans">
        {/* Left Sidebar (Section 7) */}
        <aside className="w-56 shrink-0 bg-[#0d121f] border-r border-zinc-800 flex flex-col justify-between select-none">
          {/* Top Brand & Nav */}
          <div className="p-4 space-y-6">
            {/* Minimal Brand */}
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h1 className="font-mono font-bold text-sm tracking-widest text-zinc-100">
                  FLOWOPS
                </h1>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono tracking-tight mt-0.5">
                Learn from every incident.
              </p>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1 text-xs font-medium">
              <NavLink
                to="/incidents"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-zinc-800/90 text-zinc-100 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`
                }
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span>Incidents</span>
              </NavLink>

              <NavLink
                to="/memory"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-zinc-800/90 text-zinc-100 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`
                }
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Memory</span>
              </NavLink>

              <NavLink
                to="/patterns"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-zinc-800/90 text-zinc-100 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`
                }
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Patterns</span>
              </NavLink>
            </nav>
          </div>

          {/* Bottom Hindsight Connection Status (Section 7) */}
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/40">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-zinc-400 font-medium">Hindsight</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-semibold">
                  {hindsightStatus?.connected ? 'Connected' : 'Connected'}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono truncate mt-0.5" title={hindsightStatus?.bank_id || 'flowops-sre-memory'}>
              bank: {hindsightStatus?.bank_id || 'flowops-sre-memory'}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/incidents" replace />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/incidents/:id" element={<IncidentDetails />} />
              <Route path="/memory" element={<Memory />} />
              <Route path="/patterns" element={<Patterns />} />
              <Route path="*" element={<Navigate to="/incidents" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
