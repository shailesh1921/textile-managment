import React, { useState, useEffect } from 'react';
import { 
  Leaf, Zap, Droplet, Flame, Award, ShieldCheck, 
  TrendingDown, CheckCircle2, ArrowDownRight, RefreshCw, FileCheck 
} from 'lucide-react';
import { api } from '../../lib/api';

export const ESGSustainability = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchESGMetrics = async () => {
    try {
      const res = await api.get('/api/v1/esg/metrics');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchESGMetrics();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <Leaf size={12} className="text-emerald-400" />
              Green Mill & ESG Compliance
            </span>
            <span className="text-xs text-slate-400">Export Buyer Standard (ZDHC & HIGG Index)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Smart Energy & Carbon Footprint Audit</h1>
          <p className="text-xs text-slate-300 mt-0.5">Automated monitoring of specific steam consumption, water intensity, effluent recycling, and greenhouse emissions</p>
        </div>

        {data && (
          <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-400/30">
              {data.esg_overall_score}
            </div>
            <div>
              <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider">ESG Mill Score</span>
              <span className="text-sm font-black text-emerald-400">GOLD CERTIFIED</span>
            </div>
          </div>
        )}
      </div>

      {data && (
        <>
          {/* 4 Core Intensity Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Specific Energy SEC */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Zap size={16} />
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {data.kpis.specific_energy_sec.status}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400">Specific Energy (SEC)</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">{data.kpis.specific_energy_sec.value}</span>
                  <span className="text-xs text-slate-500">{data.kpis.specific_energy_sec.unit}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                Benchmark: {data.kpis.specific_energy_sec.benchmark}
              </p>
            </div>

            {/* Boiler Steam Ratio */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Flame size={16} />
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {data.kpis.boiler_evaporation_ratio.efficiency_pct} Efficiency
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400">Boiler Evaporation Ratio</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">{data.kpis.boiler_evaporation_ratio.value}</span>
                  <span className="text-xs text-slate-500">{data.kpis.boiler_evaporation_ratio.unit}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                Benchmark: {data.kpis.boiler_evaporation_ratio.benchmark}
              </p>
            </div>

            {/* Water Intensity */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Droplet size={16} />
                </div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {data.kpis.water_intensity.savings_vs_cluster}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400">Water Intensity</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">{data.kpis.water_intensity.value}</span>
                  <span className="text-xs text-slate-500">{data.kpis.water_intensity.unit}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                Surat Avg: {data.kpis.water_intensity.benchmark}
              </p>
            </div>

            {/* Carbon Footprint */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Leaf size={16} />
                </div>
                <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Total: {data.kpis.carbon_footprint.total_emissions_mt} MT CO₂
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400">Carbon Footprint</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">{data.kpis.carbon_footprint.value}</span>
                  <span className="text-xs text-slate-500">{data.kpis.carbon_footprint.unit}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                Scope 1 & 2 Emissions
              </p>
            </div>

          </div>

          {/* Export Compliance Badges & Cost Saving Initiatives */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Export Certifications */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Export Buyer Sustainability Audit</h3>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck size={14} /> Certified
                </span>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'ZDHC MRSL Level 3 Compliance', desc: 'Zero Discharge of Hazardous Dyestuffs & Surfactants', status: 'ACTIVE' },
                  { name: 'HIGG Index FEM (Facility Environmental Module)', desc: 'Score: 86.4 / 100 verified by independent auditors', status: 'AUDITED' },
                  { name: 'GPCB Zero Liquid Discharge (ZLD)', desc: '78.5% RO recovery with Multi-Effect Evaporator for salts', status: 'COMPLIANT' },
                  { name: 'OEKO-TEX Standard 100 (Baby & Skin Contact)', desc: 'Formaldehyde & heavy metal limits passed for finished fabric', status: 'APPROVED' },
                ].map((cert, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{cert.name}</span>
                      <span className="text-[10px] text-slate-500">{cert.desc}</span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {cert.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Heat & Energy Recovery Initiatives */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Circular Economy & Energy Savings</h3>
                <span className="text-xs font-black text-[#6B4EFF]">Annual Impact</span>
              </div>

              <div className="space-y-3">
                {data.audit_initiatives.map((init, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{init.title}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{init.impact}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-600 block">{init.annual_savings_inr}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Saved / Year</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
