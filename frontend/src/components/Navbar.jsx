import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Globe, LogOut, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Navbar({ activeTab, onTabChange }) {
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => onTabChange('monitors')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">PingCraft</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">MERN</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Synthetic Health & Incidents</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange('monitors')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'monitors'
                  ? 'bg-slate-800 text-indigo-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Monitors
            </button>
            <button
              onClick={() => onTabChange('incidents')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'incidents'
                  ? 'bg-slate-800 text-indigo-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Incident War Room
            </button>
            <button
              onClick={() => onTabChange('status-page-admin')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'status-page-admin'
                  ? 'bg-slate-800 text-indigo-400 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              Status Page Settings
            </button>
          </nav>
        </div>

        {/* User & API Status */}
        <div className="flex items-center gap-4">
          {/* Health indicator badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            {apiHealth === true ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-400 font-mono text-[11px]">API Online</span>
              </>
            ) : apiHealth === false ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-400 font-mono text-[11px]">API Disconnected</span>
              </>
            ) : (
              <span className="text-slate-500 font-mono text-[11px]">Connecting...</span>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{user.email}</div>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
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
