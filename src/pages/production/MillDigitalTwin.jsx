import React, { useState, useEffect } from 'react';
import { 
  Activity, Thermometer, Gauge, Zap, Flame, Clock, 
  RotateCcw, Play, Pause, AlertTriangle, CheckCircle2, ChevronRight, X, Sparkles, Filter 
} from 'lucide-react';
import { api } from '../../lib/api';

export const MillDigitalTwin = () => {
  const [floorData, setFloorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [activeZoneFilter, setActiveZoneFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState('');

  const fetchFloorLayout = async () => {
    try {
      const res = await api.get('/api/v1/digital-twin/floor-layout');
      setFloorData(res);
      if (selectedMachine) {
        // Refresh selected machine data
        const updated = res.zones
          ?.flatMap(z => z.machines)
          ?.find(m => m.machine_id === selectedMachine.machine_id);
        if (updated) setSelectedMachine(updated);
      }
    } catch (err) {
      console.error('Error fetching digital twin floor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloorLayout();
    const interval = setInterval(fetchFloorLayout, 12000); // 12s live polling
    return () => clearInterval(interval);
  }, []);

  const handleMachineAction = async (action) => {
    if (!selectedMachine) return;
    setActionLoading(true);
    try {
      const res = await api.post('/api/v1/digital-twin/machine-action', {
        machine_id: selectedMachine.machine_id,
        action
      });
      setNotification(`✓ ${res.message}`);
      fetchFloorLayout();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const zones = floorData?.zones || [];
  const filteredZones = activeZoneFilter === 'ALL' 
    ? zones 
    : zones.filter(z => z.id === activeZoneFilter);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Telemetry Stream
            </span>
            <span className="text-xs text-slate-400">Surat Mill Cluster Standard</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Mill Floor Digital Twin</h1>
          <p className="text-xs text-slate-300 mt-0.5">Real-time 2D floor schematic, machine thermodynamics, and active batch execution</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 text-center">
            <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider">Fleet Efficiency</span>
            <span className="text-lg font-black text-emerald-400">{floorData?.mill_summary?.fleet_efficiency || '92.4%'}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 text-center">
            <span className="text-[10px] text-slate-300 font-bold block uppercase tracking-wider">Steam Load</span>
            <span className="text-lg font-black text-amber-400">{floorData?.mill_summary?.active_steam_load_tph || '8.2 TPH'}</span>
          </div>
          <button 
            onClick={fetchFloorLayout}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
            title="Refresh Telemetry"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Zone Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveZoneFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeZoneFilter === 'ALL' 
              ? 'bg-[#6B4EFF] text-white shadow-xs' 
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          All Zones ({zones.reduce((s, z) => s + z.machines.length, 0)})
        </button>
        {zones.map(z => (
          <button
            key={z.id}
            onClick={() => setActiveZoneFilter(z.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeZoneFilter === z.id 
                ? 'bg-[#6B4EFF] text-white shadow-xs' 
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {z.title.split('(')[0]} ({z.machines.length})
          </button>
        ))}
      </div>

      {/* Main Schematic Zones */}
      <div className="space-y-6">
        {filteredZones.map(zone => (
          <div key={zone.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            
            {/* Zone Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-8 rounded-full" style={{ backgroundColor: zone.color }} />
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">{zone.title}</h2>
                  <p className="text-xs text-slate-400 font-medium">{zone.description}</p>
                </div>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 rounded-full text-slate-700">
                {zone.machines.filter(m => m.status === 'RUNNING').length} of {zone.machines.length} Active
              </span>
            </div>

            {/* Machines Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zone.machines.map(m => {
                const isRunning = m.status === 'RUNNING';
                return (
                  <div
                    key={m.machine_id}
                    onClick={() => setSelectedMachine(m)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      isRunning 
                        ? 'bg-gradient-to-b from-white to-slate-50/80 border-emerald-200/80 shadow-2xs' 
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase text-slate-400">{m.code}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] font-bold text-slate-500">{m.capacity}</span>
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">{m.name}</h3>
                      </div>

                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isRunning 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    {/* Active Batch Banner */}
                    {m.active_batch ? (
                      <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 my-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-1">
                          <span>{m.active_batch.batch_no}</span>
                          <span className="text-[11px] text-emerald-700">{m.active_batch.lot_no}</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 truncate">{m.active_batch.party_name} • {m.active_batch.fabric_name}</p>
                        
                        {/* Progress Bar */}
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                            <span>Cycle Progress</span>
                            <span>{m.active_batch.progress_pct}% ({m.active_batch.est_mins_remaining}m left)</span>
                          </div>
                          <div className="w-full h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                              style={{ width: `${m.active_batch.progress_pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-100/70 rounded-lg text-center my-2.5 border border-dashed border-slate-200">
                        <span className="text-xs font-bold text-slate-400">Idle • Ready for Next Job Lot</span>
                      </div>
                    )}

                    {/* Telemetry Dials */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-2xs">
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <Thermometer size={10} className="text-rose-500" />
                          <span className="text-[9px] font-bold">TEMP</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{m.telemetry.temp_c}°C</span>
                      </div>

                      <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-2xs">
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <Gauge size={10} className="text-blue-500" />
                          <span className="text-[9px] font-bold">SPEED</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{m.telemetry.speed_mpm} m/m</span>
                      </div>

                      <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-2xs">
                        <div className="flex items-center justify-center gap-1 text-slate-400 mb-0.5">
                          <Flame size={10} className="text-amber-500" />
                          <span className="text-[9px] font-bold">STEAM</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{m.telemetry.steam_kg_hr} kg</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        ))}
      </div>

      {/* Slide-over Machine Drawer */}
      {selectedMachine && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#6B4EFF]">{selectedMachine.code} • {selectedMachine.zone}</span>
                  <h3 className="text-lg font-black text-slate-900">{selectedMachine.name}</h3>
                </div>
                <button 
                  onClick={() => setSelectedMachine(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Machine Specs */}
              <div className="grid grid-cols-2 gap-2 my-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">CAPACITY</span>
                  <span className="text-sm font-extrabold text-slate-800">{selectedMachine.capacity}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">LIQUOR RATIO</span>
                  <span className="text-sm font-extrabold text-slate-800">{selectedMachine.telemetry.liquor_ratio}</span>
                </div>
              </div>

              {/* Live Telemetry Card */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Live Sensors</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-300 block">Temperature</span>
                    <span className="text-sm font-black text-white">{selectedMachine.telemetry.temp_c}°C</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-300 block">Chamber Pres</span>
                    <span className="text-sm font-black text-white">{selectedMachine.telemetry.pressure_bar} bar</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-300 block">Steam Flow</span>
                    <span className="text-sm font-black text-white">{selectedMachine.telemetry.steam_kg_hr} kg/h</span>
                  </div>
                </div>
              </div>

              {/* Active Batch Details */}
              {selectedMachine.active_batch && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-800">Active Production Batch</span>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>Batch: {selectedMachine.active_batch.batch_no}</span>
                    <span>Lot: {selectedMachine.active_batch.lot_no}</span>
                  </div>
                  <p className="text-xs text-slate-600">{selectedMachine.active_batch.party_name}</p>
                  <p className="text-xs font-semibold text-emerald-800">{selectedMachine.active_batch.fabric_name}</p>
                </div>
              )}
            </div>

            {/* Operator Control Actions */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">Shop-Floor Controls</span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleMachineAction('RESUME')}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Play size={14} />
                  <span>Resume</span>
                </button>

                <button
                  onClick={() => handleMachineAction('PAUSE')}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Pause size={14} />
                  <span>Pause</span>
                </button>

                <button
                  onClick={() => handleMachineAction('STOP')}
                  disabled={actionLoading}
                  className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                  title="Emergency Stop"
                >
                  <AlertTriangle size={14} />
                  <span>Stop</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
