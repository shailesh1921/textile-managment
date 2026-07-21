import React, { useState } from 'react';
import { api } from '../lib/api';
import { Button, Input, Select, Badge } from '../components/ui';
import { Lock, User, Mail, Building, Shield, ChevronRight } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Sign In Form State
  const [signInForm, setSignInForm] = useState({
    username: '',
    password: ''
  });

  // Sign Up Form State
  const [signUpForm, setSignUpForm] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    mill_name: '',
    slug: '',
    gstin: '',
    register_type: 'NEW_MILL'
  });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/api/auth/login', signInForm);
      api.setToken(data.access_token);
      api.setUser(data.user);
      onLoginSuccess(data.user, data.tenant);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const slugValue = signUpForm.slug || signUpForm.mill_name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
      const data = await api.post('/api/auth/signup', {
        mill_name: signUpForm.mill_name || `${signUpForm.full_name}'s Mill`,
        owner_name: signUpForm.full_name,
        email: signUpForm.email,
        password: signUpForm.password,
        slug: slugValue
      });
      api.setToken(data.access_token);
      api.setUser(data.user);
      onLoginSuccess(data.user, data.tenant);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#09060f] text-slate-100 overflow-hidden font-sans relative">
      
      {/* Background Subtle Grain & Ambient Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,94,54,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(158,42,43,0.1),transparent_50%)] pointer-events-none z-0" />

      {/* Left Panel: Cinematic 3D Sunset Scene */}
      <div 
        className="lg:col-span-7 relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-cover bg-center select-none"
        style={{ backgroundImage: `url('/hero.jpg')` }}
      >
        {/* Soft Sunset Color Overlay Gradients to Blend Image */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09060f] via-transparent to-black/30 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#09060f] z-10" />

        {/* Brand Tag / Logo */}
        <div className="z-20 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff5e36] to-[#9e2a2b] flex items-center justify-center shadow-lg shadow-[#ff5e36]/30">
            <span className="font-black text-white text-base">S</span>
          </div>
          <span className="font-bold text-white text-base tracking-wide uppercase">Sarv Uttam Fabrics</span>
        </div>

        {/* Cozy Scenic Info */}
        <div className="z-20 max-w-lg mt-auto flex flex-col gap-3">
          <Badge status="approved">Surat Dyeing Mill Suite</Badge>
          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
            Connecting Surat's grey weavers and processing houses.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed drop-shadow">
            Track lot cards from grey fabric inwarding, spectrophotometer CIELAB color match, recipe chemical dispensing logs, to automatic WhatsApp dispatch alerts.
          </p>
        </div>
      </div>

      {/* Right Panel: Glassmorphism Login / Signup Card */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 md:p-12 z-20">
        <div className="w-full max-w-md bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 flex flex-col gap-6 relative overflow-hidden">
          
          {/* Card Accent Top Glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ff5e36] to-[#9e2a2b]" />

          {/* Heading */}
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">{isSignUp ? 'Join the Mill' : 'Welcome Back'}</h2>
            <p className="text-slate-400 text-xs mt-1.5">
              {isSignUp ? 'Create your platform account' : 'Sign in to access Surat ERP operations'}
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 bg-white/[0.04] p-1.5 rounded-xl border border-white/5">
            <button 
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${!isSignUp ? 'bg-[#ff5e36] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${isSignUp ? 'bg-[#ff5e36] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg font-medium animate-shake">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-lg font-medium">
              {success}
            </div>
          )}

          {/* Form */}
          {!isSignUp ? (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4 text-xs">
              <div className="relative">
                <User className="absolute left-3 top-[34px] text-slate-500" size={14} />
                <Input
                  label="Username"
                  type="text"
                  value={signInForm.username}
                  onChange={e => setSignInForm({ ...signInForm, username: e.target.value })}
                  placeholder="e.g. admin"
                  required
                  className="pl-9 bg-white/[0.02] border-white/10 text-white focus:border-[#ff5e36] focus:ring-[#ff5e36]"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-[34px] text-slate-500" size={14} />
                <Input
                  label="Password"
                  type="password"
                  value={signInForm.password}
                  onChange={e => setSignInForm({ ...signInForm, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="pl-9 bg-white/[0.02] border-white/10 text-white focus:border-[#ff5e36] focus:ring-[#ff5e36]"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-[#ff5e36] to-[#9e2a2b] hover:from-[#ff734f] hover:to-[#b13536] text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1 border-0"
              >
                {loading ? 'Entering...' : 'Enter Console'} <ChevronRight size={14} />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-3 text-xs max-h-[50vh] overflow-y-auto pr-1">
              <Select
                label="Registration Type"
                value={signUpForm.register_type}
                onChange={e => setSignUpForm({ ...signUpForm, register_type: e.target.value })}
                options={[
                  { value: 'TRADER_PORTAL', label: 'Surat Fabric Trader (Job Work)' },
                  { value: 'NEW_MILL', label: 'New Dyeing/Finishing Mill' }
                ]}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Username"
                  value={signUpForm.username}
                  onChange={e => setSignUpForm({ ...signUpForm, username: e.target.value })}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={signUpForm.password}
                  onChange={e => setSignUpForm({ ...signUpForm, password: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Full Name"
                value={signUpForm.full_name}
                onChange={e => setSignUpForm({ ...signUpForm, full_name: e.target.value })}
                required
              />

              <Input
                label="Email"
                type="email"
                value={signUpForm.email}
                onChange={e => setSignUpForm({ ...signUpForm, email: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Mill Name"
                  placeholder="e.g. Om Dyeing Mill"
                  value={signUpForm.mill_name}
                  onChange={e => setSignUpForm({ ...signUpForm, mill_name: e.target.value })}
                  required
                />
                <Input
                  label="Workspace Slug (Unique)"
                  placeholder="e.g. om-dyeing"
                  value={signUpForm.slug}
                  onChange={e => setSignUpForm({ ...signUpForm, slug: e.target.value })}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-[#ff5e36] to-[#9e2a2b] hover:from-[#ff734f] hover:to-[#b13536] text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1 border-0"
              >
                {loading ? 'Creating...' : 'Register Profile'} <ChevronRight size={14} />
              </Button>
            </form>
          )}

          {/* Quick Demo Logins Info */}
          <div className="pt-4 border-t border-white/10 text-center flex flex-col gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Demo Mill Accounts</span>
            <div className="flex justify-center gap-4 text-xs font-semibold text-slate-300">
              <button 
                onClick={() => setSignInForm({ username: 'admin', password: 'admin123' })}
                className="hover:text-[#ff5e36] border border-white/10 bg-white/[0.02] px-2 py-1 rounded transition-all"
              >
                admin
              </button>
              <button 
                onClick={() => setSignInForm({ username: 'prod_mgr', password: 'manager123' })}
                className="hover:text-[#ff5e36] border border-white/10 bg-white/[0.02] px-2 py-1 rounded transition-all"
              >
                prod_mgr
              </button>
              <button 
                onClick={() => setSignInForm({ username: 'qc1', password: 'qc123' })}
                className="hover:text-[#ff5e36] border border-white/10 bg-white/[0.02] px-2 py-1 rounded transition-all"
              >
                qc1
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
