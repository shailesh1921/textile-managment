import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, Sparkles, TrendingUp, DollarSign, 
  Droplet, Sliders, CheckCircle2, AlertCircle, RefreshCw, Layers 
} from 'lucide-react';
import { api } from '../../lib/api';

export const RecipeOptimizer = () => {
  const [shades, setShades] = useState(['Navy Blue', 'Jet Black', 'Royal Maroon', 'Sage Green']);
  const [selectedShade, setSelectedShade] = useState('Navy Blue');
  const [weightKg, setWeightKg] = useState('350');
  const [liquorRatio, setLiquorRatio] = useState(7);
  const [meters, setMeters] = useState('2500');
  const [jobRate, setJobRate] = useState('14.50');
  const [recipeData, setRecipeData] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateRecipe = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/v1/recipes/optimize', {
        shade_name: selectedShade,
        weight_kg: parseFloat(weightKg),
        liquor_ratio: liquorRatio,
        meters: parseFloat(meters),
        agreed_rate_per_meter: parseFloat(jobRate)
      });
      setRecipeData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateRecipe();
  }, [selectedShade, liquorRatio]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <FlaskConical size={12} className="text-cyan-400" />
              Color Kitchen & Dye Lab
            </span>
            <span className="text-xs text-slate-400">Chemical Margin Optimization</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">AI Dye Recipe & Cost Predictor</h1>
          <p className="text-xs text-slate-300 mt-0.5">Automated dye formulation dosage, liquor ratio simulator, and net job work margin calculator</p>
        </div>

        {recipeData && (
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/10">
            <span className="text-[9px] text-slate-300 font-bold block uppercase">Net Profit Margin</span>
            <span className="text-lg font-black text-emerald-400">
              {recipeData.cost_summary.profit_margin_pct}% (₹{recipeData.cost_summary.net_margin_per_meter}/m)
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: Parameters Left + Cost & Recipe Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Input Parameters (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formulation Controls</h2>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Target Shade Quality:</label>
              <div className="grid grid-cols-2 gap-2">
                {shades.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedShade(s)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left truncate ${
                      selectedShade === s 
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ● {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Liquor Ratio (M:L):</label>
                <span className="text-xs font-extrabold text-[#6B4EFF]">1:{liquorRatio}</span>
              </div>
              <input 
                type="range" 
                min="6" 
                max="12" 
                step="1" 
                value={liquorRatio}
                onChange={(e) => setLiquorRatio(parseInt(e.target.value))}
                className="w-full accent-[#6B4EFF] cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Water volume: {parseInt(weightKg || 0) * liquorRatio} Liters</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Fabric Weight (KG):</label>
                <input 
                  type="number" 
                  value={weightKg} 
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Lot Meters:</label>
                <input 
                  type="number" 
                  value={meters} 
                  onChange={(e) => setMeters(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Agreed Job Work Rate (₹/Meter):</label>
              <input 
                type="number" 
                step="0.25"
                value={jobRate} 
                onChange={(e) => setJobRate(e.target.value)}
                className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <button
              onClick={calculateRecipe}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sliders size={14} />}
              <span>Re-calculate Formulation</span>
            </button>
          </div>

        </div>

        {/* Right: Cost Sheet & Color Kitchen Recipe (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {recipeData && (
            <>
              {/* Cost Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Batch Cost</span>
                  <span className="text-lg font-black text-slate-800 mt-0.5">₹{recipeData.cost_summary.total_batch_cost.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500 font-medium">All Dyes & Energy</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Cost per Meter</span>
                  <span className="text-lg font-black text-slate-800 mt-0.5">₹{recipeData.cost_summary.cost_per_meter}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Chemical: ₹{recipeData.cost_summary.chemical_cost_per_meter}</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Job Work Rate</span>
                  <span className="text-lg font-black text-blue-600 mt-0.5">₹{jobRate}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Client Agreement</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Profit Margin</span>
                  <span className="text-lg font-black text-emerald-600 mt-0.5">+{recipeData.cost_summary.profit_margin_pct}%</span>
                  <span className="text-[10px] text-emerald-700 font-medium">₹{recipeData.cost_summary.net_margin_per_meter} / meter</span>
                </div>
              </div>

              {/* AI Recipe Recommendation Banner */}
              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Sparkles size={14} className="text-blue-600" />
                  <span>AI Chemical Optimization Suggestion</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {recipeData.ai_optimization.recommendation}
                </p>
                <div className="flex gap-4 pt-1 text-[11px] font-semibold text-blue-700">
                  <span>Class: {recipeData.ai_optimization.class}</span>
                  <span>Profile: {recipeData.ai_optimization.temp_profile}</span>
                </div>
              </div>

              {/* Recipe Breakdown Table */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Color Kitchen Dispensing Sheet</h3>
                
                {/* Dyes Table */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-2">1. Dyestuff Components (% on weight of fabric):</span>
                  <div className="space-y-1.5">
                    {recipeData.recipe_lines.dyes.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{d.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">({d.pct_owf}% owf)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-slate-900">{d.dosage_grams} Grams</span>
                          <span className="text-[10px] text-slate-500 block">₹{d.cost}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Auxiliaries Table */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block mb-2">2. Auxiliary Chemicals (Grams per Liter):</span>
                  <div className="space-y-1.5">
                    {recipeData.recipe_lines.auxiliaries.map((a, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{a.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">({a.g_per_l} g/L)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-slate-900">{a.qty_kg} KG</span>
                          <span className="text-[10px] text-slate-500 block">₹{a.cost}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
};
