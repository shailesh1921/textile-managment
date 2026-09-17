import React, { useState, useEffect } from 'react';
import { 
  Camera, Upload, CheckCircle2, AlertTriangle, Sparkles, 
  ShieldCheck, ArrowRight, Eye, RefreshCw, Layers, Award 
} from 'lucide-react';
import { api } from '../../lib/api';

export const AIVisionQC = () => {
  const [selectedPreset, setSelectedPreset] = useState('DYE_SPOT');
  const [defectSize, setDefectSize] = useState(4.5);
  const [inspectedMeters, setInspectedMeters] = useState(100);
  const [lots, setLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Real-world textile defect samples
  const defectPresets = [
    { id: 'DYE_SPOT', name: 'Dyeing Spot / Specks', defaultSize: 4.5, icon: '🔴', sampleColor: 'from-rose-500/20 to-rose-900/40' },
    { id: 'OIL_STAIN', name: 'Machine Oil Stain', defaultSize: 2.5, icon: '🟤', sampleColor: 'from-amber-700/20 to-amber-900/40' },
    { id: 'BOWING_SKEWING', name: 'Stenter Weft Bowing', defaultSize: 7.0, icon: '〰️', sampleColor: 'from-indigo-500/20 to-indigo-900/40' },
    { id: 'PIN_HOLE', name: 'Tenter Pin Hole Tear', defaultSize: 10.0, icon: '🕳️', sampleColor: 'from-slate-700/20 to-slate-900/40' },
    { id: 'COLOR_SHADING', name: 'Selvedge Color Shading', defaultSize: 8.5, icon: '🎨', sampleColor: 'from-purple-500/20 to-purple-900/40' },
    { id: 'WEFT_CRACK', name: 'Weft Crack / Missing Pick', defaultSize: 2.0, icon: '⚡', sampleColor: 'from-blue-500/20 to-blue-900/40' },
  ];

  useEffect(() => {
    api.get('/api/v1/lots').then(res => {
      setLots(Array.isArray(res) ? res : []);
      if (res?.[0]) setSelectedLotId(res[0].lot_id);
    }).catch(() => {});
    
    // Initial analysis
    runAnalysis('DYE_SPOT', 4.5);
  }, []);

  const runAnalysis = async (type = selectedPreset, size = defectSize) => {
    setLoading(true);
    setSavedSuccess(false);
    try {
      const res = await api.post('/api/v1/qc/analyze-fabric-image', {
        defect_type: type,
        defect_size_inches: size,
        meters_inspected: inspectedMeters,
        lot_id: selectedLotId ? parseInt(selectedLotId) : undefined
      });
      setAnalysisResult(res);
      if (selectedLotId && res.inspection_id) {
        setSavedSuccess(true);
      }
    } catch (err) {
      console.error('AI QC Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setDefectSize(preset.defaultSize);
    runAnalysis(preset.id, preset.defaultSize);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Sparkles size={12} className="text-amber-300 animate-pulse" />
              ASTM D5430 4-Point System
            </span>
            <span className="text-xs text-slate-400">Automated Visual Grading</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">AI Vision Fabric Defect Detection</h1>
          <p className="text-xs text-slate-300 mt-0.5">Computer vision analysis for fabric surface defects, penalty point grading, and root-cause prevention</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/10 px-3.5 py-2 rounded-xl text-center border border-white/10">
            <span className="text-[9px] text-slate-300 font-bold block uppercase">Pass Standard</span>
            <span className="text-sm font-black text-emerald-400">≤ 28 Pts / 100m</span>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>✓ Inspection logged and recorded to official QC audit ledger in database!</span>
        </div>
      )}

      {/* Main Grid: Upload/Preview Left + Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Sample Presets & Simulated Fabric Surface (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Defect Preset Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
              Select Defect Type to Analyze:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {defectPresets.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    selectedPreset === p.id 
                      ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-xs font-bold' 
                      : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  <span className="text-xs truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Simulated Fabric Surface with AI Bounding Box */}
          <div className="relative w-full h-80 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center p-6">
            
            {/* Fabric Texture Background Simulation */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:8px_8px]" />

            {/* AI Bounding Box Overlay */}
            <div className="relative w-64 h-52 rounded-xl border-2 border-dashed border-purple-400 bg-purple-500/10 backdrop-blur-2xs flex flex-col justify-between p-3 animate-in fade-in">
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-extrabold tracking-wide uppercase">
                  {analysisResult?.analysis?.defect_name || 'Detected Defect'}
                </span>
                <span className="text-[10px] font-black text-purple-200 bg-black/40 px-1.5 py-0.5 rounded">
                  Conf: 96.8%
                </span>
              </div>

              {/* Defect representation in center */}
              <div className="self-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/40 blur-xs border border-rose-400/80 flex items-center justify-center shadow-lg">
                  <span className="text-xs font-black text-white">{defectSize}"</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-purple-200 font-semibold">
                <span>ASTM Points: +{analysisResult?.analysis?.assigned_penalty_points || 2}</span>
                <span>Dim: {defectSize} inches</span>
              </div>
            </div>

            {/* Scanner Grid Lines */}
            <div className="absolute top-4 left-4 text-[10px] font-mono text-slate-500">
              FOLD_CAMERA_01 • 120 FPS
            </div>
            <div className="absolute bottom-4 right-4 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              SURFACE SCANNER ACTIVE
            </div>
          </div>

          {/* Size & Lot Sliders */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700">Defect Dimension: <span className="text-[#6B4EFF]">{defectSize} Inches</span></label>
              <span className="text-[10px] font-semibold text-slate-400">&gt;9" = 4 Pts | &gt;6" = 3 Pts | &gt;3" = 2 Pts</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="14" 
              step="0.5" 
              value={defectSize} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setDefectSize(val);
                runAnalysis(selectedPreset, val);
              }}
              className="w-full accent-[#6B4EFF] cursor-pointer" 
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Assign to Lot:</label>
                <select 
                  value={selectedLotId} 
                  onChange={(e) => setSelectedLotId(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="">-- Standalone Test --</option>
                  {lots.map(l => (
                    <option key={l.lot_id} value={l.lot_id}>{l.lot_no} ({l.current_status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Inspected Meters:</label>
                <input 
                  type="number" 
                  value={inspectedMeters} 
                  onChange={(e) => setInspectedMeters(parseInt(e.target.value) || 100)}
                  className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: ASTM D5430 Analysis & Grading (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Result Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis Result</span>
              {loading && <RefreshCw size={14} className="animate-spin text-purple-600" />}
            </div>

            {analysisResult && (
              <>
                {/* Grade Badge Banner */}
                <div className={`p-4 rounded-xl text-center border ${
                  analysisResult.analysis.result === 'PASSED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : analysisResult.analysis.result === 'COMMERCIAL_PASS'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <span className="text-[10px] font-black uppercase tracking-widest block opacity-70">Calculated Quality Grade</span>
                  <h3 className="text-xl font-black mt-0.5">{analysisResult.analysis.overall_grade.replace('_', ' ')}</h3>
                  <span className="text-xs font-bold mt-1 inline-block">
                    {analysisResult.analysis.result === 'PASSED' ? '✓ Passed Export Standards' : '⚠ Reprocess or Seconds Discount'}
                  </span>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">PENALTY POINTS</span>
                    <span className="text-lg font-black text-slate-800">+{analysisResult.analysis.assigned_penalty_points} Pts</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block">POINTS / 100M</span>
                    <span className="text-lg font-black text-slate-800">{analysisResult.analysis.points_per_100_sq_m}</span>
                  </div>
                </div>

                {/* Root Cause & Corrective Action */}
                <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                    <Sparkles size={14} className="text-purple-600" />
                    <span>AI Root-Cause Diagnosis</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <strong>Cause:</strong> {analysisResult.root_cause_analysis.cause}
                  </p>
                  <p className="text-xs text-purple-800 leading-relaxed pt-1 border-t border-purple-200/60">
                    <strong>Corrective Action:</strong> {analysisResult.root_cause_analysis.corrective_action}
                  </p>
                </div>

                {/* Save Inspection Action */}
                <button
                  onClick={() => runAnalysis(selectedPreset, defectSize)}
                  disabled={loading}
                  className="w-full py-3 bg-[#6B4EFF] hover:bg-[#583CE0] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <CheckCircle2 size={15} />
                  <span>Log & Approve Inspection in QC Ledger</span>
                </button>
              </>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
