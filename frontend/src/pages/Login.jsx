import React, { useState } from 'react';
import { Activity, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Zap, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EFE6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Editorial drafting background grid pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'radial-gradient(#D4CCBE 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px'
        }}
        aria-hidden="true"
      />

      {/* Decorative Technical Registration Marks */}
      <div className="absolute top-4 left-6 font-mono text-[9px] uppercase tracking-widest text-[#77766B]/60 select-none hidden sm:block">
        SPEC // 04-B &bull; SYSTEM OBSERVABILITY SUITE
      </div>
      <div className="absolute top-4 right-6 font-mono text-[9px] uppercase tracking-widest text-[#77766B]/60 select-none hidden sm:block">
        CORE LATENCY DISPATCH // 2026.10
      </div>
      <div className="absolute bottom-4 left-6 font-mono text-[9px] uppercase tracking-widest text-[#77766B]/60 select-none hidden sm:block">
        PORT: 10000 &bull; SSRF FILTER: ARMED
      </div>
      <div className="absolute bottom-4 right-6 font-mono text-[9px] uppercase tracking-widest text-[#77766B]/60 select-none hidden sm:block">
        SHA-256 SESSION INTEGRITY
      </div>

      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 my-auto">
        
        {/* Left Column: Industrial Editorial Showcase */}
        <div className="lg:col-span-7 space-y-5 pr-0 lg:pr-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[#E8E1D5] border border-[#D4CCBE] text-[10px] font-mono uppercase tracking-widest text-[#D84A2F]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D84A2F] animate-pulse" />
            Synthetic Instrumentation Platform
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-serif font-normal text-[#252720] tracking-tight leading-tight">
              API observability with laboratory precision.
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#77766B] leading-relaxed max-w-lg">
              Continuous endpoint health validation, microsecond monotonic latency tracking, and zero-fatigue incident state machines.
            </p>
          </div>

          {/* Technical Spec Ledger */}
          <div className="bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4CCBE] text-[10px] font-mono text-[#77766B] uppercase tracking-wider">
              <span>Telemetry Architecture</span>
              <span className="text-[#427A55]">STATUS: NORMAL</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[10px] text-[#D84A2F] font-semibold shrink-0 mt-0.5">01</span>
                <div>
                  <span className="font-medium text-[#252720] block">Continuous Synthetic Probes</span>
                  <span className="text-[#77766B] text-[11px]">15s to 300s cadences using Node's monotonic clock.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[10px] text-[#D84A2F] font-semibold shrink-0 mt-0.5">02</span>
                <div>
                  <span className="font-medium text-[#252720] block">Deterministic SSRF Shield</span>
                  <span className="text-[#77766B] text-[11px]">Pre-flight DNS validation rejecting loopback and internal subnets.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[10px] text-[#D84A2F] font-semibold shrink-0 mt-0.5">03</span>
                <div>
                  <span className="font-medium text-[#252720] block">Automated Incident Recovery</span>
                  <span className="text-[#77766B] text-[11px]">Partial compound indexing ensuring single-incident integrity.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer metrics strip */}
          <div className="flex items-center gap-4 text-[10px] font-mono text-[#77766B] pt-1">
            <span className="flex items-center gap-1.5 text-[#427A55]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SSRF SHIELD ACTIVE
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#77766B]" />
              NEAREST-RANK P95
            </span>
            <span>&bull;</span>
            <span>35/35 TESTS PASSING</span>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-[#FAF8F2] border border-[#D4CCBE] py-7 px-6 sm:px-7 shadow-md rounded-sm relative text-[#252720]">
            
            {/* Header */}
            <div className="mb-5 pb-3 border-b border-[#D4CCBE]">
              <div className="inline-flex items-center justify-center h-9 w-9 rounded-sm bg-[#292B24] border border-[#3D4036] text-[#FAF8F2] mb-2.5 shadow-sm">
                <Activity className="w-4 h-4 text-[#D84A2F]" />
              </div>
              <h2 className="text-xl font-serif font-normal text-[#252720] tracking-tight">Sign In to Cockpit</h2>
              <p className="mt-0.5 text-xs text-[#77766B]">
                Enter your credentials to access telemetry instruments.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded-sm bg-[#C63E32]/10 border border-[#C63E32]/30 text-[#C63E32] text-xs flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-[#C63E32] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#77766B] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#252720] placeholder-[#77766B] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#77766B] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#252720] placeholder-[#77766B] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F] font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-3 bg-[#D84A2F] hover:bg-[#D84A2F]/90 text-white font-medium rounded-sm shadow-sm transition-colors flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 mt-1 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Security stamp */}
            <div className="mt-4 pt-3 border-t border-[#D4CCBE] flex items-center justify-between text-[10px] font-mono text-[#77766B]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#427A55]" /> SHA-256 JWT
              </span>
              <span>BCRYPT AUTH</span>
            </div>

            {/* Switch to register */}
            <div className="mt-3 text-center text-xs text-[#77766B]">
              <span>Need an account? </span>
              <button
                onClick={onSwitchToRegister}
                className="text-xs font-medium text-[#D84A2F] hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
