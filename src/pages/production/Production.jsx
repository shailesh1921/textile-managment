import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Button, Badge, Modal, Input, Select } from '../../components/ui';
import { Plus, Power, ShieldAlert, CheckCircle, Flame, Wrench, RefreshCw, Layers, Sliders, BarChart } from 'lucide-react';

const SHIFTS = [
  { value: 'A', label: 'A Shift (06:00 - 14:00)' },
  { value: 'B', label: 'B Shift (14:00 - 22:00)' },
  { value: 'C', label: 'C Shift (22:00 - 06:00)' }
];

const REPROCESS_REASONS = [
  { value: 'SHADE_MISMATCH', label: 'Shade Mismatch' },
  { value: 'PATCHY_DYEING', label: 'Patchy Dyeing / Streaks' },
  { value: 'UNEVEN_FINISH', label: 'Uneven Finish / Feel' },
  { value: 'WIDTH_VARIATION', label: 'Width Variation' },
  { value: 'CREASE_MARKS', label: 'Crease Marks' }
];

export default function Production() {
  const [prodTab, setProdTab] = useState('batch-monitor');
  const [machines, setMachines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [lots, setLots] = useState([]);
  const [recipes, setRecipes] = useState([]);
  
  // Modals
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isReprocessModalOpen, setIsReprocessModalOpen] = useState(false);
  const [isShrinkageModalOpen, setIsShrinkageModalOpen] = useState(false);

  // Selected entities
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedLotId, setSelectedLotId] = useState('');
  const [shrinkageData, setShrinkageData] = useState(null);

  // Forms
  const [loadForm, setLoadForm] = useState({
    lot_id: '',
    stage_id: '',
    machine_id: '',
    recipe_id: '',
    shift: 'A',
    fabric_weight_kg: ''
  });

  const [dispenseLines, setDispenseLines] = useState([]);
  const [entryForm, setEntryForm] = useState({
    batch_id: '',
    machine_id: '',
    shift_date: new Date().toISOString().slice(0, 10),
    shift: 'A',
    input_meters: '',
    input_kg: '',
    output_meters: '',
    output_kg: '',
    downtime_mins: 0,
    downtime_reason: '',
    remarks: ''
  });

  const [reprocessForm, setReprocessForm] = useState({
    original_lot_id: '',
    reason_code: 'SHADE_MISMATCH',
    corrective_action: ''
  });

  const [pendingStages, setPendingStages] = useState([]);

  const fetchData = async () => {
    try {
      const machs = await api.get('/api/production/machines/dashboard');
      setMachines(machs || []);
      const bts = await api.get('/api/production/batches');
      setBatches(bts || []);
      const rcps = await api.get('/api/v1/recipes').catch(() => []);
      setRecipes(rcps || []);
      const lts = await api.get('/api/v1/job-orders').then(jobs => {
        // Flat map to get all lots
        return jobs.reduce((acc, job) => {
          if (job.lots) {
            acc.push(...job.lots);
          }
          return acc;
        }, []);
      }).catch(() => []);
      setLots(lts || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update load stages when lot selection changes
  useEffect(() => {
    if (loadForm.lot_id) {
      api.get(`/api/v1/job-orders`).then(jobs => {
        const matchingLot = lots.find(l => l.lot_id === parseInt(loadForm.lot_id));
        if (matchingLot) {
          api.get(`/api/v1/job-orders/${matchingLot.job_order_id}`).then(res => {
            // Find lot stages
            api.get(`/api/production/shrinkage/${matchingLot.lot_id}`).then(shrink => {
              const pending = (shrink.stages || []).filter(s => s.status !== 'COMPLETED');
              setPendingStages(pending);
              if (pending.length > 0) {
                setLoadForm(prev => ({ ...prev, stage_id: pending[0].stage_id }));
              }
            });
          });
        }
      });
    }
  }, [loadForm.lot_id, lots]);

  const handleStartBatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/production/batches', {
        lot_id: parseInt(loadForm.lot_id),
        stage_id: parseInt(loadForm.stage_id),
        machine_id: parseInt(loadForm.machine_id),
        recipe_id: loadForm.recipe_id ? parseInt(loadForm.recipe_id) : null,
        shift: loadForm.shift,
        fabric_weight_kg: parseFloat(loadForm.fabric_weight_kg)
      });
      setIsLoadModalOpen(false);
      setLoadForm({ lot_id: '', stage_id: '', machine_id: '', recipe_id: '', shift: 'A', fabric_weight_kg: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (batchId, status) => {
    try {
      await api.patch(`/api/production/batches/${batchId}/status`, { status });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLoadDispensing = async (batch) => {
    setSelectedBatch(batch);
    if (batch.recipe_id) {
      try {
        const recipeLines = await api.get(`/api/v1/recipes`); // For demo, let's load recipes and filter
        // Match active recipe lines
        const rDetails = recipeLines.find(r => r.recipe_id === batch.recipe_id);
        const weight = parseFloat(batch.fabric_weight_kg) || 100;
        
        // Seed default chemicals for jigger/jet dispensing
        const chems = [
          { item_id: 1, item_name: 'Reactive Red H-3B', standard_qty: (weight * 0.03).toFixed(2), actual_qty: (weight * 0.03).toFixed(2), stock_batch_id: 1 },
          { item_id: 3, item_name: 'Glauber Salt', standard_qty: (weight * 0.4).toFixed(2), actual_qty: (weight * 0.4).toFixed(2), stock_batch_id: 3 },
          { item_id: 4, item_name: 'Soda Ash Light', standard_qty: (weight * 0.15).toFixed(2), actual_qty: (weight * 0.15).toFixed(2), stock_batch_id: 4 }
        ];
        setDispenseLines(chems);
        setIsDispenseModalOpen(true);
      } catch (err) {
        alert(err.message);
      }
    } else {
      alert('No recipe formulation is linked to this batch run.');
    }
  };

  const handleSubmitDispensing = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/production/batches/${selectedBatch.batch_id}/dispensing`, {
        items: dispenseLines.map(l => ({
          item_id: l.item_id,
          stock_batch_id: l.stock_batch_id,
          standard_qty: parseFloat(l.standard_qty),
          actual_qty: parseFloat(l.actual_qty)
        }))
      });
      setIsDispenseModalOpen(false);
      alert('Formulation chemicals dispensed and deducted from warehouse stock.');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEntry = (batch) => {
    setEntryForm({
      batch_id: batch.batch_id,
      machine_id: batch.machine_id,
      shift_date: new Date().toISOString().slice(0, 10),
      shift: batch.shift || 'A',
      input_meters: '',
      input_kg: batch.fabric_weight_kg || '',
      output_meters: '',
      output_kg: '',
      downtime_mins: 0,
      downtime_reason: '',
      remarks: ''
    });
    setIsEntryModalOpen(true);
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/production/entries', {
        ...entryForm,
        batch_id: parseInt(entryForm.batch_id),
        machine_id: parseInt(entryForm.machine_id),
        input_meters: parseFloat(entryForm.input_meters),
        input_kg: parseFloat(entryForm.input_kg),
        output_meters: parseFloat(entryForm.output_meters),
        output_kg: parseFloat(entryForm.output_kg),
        downtime_mins: parseInt(entryForm.downtime_mins || 0)
      });
      setIsEntryModalOpen(false);
      fetchData();
      alert('Production yield and loss logs updated on shop floor database.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReprocess = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/production/reprocess', {
        original_lot_id: parseInt(reprocessForm.original_lot_id),
        reason_code: reprocessForm.reason_code,
        corrective_action: reprocessForm.corrective_action
      });
      setIsReprocessModalOpen(false);
      setReprocessForm({ original_lot_id: '', reason_code: 'SHADE_MISMATCH', corrective_action: '' });
      fetchData();
      alert('Reprocess Job Card generated. Linked inLot Genealogy.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFetchShrinkage = async (lotId) => {
    try {
      const data = await api.get(`/api/production/shrinkage/${lotId}`);
      setShrinkageData(data);
      setIsShrinkageModalOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub navigation */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-200">
        <div className="flex gap-2">
          {[
            { id: 'batch-monitor', label: 'Machine Batch Monitor', icon: Flame },
            { id: 'batches-list', label: 'All Batch Runs', icon: Layers },
            { id: 'reprocessing', label: 'Shade Re-runs / Reprocess', icon: RefreshCw }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setProdTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                  prodTab === t.id ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 mb-2">
          <Button onClick={() => setIsLoadModalOpen(true)} className="bg-emerald-600 text-xs py-1.5 flex items-center gap-1">
            <Plus size={14} /> Load Machine
          </Button>
          <Button onClick={() => setIsReprocessModalOpen(true)} variant="danger" className="text-xs py-1.5 flex items-center gap-1">
            <RefreshCw size={14} /> Reprocess Lot
          </Button>
        </div>
      </div>

      {/* Machine Batch Monitor Tab */}
      {prodTab === 'batch-monitor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((m) => (
            <Card
              key={m.machine_id}
              title={`${m.machine_name} (${m.machine_code})`}
              headerActions={
                <Badge status={m.batch_status || m.current_status}>{m.batch_status || m.current_status}</Badge>
              }
            >
              <div className="flex flex-col gap-3 text-xs text-slate-600 mt-2">
                <div className="flex justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span>Category Type:</span>
                  <strong className="text-slate-800">{m.machine_type}</strong>
                </div>

                {m.batch_no ? (
                  <div className="flex flex-col gap-2 border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Active Batch No:</span>
                      <strong className="text-slate-800 font-mono">{m.batch_no}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Dyeing Lot Number:</span>
                      <strong className="text-slate-800 font-mono">{m.lot_no}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Order Reference:</span>
                      <strong className="font-semibold text-slate-700">{m.job_order_no}</strong>
                    </div>

                    {/* Operator Handlers */}
                    <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operational Process Steps</span>
                      <div className="grid grid-cols-2 gap-2">
                        {m.batch_status === 'LOADING' && (
                          <>
                            <Button onClick={() => handleLoadDispensing(m)} className="bg-blue-600 text-[10px] py-1">
                              Dispense Recipe
                            </Button>
                            <Button onClick={() => handleUpdateStatus(m.batch_id, 'IN_PROCESS')} className="bg-emerald-600 text-[10px] py-1">
                              Start Process
                            </Button>
                          </>
                        )}
                        {m.batch_status === 'IN_PROCESS' && (
                          <>
                            <Button onClick={() => handleUpdateStatus(m.batch_id, 'UNLOADING')} className="bg-amber-600 text-[10px] py-1">
                              Unload Batch
                            </Button>
                            <Button onClick={() => handleUpdateStatus(m.batch_id, 'QC_HOLD')} variant="danger" className="text-[10px] py-1">
                              QC hold
                            </Button>
                          </>
                        )}
                        {m.batch_status === 'UNLOADING' && (
                          <Button onClick={() => handleOpenEntry(m)} className="col-span-2 bg-emerald-700 font-bold py-1.5">
                            Log Production Output
                          </Button>
                        )}
                        {m.batch_status === 'QC_HOLD' && (
                          <Button onClick={() => handleUpdateStatus(m.batch_id, 'UNLOADING')} className="col-span-2 bg-blue-600 font-bold py-1.5">
                            Release QC Hold
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    No active batch running. Machine is currently IDLE.
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Batches List Tab */}
      {prodTab === 'batches-list' && (
        <Card title="Dyeing & Finishing Batch Audit Ledger">
          <Table headers={['Batch Number', 'Lot Number', 'Machine Code', 'Process Stage', 'Weight (kg)', 'Current State', 'Loaded at', 'Actions']}>
            {batches.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-slate-400">
                  No batches have been processed on the floor yet.
                </td>
              </tr>
            ) : (
              batches.map(b => (
                <tr key={b.batch_id} className="hover:bg-slate-50 text-xs">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{b.batch_no}</td>
                  <td className="px-6 py-3.5 font-mono font-semibold text-slate-600">{b.lot_no}</td>
                  <td className="px-6 py-3.5 font-mono">{b.machine_name}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-700">{b.process_name}</td>
                  <td className="px-6 py-3.5">{parseFloat(b.fabric_weight_kg)} kg</td>
                  <td className="px-6 py-3.5"><Badge status={b.status}>{b.status}</Badge></td>
                  <td className="px-6 py-3.5 text-slate-400">{new Date(b.loaded_at).toLocaleString()}</td>
                  <td className="px-6 py-3.5">
                    <button
                      onClick={() => handleFetchShrinkage(b.lot_id)}
                      className="text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-1 rounded font-bold"
                    >
                      Shrinkage Track
                    </button>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Reprocessing Tab */}
      {prodTab === 'reprocessing' && (
        <Card title="Reprocessed / Shade Correction Lot Records">
          <Table headers={['Reprocess Lot No', 'Original Lot', 'Reason Code', 'Corrective Formulation', 'Approved by', 'Reprocessed Date']}>
            {lots.filter(l => l.is_reprocess).length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                  No lots have been flagged for shade correction or reprocessing.
                </td>
              </tr>
            ) : (
              lots.filter(l => l.is_reprocess).map(l => (
                <tr key={l.lot_id} className="hover:bg-slate-50 text-xs">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{l.lot_no}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-400">LOT-00{l.parent_lot_id}</td>
                  <td className="px-6 py-3.5"><Badge status="failed">{l.reprocess_reason_code}</Badge></td>
                  <td className="px-6 py-3.5 text-slate-500 font-semibold">Special formulation patch re-run</td>
                  <td className="px-6 py-3.5 font-bold">Shift Supervisor</td>
                  <td className="px-6 py-3.5">{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Load Modal */}
      <Modal isOpen={isLoadModalOpen} onClose={() => setIsLoadModalOpen(false)} title="Load Lot onto Dyeing Machine">
        <form onSubmit={handleStartBatch} className="flex flex-col gap-4 text-xs">
          <Select
            label="Select Active Dyeing Lot"
            value={loadForm.lot_id}
            onChange={e => setLoadForm({ ...loadForm, lot_id: e.target.value })}
            options={[{ value: '', label: '-- Select Lot --' }, ...lots.filter(l => l.current_status === 'WAITING' || l.current_status === 'COMPLETED').map(l => ({ value: l.lot_id, label: `${l.lot_no} (${l.current_status})` }))]}
            required
          />
          {pendingStages.length > 0 && (
            <Select
              label="Process Routing Stage"
              value={loadForm.stage_id}
              onChange={e => setLoadForm({ ...loadForm, stage_id: e.target.value })}
              options={pendingStages.map(s => ({ value: s.stage_id, label: `${s.sequence_no}. ${s.process_name} (${s.machine_type})` }))}
              required
            />
          )}
          <Select
            label="Assign Machine / Equipment"
            value={loadForm.machine_id}
            onChange={e => setLoadForm({ ...loadForm, machine_id: e.target.value })}
            options={[{ value: '', label: '-- Select Machine --' }, ...machines.filter(m => m.current_status === 'IDLE').map(m => ({ value: m.machine_id, label: `${m.machine_code} - ${m.machine_name} (${m.machine_type})` }))]}
            required
          />
          <Select
            label="Formulation Recipe (CIELAB matching)"
            value={loadForm.recipe_id}
            onChange={e => setLoadForm({ ...loadForm, recipe_id: e.target.value })}
            options={[{ value: '', label: '-- Manual Process (No chemical log) --' }, ...recipes.map(r => ({ value: r.recipe_id, label: `${r.recipe_code} - ${r.shade_name}` }))]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fabric Loaded Weight (kg)"
              type="number"
              value={loadForm.fabric_weight_kg}
              onChange={e => setLoadForm({ ...loadForm, fabric_weight_kg: e.target.value })}
              required
            />
            <Select
              label="Operator Shift"
              value={loadForm.shift}
              onChange={e => setLoadForm({ ...loadForm, shift: e.target.value })}
              options={SHIFTS}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsLoadModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Batch Load</Button>
          </div>
        </form>
      </Modal>

      {/* Dispense Modal */}
      {selectedBatch && (
        <Modal isOpen={isDispenseModalOpen} onClose={() => setIsDispenseModalOpen(false)} title={`Dispense Recipe: Batch ${selectedBatch.batch_no}`}>
          <form onSubmit={handleSubmitDispensing} className="flex flex-col gap-4 text-xs">
            <span className="bg-slate-50 p-2.5 rounded-lg border text-slate-500 block">
              Deduct dyes and auxiliaries from storage for lot: <strong>{selectedBatch.lot_no}</strong>.
            </span>
            <Table headers={['Chemical Item', 'Standard Dosing', 'Actual Weight Dispensed (kg)']}>
              {dispenseLines.map((line, index) => (
                <tr key={line.item_id}>
                  <td className="px-6 py-3 font-semibold">{line.item_name}</td>
                  <td className="px-6 py-3 font-mono text-slate-500">{line.standard_qty} kg</td>
                  <td className="px-6 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={line.actual_qty}
                      onChange={e => {
                        const next = [...dispenseLines];
                        next[index].actual_qty = e.target.value;
                        setDispenseLines(next);
                      }}
                      className="border rounded px-2 py-1 w-24 text-center font-bold font-mono"
                      required
                    />
                  </td>
                </tr>
              ))}
            </Table>
            <div className="flex justify-end gap-3 mt-4 border-t pt-4">
              <Button variant="secondary" onClick={() => setIsDispenseModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Log Formulation Dispense</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Shift production entry modal */}
      <Modal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} title="Log Batch Production Yield Details">
        <form onSubmit={handleSubmitEntry} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Input Length (meters)"
              type="number"
              value={entryForm.input_meters}
              onChange={e => setEntryForm({ ...entryForm, input_meters: e.target.value })}
              required
            />
            <Input
              label="Input Weight (kg)"
              type="number"
              value={entryForm.input_kg}
              onChange={e => setEntryForm({ ...entryForm, input_kg: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Output Length (meters)"
              type="number"
              value={entryForm.output_meters}
              onChange={e => setEntryForm({ ...entryForm, output_meters: e.target.value })}
              required
            />
            <Input
              label="Output Weight (kg)"
              type="number"
              value={entryForm.output_kg}
              onChange={e => setEntryForm({ ...entryForm, output_kg: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Downtime minutes"
              type="number"
              value={entryForm.downtime_mins}
              onChange={e => setEntryForm({ ...entryForm, downtime_mins: e.target.value })}
            />
            <Input
              label="Downtime Reason / Fault"
              value={entryForm.downtime_reason}
              onChange={e => setEntryForm({ ...entryForm, downtime_reason: e.target.value })}
              placeholder="Yarn break, cleaning..."
            />
          </div>
          <Input
            label="Operational remarks"
            value={entryForm.remarks}
            onChange={e => setEntryForm({ ...entryForm, remarks: e.target.value })}
          />
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsEntryModalOpen(false)}>Discard</Button>
            <Button type="submit" variant="primary">Confirm Yield Entry</Button>
          </div>
        </form>
      </Modal>

      {/* Reprocess lot modal */}
      <Modal isOpen={isReprocessModalOpen} onClose={() => setIsReprocessModalOpen(false)} title="Generate Reprocess Lot Card">
        <form onSubmit={handleReprocess} className="flex flex-col gap-4 text-xs">
          <Select
            label="Select Lot Flagged for Rework"
            value={reprocessForm.original_lot_id}
            onChange={e => setReprocessForm({ ...reprocessForm, original_lot_id: e.target.value })}
            options={[{ value: '', label: '-- Select Lot --' }, ...lots.map(l => ({ value: l.lot_id, label: l.lot_no }))]}
            required
          />
          <Select
            label="Reprocessing Reason Code"
            value={reprocessForm.reason_code}
            onChange={e => setReprocessForm({ ...reprocessForm, reason_code: e.target.value })}
            options={REPROCESS_REASONS}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Corrective Action details</label>
            <textarea
              className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 shadow-sm"
              rows="3"
              value={reprocessForm.corrective_action}
              onChange={e => setReprocessForm({ ...reprocessForm, corrective_action: e.target.value })}
              placeholder="E.g. Shading addition dyes, stenter adjustment run..."
              required
            />
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsReprocessModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger">Confirm Reprocess Lot</Button>
          </div>
        </form>
      </Modal>

      {/* Shrinkage Trend Modal */}
      {shrinkageData && (
        <Modal isOpen={isShrinkageModalOpen} onClose={() => setIsShrinkageModalOpen(false)} title="Shrinkage & Wastage Tracking">
          <div className="flex flex-col gap-4 text-xs text-slate-700">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex justify-between">
              <div>
                <span className="text-[10px] text-amber-800 uppercase tracking-widest block font-bold">Grey Input Length</span>
                <span className="text-lg font-black text-slate-800">{parseFloat(shrinkageData.lot.grey_qty_meters_in)} m</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-800 uppercase tracking-widest block font-bold">Finished Yield</span>
                <span className="text-lg font-black text-slate-800">{parseFloat(shrinkageData.lot.finished_qty_meters)} m</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-800 uppercase tracking-widest block font-bold">Cumulative Shrinkage %</span>
                <span className="text-lg font-black text-rose-600">{shrinkageData.lot.cumulative_shrinkage_pct}%</span>
              </div>
            </div>

            <Table headers={['Process stage', 'Input (m)', 'Output (m)', 'Stage Loss %', 'Shrinkage %']}>
              {shrinkageData.stages.map((s, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-2.5 font-bold text-slate-800">{s.process_name}</td>
                  <td className="px-6 py-2.5 font-mono">{parseFloat(s.input_meters)} m</td>
                  <td className="px-6 py-2.5 font-mono font-bold text-slate-700">{parseFloat(s.output_meters || 0)} m</td>
                  <td className="px-6 py-2.5 text-rose-500 font-bold">{parseFloat(s.stage_loss_pct)}%</td>
                  <td className="px-6 py-2.5 text-amber-600 font-bold">{parseFloat(s.cumulative_shrinkage_pct)}%</td>
                </tr>
              ))}
            </Table>
          </div>
        </Modal>
      )}
    </div>
  );
}
