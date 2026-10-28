import React, { useState } from 'react';
import { Activity, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0B0F14] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-[#131A23] border border-[#263241] text-[#E8EDF4] mb-3 shadow-sm">
          <Activity className="w-5 h-5 text-[#3DD6C6]" />
        </div>
        <h2 className="text-xl font-semibold text-[#E8EDF4] tracking-tight">Sign in to PingCraft</h2>
        <p className="mt-1 text-xs text-[#9AA8B8]">
          Synthetic observability, incident triage & status platform.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-[#131A23] border border-[#263241] py-7 px-6 shadow-xl rounded-xl sm:px-8">
          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-[#FF647C]/10 border border-[#FF647C]/20 text-[#FF647C] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#FF647C] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9AA8B8] mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#687789] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-[#0E131A] border border-[#263241] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#E8EDF4] placeholder-[#687789] focus:outline-none focus:border-[#3DD6C6] focus:ring-1 focus:ring-[#3DD6C6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9AA8B8] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#687789] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0E131A] border border-[#263241] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#E8EDF4] placeholder-[#687789] focus:outline-none focus:border-[#3DD6C6] focus:ring-1 focus:ring-[#3DD6C6]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 bg-[#3DD6C6] hover:bg-[#59E2D2] text-[#0B0F14] font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 mt-1"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#1D2733] text-center">
            <span className="text-xs text-[#687789]">Need an account? </span>
            <button
              onClick={onSwitchToRegister}
              className="text-xs font-medium text-[#8BB8FF] hover:underline"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
