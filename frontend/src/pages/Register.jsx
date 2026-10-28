import React, { useState } from 'react';
import { Activity, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EFE6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-sm bg-[#292B24] border border-[#3D4036] text-[#FAF8F2] mb-3 shadow-sm">
          <Activity className="w-5 h-5 text-[#D84A2F]" />
        </div>
        <h2 className="text-2xl font-serif font-normal text-[#252720] tracking-tight">Create Account</h2>
        <p className="mt-1 text-xs text-[#77766B]">
          Start monitoring synthetic endpoints & SLA thresholds.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-[#FAF8F2] border border-[#D4CCBE] py-7 px-6 shadow-md rounded-sm sm:px-8">
          {error && (
            <div className="mb-4 p-2.5 rounded-sm bg-[#C63E32]/10 border border-[#C63E32]/30 text-[#C63E32] text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 text-[#C63E32] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#77766B] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#77766B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="DevOps Engineer"
                  className="w-full bg-[#FAF8F2] border border-[#D4CCBE] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#252720] placeholder-[#77766B] focus:outline-none focus:border-[#D84A2F] focus:ring-1 focus:ring-[#D84A2F]"
                />
              </div>
            </div>

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
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#77766B] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={8}
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
              {loading ? 'Creating...' : 'Create Account'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#D4CCBE] text-center">
            <span className="text-xs text-[#77766B]">Already have an account? </span>
            <button
              onClick={onSwitchToLogin}
              className="text-xs font-medium text-[#D84A2F] hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
