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
    <header className="sticky top-0 z-40 w-full border-b border-[#263241] bg-[#0E131A]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => onTabChange('monitors')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="h-8 w-8 rounded-lg bg-[#131A23] border border-[#263241] flex items-center justify-center text-[#E8EDF4] shadow-sm">
              <Activity className="w-4 h-4 text-[#3DD6C6]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-[#E8EDF4]">PingCraft</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onTabChange('monitors')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'monitors'
                  ? 'bg-[#192330] text-[#E8EDF4] border border-[#263241] shadow-sm'
                  : 'text-[#9AA8B8] hover:text-[#E8EDF4] hover:bg-[#131A23]'
              }`}
            >
              Monitors
            </button>
            <button
              onClick={() => onTabChange('incidents')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'incidents'
                  ? 'bg-[#192330] text-[#E8EDF4] border border-[#263241] shadow-sm'
                  : 'text-[#9AA8B8] hover:text-[#E8EDF4] hover:bg-[#131A23]'
              }`}
            >
              Incident War Room
            </button>
            <button
              onClick={() => onTabChange('status-page-admin')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'status-page-admin'
                  ? 'bg-[#192330] text-[#E8EDF4] border border-[#263241] shadow-sm'
                  : 'text-[#9AA8B8] hover:text-[#E8EDF4] hover:bg-[#131A23]'
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
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#E8EDF4] hover:text-white bg-[#131A23] hover:bg-[#192330] border border-[#263241] rounded-lg transition-colors shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#3DD6C6]" />
            <span>How to Use</span>
          </button>

          {/* Health indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#131A23] border border-[#263241] text-xs font-mono text-[#9AA8B8]">
            <span className={`w-2 h-2 rounded-full ${apiHealth ? 'bg-[#45D483]' : 'bg-[#FF647C]'}`} />
            <span>{apiHealth ? 'Backend UP' : 'Connecting'}</span>
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-[#1D2733]">
              <span className="text-xs text-[#E8EDF4] hidden sm:inline-block font-medium">{user.name}</span>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-[#9AA8B8] hover:text-[#FF647C] hover:bg-[#131A23] transition-colors"
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
