import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Globe, LogOut, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Navbar({ activeTab, onTabChange, onOpenGuide }) {
  const { user, logout } = useAuth();
  const [apiHealth, setApiHealth] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api.health.check()
      .then(res => {
        if (isMounted) setApiHealth(res.status === 'UP');
      })
      .catch(() => {
        if (isMounted) setApiHealth(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#0b0d13]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => onTabChange('monitors')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shadow-sm">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">PingCraft</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">MERN</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onTabChange('monitors')}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'monitors'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              Monitors
            </button>
            <button
              onClick={() => onTabChange('incidents')}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'incidents'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              Incident War Room
            </button>
            <button
              onClick={() => onTabChange('status-page-admin')}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'status-page-admin'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              Public Status Page
            </button>
          </nav>
        </div>

        {/* User, API Status & Guide */}
        <div className="flex items-center gap-3.5">
          {/* How to use button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 rounded-lg transition-colors shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>How to Use</span>
          </button>

          {/* Health indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
            <span className={`w-2 h-2 rounded-full ${apiHealth ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span>{apiHealth ? 'Backend UP' : 'Connecting'}</span>
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-zinc-800">
              <span className="text-sm text-zinc-200 hidden sm:inline-block font-medium">{user.name}</span>
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
