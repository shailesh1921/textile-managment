import React, { useState } from 'react';
import { api } from '../lib/api';
import { Button, Input } from '../components/ui';
import { Lock, User } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/api/auth/login', { username, password });
      api.setToken(data.access_token);
      api.setUser(data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Banner with theme gradient */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-8 text-center text-white">
          <div className="mx-auto w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-3">
            <Lock className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold">Sarv Uttam Fabrics</h2>
          <p className="text-emerald-100 text-xs mt-1 uppercase tracking-widest font-semibold">Enterprise Suite Login</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="relative">
            <User className="absolute left-3 top-[38px] text-slate-400" size={16} />
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username (e.g. admin)"
              required
              className="pl-9"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-[38px] text-slate-400" size={16} />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="pl-9"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-400">Default Accounts:</span>
            <div className="flex justify-center gap-4 text-xs font-semibold text-slate-500 mt-2">
              <span>admin / admin123</span>
              <span>manager1 / manager123</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
