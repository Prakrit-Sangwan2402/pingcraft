import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Globe, LogOut, HelpCircle, Server } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#0b0d13]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-7">
          <div
            onClick={() => onTabChange('monitors')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="h-7 w-7 rounded-md bg-zinc-800 border border-zinc-700/70 flex items-center justify-center text-zinc-100">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-100">PingCraft</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">MERN</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange('monitors')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'monitors'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              Monitors
            </button>
            <button
              onClick={() => onTabChange('incidents')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'incidents'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              Incident War Room
            </button>
            <button
              onClick={() => onTabChange('status-page-admin')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'status-page-admin'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              Public Status Page
            </button>
          </nav>
        </div>

        {/* User, API Status & Guide */}
        <div className="flex items-center gap-3">
          {/* How to use button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>How to Use</span>
          </button>

          {/* Health indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
            <span className={`w-1.5 h-1.5 rounded-full ${apiHealth ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span>{apiHealth ? 'Backend UP' : 'Connecting'}</span>
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
              <span className="text-xs text-zinc-300 hidden sm:inline-block font-medium">{user.name}</span>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
