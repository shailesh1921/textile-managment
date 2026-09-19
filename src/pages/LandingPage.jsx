import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api } from '../lib/api';
import {
  Factory, Zap, Search, LogIn, ChevronRight, ArrowRight,
  Layers, FlaskConical, Gauge, ClipboardCheck, Package, Truck,
  Mic, Globe, CheckCircle2, X, Star, Shield, BarChart3,
  Sparkles, Activity, Thermometer, Droplets, Ruler, QrCode,
  FileText, Calculator, Users, Phone, Mail, MapPin,
  ChevronDown, Boxes, Scan, Award, Eye
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   GLOBAL CSS INJECTED ONCE — all keyframes & utility classes
   ═══════════════════════════════════════════════════════════════ */
const CINEMATIC_CSS = `
@keyframes fadeUpIn {
  from { opacity: 0; transform: translateY(30px) translateZ(0); }
  to   { opacity: 1; transform: translateY(0) translateZ(0); }
}
@keyframes popIn {
  from { opacity: 0; transform: scale(0.92) translateZ(0); }
  to   { opacity: 1; transform: scale(1) translateZ(0); }
}
@keyframes blobDrift1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(60px, -40px) scale(1.1); }
  50%      { transform: translate(-30px, 50px) scale(0.95); }
  75%      { transform: translate(40px, 20px) scale(1.05); }
}
@keyframes blobDrift2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%      { transform: translate(-50px, 30px) scale(1.08); }
  50%      { transform: translate(40px, -60px) scale(0.92); }
  75%      { transform: translate(-20px, -30px) scale(1.03); }
}
@keyframes blobDrift3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(30px, 50px) scale(1.12); }
  66%      { transform: translate(-60px, -20px) scale(0.9); }
}
@keyframes orbPulse {
  0%, 100% { opacity: 0.12; }
  50%      { opacity: 0.25; }
}
@keyframes shimmerFlow {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes float1 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes float2 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes float3 { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
@keyframes marqueeScroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes cursorBlink {
  0%,100% { opacity: 1; }
  50%     { opacity: 0; }
}
@keyframes timelineShimmer {
  0%   { background-position: 0 -200%; }
  100% { background-position: 0 200%; }
}
@keyframes glowPulse {
  0%,100% { box-shadow: 0 0 20px rgba(16,185,129,0.15); }
  50%     { box-shadow: 0 0 40px rgba(16,185,129,0.3); }
}
@keyframes checkPop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.cinematic-fadeup { animation: fadeUpIn 0.8s cubic-bezier(0.16,1,0.3,1) both; will-change: transform, opacity; }
.cinematic-popin  { animation: popIn 0.6s cubic-bezier(0.16,1,0.3,1) both; will-change: transform, opacity; }
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.12s; }
.stagger-3 { animation-delay: 0.2s; }
.stagger-4 { animation-delay: 0.28s; }
.stagger-5 { animation-delay: 0.36s; }
.stagger-6 { animation-delay: 0.44s; }
.stagger-7 { animation-delay: 0.52s; }
.stagger-8 { animation-delay: 0.6s; }
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return;
  const style = document.createElement('style');
  style.textContent = CINEMATIC_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}

/* ═══════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════ */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, isVisible];
}

function useCountUp(target, duration = 2000, startOnVisible = false, isVisible = true) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!isVisible || started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isVisible, target, duration]);
  return value;
}

function useScrolledNavbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return scrolled;
}

/* ═══════════════════════════════════════════════════════════════
   SPARKLE PARTICLES
   ═══════════════════════════════════════════════════════════════ */
function Sparkles_Particles() {
  const particles = useMemo(() => [
    { top: '18%', left: '12%', size: 3, delay: '0s', anim: 'float1', dur: '3s' },
    { top: '25%', left: '85%', size: 2, delay: '0.8s', anim: 'float2', dur: '4s' },
    { top: '45%', left: '8%', size: 2, delay: '1.5s', anim: 'float3', dur: '3.5s' },
    { top: '15%', left: '65%', size: 3, delay: '0.3s', anim: 'float1', dur: '4.2s' },
    { top: '55%', left: '92%', size: 2, delay: '2s', anim: 'float2', dur: '3.8s' },
    { top: '35%', left: '35%', size: 2, delay: '1.2s', anim: 'float3', dur: '3.2s' },
  ], []);
  return (
    <>
      {particles.map((p, i) => (
        <div key={i} className="absolute rounded-full bg-emerald-400/40 pointer-events-none"
          style={{ top: p.top, left: p.left, width: p.size, height: p.size,
            animation: `${p.anim} ${p.dur} ease-in-out infinite`, animationDelay: p.delay }} />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AURORA GRADIENT MESH BACKGROUND
   ═══════════════════════════════════════════════════════════════ */
function AuroraMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      {/* Blob 1 - Emerald */}
      <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.12]"
        style={{ top: '5%', right: '15%', background: 'radial-gradient(circle, rgba(16,185,129,0.5) 0%, transparent 70%)',
          animation: 'blobDrift1 20s ease-in-out infinite' }} />
      {/* Blob 2 - Cyan */}
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.10]"
        style={{ bottom: '10%', left: '10%', background: 'radial-gradient(circle, rgba(6,182,212,0.5) 0%, transparent 70%)',
          animation: 'blobDrift2 25s ease-in-out infinite' }} />
      {/* Blob 3 - Purple */}
      <div className="absolute w-[450px] h-[450px] rounded-full opacity-[0.08]"
        style={{ top: '40%', left: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)',
          animation: 'blobDrift3 22s ease-in-out infinite' }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NAVBAR (Frosted Glass on Scroll)
   ═══════════════════════════════════════════════════════════════ */
function Navbar({ onSignIn, onRegister, onDemo, onTrack }) {
  const scrolled = useScrolledNavbar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navLinks = [
    { label: 'Modules', href: '#modules' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'AI Copilot', href: '#ai-copilot' },
    { label: 'Trader Portal', href: '#trader-portal' },
  ];
  const handleNav = (href) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-[#0A0F1E]/90 backdrop-blur-2xl shadow-lg shadow-black/20 border-b border-white/[0.06]'
               : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
              <Factory size={17} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white text-sm tracking-wide leading-none">VastraERP</span>
              <span className="text-[8px] text-emerald-400/80 font-bold tracking-[0.2em] uppercase">Textile Manufacturing</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map(l => (
              <button key={l.label} onClick={() => handleNav(l.href)}
                className="px-4 py-2 text-[13px] font-semibold text-slate-400 hover:text-white rounded-lg transition-all duration-300 hover:bg-white/[0.06]">
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onTrack}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white border border-white/[0.1] hover:border-white/[0.2] rounded-xl transition-all duration-300 hover:bg-white/[0.04]">
              <Search size={13} /> Track Lot
            </button>
            <button onClick={onDemo}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/[0.1] transition-all duration-300">
              <Zap size={13} /> Demo
            </button>
            <button onClick={onRegister}
              className="group inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-[1.03]">
              <Sparkles size={12} /> Register Mill
            </button>
            <button onClick={onSignIn}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur-sm rounded-xl border border-white/[0.1] hover:border-white/[0.2] transition-all duration-300">
              <LogIn size={13} /> Sign In
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden ml-1 text-slate-400 hover:text-white transition-colors">
              {mobileOpen ? <X size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="lg:hidden pb-4 flex flex-col gap-1 border-t border-white/[0.06] pt-3 cinematic-fadeup">
            {navLinks.map(l => (
              <button key={l.label} onClick={() => handleNav(l.href)}
                className="px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-xl text-left transition-all">
                {l.label}
              </button>
            ))}
            <button onClick={() => { setMobileOpen(false); onRegister(); }}
              className="px-4 py-3 text-sm font-bold text-emerald-400 hover:text-emerald-300 text-left">
              ✨ Register Your Mill
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════════════ */
function StatCard({ icon: Icon, value, suffix, label, color, isVisible }) {
  const count = useCountUp(value, 2200, true, isVisible);
  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 hover:border-emerald-400/20 hover:-translate-y-0.5 transition-all duration-500 group">
      <Icon size={16} className={`text-${color}-400 mb-2 group-hover:scale-110 transition-transform`} />
      <p className="text-white font-black text-lg tabular-nums">{count.toLocaleString()}{suffix}</p>
      <p className="text-slate-500 text-[10px] font-semibold mt-0.5 tracking-wide">{label}</p>
    </div>
  );
}

function ProcessBar() {
  const stages = ['Inward', 'Desize', 'Scour', 'Bleach', 'Mercerize', 'Dye', 'Wash', 'Stenter', 'QC'];
  const [hovered, setHovered] = useState(null);
  return (
    <div className="mt-5">
      <div className="flex gap-1 relative">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.15) 50%, transparent 100%)',
            backgroundSize: '200% 100%', animation: 'shimmerFlow 3s linear infinite' }} />
        {stages.map((s, i) => (
          <div key={i} className="flex-1 relative group cursor-pointer" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div className={`h-2 rounded-full transition-all duration-500 ${
              i < 6 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
              i === 6 ? 'bg-amber-400/80' : 'bg-slate-700'}`} />
            <span className={`text-[7px] font-bold mt-1.5 block text-center transition-colors duration-300 ${
              hovered === i ? 'text-emerald-400' : 'text-slate-600'}`}>{s}</span>
            {hovered === i && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap cinematic-popin z-10 border border-white/10">
                Stage {i + 1}: {s} {i < 6 ? '✓' : i === 6 ? '⏳' : '○'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroSection({ onDemo, onRegister, onSignIn, onTrack }) {
  const [cardRef, cardVisible] = useScrollReveal(0.2);
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16" style={{ background: 'linear-gradient(170deg, #0A0F1E 0%, #0F172A 40%, #111827 100%)' }}>
      <AuroraMesh />
      <Sparkles_Particles />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left */}
          <div className="flex flex-col gap-6">
            <div className="cinematic-popin stagger-1 inline-flex items-center gap-2.5 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-full px-5 py-2 w-fit backdrop-blur-sm">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
              <span className="text-emerald-300 text-xs font-semibold">Live across 47 mills in Surat & Tirupur clusters</span>
            </div>

            <h1 className="cinematic-fadeup stagger-2 text-3xl sm:text-4xl lg:text-[3.4rem] font-black text-white leading-[1.1] tracking-tight">
              The Zero-Defect{' '}
              <span className="block mt-1">Manufacturing ERP</span>
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                for Indian Textile Mills
              </span>
            </h1>

            <p className="cinematic-fadeup stagger-3 text-slate-400 text-base lg:text-lg leading-relaxed max-w-xl">
              From Grey Taka Inward & 4×2 Thermal Barcode Stickers to Color Lab MLR Chemical Locks,
              ASTM D5430 4-Point QC Grading, and Rule 55 GST Delivery Challans — all in one system.
            </p>

            <div className="cinematic-fadeup stagger-4 flex flex-wrap gap-3 mt-1">
              <button onClick={onRegister}
                className="group inline-flex items-center gap-2.5 px-7 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-2xl transition-all duration-500 hover:shadow-[0_0_50px_rgba(16,185,129,0.35)] hover:scale-[1.03] active:scale-[0.98]">
                <Sparkles size={16} /> Register Your Mill — Free Trial
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button onClick={onDemo}
                className="inline-flex items-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl border border-white/[0.1] hover:border-white/[0.2] transition-all duration-500">
                <Zap size={15} /> Launch 1-Click Demo
              </button>
              <button onClick={onSignIn}
                className="inline-flex items-center gap-2 px-5 py-4 text-slate-300 hover:text-white text-sm font-semibold transition-all duration-300 hover:bg-white/[0.04] rounded-2xl">
                <LogIn size={15} /> Staff Sign In
              </button>
            </div>

            <div className="cinematic-fadeup stagger-5 flex flex-wrap items-center gap-5 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Shield size={13} className="text-emerald-500/70" /> GST Compliant</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-500/70" /> ASTM D5430</span>
              <span className="flex items-center gap-1.5"><Award size={13} className="text-amber-400/70" /> ISO 9001</span>
              <span className="flex items-center gap-1.5">🇮🇳 Made in India</span>
            </div>
          </div>

          {/* Right — Glass Dashboard Card */}
          <div ref={cardRef} className="relative cinematic-fadeup stagger-5">
            {/* Glow orbs */}
            <div className="absolute -top-16 -right-16 w-[350px] h-[350px] rounded-full pointer-events-none" 
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', animation: 'orbPulse 4s ease-in-out infinite' }} />
            <div className="absolute -bottom-12 -left-12 w-[280px] h-[280px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', animation: 'orbPulse 5s ease-in-out infinite 1s' }} />

            <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 lg:p-7 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <Activity size={16} className="text-emerald-400" />
                  <span className="text-sm font-bold text-white">Live Mill Floor Dashboard</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20"
                  style={{ animation: 'glowPulse 2s ease-in-out infinite' }}>● LIVE</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Gauge} value={12} suffix=" / 14" label="Active Jet Machines" color="emerald" isVisible={cardVisible} />
                <StatCard icon={Layers} value={42850} suffix=" M" label="Today's Grey Inward" color="cyan" isVisible={cardVisible} />
                <StatCard icon={ClipboardCheck} value={98} suffix=".4%" label="ASTM QC Grade A Rate" color="emerald" isVisible={cardVisible} />
                <StatCard icon={Truck} value={38200} suffix=" M" label="Dispatched Today (GST ✓)" color="amber" isVisible={cardVisible} />
              </div>
              <ProcessBar />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MARQUEE — Social Proof
   ═══════════════════════════════════════════════════════════════ */
function Marquee() {
  const items = 'Pandesara GIDC  •  Sachin GIDC  •  Palsana  •  Kim  •  Kadodara  •  Tirupur Zone 1–4  •  Erode  •  Ahmedabad  •  Surat Ring Road  •  Ichalkaranji';
  return (
    <div className="relative overflow-hidden bg-[#0A0F1E] border-y border-white/[0.04] py-4"
      style={{ maskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)' }}>
      <div className="flex whitespace-nowrap" style={{ animation: 'marqueeScroll 30s linear infinite' }}>
        <span className="text-xs font-semibold text-slate-600 tracking-widest uppercase mx-4">{items}</span>
        <span className="text-xs font-semibold text-slate-600 tracking-widest uppercase mx-4">{items}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BENTO MODULES GRID
   ═══════════════════════════════════════════════════════════════ */
function BentoModules() {
  const [ref, visible] = useScrollReveal(0.1);
  const modules = [
    { icon: Layers, title: 'Grey Inward & Taka Tracking', desc: 'Roll-by-roll tracking with L₁/L₂ measurements, EPI/PPI/GSM specs, broker details, LR numbers, and automatic 4"×2" Zebra-format thermal barcode sticker generation.', large: true, gradient: 'from-emerald-500 to-teal-600' },
    { icon: ClipboardCheck, title: 'ASTM D5430 Quality Engine', desc: 'Automated digital 4-point defect scoring with grade classification. Score ≤28.0 pts/100m² = Grade A. Integrated quality certificates and reprocess workflows.', large: true, gradient: 'from-cyan-500 to-blue-600' },
    { icon: FlaskConical, title: 'Color Lab & Recipes', desc: 'MLR formulation with % OWF dyes and g/L auxiliaries. Pre-batch chemical inventory lock.', gradient: 'from-purple-500 to-violet-600' },
    { icon: Gauge, title: 'Production & Machines', desc: 'Batch runs, jet/stenter logs, operator assignments, shift management, utility costing.', gradient: 'from-emerald-500 to-green-600' },
    { icon: Boxes, title: 'Inventory & Stock', desc: 'Finished goods, greige stock, chemical inventory with FIFO batch tracking and reorder alerts.', gradient: 'from-amber-500 to-orange-600' },
    { icon: Truck, title: 'Dispatch & Challans', desc: 'Rule 55 delivery challans, packing lists, tare weight audit, party ledger integration.', gradient: 'from-rose-500 to-pink-600' },
    { icon: Calculator, title: 'Finance & GST', desc: '5% Job Work GST (SAC 998821), CGST/SGST/IGST, automatic invoice and party ledger.', gradient: 'from-blue-500 to-indigo-600' },
    { icon: BarChart3, title: 'Reports & Analytics', desc: 'Production dashboards, lot P&L, efficiency metrics, ESG sustainability, owner cockpit.', gradient: 'from-teal-500 to-cyan-600' },
  ];
  return (
    <section id="modules" ref={ref} className="py-24 lg:py-32 bg-[#080C18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-xs font-bold text-emerald-400/80 uppercase tracking-[0.2em]">Core ERP Modules</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-4">
            Everything a Process Mill Needs —{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Built In, Not Bolted On</span>
          </h2>
        </div>

        <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {modules.map((m, i) => (
            <div key={i} className={`${m.large ? 'sm:col-span-2' : ''} bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 
              hover:border-emerald-400/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/[0.05] transition-all duration-500 group`}>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <m.icon size={18} className="text-white" />
              </div>
              <h3 className="font-bold text-white text-sm mb-2 group-hover:text-emerald-300 transition-colors">{m.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{m.desc}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400/60 mt-3 group-hover:text-emerald-400 transition-colors">
                Explore <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WORKFLOW TIMELINE
   ═══════════════════════════════════════════════════════════════ */
const timelineSteps = [
  { icon: Layers, title: 'Grey Inward & Taka Entry', hindi: 'कोरा कपड़ा आवक', desc: 'Roll-by-roll tracking with Length (L₁), Weight (L₂), EPI/PPI, GSM specs, and Broker details. Auto-generates 4"×2" thermal barcode stickers.', tags: ['Taka Tracking', 'QR Barcode', 'Thermal Stickers'] },
  { icon: Ruler, title: '9-Stage Route Card Generation', hindi: 'प्रोसेस रूट कार्ड', desc: 'Auto-generated manufacturing chain: Desizing → Scouring → Bleaching → Mercerizing → Jet Dyeing → Washing → Stenter → QC → Packing with shrinkage tracking.', tags: ['9 Stages', 'Shrinkage Control'] },
  { icon: FlaskConical, title: 'Color Lab Recipe & Chemical Lock', hindi: 'कलर लैब रेसिपी', desc: 'Automated % OWF / g/L MLR calculations. Pre-batch simulation checks inventory and sets UNLOCKED_READY or LOCKED_INSUFFICIENT_STOCK.', tags: ['MLR Engine', 'Chemical Lock'] },
  { icon: Thermometer, title: 'Machine Floor Logs & Utility Tracking', hindi: 'मशीन फ्लोर लॉग', desc: 'Jet & Stenter machine logs: speed (m/min), temperature, operator, shift. Utility: coal (kg), steam (kg), electricity (kWh), water (L).', tags: ['Jet Logs', 'Utility Costing'] },
  { icon: ClipboardCheck, title: 'ASTM D5430 4-Point QC Grading', hindi: 'क्वालिटी चेक', desc: 'Formula: (Points × 100) / (Meters × Width/36). Score ≤ 28.0 = Grade A (Pass). Above threshold triggers reprocess workflow.', tags: ['ASTM D5430', 'Auto-Scoring'] },
  { icon: Truck, title: 'Folding, Packing & Rule 55 Challan', hindi: 'डिलीवरी चालान', desc: 'Tare weight audit, formal A4 PDF delivery challans with QR codes, 5% GST (SAC 998821) invoice with live party ledger posting.', tags: ['Rule 55 PDF', '5% GST'] },
];

function WorkflowTimeline() {
  const [ref, visible] = useScrollReveal(0.05);
  return (
    <section id="workflow" ref={ref} className="py-24 lg:py-32 bg-gradient-to-b from-[#080C18] to-[#0A0F1E]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-xs font-bold text-emerald-400/80 uppercase tracking-[0.2em]">Shop-Floor Workflow</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-4">
            End-to-End Manufacturing Chain
          </h2>
          <p className="text-slate-500 text-sm mt-3">Every stage mirrors actual Surat & Tirupur process mill operations.</p>
        </div>

        <div className="relative">
          {/* Timeline line with shimmer */}
          <div className="absolute left-6 lg:left-8 top-0 bottom-0 w-[2px] bg-slate-800 rounded-full overflow-hidden">
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.4) 50%, transparent 100%)',
              backgroundSize: '100% 200%', animation: 'timelineShimmer 4s linear infinite' }} />
          </div>

          <div className="space-y-6 lg:space-y-8">
            {timelineSteps.map((step, i) => (
              <div key={i} className={`relative flex gap-5 lg:gap-8 pl-2 transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: visible ? `${i * 150}ms` : '0ms' }}>
                {/* Node */}
                <div className="relative z-10 shrink-0 flex flex-col items-center">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                    style={i < 4 ? { animation: 'glowPulse 3s ease-in-out infinite', animationDelay: `${i * 0.5}s` } : {}}>
                    <step.icon size={20} className="text-white" />
                  </div>
                  <span className="text-[9px] font-black text-slate-600 mt-2 tracking-wider">{String(i + 1).padStart(2, '0')}</span>
                </div>
                {/* Card */}
                <div className="flex-1 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 lg:p-6 hover:border-emerald-400/15 transition-all duration-500 group">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">{step.title}</h3>
                    <span className="text-[9px] text-slate-500 font-semibold bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06]">{step.hindi}</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {step.tags.map(t => (
                      <span key={t} className="text-[9px] font-bold text-emerald-400/70 bg-emerald-400/[0.08] border border-emerald-400/10 px-2.5 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI COPILOT — Interactive Typing Demo
   ═══════════════════════════════════════════════════════════════ */
const chatCycles = [
  { query: 'Batch 42 ka dyeing status kya hai?', lang: 'Hindi', response: '✅ Batch 42: Jet Dyeing complete → now in Stenter Finishing (Stage 7/9). ETA: 2.5 hours.' },
  { query: 'Grey fabric stock ketlu baki che?', lang: 'Gujarati', response: '📦 Grey Stock: 12,450 meters (86 takas) across 3 lots. Oldest lot: 4 days.' },
  { query: 'Flag any batch running behind schedule', lang: 'English', response: '⚠️ 2 batches delayed: Lot #1847 (Stenter +3hrs), Lot #1852 (Dyeing +1.5hrs). Notifying supervisors.' },
  { query: 'Aaj ka total inward kitna hua meters me?', lang: 'Hinglish', response: '📊 Today\'s inward: 42,850 meters (418 takas). Top party: Shree Hari Textiles (12,400m).' },
];

function AICopilotSection() {
  const [ref, visible] = useScrollReveal(0.15);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [typedQuery, setTypedQuery] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef(null);

  const startTyping = useCallback(() => {
    const cycle = chatCycles[cycleIndex % chatCycles.length];
    setTypedQuery('');
    setShowResponse(false);
    setIsTyping(true);
    let i = 0;
    timerRef.current = setInterval(() => {
      if (i < cycle.query.length) {
        setTypedQuery(cycle.query.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timerRef.current);
        setIsTyping(false);
        setTimeout(() => setShowResponse(true), 400);
        setTimeout(() => {
          setCycleIndex(prev => prev + 1);
        }, 4000);
      }
    }, 45);
  }, [cycleIndex]);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(startTyping, 600);
    return () => { clearTimeout(timeout); if (timerRef.current) clearInterval(timerRef.current); };
  }, [visible, startTyping]);

  const currentCycle = chatCycles[cycleIndex % chatCycles.length];
  return (
    <section id="ai-copilot" ref={ref} className="py-24 lg:py-32 relative overflow-hidden" style={{ background: 'linear-gradient(170deg, #0A0F1E 0%, #0F172A 50%, #111827 100%)' }}>
      {/* Glow orbs */}
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', animation: 'orbPulse 5s ease-in-out infinite' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/[0.08] border border-purple-500/15 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
              <Sparkles size={13} className="text-purple-400" />
              <span className="text-purple-300 text-xs font-semibold">AI-Powered</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4">
              VastraAI — Multilingual{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Factory Floor Copilot</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-7">
              Factory floor workers who won't type into a dashboard can ask questions by voice or text in
              <strong className="text-white"> Hindi, Gujarati, English, or Hinglish</strong>.
              The AI parses it, queries the database, and responds in the same language — instantly.
            </p>
            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Mic size={13} className="text-purple-400/70" /> Voice Input</span>
              <span className="flex items-center gap-1.5"><Globe size={13} className="text-purple-400/70" /> 4 Languages</span>
              <span className="flex items-center gap-1.5"><Scan size={13} className="text-purple-400/70" /> Real-time Query</span>
              <span className="flex items-center gap-1.5"><Eye size={13} className="text-purple-400/70" /> Context Aware</span>
            </div>
          </div>

          {/* Chat Terminal */}
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/30">
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-5 py-3 bg-white/[0.03] border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-[10px] font-semibold text-slate-600 ml-2">VastraAI Terminal — {currentCycle.lang}</span>
              <div className="ml-auto" style={{ animation: 'glowPulse 2s ease-in-out infinite' }}>
                <Mic size={14} className="text-purple-400" />
              </div>
            </div>
            {/* Chat body */}
            <div className="p-5 min-h-[200px] flex flex-col gap-4">
              {/* User message */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Users size={12} className="text-slate-400" />
                </div>
                <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                  <p className="text-white text-sm font-medium">
                    {typedQuery}
                    {isTyping && <span className="inline-block w-[2px] h-4 bg-emerald-400 ml-0.5 align-middle" style={{ animation: 'cursorBlink 0.8s step-end infinite' }} />}
                  </p>
                  <p className="text-slate-600 text-[9px] font-semibold mt-1">🇮🇳 {currentCycle.lang} • Voice query</p>
                </div>
              </div>
              {/* AI response */}
              {showResponse && (
                <div className="flex items-start gap-3 cinematic-fadeup">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={12} className="text-white" />
                  </div>
                  <div className="bg-purple-500/[0.08] border border-purple-500/15 rounded-xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                    <p className="text-purple-100 text-sm font-medium">{currentCycle.response}</p>
                    <p className="text-purple-400/50 text-[9px] font-semibold mt-1">VastraAI • 0.3s response</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRADER PORTAL — Split Card with Live Search
   ═══════════════════════════════════════════════════════════════ */
function TraderPortal() {
  const [ref, visible] = useScrollReveal(0.15);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await api.get(`/api/v1/lots/track?q=${encodeURIComponent(query.trim())}`);
      setResult(data);
    } catch {
      setError('No results found. Check your Lot/LR/Job Order number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="trader-portal" ref={ref} className="py-24 lg:py-32 bg-[#080C18]">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="relative rounded-3xl overflow-hidden">
          {/* BG gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <div className="relative grid lg:grid-cols-2 gap-8 p-8 lg:p-14">
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
                Trader & Merchant Self-Service Portal
              </h2>
              <p className="text-emerald-100/80 text-sm leading-relaxed mb-6 max-w-lg">
                Cloth merchants, commission agents, and traders can track lot progress, view folding breakdowns,
                and download delivery challans — reducing repetitive phone calls to the mill office.
              </p>
              <div className="flex flex-wrap gap-5 text-emerald-100/70 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><QrCode size={14} /> Track by LR / Lot No</span>
                <span className="flex items-center gap-1.5"><FileText size={14} /> Download PDF Challans</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> No Login Required</span>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <form onSubmit={handleSearch} className="bg-black/20 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <p className="text-white text-sm font-bold mb-3">📦 Track Your Lot / Delivery Challan</p>
                <div className="flex gap-2">
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="e.g. LOT/2026-27/00001 or LR-8821"
                    className="flex-1 px-4 py-3 text-sm bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all" />
                  <button type="submit" disabled={loading}
                    className="px-5 py-3 bg-white text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-50 transition-all disabled:opacity-60 shadow-lg">
                    {loading ? '...' : 'Track'}
                  </button>
                </div>
                {error && <p className="text-rose-200 text-xs mt-3 bg-rose-500/20 px-3 py-2 rounded-lg">{error}</p>}
                {result && (
                  <div className="mt-3 bg-white/10 border border-white/15 rounded-xl p-3.5 cinematic-fadeup">
                    <p className="font-bold text-white text-sm">Lot: {result.lot_no || query}</p>
                    <p className="text-emerald-200 text-xs mt-1">Status: <strong>{result.current_status || 'IN_PROCESS'}</strong></p>
                    {result.stage && <p className="text-emerald-300/70 text-xs mt-0.5">Stage: {result.stage}</p>}
                    {result.party_name && <p className="text-white/50 text-[10px] mt-1">Party: {result.party_name}</p>}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPARISON TABLE
   ═══════════════════════════════════════════════════════════════ */
function ComparisonTable() {
  const [ref, visible] = useScrollReveal(0.1);
  const features = [
    'Taka-Level Roll Tracking (L₁/L₂)',
    '4"×2" Thermal Barcode Stickers',
    '9-Stage Process Route Card',
    'Color Lab MLR (% OWF / g/L)',
    'Pre-Batch Chemical Inventory Lock',
    'ASTM D5430 4-Point QC Grading',
    'Rule 55 Delivery Challan PDF',
    '5% Job Work GST (SAC 998821)',
    'Live Party Ledger Auto-Debit',
    'Multilingual AI Voice Copilot',
  ];
  return (
    <section ref={ref} className="py-24 lg:py-32 bg-[#0A0F1E]">
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-emerald-400/80 uppercase tracking-[0.2em]">Why VastraERP</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-4">Cluster Benchmark Comparison</h2>
        </div>
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-6 py-4 font-bold text-slate-400 text-[11px]">Feature</th>
                  <th className="text-center px-4 py-4 font-bold text-slate-600 text-[11px]">Tally / Busy</th>
                  <th className="text-center px-4 py-4 font-bold text-slate-600 text-[11px]">Custom Mill SW</th>
                  <th className="text-center px-5 py-4 font-bold text-emerald-400 text-[11px] bg-emerald-400/[0.05] border-x border-emerald-400/10">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[8px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">★ RECOMMENDED</span>
                      VastraERP
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={i} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-6 py-3.5 text-slate-300 font-medium">{f}</td>
                    <td className="text-center px-4 py-3.5 text-slate-700">✕</td>
                    <td className="text-center px-4 py-3.5 text-slate-600">{i < 3 ? '△' : '✕'}</td>
                    <td className="text-center px-5 py-3.5 bg-emerald-400/[0.04] border-x border-emerald-400/10">
                      <span className={`inline-flex text-emerald-400 font-bold transition-all ${visible ? '' : 'opacity-0 scale-0'}`}
                        style={visible ? { animation: `checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both`, animationDelay: `${0.6 + i * 0.08}s` } : {}}>
                        ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════════════════════════ */
function FinalCTA({ onDemo, onRegister, onSignIn }) {
  const [ref, visible] = useScrollReveal(0.2);
  return (
    <section ref={ref} className="relative py-24 lg:py-32 overflow-hidden" style={{ background: 'linear-gradient(170deg, #0A0F1E 0%, #0F172A 50%, #111827 100%)' }}>
      <AuroraMesh />
      <div className={`relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4">
          Ready to Eliminate Defects from{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Your Mill Floor?</span>
        </h2>
        <p className="text-slate-400 text-sm lg:text-base mb-8 max-w-xl mx-auto">
          Join 47 process mills already running zero-defect operations across Surat, Tirupur, and Ahmedabad clusters.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <button onClick={onRegister}
            className="group inline-flex items-center gap-2.5 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-2xl transition-all duration-500 hover:shadow-[0_0_60px_rgba(16,185,129,0.35)] hover:scale-[1.03] active:scale-[0.98]">
            <Sparkles size={16} /> Register Your Mill — Free 30-Day Trial
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <button onClick={onDemo}
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl border border-white/[0.1] hover:border-white/[0.2] backdrop-blur-sm transition-all duration-500">
            <Zap size={15} /> Launch Live Demo
          </button>
          <button onClick={onSignIn}
            className="inline-flex items-center gap-2 px-6 py-4 text-slate-400 hover:text-white text-sm font-semibold transition-all duration-300 hover:bg-white/[0.04] rounded-2xl">
            <LogIn size={15} /> Staff Sign In
          </button>
        </div>
        <p className="text-slate-600 text-xs">Free 30-day production trial • Dedicated isolated database • Setup in 2 minutes</p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-[#060A14] border-t border-white/[0.04] pt-14 pb-8">
      {/* Gradient top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent -mt-14 mb-14" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Factory size={14} className="text-white" />
              </div>
              <span className="font-black text-white text-sm">VastraERP</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Production-grade Manufacturing ERP for Indian Textile Dyeing, Printing, and Finishing Process Mills.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-[0.15em] mb-4">Mill Modules</h4>
            <ul className="space-y-2.5">
              {['Grey Inward & Taka Entry', 'Color Lab & Recipes', 'Production & Machine Floor', 'Quality (ASTM D5430)', 'Dispatch & Challans', 'Finance & GST'].map(l => (
                <li key={l} className="text-slate-600 text-xs hover:text-emerald-400 transition-colors cursor-default">{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-[0.15em] mb-4">Compliance</h4>
            <ul className="space-y-2.5">
              {['GST Rule 55 (Delivery Challan)', 'SAC 998821 (Job Work)', 'ASTM D5430 (4-Point System)', 'HSN 5407-5516 (Fabric)', 'CGST/SGST/IGST Invoicing', 'E-Way Bill Integration'].map(l => (
                <li key={l} className="text-slate-600 text-xs hover:text-emerald-400 transition-colors cursor-default">{l}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-[0.15em] mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-slate-600 text-xs"><MapPin size={13} className="text-slate-700 shrink-0 mt-0.5" /> Pandesara GIDC, Surat, Gujarat 394221</li>
              <li className="flex items-center gap-2 text-slate-600 text-xs"><Phone size={13} className="text-slate-700 shrink-0" /> +91 9876 543 210</li>
              <li className="flex items-center gap-2 text-slate-600 text-xs"><Mail size={13} className="text-slate-700 shrink-0" /> erp@vastra.co.in</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/[0.04] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-700 text-[10px]">© 2026 VastraERP — Built for Indian Textile Process Mills</p>
          <p className="text-slate-700 text-[10px] font-medium">Engineered with ♦ from Surat & Tirupur</p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRACKING MODAL (reused from before)
   ═══════════════════════════════════════════════════════════════ */
function TrackingModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await api.get(`/api/v1/lots/track?q=${encodeURIComponent(query.trim())}`);
      setResult(data);
    } catch {
      setError('No results found. Check your Lot/LR/Job Order number.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden cinematic-popin" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">📦 Track Your Lot / Delivery Challan</h3>
            <p className="text-slate-500 text-xs mt-0.5">Enter LR No, Lot No, or Job Order No</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSearch} className="p-6 flex flex-col gap-4">
          <div className="flex gap-2">
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="e.g. LOT/2026-27/00001 or LR-8821"
              className="flex-1 px-4 py-3 text-sm bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all" />
            <button type="submit" disabled={loading}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              {loading ? '...' : 'Track'}
            </button>
          </div>
          {error && <p className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl">{error}</p>}
          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 cinematic-fadeup">
              <p className="font-bold text-emerald-300 text-sm">Lot: {result.lot_no || query}</p>
              <p className="text-emerald-200 text-xs mt-1">Status: <strong>{result.current_status || 'IN_PROCESS'}</strong></p>
              {result.stage && <p className="text-emerald-400/70 text-[10px] mt-0.5">Stage: {result.stage}</p>}
            </div>
          )}
          {!result && !error && (
            <p className="text-slate-600 text-xs text-center">Merchants & traders: check fabric lot status without signing in.</p>
          )}
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage({ onSignIn, onRegister, onDemo }) {
  const [trackOpen, setTrackOpen] = useState(false);

  useEffect(() => { injectCSS(); }, []);

  return (
    <div className="min-h-screen bg-[#060A14] font-sans">
      <Navbar onSignIn={onSignIn} onRegister={onRegister} onDemo={onDemo} onTrack={() => setTrackOpen(true)} />
      <HeroSection onDemo={onDemo} onRegister={onRegister} onSignIn={onSignIn} onTrack={() => setTrackOpen(true)} />
      <Marquee />
      <BentoModules />
      <WorkflowTimeline />
      <AICopilotSection />
      <TraderPortal />
      <ComparisonTable />
      <FinalCTA onDemo={onDemo} onRegister={onRegister} onSignIn={onSignIn} />
      <Footer />
      <TrackingModal isOpen={trackOpen} onClose={() => setTrackOpen(false)} />
    </div>
  );
}
