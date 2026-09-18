import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, Button, Input, Select, Badge, Table, TableRow, TableCell } from '../components/ui';
import { 
  Plus, CheckCircle, Clock, FileText, Layers, Activity, 
  CheckSquare, Truck, ArrowRight, ShieldCheck, UserCheck 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function StaffEntry({ setActiveTab }) {
  const { t } = useLanguage();
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
    party_id: '', fabric_id: '', challan_no: '', ordered_meters: '', rate_per_meter: '12.50',
    broker_name: '', lr_no: ''
  });

  const [batchForm, setBatchForm] = useState({
    lot_id: '', machine_id: '', shift: 'A', weight_kg: ''
  });

  const [qcForm, setQcForm] = useState({
    lot_id: '', meters_inspected: '100', total_defect_points: '12', remarks: 'Good surface quality'
  });

  const [dispatchForm, setDispatchForm] = useState({
    lot_id: '', total_rolls: '10', total_meters: '1050', gross_weight_kg: '189.5', core_tare_kg: '4.5', finished_kg: '185'
  });

  const fetchData = async () => {
    try {
      const [p, f, m, l] = await Promise.all([
        api.get('/api/v1/parties').catch(() => []),
        api.get('/api/v1/fabrics').catch(() => []),
        api.get('/api/v1/production/machines/dashboard').catch(() => []),
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
        rate_per_meter: parseFloat(inwardForm.rate_per_meter),
        customer_po_ref: inwardForm.broker_name ? `Broker: ${inwardForm.broker_name}` : null,
        inward_challan_ref: inwardForm.lr_no ? `LR: ${inwardForm.lr_no}` : null
      });
      setSuccessMsg(`✓ Inward Order #${res.job_order_no || 'Created'} recorded with thermal sticker labels ready!`);
      setInwardForm({ party_id: '', fabric_id: '', challan_no: '', ordered_meters: '', rate_per_meter: '12.50', broker_name: '', lr_no: '' });
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
      await api.post('/api/v1/production/batches', {
        lot_id: parseInt(batchForm.lot_id),
        machine_id: parseInt(batchForm.machine_id),
        shift: batchForm.shift,
        fabric_weight_kg: parseFloat(batchForm.weight_kg)
      });
      setSuccessMsg('✓ Production Machine Run initiated and verified against chemical stock!');
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
      const points = parseInt(qcForm.total_defect_points || 0);
      const meters = parseFloat(qcForm.meters_inspected || 100);
      // ASTM D5430 formula: (pts * 100) / (meters * (58/36))
      const pointsPer100 = (points * 100) / (meters * (58 / 36));
      const pass = pointsPer100 <= 28;
      await api.post('/api/v1/qc/inspections', {
        lot_id: parseInt(qcForm.lot_id),
        meters_inspected: meters,
        total_defect_points: points,
        result: pass ? 'PASS' : 'FAIL',
        remarks: `${qcForm.remarks || 'Routine Floor Inspection'} [ASTM D5430: ${pointsPer100.toFixed(1)} pts/100m²]`
      });
      setSuccessMsg(`✓ ASTM D5430 QC Inspection logged: Result is ${pass ? 'PASSED (Grade A)' : 'REPROCESS REQUIRED (Seconds)'}`);
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
      const gross = parseFloat(dispatchForm.gross_weight_kg || 0);
      const tare = parseFloat(dispatchForm.core_tare_kg || 0);
      const net = gross > 0 ? parseFloat((gross - tare).toFixed(2)) : parseFloat(dispatchForm.finished_kg);

      await api.post('/api/v1/dispatch/packing-lists', {
        lot_id: parseInt(dispatchForm.lot_id),
        total_rolls: parseInt(dispatchForm.total_rolls),
        total_meters: parseFloat(dispatchForm.total_meters),
        total_kg: net,
        gross_weight_kg: gross,
        tare_weight_kg: tare
      });
      setSuccessMsg(`✓ Finished Goods Packing List created! Net Weight: ${net} kg verified.`);
      setDispatchForm({ lot_id: '', total_rolls: '10', total_meters: '1050', gross_weight_kg: '189.5', core_tare_kg: '4.5', finished_kg: '185' });
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
              {t('staff_portal_tag')}
            </span>
          </div>
          <h2 className="text-xl font-bold">{t('staff_console_title')}</h2>
          <p className="text-emerald-100 text-xs mt-0.5">
            {t('staff_console_sub')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className="bg-white text-emerald-800 font-bold px-3 py-1.5 text-xs">
            <UserCheck size={14} className="mr-1 inline" /> {t('logged_as_staff')}
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
          { id: 'job_inward', name: t('tab_inward_greige'), icon: FileText, desc: t('tab_inward_sub') },
          { id: 'batch_load', name: t('tab_load_batch'), icon: Activity, desc: t('tab_load_sub') },
          { id: 'qc_check', name: t('tab_qc_inspect'), icon: CheckSquare, desc: t('tab_qc_sub') },
          { id: 'dispatch_pack', name: t('tab_packing_dispatch'), icon: Truck, desc: t('tab_packing_sub') }
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
            <Card title={t('tab_inward_greige')}>
              <form onSubmit={handleInwardSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label={t('form_customer_trader')}
                    value={inwardForm.party_id}
                    onChange={e => setInwardForm({ ...inwardForm, party_id: e.target.value })}
                    options={[{ label: t('form_select_customer'), value: '' }, ...parties.map(p => ({ label: `${p.trade_name} (${p.city || 'Surat'})`, value: p.party_id }))]}
                    required
                  />
                  <Select
                    label={t('form_fabric_quality')}
                    value={inwardForm.fabric_id}
                    onChange={e => setInwardForm({ ...inwardForm, fabric_id: e.target.value })}
                    options={[{ label: t('form_select_fabric'), value: '' }, ...fabrics.map(f => ({ label: `${f.fabric_name} (${f.fabric_category})`, value: f.fabric_id }))]}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label={t('form_challan_no')}
                    placeholder="e.g. CH-9821"
                    value={inwardForm.challan_no}
                    onChange={e => setInwardForm({ ...inwardForm, challan_no: e.target.value })}
                    required
                  />
                  <Input
                    label={t('form_received_meters')}
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2500"
                    value={inwardForm.ordered_meters}
                    onChange={e => setInwardForm({ ...inwardForm, ordered_meters: e.target.value })}
                    required
                  />
                  <Input
                    label={t('form_job_rate')}
                    type="number"
                    step="0.01"
                    value={inwardForm.rate_per_meter}
                    onChange={e => setInwardForm({ ...inwardForm, rate_per_meter: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Broker / Commission Agent"
                    placeholder="e.g. Surat Cloth Agency / Dalal"
                    value={inwardForm.broker_name}
                    onChange={e => setInwardForm({ ...inwardForm, broker_name: e.target.value })}
                  />
                  <Input
                    label="Transport LR / Bilty No."
                    placeholder="e.g. LR-9921 / Shriram Transport"
                    value={inwardForm.lr_no}
                    onChange={e => setInwardForm({ ...inwardForm, lr_no: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11">
                  {loading ? 'Submitting...' : t('form_submit_inward')}
                </Button>
              </form>
            </Card>
          )}

          {/* TAB 2: MACHINE BATCH */}
          {entryType === 'batch_load' && (
            <Card title={t('tab_load_batch')}>
              <form onSubmit={handleBatchSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label={t('form_select_lot')}
                    value={batchForm.lot_id}
                    onChange={e => setBatchForm({ ...batchForm, lot_id: e.target.value })}
                    options={[{ label: `-- ${t('form_select_lot')} --`, value: '' }, ...lots.map(l => ({ label: `${l.lot_no} (${l.current_status})`, value: l.lot_id }))]}
                    required
                  />
                  <Select
                    label={t('form_select_machine')}
                    value={batchForm.machine_id}
                    onChange={e => setBatchForm({ ...batchForm, machine_id: e.target.value })}
                    options={[{ label: `-- ${t('form_select_machine')} --`, value: '' }, ...machines.map(m => ({ label: `${m.machine_name} (${m.machine_type})`, value: m.machine_id }))]}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label={t('form_shift')}
                    value={batchForm.shift}
                    onChange={e => setBatchForm({ ...batchForm, shift: e.target.value })}
                    options={[{ label: t('form_shift_a'), value: 'A' }, { label: t('form_shift_b'), value: 'B' }, { label: t('form_shift_c'), value: 'C' }]}
                    required
                  />
                  <Input
                    label={t('form_fabric_mass_kg')}
                    type="number"
                    step="0.1"
                    placeholder="e.g. 350.5"
                    value={batchForm.weight_kg}
                    onChange={e => setBatchForm({ ...batchForm, weight_kg: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11">
                  {loading ? 'Submitting...' : t('form_submit_batch')}
                </Button>
              </form>
            </Card>
          )}

          {/* TAB 3: QC INSPECTION */}
          {entryType === 'qc_check' && (
            <Card title={t('tab_qc_inspect')}>
              <form onSubmit={handleQcSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label={t('form_select_lot')}
                    value={qcForm.lot_id}
                    onChange={e => setQcForm({ ...qcForm, lot_id: e.target.value })}
                    options={[{ label: `-- ${t('form_select_lot')} --`, value: '' }, ...lots.map(l => ({ label: `${l.lot_no} - ${l.current_status}`, value: l.lot_id }))]}
                    required
                  />
                  <Input
                    label={t('form_meters_inspected')}
                    type="number"
                    value={qcForm.meters_inspected}
                    onChange={e => setQcForm({ ...qcForm, meters_inspected: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('form_defect_points')}
                    type="number"
                    placeholder="e.g. 14"
                    value={qcForm.total_defect_points}
                    onChange={e => setQcForm({ ...qcForm, total_defect_points: e.target.value })}
                    required
                  />
                  <Input
                    label={t('form_inspector_remarks')}
                    placeholder="e.g. Minor selvedge curl, passed"
                    value={qcForm.remarks}
                    onChange={e => setQcForm({ ...qcForm, remarks: e.target.value })}
                  />
                </div>

                {/* ASTM D5430 Real-time Standard Preview */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">ASTM D5430 4-Point System Standard</span>
                    <span className="text-[11px] text-slate-500">
                      Score: {((parseFloat(qcForm.total_defect_points || 0) * 100) / ((parseFloat(qcForm.meters_inspected) || 100) * (58 / 36))).toFixed(2)} pts/100m² (Tolerance ≤ 28.0)
                    </span>
                  </div>
                  <Badge variant={((parseFloat(qcForm.total_defect_points || 0) * 100) / ((parseFloat(qcForm.meters_inspected) || 100) * (58 / 36))) <= 28 ? 'success' : 'danger'}>
                    {((parseFloat(qcForm.total_defect_points || 0) * 100) / ((parseFloat(qcForm.meters_inspected) || 100) * (58 / 36))) <= 28 ? '✓ GRADE A (PASS)' : '✕ SECONDS (REPROCESS)'}
                  </Badge>
                </div>

                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11">
                  {loading ? 'Submitting...' : t('form_submit_qc')}
                </Button>
              </form>
            </Card>
          )}

          {/* TAB 4: DISPATCH PACKING */}
          {entryType === 'dispatch_pack' && (
            <Card title={t('tab_packing_dispatch')}>
              <form onSubmit={handleDispatchSubmit} className="flex flex-col gap-4">
                <Select
                  label={t('form_select_lot')}
                  value={dispatchForm.lot_id}
                  onChange={e => setDispatchForm({ ...dispatchForm, lot_id: e.target.value })}
                  options={[{ label: `-- ${t('form_select_lot')} --`, value: '' }, ...lots.map(l => ({ label: `${l.lot_no} (${l.current_status})`, value: l.lot_id }))]}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('form_total_rolls')}
                    type="number"
                    value={dispatchForm.total_rolls}
                    onChange={e => setDispatchForm({ ...dispatchForm, total_rolls: e.target.value })}
                    required
                  />
                  <Input
                    label={t('form_finished_meters')}
                    type="number"
                    step="0.01"
                    value={dispatchForm.total_meters}
                    onChange={e => setDispatchForm({ ...dispatchForm, total_meters: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Gross Weight (Kg)"
                    type="number"
                    step="0.1"
                    value={dispatchForm.gross_weight_kg}
                    onChange={e => setDispatchForm({ ...dispatchForm, gross_weight_kg: e.target.value })}
                    required
                  />
                  <Input
                    label="Core Tare Weight (Kg)"
                    type="number"
                    step="0.1"
                    value={dispatchForm.core_tare_kg}
                    onChange={e => setDispatchForm({ ...dispatchForm, core_tare_kg: e.target.value })}
                    required
                  />
                  <Input
                    label="Net Finished Weight (Kg)"
                    type="number"
                    step="0.1"
                    value={parseFloat(dispatchForm.gross_weight_kg || 0) > 0 ? (parseFloat(dispatchForm.gross_weight_kg) - parseFloat(dispatchForm.core_tare_kg || 0)).toFixed(1) : dispatchForm.finished_kg}
                    disabled
                  />
                </div>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11">
                  {loading ? 'Submitting...' : t('form_submit_dispatch')}
                </Button>
              </form>
            </Card>
          )}

        </div>

        {/* Right 1 Col: Operator Help & Live Lots */}
        <div className="flex flex-col gap-4">
          <Card title={t('operator_quick_actions')}>
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => setActiveTab('jobs')}
                className="w-full text-left p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">{t('print_qr_traveler')}</span>
                  <span className="text-[10px] text-slate-400">{t('print_qr_sub')}</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button 
                onClick={() => setActiveTab('production')}
                className="w-full text-left p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">{t('log_utility_fuel')}</span>
                  <span className="text-[10px] text-slate-400">{t('log_utility_sub')}</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              <button 
                onClick={() => setActiveTab('inventory')}
                className="w-full text-left p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">{t('check_chemical_stock')}</span>
                  <span className="text-[10px] text-slate-400">{t('check_chemical_sub')}</span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>
            </div>
          </Card>

          <Card title={t('active_lots_floor')}>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {lots.length === 0 ? (
                <span className="text-xs text-slate-400">No active lots currently found.</span>
              ) : (
                lots.slice(0, 6).map(l => (
                  <div key={l.lot_id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 block truncate">{l.lot_no}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{l.barcode_value}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a 
                        href={`/api/v1/lots/${l.lot_id}/thermal-stickers-pdf`}
                        target="_blank"
                        rel="noreferrer"
                        title="Print 4x2 Thermal Stickers"
                        className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-1 rounded hover:bg-emerald-100"
                      >
                        🖨️ 4×2 Stickers
                      </a>
                      <Badge variant={l.current_status === 'COMPLETED' ? 'success' : 'default'} className="text-[10px]">
                        {l.current_status}
                      </Badge>
                    </div>
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
