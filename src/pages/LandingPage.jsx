import React, { useState } from 'react';
import { api } from '../lib/api';
import {
  Factory, Zap, Search, LogIn, ChevronRight, ArrowRight,
  Layers, FlaskConical, Gauge, ClipboardCheck, Package, Truck,
  Mic, Globe, CheckCircle2, X, Star, Shield, BarChart3,
  Sparkles, Activity, Thermometer, Droplets, Ruler, QrCode,
  FileText, Calculator, Users, Phone, Mail, MapPin,
  ChevronDown, ExternalLink, Boxes, Scan
} from 'lucide-react';

// ── Sticky Navbar ──────────────────────────────────────────────
function Navbar({ onSignIn, onDemo, onTrack }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Factory size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white text-sm tracking-wide leading-none">VastraERP</span>
              <span className="text-[9px] text-emerald-400 font-semibold tracking-widest uppercase">Surat & Tirupur Mill Standard</span>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-1">
            {['Modules', 'Workflow', 'AI Assistant', 'Trader Portal'].map(label => (
              <a key={label} href={`#${label.toLowerCase().replace(/\s/g, '-')}`}
                className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all">
                {label}
              </a>
            ))}
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-2">
            <button onClick={onTrack}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg transition-all">
              <Search size={13} /> Track Lot / LR
            </button>
            <button onClick={onDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-600/20 transition-all">
              <Zap size={13} /> Live Demo
            </button>
            <button onClick={onSignIn}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-all">
              <LogIn size={13} /> Sign In
            </button>
            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden ml-1 text-slate-300 hover:text-white">
              {mobileOpen ? <X size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 flex flex-col gap-1 border-t border-slate-700/50 pt-3">
            {['Modules', 'Workflow', 'AI Assistant', 'Trader Portal'].map(label => (
              <a key={label} href={`#${label.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">
                {label}
              </a>
            ))}
            <button onClick={() => { setMobileOpen(false); onTrack(); }}
              className="sm:hidden flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg">
              <Search size={14} /> Track Lot / LR
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

// ── Trader Lot Tracking Modal ────────────────────────────────
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
      setError('No results found. Please check your Lot Number, LR Number, or Job Order Number and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-[#0F172A] px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">📦 Track Your Lot / Delivery Challan</h3>
            <p className="text-slate-400 text-xs mt-0.5">Enter LR No, Lot No, or Job Order No</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSearch} className="p-6 flex flex-col gap-4">
          <div className="flex gap-2">
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="e.g. LOT/2026-27/00001 or LR-8821"
              className="flex-1 px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button type="submit" disabled={loading}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60">
              {loading ? '...' : 'Track'}
            </button>
          </div>
          {error && <p className="text-rose-500 text-xs font-medium bg-rose-50 px-4 py-2.5 rounded-xl">{error}</p>}
          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
              <p className="font-bold text-emerald-800">Lot: {result.lot_no || query}</p>
              <p className="text-emerald-700 mt-1">Status: <span className="font-bold">{result.current_status || 'IN_PROCESS'}</span></p>
              {result.stage && <p className="text-emerald-600 text-xs mt-1">Current Stage: {result.stage}</p>}
            </div>
          )}
          {!result && !error && (
            <p className="text-slate-400 text-xs text-center">Merchants & traders: check your fabric lot status without signing in.</p>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Hero Section ─────────────────────────────────────────────
function HeroSection({ onDemo, onSignIn, onTrack }) {
  return (
    <section className="relative min-h-[92vh] flex items-center bg-gradient-to-b from-[#0F172A] via-[#0F172A] to-[#1E293B] overflow-hidden pt-16">
      {/* Decorative grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      {/* Glowing orb */}
      <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 left-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col gap-6">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-300 text-xs font-semibold">Live in Surat (Pandesara / Sachin / Palsana) & Tirupur Clusters</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              The Zero-Defect Manufacturing ERP for Indian Textile
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> Dyeing & Printing</span> Mills
            </h1>

            <p className="text-slate-400 text-base lg:text-lg leading-relaxed max-w-xl">
              From Grey Taka Inward & 4"×2" Thermal Barcode Stickers to Color Lab MLR Chemical Locks, 
              ASTM D5430 4-Point QC, and Rule 55 Delivery Challans with 5% Job Work GST (SAC 998821).
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mt-2">
              <button onClick={onDemo}
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-xl shadow-emerald-600/25 transition-all hover:shadow-emerald-500/30 hover:scale-[1.02]">
                <Zap size={16} /> Launch Interactive Demo
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <button onClick={onSignIn}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white text-sm font-bold rounded-xl border border-slate-600 hover:border-slate-400 transition-all">
                <LogIn size={15} /> Staff & Operator Sign In
              </button>
              <button onClick={onTrack}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-slate-300 hover:text-white text-sm font-semibold transition-all hover:bg-white/5 rounded-xl">
                <Package size={15} /> Track Merchant Lot
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex items-center gap-6 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Shield size={13} className="text-emerald-500" /> GST Compliant</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-500" /> ASTM D5430</span>
              <span className="flex items-center gap-1.5"><Star size={13} className="text-amber-400" /> Production Grade</span>
            </div>
          </div>

          {/* Right: Live floor snapshot card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-emerald-400" />
                  <span className="text-sm font-bold text-white">Live Mill Floor Snapshot</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full animate-pulse">● LIVE</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Active Jet Machines', value: '12 / 14', icon: Gauge, color: 'emerald' },
                  { label: "Today's Inward", value: '42,850 M (418 Takas)', icon: Layers, color: 'cyan' },
                  { label: 'ASTM QC Pass Rate', value: '98.4% Grade A', icon: ClipboardCheck, color: 'emerald' },
                  { label: 'Dispatched Today', value: '38,200 M • GST ✓', icon: Truck, color: 'amber' },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3.5 hover:border-slate-600/60 transition-all">
                    <stat.icon size={16} className={`text-${stat.color}-400 mb-2`} />
                    <p className="text-white font-bold text-sm">{stat.value}</p>
                    <p className="text-slate-500 text-[10px] font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
              {/* Mini process bar */}
              <div className="mt-4 flex gap-1">
                {['Inward', 'Desizing', 'Scouring', 'Bleach', 'Dyeing', 'Stenter', 'QC', 'Pack'].map((s, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className={`h-1.5 rounded-full ${i < 6 ? 'bg-emerald-500' : i === 6 ? 'bg-amber-400' : 'bg-slate-600'}`} />
                    <span className="text-[7px] text-slate-500 mt-1 block">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Workflow Timeline Section ────────────────────────────────
const workflowSteps = [
  {
    icon: Layers,
    title: 'Grey Inward & Taka Entry',
    hindi: 'कोरा कपड़ा आवक',
    desc: 'Roll-by-roll tracking with Length (L₁), Weight (L₂), EPI/PPI, GSM specs, Broker name, and Transport LR Number. Auto-generates 4"×2" Zebra-format thermal barcode stickers for every taka.',
    tags: ['Taka Tracking', 'Thermal Stickers', 'QR Barcode'],
  },
  {
    icon: Ruler,
    title: 'Standard 9-Stage Route Card',
    hindi: 'प्रोसेस रूट कार्ड',
    desc: 'Auto-generated manufacturing chain: Desizing → Scouring → Bleaching → Mercerizing → Jet Dyeing → Washing & Soaping → Stenter Finishing → ASTM 4-Point QC → Folding & Packing, with cumulative shrinkage tracking at every stage.',
    tags: ['9 Stages', 'Shrinkage Control', 'Auto-Generated'],
  },
  {
    icon: FlaskConical,
    title: 'Color Lab Recipe & Chemical Lock',
    hindi: 'कलर लैब रेसिपी',
    desc: 'Automated % OWF (dyes) and g/L (auxiliaries) MLR calculations. Pre-batch simulation engine checks physical inventory and sets UNLOCKED_READY or LOCKED_INSUFFICIENT_STOCK before production starts.',
    tags: ['MLR Formulation', 'Chemical Lock', 'Inventory Check'],
  },
  {
    icon: Thermometer,
    title: 'Machine Floor Logs & Utility Tracking',
    hindi: 'मशीन फ्लोर लॉग',
    desc: 'Jet & Stenter machine logs capture speed (m/min), chamber temperature, operator name, and shift code. Utility tracking for coal (kg), steam (kg), electricity (kWh), and water (liters) with unit costing.',
    tags: ['Jet Logs', 'Stenter Logs', 'Utility Costing'],
  },
  {
    icon: ClipboardCheck,
    title: 'ASTM D5430 4-Point QC Engine',
    hindi: 'क्वालिटी चेक',
    desc: 'Automated digital defect scoring using the ASTM D5430 formula: (Points × 100) / (Meters × Width/36). Score ≤ 28.0 pts/100m² = Grade A (Pass); above threshold = Seconds (Reprocess).',
    tags: ['ASTM D5430', 'Grade A / Seconds', 'Auto-Scoring'],
  },
  {
    icon: Truck,
    title: 'Folding, Packing & Rule 55 Delivery Challan',
    hindi: 'पैकिंग और डिलीवरी चालान',
    desc: 'Gross vs Net tare weight audit, formal A4 PDF delivery challans with QR verification codes, and automatic 5% GST (SAC 998821) invoice generation with live party ledger debit postings.',
    tags: ['Tare Weight', 'Rule 55 PDF', '5% GST'],
  },
];

function WorkflowSection() {
  return (
    <section id="workflow" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Shop-Floor Workflow</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
            End-to-End Manufacturing Chain — Hardened for Real Mill Ground Reality
          </h2>
          <p className="text-slate-500 text-sm mt-3">
            Every stage mirrors actual Surat & Tirupur process mill operations. No speculative boilerplate — only verified, industry-standard workflows.
          </p>
        </div>

        <div className="grid gap-5">
          {workflowSteps.map((step, index) => (
            <div key={index}
              className="group relative flex gap-5 p-5 lg:p-6 border border-slate-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-300">
              {/* Step number */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/15 group-hover:scale-105 transition-transform">
                  <step.icon size={20} className="text-white" />
                </div>
                <span className="text-[10px] font-black text-slate-300 mt-2">STEP {index + 1}</span>
                {index < workflowSteps.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-2 rounded-full" />}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-slate-900 text-base">{step.title}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">{step.hindi}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {step.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Modules Showcase Section ─────────────────────────────────
function ModulesSection() {
  const modules = [
    { icon: Layers, title: 'Grey Inward & Lots', desc: 'Taka entry, EPI/PPI/GSM specs, LR tracking, and 4"×2" thermal barcode sticker printing.' },
    { icon: FlaskConical, title: 'Color Lab & Recipes', desc: 'MLR formulation, % OWF & g/L dosage, recipe approval workflow, and pre-batch chemical lock.' },
    { icon: Gauge, title: 'Production & Machines', desc: 'Batch runs, jet/stenter machine logs, operator assignments, shift management, and utility costing.' },
    { icon: ClipboardCheck, title: 'ASTM D5430 Quality', desc: 'Digital 4-point inspection, automatic grade classification, and quality certificate generation.' },
    { icon: Boxes, title: 'Inventory & Stock', desc: 'Finished goods, greige stock, chemical inventory with FIFO batch tracking and reorder alerts.' },
    { icon: Truck, title: 'Dispatch & Challans', desc: 'Rule 55 delivery challans, packing lists, tare weight audit, and party ledger integration.' },
    { icon: Calculator, title: 'Finance & GST', desc: '5% Job Work GST (SAC 998821), CGST/SGST/IGST, automatic invoice generation, and party ledger.' },
    { icon: BarChart3, title: 'Reports & Analytics', desc: 'Production dashboards, lot P&L, efficiency metrics, ESG sustainability, and owner cockpit.' },
  ];
  return (
    <section id="modules" className="py-20 lg:py-28 bg-slate-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Core ERP Modules</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
            Everything a Process Mill Needs — Built In, Not Bolted On
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                <m.icon size={18} className="text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">{m.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── AI Voice Assistant Spotlight ─────────────────────────────
function AISpotlight() {
  const queries = [
    { lang: 'Hindi', text: '"Batch 42 ka dyeing status kya hai?"', flag: '🇮🇳' },
    { lang: 'Gujarati', text: '"Grey fabric stock ketlu baki che?"', flag: '🇮🇳' },
    { lang: 'English', text: '"Flag any batch running behind schedule"', flag: '🌐' },
    { lang: 'Hinglish', text: '"Aaj ka total inward kitna hua meters me?"', flag: '🇮🇳' },
  ];
  return (
    <section id="ai-assistant" className="py-20 lg:py-28 bg-gradient-to-b from-[#0F172A] to-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 mb-5">
              <Sparkles size={13} className="text-purple-400" />
              <span className="text-purple-300 text-xs font-semibold">Powered by AI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
              VastraAI — Multilingual Factory Floor Copilot
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              A natural-language layer on top of your ERP. Factory floor workers (who won't type into a dashboard) can ask 
              questions in <strong className="text-white">Hindi, Gujarati, English, or Hinglish</strong> — by voice or text. 
              AI parses it, converts to a database query, and answers in the same language.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><Mic size={13} className="text-purple-400" /> Voice Input</span>
              <span className="flex items-center gap-1.5"><Globe size={13} className="text-purple-400" /> 4 Languages</span>
              <span className="flex items-center gap-1.5"><Scan size={13} className="text-purple-400" /> Real-time Query</span>
            </div>
          </div>
          <div className="space-y-3">
            {queries.map((q, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 flex items-start gap-3 hover:border-purple-500/30 transition-all">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Mic size={14} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{q.text}</p>
                  <p className="text-slate-500 text-[10px] font-semibold mt-1">{q.flag} {q.lang} • Shop-floor voice query</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Trader Self-Service Section ──────────────────────────────
function TraderSection({ onTrack }) {
  return (
    <section id="trader-portal" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
              Trader & Merchant Self-Service Portal
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed mb-6 max-w-xl">
              Cloth merchants, commission agents, and traders can track their lot progress, view folding breakdowns, 
              and download delivery challans online — reducing repetitive phone calls to the mill office.
            </p>
            <div className="flex flex-wrap gap-4 text-emerald-100 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><QrCode size={14} /> Track by LR / Lot No</span>
              <span className="flex items-center gap-1.5"><FileText size={14} /> Download PDF Challans</span>
              <span className="flex items-center gap-1.5"><Users size={14} /> No Login Required</span>
            </div>
          </div>
          <button onClick={onTrack}
            className="shrink-0 inline-flex items-center gap-2 px-7 py-4 bg-white text-emerald-700 text-sm font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all">
            <Search size={16} /> Track Your Lot Now
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Comparison Table ─────────────────────────────────────────
function ComparisonTable() {
  const features = [
    'Taka-Level Roll Tracking (L₁/L₂ Weights)',
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
    <section className="py-20 lg:py-28 bg-slate-50/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Why VastraERP</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
            Cluster Benchmark Comparison
          </h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 font-bold text-slate-700">Feature</th>
                  <th className="text-center px-4 py-3.5 font-bold text-slate-500">Tally / Busy</th>
                  <th className="text-center px-4 py-3.5 font-bold text-slate-500">Custom Mill SW</th>
                  <th className="text-center px-4 py-3.5 font-bold text-emerald-700 bg-emerald-50">VastraERP ✦</th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3 text-slate-700 font-medium">{f}</td>
                    <td className="text-center px-4 py-3 text-slate-400">✕</td>
                    <td className="text-center px-4 py-3 text-slate-400">{i < 3 ? '△' : '✕'}</td>
                    <td className="text-center px-4 py-3 text-emerald-600 font-bold bg-emerald-50/50">✓</td>
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

// ── Footer ───────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0F172A] border-t border-slate-800 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <Factory size={15} className="text-white" />
              </div>
              <span className="font-black text-white text-sm">VastraERP</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Production-grade Manufacturing ERP for Indian Textile Dyeing, Printing, and Finishing Process Mills.
            </p>
          </div>
          {/* Mill Modules */}
          <div>
            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-4">Mill Modules</h4>
            <ul className="space-y-2">
              {['Grey Inward & Taka Entry', 'Color Lab & Recipes', 'Production & Machine Floor', 'Quality (ASTM D5430)', 'Dispatch & Challans', 'Finance & GST'].map(l => (
                <li key={l} className="text-slate-500 text-xs hover:text-emerald-400 transition-colors cursor-default">{l}</li>
              ))}
            </ul>
          </div>
          {/* Compliance */}
          <div>
            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-4">Compliance & Standards</h4>
            <ul className="space-y-2">
              {['GST Rule 55 (Delivery Challan)', 'SAC 998821 (Job Work)', 'ASTM D5430 (4-Point System)', 'HSN 5407-5516 (Fabric)', 'CGST/SGST/IGST Invoicing', 'E-Way Bill Integration'].map(l => (
                <li key={l} className="text-slate-500 text-xs hover:text-emerald-400 transition-colors cursor-default">{l}</li>
              ))}
            </ul>
          </div>
          {/* Contact */}
          <div>
            <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-slate-500 text-xs"><MapPin size={13} className="text-slate-600 shrink-0" /> Pandesara GIDC, Surat, Gujarat 394221</li>
              <li className="flex items-center gap-2 text-slate-500 text-xs"><Phone size={13} className="text-slate-600 shrink-0" /> +91 9876 543 210</li>
              <li className="flex items-center gap-2 text-slate-500 text-xs"><Mail size={13} className="text-slate-600 shrink-0" /> erp@vastra.co.in</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-600 text-[10px]">© 2026 VastraERP — Built for Indian Textile Process Mills</p>
          <p className="text-slate-700 text-[10px] font-medium">Engineered with ♦ from Surat & Tirupur</p>
        </div>
      </div>
    </footer>
  );
}

// ── Main Landing Page Export ─────────────────────────────────
export default function LandingPage({ onSignIn, onDemo }) {
  const [trackOpen, setTrackOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar onSignIn={onSignIn} onDemo={onDemo} onTrack={() => setTrackOpen(true)} />
      <HeroSection onDemo={onDemo} onSignIn={onSignIn} onTrack={() => setTrackOpen(true)} />
      <ModulesSection />
      <WorkflowSection />
      <AISpotlight />
      <TraderSection onTrack={() => setTrackOpen(true)} />
      <ComparisonTable />
      <Footer />
      <TrackingModal isOpen={trackOpen} onClose={() => setTrackOpen(false)} />
    </div>
  );
}
