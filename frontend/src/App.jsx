import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import MonitorDetail from './pages/MonitorDetail';
import IncidentsPage from './pages/IncidentsPage';
import StatusPageAdmin from './pages/StatusPageAdmin';
import PublicStatusPage from './pages/PublicStatusPage';
import UserGuideModal from './components/UserGuideModal';
import Login from './pages/Login';
import Register from './pages/Register';
import { Activity } from 'lucide-react';
import { api } from './api/client';

export default function App() {
  const { user, loading } = useAuth();

  // Navigation states
  const [activeTab, setActiveTab] = useState('monitors');
  const [selectedMonitorId, setSelectedMonitorId] = useState(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [publicSlug, setPublicSlug] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Detect public status page route in URL hash (e.g. #/status/acme-api)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/status\/([a-z0-9-]+)$/i);
      if (match) {
        setPublicSlug(match[1]);
        setActiveTab('public-status');
      } else if (activeTab === 'public-status') {
        setPublicSlug(null);
        setActiveTab('monitors');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [activeTab]);

  // Seed demo handler from guide
  const handleSeedDemoFromGuide = async () => {
    try {
      await api.monitors.seedDemo();
      setSelectedMonitorId(null);
      setActiveTab('monitors');
      window.location.reload();
    } catch (err) {
      alert(`Error loading demo monitors: ${err.message}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex flex-col items-center justify-center">
        <Activity className="w-7 h-7 text-[#3DD6C6] animate-pulse mb-3" />
        <span className="text-[#9AA8B8] text-xs font-mono tracking-wider uppercase">Initializing PingCraft...</span>
      </div>
    );
  }

  // 1. Public Status Page view (Zero authentication required)
  if (activeTab === 'public-status' && publicSlug) {
    return (
      <PublicStatusPage
        slug={publicSlug}
        onGoHome={() => {
          window.location.hash = '';
          setActiveTab('monitors');
        }}
      />
    );
  }

  // 2. Unauthenticated View (Login / Register)
  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  // 3. Authenticated App Layout
  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E8EDF4] flex flex-col antialiased selection:bg-[#3DD6C6]/20 selection:text-[#3DD6C6]">
      <Navbar
        activeTab={activeTab === 'monitor-detail' ? 'monitors' : activeTab}
        onTabChange={(tab) => {
          setSelectedMonitorId(null);
          setSelectedIncidentId(null);
          setActiveTab(tab);
        }}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-7">
        {activeTab === 'monitors' && (
          <Dashboard
            onSelectMonitor={(id) => {
              setSelectedMonitorId(id);
              setActiveTab('monitor-detail');
            }}
            onViewIncidents={() => setActiveTab('incidents')}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {activeTab === 'monitor-detail' && selectedMonitorId && (
          <MonitorDetail
            monitorId={selectedMonitorId}
            onBack={() => {
              setSelectedMonitorId(null);
              setActiveTab('monitors');
            }}
            onViewIncident={(incId) => {
              setSelectedIncidentId(incId);
              setActiveTab('incidents');
            }}
          />
        )}

        {activeTab === 'incidents' && (
          <IncidentsPage
            selectedIncidentId={selectedIncidentId}
            onSelectMonitor={(id) => {
              setSelectedMonitorId(id);
              setActiveTab('monitor-detail');
            }}
          />
        )}

        {activeTab === 'status-page-admin' && (
          <StatusPageAdmin
            onNavigatePublic={(slug) => {
              window.location.hash = `#/status/${slug}`;
              setPublicSlug(slug);
              setActiveTab('public-status');
            }}
          />
        )}
      </main>

      <footer className="border-t border-[#1D2733] bg-[#0E131A] py-3.5 text-center text-[11px] text-[#687789] font-mono">
        PingCraft Infrastructure Observability & Synthetic Health Platform
      </footer>

      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSeedDemo={handleSeedDemoFromGuide}
      />
    </div>
  );
}
