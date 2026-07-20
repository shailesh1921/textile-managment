import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, TableRow, TableCell, Button, Badge, Modal, Input, Select } from '../../components/ui';
import { 
  Plus, Power, ShieldAlert, CheckCircle, Flame, Wrench, RefreshCw, 
  Layers, Sliders, BarChart, FileEdit, Settings, QrCode, Send
} from 'lucide-react';
import { SendNotificationModal } from '../../components/SendNotificationModal';
import { BatchQRModal } from '../../components/BatchQRModal';

const SHIFTS = [
  { value: 'A', label: 'A Shift (06:00 - 14:00)' },
  { value: 'B', label: 'B Shift (14:00 - 22:00)' },
  { value: 'C', label: 'C Shift (22:00 - 06:00)' }
];

export default function Production() {
  const [machines, setMachines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [lots, setLots] = useState([]);
  
  // Modals
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Selected entities
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [targetBatchId, setTargetBatchId] = useState(null);
  const [targetPhone, setTargetPhone] = useState('');

  // Forms
  const [loadForm, setLoadForm] = useState({
    lot_id: '', stage_id: '', machine_id: '', recipe_id: '', shift: 'A', fabric_weight_kg: ''
  });

  const [dispenseLines, setDispenseLines] = useState([]);
  const [entryForm, setEntryForm] = useState({
    batch_id: '', machine_id: '', shift_date: new Date().toISOString().slice(0, 10), shift: 'A',
    input_meters: '', input_kg: '', output_meters: '', output_kg: '', downtime_mins: 0, remarks: ''
  });

  const [pendingStages, setPendingStages] = useState([]);

  const fetchData = async () => {
    try {
      const machs = await api.get('/api/production/machines/dashboard');
      setMachines(machs || []);
      const bts = await api.get('/api/production/batches');
      setBatches(bts || []);
      const lts = await api.get('/api/v1/job-orders').then(jobs => {
        return jobs.reduce((acc, job) => {
          if (job.lots) acc.push(...job.lots);
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
      const matchingLot = lots.find(l => l.lot_id === parseInt(loadForm.lot_id));
      if (matchingLot) {
        api.get(`/api/production/shrinkage/${matchingLot.lot_id}`).then(shrink => {
          const pending = (shrink.stages || []).filter(s => s.status !== 'COMPLETED');
          setPendingStages(pending);
          if (pending.length > 0) {
            setLoadForm(prev => ({ ...prev, stage_id: pending[0].stage_id }));
          }
        });
      }
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
        const weight = parseFloat(batch.fabric_weight_kg) || 100;
        const chems = [
          { item_id: 1, item_name: 'Reactive Red H-3B', standard_qty: (weight * 0.03).toFixed(2), actual_qty: (weight * 0.03).toFixed(2), stock_batch_id: 1 },
          { item_id: 3, item_name: 'Glauber Salt', standard_qty: (weight * 0.4).toFixed(2), actual_qty: (weight * 0.4).toFixed(2), stock_batch_id: 3 },
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
          item_id: l.item_id, stock_batch_id: l.stock_batch_id, standard_qty: parseFloat(l.standard_qty), actual_qty: parseFloat(l.actual_qty)
        }))
      });
      setIsDispenseModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEntry = (batch) => {
    setEntryForm({
      batch_id: batch.batch_id, machine_id: batch.machine_id, shift_date: new Date().toISOString().slice(0, 10), shift: batch.shift || 'A',
      input_meters: '', input_kg: batch.fabric_weight_kg || '', output_meters: '', output_kg: '', downtime_mins: 0, remarks: ''
    });
    setSelectedBatch(batch);
    setIsEntryModalOpen(true);
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/production/entries', {
        ...entryForm,
        input_meters: parseFloat(entryForm.input_meters), input_kg: parseFloat(entryForm.input_kg),
        output_meters: parseFloat(entryForm.output_meters), output_kg: parseFloat(entryForm.output_kg),
        downtime_mins: parseInt(entryForm.downtime_mins)
      });
      setIsEntryModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'LOADING': return <Badge variant="warning">Loading</Badge>;
      case 'IN_PROCESS': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">In Process</Badge>;
      case 'UNLOADING': return <Badge variant="secondary">Unloading</Badge>;
      case 'QC_HOLD': return <Badge variant="destructive">QC Hold</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Production Shop Floor</h2>
          <p className="text-muted-foreground text-sm">Manage active batches and log machine telemetry.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setIsLoadModalOpen(true)} className="gap-2">
            <Plus size={14} /> Start New Batch
          </Button>
        </div>
      </div>

      <Card title="Active & Recent Batches">
        <Table headers={['Batch No', 'Lot No (Barcode)', 'Machine', 'Process Stage', 'Status', 'Actions']}>
          {batches.length === 0 ? (
            <TableRow>
              <TableCell colSpan="6" className="h-24 text-center text-muted-foreground">
                No active batches in production.
              </TableCell>
            </TableRow>
          ) : (
            batches.map((b) => (
              <TableRow key={b.batch_id}>
                <TableCell className="font-mono font-medium">{b.batch_no}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold">{b.lot_no}</span>
                    <span className="text-xs text-muted-foreground font-mono">{b.barcode_value}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-primary">{b.machine_name}</TableCell>
                <TableCell>{b.process_name}</TableCell>
                <TableCell>{getStatusBadge(b.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { setTargetBatchId(b.batch_id); setIsQRModalOpen(true); }}
                      title="View / Print Batch QR Code"
                    >
                      <QrCode size={14} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => { setSelectedBatch(b); setIsNotifyModalOpen(true); }}
                      title="Send SMS / WhatsApp Update to Client"
                    >
                      <Send size={14} className="mr-1" /> Notify
                    </Button>
                    {b.status === 'LOADING' && (
                      <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(b.batch_id, 'IN_PROCESS')}>
                        Start Running
                      </Button>
                    )}
                    {b.status === 'IN_PROCESS' && (
                      <div className="flex items-center gap-2">
                        {b.recipe_id && (
                          <Button variant="secondary" size="sm" onClick={() => handleLoadDispensing(b)} title="Dispense Chemicals">
                            <Layers size={14} className="mr-1" /> Dispense
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(b.batch_id, 'UNLOADING')}>
                          Unload
                        </Button>
                      </div>
                    )}
                    {b.status === 'UNLOADING' && (
                      <Button variant="default" size="sm" onClick={() => handleOpenEntry(b)}>
                        <FileEdit size={14} className="mr-1" /> Log Output
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Machine Status (Telemetry)">
          <div className="grid grid-cols-2 gap-4">
            {machines.map((m) => (
              <div key={m.machine_id} className="border rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-2 h-full ${
                  m.current_status === 'IDLE' ? 'bg-muted' : 
                  m.current_status === 'LOADING' ? 'bg-amber-400' :
                  m.current_status === 'IN_PROCESS' ? 'bg-emerald-500' : 'bg-blue-400'
                }`} />
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-foreground">{m.machine_name}</h4>
                  <Wrench size={14} className="text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-muted-foreground">Type: <span className="font-medium text-foreground">{m.machine_type}</span></span>
                  <span className="text-muted-foreground">Status: <span className="font-semibold text-primary">{m.current_status}</span></span>
                </div>
                {m.batch_no && (
                  <div className="mt-2 bg-muted/50 p-2 rounded text-xs font-medium">
                    Active: <span className="text-foreground">{m.batch_no}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Start Batch Modal */}
      <Modal isOpen={isLoadModalOpen} onClose={() => setIsLoadModalOpen(false)} title="Assign Machine to Lot Stage" className="max-w-xl">
        <form onSubmit={handleStartBatch} className="flex flex-col gap-4">
          <Select
            label="Select Lot (Waiting for processing)"
            value={loadForm.lot_id}
            onChange={(e) => setLoadForm({ ...loadForm, lot_id: e.target.value })}
            options={[{ value: '', label: '-- Select Lot --' }, ...lots.filter(l => l.current_status !== 'COMPLETED').map(l => ({ value: l.lot_id, label: `${l.lot_no} (${l.current_status})` }))]}
            required
          />
          {pendingStages.length > 0 && (
            <Select
              label="Process Stage"
              value={loadForm.stage_id}
              onChange={(e) => setLoadForm({ ...loadForm, stage_id: e.target.value })}
              options={pendingStages.map(s => ({ value: s.stage_id, label: s.process_name }))}
              required
            />
          )}
          <Select
            label="Assign Machine"
            value={loadForm.machine_id}
            onChange={(e) => setLoadForm({ ...loadForm, machine_id: e.target.value })}
            options={[{ value: '', label: '-- Select Machine --' }, ...machines.filter(m => m.current_status === 'IDLE').map(m => ({ value: m.machine_id, label: m.machine_name }))]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Shift"
              value={loadForm.shift}
              onChange={(e) => setLoadForm({ ...loadForm, shift: e.target.value })}
              options={SHIFTS}
              required
            />
            <Input
              label="Loaded Fabric Weight (KG)"
              type="number"
              value={loadForm.fabric_weight_kg}
              onChange={(e) => setLoadForm({ ...loadForm, fabric_weight_kg: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsLoadModalOpen(false)}>Cancel</Button>
            <Button type="submit">Start Loading</Button>
          </div>
        </form>
      </Modal>

      {/* Entry Modal */}
      <Modal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} title="Log Production Output" className="max-w-2xl">
        <form onSubmit={handleSubmitEntry} className="flex flex-col gap-4">
          <div className="bg-muted/30 p-3 rounded-lg border font-mono text-sm font-semibold mb-2">
            Batch: {selectedBatch?.batch_no} | Lot: {selectedBatch?.lot_no}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Input Meters" type="number" step="0.01" value={entryForm.input_meters} onChange={(e) => setEntryForm({ ...entryForm, input_meters: e.target.value })} required />
            <Input label="Input Weight (KG)" type="number" step="0.01" value={entryForm.input_kg} onChange={(e) => setEntryForm({ ...entryForm, input_kg: e.target.value })} required />
            <Input label="Output Meters" type="number" step="0.01" value={entryForm.output_meters} onChange={(e) => setEntryForm({ ...entryForm, output_meters: e.target.value })} required />
            <Input label="Output Weight (KG)" type="number" step="0.01" value={entryForm.output_kg} onChange={(e) => setEntryForm({ ...entryForm, output_kg: e.target.value })} required />
          </div>
          <Input label="Remarks" value={entryForm.remarks} onChange={(e) => setEntryForm({ ...entryForm, remarks: e.target.value })} />
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEntryModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="default">Complete Process & Log Data</Button>
          </div>
        </form>
      </Modal>

      {/* Dispensing Modal */}
      <Modal isOpen={isDispenseModalOpen} onClose={() => setIsDispenseModalOpen(false)} title="Chemical Dispensing" className="max-w-3xl">
        <form onSubmit={handleSubmitDispensing} className="flex flex-col gap-4">
          <Table headers={['Chemical Item', 'Standard Qty (kg)', 'Actual Dispensed (kg)']}>
            {dispenseLines.map((line, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-semibold text-primary">{line.item_name}</TableCell>
                <TableCell className="font-mono">{line.standard_qty}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={line.actual_qty}
                    onChange={(e) => {
                      const copy = [...dispenseLines];
                      copy[idx].actual_qty = e.target.value;
                      setDispenseLines(copy);
                    }}
                    required
                  />
                </TableCell>
              </TableRow>
            ))}
          </Table>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDispenseModalOpen(false)}>Cancel</Button>
            <Button type="submit">Dispense & Update Inventory</Button>
          </div>
        </form>
      </Modal>

      {/* SMS & WhatsApp Notification Modal */}
      <SendNotificationModal 
        isOpen={isNotifyModalOpen} 
        onClose={() => setIsNotifyModalOpen(false)} 
        defaultPhone={selectedBatch?.client_phone || ''}
        defaultOrderNo={selectedBatch?.batch_no || ''}
        batchId={selectedBatch?.batch_id}
      />

      {/* Shop Floor QR Code Modal */}
      <BatchQRModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        batchId={targetBatchId} 
      />
    </div>
  );
}
