import React, { useState } from 'react';
import { api } from '../lib/api';
import { Button, Input, Select, Badge } from '../components/ui';
import { Lock, User, Mail, Building, Shield, ChevronRight, Eye, EyeOff, Phone, MapPin, Hash, Sparkles } from 'lucide-react';
import { HlsBackgroundVideo } from '../components/HlsBackgroundVideo';

export default function Login({ onLoginSuccess, onBack, initialTab = 'signin' }) {
  const [isSignUp, setIsSignUp] = useState(initialTab === 'signup');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sign In Form State
  const [signInForm, setSignInForm] = useState({
    username: '',
    password: ''
  });

  // Sign Up Form State — Multi-Tenant Mill Owner Onboarding
  const [signUpForm, setSignUpForm] = useState({
    mill_name: '',
    owner_name: '',
    email: '',
    mobile: '',
    password: '',
    confirm_password: '',
    city: 'Surat',
    gstin: '',
    slug: ''
  });

  // Auto-generate clean slug preview as mill name changes
  const computedSlug = signUpForm.slug || signUpForm.mill_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (signUpForm.password !== signUpForm.confirm_password) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (signUpForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    if (signUpForm.mobile && !/^[6-9]\d{9}$/.test(signUpForm.mobile.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      setLoading(false);
      return;
    }
    if (signUpForm.gstin && signUpForm.gstin.trim().length !== 15) {
      setError('GSTIN must be exactly 15 alphanumeric characters if provided.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        mill_name: signUpForm.mill_name.trim(),
        owner_name: signUpForm.owner_name.trim(),
        email: signUpForm.email.trim(),
        mobile: signUpForm.mobile.trim(),
        password: signUpForm.password,
        slug: computedSlug,
        city: signUpForm.city,
        gstin: signUpForm.gstin.trim().toUpperCase() || undefined
      };

      const data = await api.post('/api/auth/signup', payload);
      setSuccess('✅ Your mill workspace has been created! Setting up your dashboard...');
      
      // Auto-authenticate with new token and redirect
      api.setToken(data.access_token);
      api.setUser(data.user);
      setTimeout(() => {
        onLoginSuccess(data.user, data.tenant);
      }, 800);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F1F7] flex items-center justify-center p-4 md:p-6 font-sans relative overflow-hidden">
      
      {/* Live HLS Streaming Video with soft overlay */}
      <HlsBackgroundVideo 
        src="https://stream.mux.com/NcU3HlHeF7CUL86azTTzpy3Tlb00d6iF3BmCdFslMJYM.m3u8" 
        poster="/hero.jpg" 
        overlayColor="bg-[#F3F1F7]/95" 
      />

      {/* Decorative Accent Bars */}
      <div className="hidden lg:block absolute left-12 xl:left-24 top-1/4 bottom-1/4 w-[6px] bg-slate-300/40 rounded-full z-10" />
      <div className="hidden lg:block absolute right-12 xl:right-24 top-1/4 bottom-1/4 w-[6px] bg-slate-300/40 rounded-full z-10" />

      {/* Outer framed container */}
      <div className={`border border-slate-300/40 bg-white/20 p-4 rounded-[20px] shadow-sm w-full relative z-20 transition-all duration-300 ${isSignUp ? 'max-w-lg' : 'max-w-md'}`}>
        
        {/* Inner floating card */}
        <div className="bg-white border border-slate-100/50 rounded-[14px] shadow-xl p-6 sm:p-8 flex flex-col gap-4">
          
          {/* Centered Brand Logo */}
          <div className="flex flex-col items-center gap-1.5 mb-1">
            <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#6B4EFF] to-[#573fd6] flex items-center justify-center shadow-md shadow-[#6B4EFF]/25">
              <span className="font-black text-white text-lg">V</span>
            </div>
            <span className="font-extrabold text-slate-800 text-xs tracking-[0.2em] uppercase">VASTRA ERP • TEXTILE CLOUD</span>
          </div>

          {/* Centered Welcome Heading */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900">
              {isSignUp ? 'Register Your Process Mill' : 'Sign In to Your Mill'}
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              {isSignUp ? 'Free 30-day production trial • Multi-tenant private workspace' : 'Enter your staff or owner credentials to continue'}
            </p>
          </div>

          {/* Form Tabs */}
          <div className="grid grid-cols-2 bg-slate-100/80 p-1 rounded-[10px] border border-slate-200/40">
            <button 
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                !isSignUp 
                  ? 'bg-white text-[#6B4EFF] shadow-sm font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Staff Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1 ${
                isSignUp 
                  ? 'bg-white text-[#6B4EFF] shadow-sm font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles size={12} className={isSignUp ? 'text-[#6B4EFF]' : 'text-slate-400'} />
              Register Mill
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

          {/* ════════════ SIGN IN FORM ════════════ */}
          {!isSignUp ? (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <Input
                label="Username or Email"
                type="text"
                value={signInForm.username}
                onChange={e => setSignInForm({ ...signInForm, username: e.target.value })}
                placeholder="e.g. admin or owner@skdyeing.com"
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
                {loading ? 'Authenticating...' : 'Sign In to Mill'} <ChevronRight size={14} />
              </Button>
            </form>
          ) : (
            /* ════════════ SIGN UP FORM (MULTI-TENANT MILL) ════════════ */
            <form onSubmit={handleSignUp} className="flex flex-col gap-3 max-h-[55vh] overflow-y-auto pr-1">
              {/* Mill Details */}
              <Input
                label="Mill / Company Name"
                placeholder="e.g. Om Dyeing & Printing Mill"
                value={signUpForm.mill_name}
                onChange={e => setSignUpForm({ ...signUpForm, mill_name: e.target.value })}
                required
                icon={<Building size={16} />}
              />

              {/* Slug Preview */}
              {computedSlug && (
                <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 flex items-center gap-1 -mt-1">
                  <span className="font-semibold text-slate-700">Workspace:</span>
                  <span className="text-[#6B4EFF] font-mono font-bold">{computedSlug}</span>.vastraerp.com
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Owner / Contact Person"
                  placeholder="e.g. Rajesh Patel"
                  value={signUpForm.owner_name}
                  onChange={e => setSignUpForm({ ...signUpForm, owner_name: e.target.value })}
                  required
                  icon={<User size={16} />}
                />
                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="9876543210"
                  value={signUpForm.mobile}
                  onChange={e => setSignUpForm({ ...signUpForm, mobile: e.target.value })}
                  icon={<Phone size={16} />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Email (Login Username)"
                  type="email"
                  placeholder="owner@yourmill.com"
                  value={signUpForm.email}
                  onChange={e => setSignUpForm({ ...signUpForm, email: e.target.value })}
                  required
                  icon={<Mail size={16} />}
                />
                <Select
                  label="Cluster Location"
                  value={signUpForm.city}
                  onChange={e => setSignUpForm({ ...signUpForm, city: e.target.value })}
                  options={[
                    { value: 'Surat', label: 'Surat (Pandesara/Sachin/Palsana)' },
                    { value: 'Tirupur', label: 'Tirupur Textile Cluster' },
                    { value: 'Ahmedabad', label: 'Ahmedabad Process Mills' },
                    { value: 'Erode', label: 'Erode / Coimbatore' },
                    { value: 'Ichalkaranji', label: 'Ichalkaranji (Maharashtra)' },
                    { value: 'Other', label: 'Other Textile Hub' }
                  ]}
                />
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Input
                    label="Password (min 6 chars)"
                    type={showPassword ? 'text' : 'password'}
                    value={signUpForm.password}
                    onChange={e => setSignUpForm({ ...signUpForm, password: e.target.value })}
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
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="relative">
                  <Input
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={signUpForm.confirm_password}
                    onChange={e => setSignUpForm({ ...signUpForm, confirm_password: e.target.value })}
                    placeholder="••••••••"
                    required
                    icon={<Lock size={16} />}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-[28px] text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center min-h-[36px] min-w-[36px]"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* GSTIN (Optional) */}
              <Input
                label="Mill GSTIN (Optional)"
                placeholder="e.g. 24AAACS1234A1Z0"
                value={signUpForm.gstin}
                onChange={e => setSignUpForm({ ...signUpForm, gstin: e.target.value.toUpperCase() })}
                icon={<Hash size={16} />}
              />

              <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-2.5 text-[11px] text-emerald-800">
                ✨ Includes 7 role accounts, 5 starter fabric types, 9-stage route cards & chemical master templates.
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6B4EFF] hover:bg-[#573fd6] text-white font-bold rounded-[10px] transition-all flex items-center justify-center gap-1 border-0 mt-1 min-h-[44px]"
              >
                {loading ? 'Creating Private Workspace...' : 'Register Mill & Launch Workspace'} <ChevronRight size={14} />
              </Button>
            </form>
          )}

          {onBack && (
            <button type="button" onClick={onBack}
              className="text-xs text-slate-400 hover:text-[#6B4EFF] font-semibold text-center transition-colors mt-0.5">
              ← Back to Homepage
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
