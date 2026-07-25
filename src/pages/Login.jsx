import React, { useState } from 'react';
import { api } from '../lib/api';
import { Button, Input, Select, Badge } from '../components/ui';
import { Lock, User, Mail, Building, Shield, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { HlsBackgroundVideo } from '../components/HlsBackgroundVideo';

export default function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-[#F3F1F7] flex items-center justify-center p-4 md:p-6 font-sans relative overflow-hidden">
      
      {/* Live HLS Streaming Video with highly-tinted soft lavender overlay */}
      <HlsBackgroundVideo 
        src="https://stream.mux.com/NcU3HlHeF7CUL86azTTzpy3Tlb00d6iF3BmCdFslMJYM.m3u8" 
        poster="/hero.jpg" 
        overlayColor="bg-[#F3F1F7]/95" 
      />

      {/* Decorative Accent Bar Left */}
      <div className="hidden lg:block absolute left-12 xl:left-24 top-1/4 bottom-1/4 w-[6px] bg-slate-300/40 rounded-full z-10" />

      {/* Decorative Accent Bar Right */}
      <div className="hidden lg:block absolute right-12 xl:right-24 top-1/4 bottom-1/4 w-[6px] bg-slate-300/40 rounded-full z-10" />

      {/* Outer framed container (Subtle nested border effect) */}
      <div className="border border-slate-300/40 bg-white/20 p-4 rounded-[20px] shadow-sm max-w-md w-full relative z-20 transition-all duration-300">
        
        {/* Inner floating card */}
        <div className="bg-white border border-slate-100/50 rounded-[14px] shadow-xl p-6 sm:p-8 flex flex-col gap-5">
          
          {/* Centered Brand Logo */}
          <div className="flex flex-col items-center gap-1.5 mb-1">
            <div className="w-10 h-10 rounded-[10px] bg-[#6B4EFF] flex items-center justify-center shadow-md">
              <span className="font-black text-white text-lg">S</span>
            </div>
            <span className="font-extrabold text-slate-800 text-xs tracking-[0.2em] uppercase">SARV UTTAM FABRICS</span>
          </div>

          {/* Centered Welcome Heading */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="text-slate-500 text-xs mt-1">
              {isSignUp ? 'Fill in your mill details to join' : 'Sign in to continue'}
            </p>
          </div>

          {/* Form Tabs */}
          <div className="grid grid-cols-2 bg-slate-100/80 p-1 rounded-[10px] border border-slate-200/40">
            <button 
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                !isSignUp 
                  ? 'bg-white text-[#6B4EFF] shadow-sm font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                isSignUp 
                  ? 'bg-white text-[#6B4EFF] shadow-sm font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs p-3 rounded-[10px] font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs p-3 rounded-[10px] font-medium">
              {success}
            </div>
          )}

          {/* Input Form Fields */}
          {!isSignUp ? (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <Input
                label="Username"
                type="text"
                value={signInForm.username}
                onChange={e => setSignInForm({ ...signInForm, username: e.target.value })}
                placeholder="e.g. admin"
                required
                icon={<User size={16} />}
              />
              
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={signInForm.password}
                  onChange={e => setSignInForm({ ...signInForm, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  icon={<Lock size={16} />}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-[28px] text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center min-h-[36px] min-w-[36px]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6B4EFF] hover:bg-[#573fd6] text-white font-bold rounded-[10px] transition-all flex items-center justify-center gap-1 border-0 mt-1 min-h-[44px]"
              >
                {loading ? 'Processing...' : 'Sign In'} <ChevronRight size={14} />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-3 max-h-[42vh] overflow-y-auto pr-1">
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
                  label="Workspace Slug"
                  placeholder="e.g. om-dyeing"
                  value={signUpForm.slug}
                  onChange={e => setSignUpForm({ ...signUpForm, slug: e.target.value })}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6B4EFF] hover:bg-[#573fd6] text-white font-bold rounded-[10px] transition-all flex items-center justify-center gap-1 border-0 mt-1 min-h-[44px]"
              >
                {loading ? 'Creating...' : 'Register Profile'} <ChevronRight size={14} />
              </Button>
            </form>
          )}

          {/* Quick Demo Logins Info */}
          <div className="pt-4 border-t border-slate-100 text-center flex flex-col gap-2 mt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Demo Mill Accounts</span>
            <div className="flex justify-center gap-3">
              {['admin', 'prod_mgr', 'qc1'].map(user => (
                <button 
                  type="button"
                  key={user}
                  onClick={() => {
                    const creds = {
                      admin: { username: 'admin', password: 'admin123' },
                      prod_mgr: { username: 'prod_mgr', password: 'manager123' },
                      qc1: { username: 'qc1', password: 'qc123' }
                    }[user];
                    setSignInForm(creds);
                  }}
                  className="text-xs text-slate-600 hover:text-[#6B4EFF] border border-slate-200 bg-slate-50 px-2.5 py-1 rounded-md transition-all font-semibold"
                >
                  {user}
                </button>
              ))}
            </div>
          </div>

          {/* Version Footer */}
          <div className="text-center text-[10px] text-slate-400 font-medium tracking-wide">
            v1.2.0 • Surat Textile Management Suite
          </div>

        </div>
      </div>
    </div>
  );
}
