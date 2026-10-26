import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import MonitorDetail from './pages/MonitorDetail';
import IncidentsPage from './pages/IncidentsPage';
import StatusPageAdmin from './pages/StatusPageAdmin';
import PublicStatusPage from './pages/PublicStatusPage';
import Login from './pages/Login';
import Register from './pages/Register';
import { Activity } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();

  // Navigation states
  const [activeTab, setActiveTab] = useState('monitors'); // 'monitors' | 'monitor-detail' | 'incidents' | 'status-page-admin' | 'public-status'
  const [selectedMonitorId, setSelectedMonitorId] = useState(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [publicSlug, setPublicSlug] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Activity className="w-10 h-10 text-indigo-500 animate-pulse mb-3" />
        <span className="text-slate-400 text-sm font-medium">Initializing PingCraft...</span>
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        activeTab={activeTab === 'monitor-detail' ? 'monitors' : activeTab}
        onTabChange={(tab) => {
          setSelectedMonitorId(null);
          setSelectedIncidentId(null);
          setActiveTab(tab);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'monitors' && (
          <Dashboard
            onSelectMonitor={(id) => {
              setSelectedMonitorId(id);
              setActiveTab('monitor-detail');
            }}
            onViewIncidents={() => setActiveTab('incidents')}
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

      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-600">
        PingCraft Synthetic Monitoring Platform • End-Term Software Engineering Project
      </footer>
    </div>
  );
}
