import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/layout/Logo';
import Button from '../components/common/Button';
import { Shield, Lock, User, AlertCircle, HelpCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      setLoading(false);
      navigate('/');
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-150">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Logo className="mx-auto" size={54} />
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Crion VROTS Tracker
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          Sign in to access your Unity operations workspace board.
        </p>
      </div>

      {/* Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl sm:px-10 space-y-6">
          
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex gap-2.5 text-xs leading-relaxed items-start">
              <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User size={14} className="text-slate-400" />
                Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Lock size={14} className="text-slate-400" />
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 text-sm font-semibold rounded-xl mt-2"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Sandbox Help Panel */}
          <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <HelpCircle size={12} />
              Sandbox Workspace Access (Click to auto-fill)
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div 
                onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="font-bold block text-slate-700 dark:text-slate-300">Admin</span>
                <span>admin / admin123</span>
              </div>
              <div 
                onClick={() => { setUsername('manager'); setPassword('manager123'); }}
                className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="font-bold block text-slate-700 dark:text-slate-300">Manager</span>
                <span>manager / manager123</span>
              </div>
              <div 
                onClick={() => { setUsername('member'); setPassword('member123'); }}
                className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="font-bold block text-slate-700 dark:text-slate-300">Team Member</span>
                <span>member / member123</span>
              </div>
              <div 
                onClick={() => { setUsername('stakeholder'); setPassword('stakeholder123'); }}
                className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="font-bold block text-slate-700 dark:text-slate-300">Stakeholder</span>
                <span>stakeholder / stakeholder123</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
