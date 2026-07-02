import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Button, Badge, Modal, Input, Select } from '../../components/ui';
import { Plus, Power, ShieldAlert, CheckCircle, Flame, Wrench } from 'lucide-react';

export default function Production() {
  const [prodTab, setProdTab] = useState('workorders');
  const [workOrders, setWorkOrders] = useState([]);
  const [machines, setMachines] = useState([]);
  const [products, setProducts] = useState([]);
  const [productionLogs, setProductionLogs] = useState([]);

  const [isWoModalOpen, setIsWoModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form states
  const [woForm, setWoForm] = useState({
    product_id: '', quantity: '', planned_start_date: '', planned_end_date: '', priority: 'medium', notes: ''
  });

  const [logForm, setLogForm] = useState({
    wo_id: '', quantity_produced: '', quantity_rejected: '', shift: 'morning', machine_id: '', downtime_minutes: 0, downtime_reason: '', notes: ''
  });

  const fetchData = async () => {
    try {
      const wos = await api.get('/api/production/work-orders');
      setWorkOrders(wos || []);
      const machs = await api.get('/api/production/machines');
      setMachines(machs || []);
      const prods = await api.get('/api/production/products');
      setProducts(prods || []);
      const logs = await api.get('/api/production/production-logs');
      setProductionLogs(logs || []);
    } catch (err) {
      console.error('Error fetching production logs:', err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/production/work-orders', woForm);
      setIsWoModalOpen(false);
      setWoForm({ product_id: '', quantity: '', planned_start_date: '', planned_end_date: '', priority: 'medium', notes: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateWoStatus = async (woId, newStatus) => {
    try {
      await api.post(`/api/production/work-orders/${woId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMachineStatusChange = async (machineId, newStatus) => {
    try {
      await api.post(`/api/production/machines/${machineId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/production/production-logs', logForm);
      setIsLogModalOpen(false);
      setLogForm({ wo_id: '', quantity_produced: '', quantity_rejected: '', shift: 'morning', machine_id: '', downtime_minutes: 0, downtime_reason: '', notes: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setProdTab('workorders')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            prodTab === 'workorders' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Production Work Orders
        </button>
        <button
          onClick={() => setProdTab('machines')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            prodTab === 'machines' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Factory Machine Controls
        </button>
      </div>

      {prodTab === 'workorders' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work Orders List */}
          <div className="lg:col-span-2">
            <Card 
              title="Work Orders Queue" 
              headerActions={
                <div className="flex gap-2">
                  <Button onClick={() => setIsWoModalOpen(true)} className="flex items-center gap-1 bg-emerald-600 text-xs py-1.5">
                    <Plus size={14} /> Schedule WO
                  </Button>
                  <Button onClick={() => setIsLogModalOpen(true)} variant="secondary" className="flex items-center gap-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs py-1.5">
                    <CheckCircle size={14} /> Yield Log
                  </Button>
                </div>
              }
            >
              <div className="mt-4">
                <Table headers={['WO Number', 'Fabric Product', 'Target (m)', 'Yielded (m)', 'Priority', 'Status', 'Actions']}>
                  {workOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                        No scheduled production orders. Click 'Schedule WO' to add runs.
                      </td>
                    </tr>
                  ) : (
                    workOrders.map((wo) => (
                      <tr key={wo.wo_id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-800">{wo.wo_number}</td>
                        <td className="px-6 py-4 font-semibold">{wo.product_name}</td>
                        <td className="px-6 py-4">{parseFloat(wo.quantity)} m</td>
                        <td className="px-6 py-4 font-bold text-slate-700">{parseFloat(wo.produced_quantity)} m</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                            wo.priority === 'urgent' || wo.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {wo.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={wo.status}>{wo.status}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1.5">
                            {wo.status === 'planned' && (
                              <button 
                                onClick={() => handleUpdateWoStatus(wo.wo_id, 'in_progress')}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-0.5"
                              >
                                <Power size={10} /> Start Run
                              </button>
                            )}
                            {wo.status === 'in_progress' && (
                              <button 
                                onClick={() => handleUpdateWoStatus(wo.wo_id, 'completed')}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-0.5"
                              >
                                <CheckCircle size={10} /> Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </Table>
              </div>
            </Card>
          </div>

          {/* Shopfloor Progress logs */}
          <div className="lg:col-span-1">
            <Card title="Shopfloor Operations Feed">
              <div className="flex flex-col gap-4 mt-2 max-h-[480px] overflow-y-auto pr-1">
                {productionLogs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No yields logged on the floor today yet.
                  </div>
                ) : (
                  productionLogs.map((log) => (
                    <div key={log.log_id} className="p-3 border border-slate-200 bg-white rounded-lg flex flex-col gap-1.5 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-sm">{log.wo_number}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{log.shift} Shift</span>
                      </div>
                      <div className="text-xs text-slate-500 font-semibold">{log.product_name}</div>
                      <div className="flex items-center justify-between mt-1 text-xs border-t border-slate-100 pt-1.5">
                        <span className="text-emerald-600 font-bold">Yield: {parseFloat(log.quantity_produced)} m</span>
                        <span className="text-rose-600">Rejects: {parseFloat(log.quantity_rejected)} m</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>Operator: <strong>{log.operator_name}</strong></span>
                        <span>Machine: <strong>{log.machine_name || 'Manual'}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Machines tab */
        <Card title="Shopfloor Weaving & Dyeing Equipment">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
            {machines.map((mac) => (
              <div key={mac.machine_id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">{mac.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{mac.machine_code}</span>
                  </div>
                  <Badge status={mac.status}>{mac.status}</Badge>
                </div>

                <div className="text-xs text-slate-500 flex flex-col gap-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <strong className="text-slate-700">{mac.machine_type}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed Capacity:</span>
                    <strong className="text-slate-700">{parseFloat(mac.capacity)} {mac.capacity_unit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Floor Area:</span>
                    <strong className="text-slate-700">{mac.location}</strong>
                  </div>
                </div>

                {/* Operator Quick Status Toggles */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toggle Operations State</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button 
                      onClick={() => handleMachineStatusChange(mac.machine_id, 'available')}
                      className={`py-1 rounded text-[10px] font-bold flex items-center justify-center gap-0.5 border ${
                        mac.status === 'available' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Power size={10} /> Online
                    </button>
                    <button 
                      onClick={() => handleMachineStatusChange(mac.machine_id, 'in_use')}
                      className={`py-1 rounded text-[10px] font-bold flex items-center justify-center gap-0.5 border ${
                        mac.status === 'in_use' ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Flame size={10} /> Running
                    </button>
                    <button 
                      onClick={() => handleMachineStatusChange(mac.machine_id, 'maintenance')}
                      className={`py-1 rounded text-[10px] font-bold flex items-center justify-center gap-0.5 border ${
                        mac.status === 'maintenance' ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Wrench size={10} /> Service
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Schedule Work Order Modal */}
      <Modal isOpen={isWoModalOpen} onClose={() => setIsWoModalOpen(false)} title="Schedule Production Run">
        <form onSubmit={handleCreateWo} className="flex flex-col gap-4">
          <Select
            label="Fabric Target Product"
            value={woForm.product_id}
            onChange={(e) => setWoForm({...woForm, product_id: e.target.value})}
            options={[{ value: '', label: '-- Select Finished Fabric --' }, ...products.map(p => ({ value: p.product_id, label: `${p.name} (${p.product_code})` }))]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Target Quantity (meters)" type="number" value={woForm.quantity} onChange={(e) => setWoForm({...woForm, quantity: e.target.value})} required />
            <Select
              label="Priority Level"
              value={woForm.priority}
              onChange={(e) => setWoForm({...woForm, priority: e.target.value})}
              options={[
                { value: 'low', label: 'LOW' },
                { value: 'medium', label: 'MEDIUM' },
                { value: 'high', label: 'HIGH' },
                { value: 'urgent', label: 'URGENT' }
              ]}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Planned Start Date" type="date" value={woForm.planned_start_date} onChange={(e) => setWoForm({...woForm, planned_start_date: e.target.value})} required />
            <Input label="Planned Completion" type="date" value={woForm.planned_end_date} onChange={(e) => setWoForm({...woForm, planned_end_date: e.target.value})} required />
          </div>
          <Input label="Production Parameters / Recipe notes" placeholder="Dye concentration, weaving tension details..." value={woForm.notes} onChange={(e) => setWoForm({...woForm, notes: e.target.value})} />

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsWoModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Confirm Schedule</Button>
          </div>
        </form>
      </Modal>

      {/* Log Yield Modal */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Log Daily Yield Outcomes">
        <form onSubmit={handleCreateLog} className="flex flex-col gap-4">
          <Select
            label="Select Work Order Run"
            value={logForm.wo_id}
            onChange={(e) => setLogForm({...logForm, wo_id: e.target.value})}
            options={[{ value: '', label: '-- Active Work Orders --' }, ...workOrders.filter(w => w.status === 'in_progress').map(w => ({ value: w.wo_id, label: `${w.wo_number} - ${w.product_name}` }))]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Good Fabric Produced (m)" type="number" value={logForm.quantity_produced} onChange={(e) => setLogForm({...logForm, quantity_produced: e.target.value})} required />
            <Input label="Defects / Rejected (m)" type="number" value={logForm.quantity_rejected} onChange={(e) => setLogForm({...logForm, quantity_rejected: e.target.value})} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Working Shift"
              value={logForm.shift}
              onChange={(e) => setLogForm({...logForm, shift: e.target.value})}
              options={[
                { value: 'morning', label: 'Morning' },
                { value: 'afternoon', label: 'Afternoon' },
                { value: 'night', label: 'Night' }
              ]}
              required
            />
            <Select
              label="Machine Allocated"
              value={logForm.machine_id}
              onChange={(e) => setLogForm({...logForm, machine_id: e.target.value})}
              options={[{ value: '', label: '-- Manual Weave --' }, ...machines.map(m => ({ value: m.machine_id, label: m.name }))]}
            />
            <Input label="Downtime (minutes)" type="number" value={logForm.downtime_minutes} onChange={(e) => setLogForm({...logForm, downtime_minutes: e.target.value})} />
          </div>
          <Input label="Downtime Cause" placeholder="Yarn breakage, cleaning delay..." value={logForm.downtime_reason} onChange={(e) => setLogForm({...logForm, downtime_reason: e.target.value})} />
          <Input label="Operational Remarks" placeholder="Operator notes..." value={logForm.notes} onChange={(e) => setLogForm({...logForm, notes: e.target.value})} />

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsLogModalOpen(false)}>Discard</Button>
            <Button type="submit" variant="primary">Log Yield</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
