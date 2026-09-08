import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, Button, Input, Select, Badge, Table, TableRow, TableCell } from '../components/ui';
import { 
  Plus, CheckCircle, Clock, FileText, Layers, Activity, 
  CheckSquare, Truck, ArrowRight, ShieldCheck, UserCheck 
} from 'lucide-react';

export default function StaffEntry({ setActiveTab }) {
  const [entryType, setEntryType] = useState('job_inward');
  const [parties, setParties] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [machines, setMachines] = useState([]);
  const [lots, setLots] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [inwardForm, setInwardForm] = useState({
    party_id: '', fabric_id: '', challan_no: '', ordered_meters: '', rate_per_meter: '12.50'
  });

  const [batchForm, setBatchForm] = useState({
    lot_id: '', machine_id: '', shift: 'A', weight_kg: ''
  });

  const [qcForm, setQcForm] = useState({
    lot_id: '', meters_inspected: '100', total_defect_points: '12', remarks: 'Good surface quality'
  });

  const [dispatchForm, setDispatchForm] = useState({
    lot_id: '', total_rolls: '10', total_meters: '1050', finished_kg: '185'
  });

  const fetchData = async () => {
    try {
      const [p, f, m, l] = await Promise.all([
        api.get('/api/v1/parties').catch(() => []),
        api.get('/api/v1/fabrics').catch(() => []),
        api.get('/api/production/machines/dashboard').catch(() => []),
        api.get('/api/v1/lots').catch(() => [])
      ]);
      setParties(p || []);
      setFabrics(f || []);
      setMachines(m || []);
      setLots(l || []);
    } catch (err) {
      console.error('Error fetching staff master data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInwardSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const party = parties.find(p => p.party_id === parseInt(inwardForm.party_id));
      const res = await api.post('/api/v1/job-orders', {
        party_id: parseInt(inwardForm.party_id),
        party_name: party?.trade_name || 'Trader',
        fabric_id: parseInt(inwardForm.fabric_id),
        challan_no: inwardForm.challan_no || `CH-${Date.now().toString().slice(-4)}`,
        ordered_meters: parseFloat(inwardForm.ordered_meters),
        rate_per_meter: parseFloat(inwardForm.rate_per_meter)
      });
      setSuccessMsg(`✓ Inward Order #${res.job_order_no || 'Created'} recorded successfully by Staff!`);
      setInwardForm({ party_id: '', fabric_id: '', challan_no: '', ordered_meters: '', rate_per_meter: '12.50' });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/production/batches', {
        lot_id: parseInt(batchForm.lot_id),
        machine_id: parseInt(batchForm.machine_id),
        shift: batchForm.shift,
        fabric_weight_kg: parseFloat(batchForm.weight_kg)
      });
      setSuccessMsg('✓ Production Machine Run initiated and logged on floor!');
      setBatchForm({ lot_id: '', machine_id: '', shift: 'A', weight_kg: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQcSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const points = parseInt(qcForm.total_defect_points);
      const pass = points <= 28;
      await api.post('/api/v1/quality/inspect', {
        lot_id: parseInt(qcForm.lot_id),
        meters_inspected: parseFloat(qcForm.meters_inspected),
        total_defect_points: points,
        overall_grade: pass ? 'GRADE_A' : 'GRADE_B',
        inspection_result: pass ? 'PASSED' : 'REPROCESS',
        remarks: qcForm.remarks
      });
      setSuccessMsg(`✓ QC Inspection logged: Result is ${pass ? 'PASSED (Grade A)' : 'REPROCESS REQUIRED'}`);
      setQcForm({ lot_id: '', meters_inspected: '100', total_defect_points: '12', remarks: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/v1/dispatch/packing-lists', {
        lot_id: parseInt(dispatchForm.lot_id),
        total_rolls: parseInt(dispatchForm.total_rolls),
        total_meters: parseFloat(dispatchForm.total_meters),
        total_kg: parseFloat(dispatchForm.finished_kg)
      });
      setSuccessMsg('✓ Finished Goods Packing List created for Dispatch!');
      setDispatchForm({ lot_id: '', total_rolls: '10', total_meters: '1050', finished_kg: '185' });
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Staff Portal • High-Speed Data Entry
            </span>
          </div>
          <h2 className="text-xl font-bold">Floor Operator & Data Entry Console</h2>
          <p className="text-emerald-100 text-xs mt-0.5">
            Quickly enter inward greige, load production machines, record QC inspection, and generate packing lists.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className="bg-white text-emerald-800 font-bold px-3 py-1.5 text-xs">
            <UserCheck size={14} className="mr-1 inline" /> Logged as Floor Staff
          </Badge>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Entry Category Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'job_inward', name: '1. Inward Greige Fabric', icon: FileText, desc: 'Log incoming trader challan' },
          { id: 'batch_load', name: '2. Load Machine Batch', icon: Activity, desc: 'Assign lot to dyeing machine' },
          { id: 'qc_check', name: '3. 4-Point QC Inspection', icon: CheckSquare, desc: 'Record defect score' },
          { id: 'dispatch_pack', name: '4. Packing & Dispatch', icon: Truck, desc: 'Create delivery packing' }
        ].map(item => {
          const Icon = item.icon;
          const active = entryType === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setEntryType(item.id); setSuccessMsg(''); }}
              className={`p-4 rounded-xl text-left border transition-all flex flex-col gap-2 ${
                active 
                  ? 'bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/20' 
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                <Icon size={18} />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 block">{item.name}</span>
                <span className="text-[10px] text-slate-400 block">{item.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Form Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2">
          
          {/* TAB 1: INWARD GREIGE */}
          {entryType === 'job_inward' && (
            <Card title="Quick Inward: Greige Fabric Entry">
              <form onSubmit={handleInwardSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Customer / Trader"
                    value={inwardForm.party_id}
                    onChange={e => setInwardForm({ ...inwardForm, party_id: e.target.value })}
                    options={[{ label: '-- Select Customer --', value: '' }, ...parties.map(p => ({ label: `${p.trade_name} (${p.city || 'Surat'})`, value: p.party_id }))]}
                    required
                  />
                  <Select
                    label="Fabric Quality"
                    value={inwardForm.fabric_id}
                    onChange={e => setInwardForm({ ...inwardForm, fabric_id: e.target.value })}
                    options={[{ label: '-- Select Fabric Quality --', value: '' }, ...fabrics.map(f => ({ label: `${f.fabric_name} (${f.fabric_category})`, value: f.fabric_id }))]}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Trader Challan No."
                    placeholder="e.g. CH-9821"
                    value={inwardForm.challan_no}
                    onChange={e => setInwardForm({ ...inwardForm, challan_no: e.target.value })}
                    required
                  />
                  <Input
                    label="Received Meters"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2500"
                    value={inwardForm.ordered_meters}
                    onChange={e => setInwardForm({ ...inwardForm, ordered_meters: e.target.value })}
                    required
                  />
                  <Input
                    label="Job Rate (₹ / Meter)"
                    type="number"
                    step="0.01"
                    value={inwardForm.rate_per_meter}
                    onChange={e => setInwardForm({ ...inwardForm, rate_per_meter: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11">
                  {loading ? 'Submitting...' : '+ Submit & Create Inward Lot'}
                </Button>
              </form>
            </Card>
          )}

          {/* TAB 2: MACHINE BATCH */}
          {entryType === 'batch_load' && (
            <Card title="Quick Load: Machine Batch Run">
              <form onSubmit={handleBatchSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Select Inward Lot"
                    value={batchForm.lot_id}
                    onChange={e => setBatchForm({ ...batchForm, lot_id: e.target.value })}
                    options={[{ label: '-- Select Inward Lot --', value: '' }, ...lots.map(l => ({ label: `${l.lot_no} (${l.current_status})`, value: l.lot_id }))]}
                    required
                  />
                  <Select
                    label="Dyeing Machine / Stenter"
                    value={batchForm.machine_id}
                    onChange={e => setBatchForm({ ...batchForm, machine_id: e.target.value })}
                    options={[{ label: '-- Select Machine --', value: '' }, ...machines.map(m => ({ label: `${m.machine_name} (${m.machine_type})`, value: m.machine_id }))]}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Operational Shift"
                    value={batchForm.shift}
                    onChange={e => setBatchForm({ ...batchForm, shift: e.target.value })}
                    options={[{ label: 'A Shift (06:00 - 14:00)', value: 'A' }, { label: 'B Shift (14:00 - 22:00)', value: 'B' }, { label: 'C Shift (22:00 - 06:00)', value: 'C' }]}
                    required
                  />
                  <Input
                    label="Fabric Mass (Weight in KG)"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 350.5"
                    value={batchForm.weight_kg}
                    onChange={e => setBatchForm({ ...batchForm, weight_kg: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11">
                  {loading ? 'Submitting...' : '+ Start Machine Batch Execution'}
                </Button>
              </form>
            </Card>
          )}

          {/* TAB 3: QC INSPECTION */}
          {entryType === 'qc_check' && (
            <Card title="Quick QC: 4-Point Inspection Entry">
              <form onSubmit={handleQcSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Select Lot to Inspect"
                    value={qcForm.lot_id}
                    onChange={e => setQcForm({ ...qcForm, lot_id: e.target.value })}
                    options={[{ label: '-- Select Lot --', value: '' }, ...lots.map(l => ({ label: `${l.lot_no} - ${l.current_status}`, value: l.lot_id }))]}
                    required
                  />
                  <Input
                    label="Meters Inspected"
                    type="number"
                    value={qcForm.meters_inspected}
                    onChange={e => setQcForm({ ...qcForm, meters_inspected: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Total Defect Points (ASTM 4-Point)"
                    type="number"
                    placeholder="e.g. 14"
                    value={qcForm.total_defect_points}
                    onChange={e => setQcForm({ ...qcForm, total_defect_points: e.target.value })}
                    required
                  />
                  <Input
                    label="Inspector Remarks"
                    placeholder="e.g. Minor selvedge curl, passed"
                    value={qcForm.remarks}
                    onChange={e => setQcForm({ ...qcForm, remarks: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11">
                  {loading ? 'Submitting...' : '+ Record QC Audit Result'}
                </Button>
              </form>
            </Card>
          )}

          {/* TAB 4: DISPATCH PACKING */}
          {entryType === 'dispatch_pack' && (
            <Card title="Quick Dispatch: Packing List Entry">
              <form onSubmit={handleDispatchSubmit} className="flex flex-col gap-4">
                <Select
                  label="Select Finished Lot"
                  value={dispatchForm.lot_id}
                  onChange={e => setDispatchForm({ ...dispatchForm, lot_id: e.target.value })}
                  options={[{ label: '-- Select Finished Lot --', value: '' }, ...lots.map(l => ({ label: `${l.lot_no} (${l.current_status})`, value: l.lot_id }))]}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Total Rolls (Takas)"
                    type="number"
                    value={dispatchForm.total_rolls}
                    onChange={e => setDispatchForm({ ...dispatchForm, total_rolls: e.target.value })}
                    required
                  />
                  <Input
                    label="Finished Meters"
                    type="number"
                    step="0.01"
                    value={dispatchForm.total_meters}
                    onChange={e => setDispatchForm({ ...dispatchForm, total_meters: e.target.value })}
                    required
                  />
                  <Input
                    label="Finished Weight (KG)"
                    type="number"
                    step="0.1"
                    value={dispatchForm.finished_kg}
                    onChange={e => setDispatchForm({ ...dispatchForm, finished_kg: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11">
                  {loading ? 'Submitting...' : '+ Create Packing List & Ready for Dispatch'}
                </Button>
              </form>
            </Card>
          )}

        </div>

        {/* Right 1 Col: Operator Help & Live Lots */}
        <div className="flex flex-col gap-4">
          <Card title="Operator Quick Actions">
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => setActiveTab('jobs')}
                className="w-full text-left p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Print QR Lot Traveler</span>
                  <span className="text-[10px] text-slate-400">Generate barcoded slip</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button 
                onClick={() => setActiveTab('production')}
                className="w-full text-left p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Log Utility Fuel (Coal/Steam)</span>
                  <span className="text-[10px] text-slate-400">Enter shift power readings</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button 
                onClick={() => setActiveTab('inventory')}
                className="w-full text-left p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Check Dye Chemical Stock</span>
                  <span className="text-[10px] text-slate-400">View reorder alerts</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>
            </div>
          </Card>

          <Card title="Current Active Lots on Floor">
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {lots.length === 0 ? (
                <span className="text-xs text-slate-400">No active lots currently found.</span>
              ) : (
                lots.slice(0, 5).map(l => (
                  <div key={l.lot_id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">{l.lot_no}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{l.barcode_value}</span>
                    </div>
                    <Badge variant={l.current_status === 'COMPLETED' ? 'success' : 'default'} className="text-[10px]">
                      {l.current_status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
