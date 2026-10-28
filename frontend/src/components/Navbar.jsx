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
    <header className="sticky top-0 z-40 w-full border-b border-[#3D4136] bg-[#292B24] text-[#FAF8F2] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-7">
          <div
            onClick={() => onTabChange('monitors')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="h-7 w-7 rounded-sm bg-[#FAF8F2] flex items-center justify-center text-[#292B24] shadow-xs">
              <Activity className="w-4 h-4 text-[#D84A2F]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-xl tracking-tight text-[#FAF8F2] font-semibold">PingCraft</span>
              <span className="text-[10px] font-mono tracking-widest text-[#B3AFA5] uppercase">inst.</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange('monitors')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-sm ${
                activeTab === 'monitors'
                  ? 'bg-[#34372E] text-[#FAF8F2] border-b-2 border-[#D84A2F]'
                  : 'text-[#B3AFA5] hover:text-[#FAF8F2] hover:bg-[#34372E]/60'
              }`}
            >
              Monitors
            </button>
            <button
              onClick={() => onTabChange('incidents')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-sm ${
                activeTab === 'incidents'
                  ? 'bg-[#34372E] text-[#FAF8F2] border-b-2 border-[#D84A2F]'
                  : 'text-[#B3AFA5] hover:text-[#FAF8F2] hover:bg-[#34372E]/60'
              }`}
            >
              Incident War Room
            </button>
            <button
              onClick={() => onTabChange('status-page-admin')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors rounded-sm ${
                activeTab === 'status-page-admin'
                  ? 'bg-[#34372E] text-[#FAF8F2] border-b-2 border-[#D84A2F]'
                  : 'text-[#B3AFA5] hover:text-[#FAF8F2] hover:bg-[#34372E]/60'
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
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#FAF8F2] hover:text-white bg-[#34372E] hover:bg-[#3E4237] border border-[#484D40] rounded-sm transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#B6C66B]" />
            <span>Guide</span>
          </button>

          {/* Health indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[#22241D] border border-[#3E4237] text-[11px] font-mono text-[#B3AFA5]">
            <span className={`w-1.5 h-1.5 rounded-full ${apiHealth ? 'bg-[#427A55]' : 'bg-[#C63E32]'}`} />
            <span>{apiHealth ? 'SYS OK' : 'OFFLINE'}</span>
          </div>

          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-[#3D4136]">
              <span className="text-xs text-[#FAF8F2] hidden sm:inline-block font-mono">{user.name}</span>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-sm text-[#B3AFA5] hover:text-[#C63E32] hover:bg-[#34372E] transition-colors"
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
