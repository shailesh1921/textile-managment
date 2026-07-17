import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Badge, Button, Modal, Input, Select } from '../../components/ui';
import { Plus, Eye, CheckCircle, Scissors, FileText } from 'lucide-react';

export default function JobOrders() {
  const [orders, setOrders] = useState([]);
  const [parties, setParties] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [shades, setShades] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [moduleTab, setModuleTab] = useState('ORDERS'); // 'ORDERS' or 'GRN'
  
  const [grns, setGrns] = useState([]);
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [grnForm, setGrnForm] = useState({
    grn_no: '', party_id: '', fabric_id: '', challan_no: '',
    challan_meters: '', challan_kg: '', actual_meters: '', actual_kg: '',
    discrepancy_flagged: false, remarks: ''
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLots, setOrderLots] = useState([]);

  // Form state
  const [form, setForm] = useState({
    party_id: '',
    broker_id: '',
    fabric_id: '',
    grey_fabric_state: 'GREY',
    ownership_type: 'CUSTOMER_OWNED',
    qty_meters_ordered: '',
    qty_kg_ordered: '',
    shade_id: '',
    process_type: 'FULL_PROCESS',
    process_template_id: '',
    required_delivery_date: '',
    rate_per_meter: '',
    rate_per_kg: '',
    billing_uom: 'METER',
    customer_po_ref: '',
    inward_challan_ref: '',
    special_instructions: ''
  });

  const fetchData = async () => {
    try {
      const ords = await api.get('/api/v1/job-orders');
      setOrders(ords || []);
      const pts = await api.get('/api/parties');
      setParties(pts || []);
      const fabs = await api.get('/api/fabrics');
      setFabrics(fabs || []);
      const shds = await api.get('/api/shades');
      setShades(shds || []);
      const tmps = await api.get('/api/v1/process-templates').catch(() => []);
      setTemplates(tmps || []);
      const g = await api.get('/api/v1/grns').catch(() => []);
      setGrns(g || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-convert meters to KG when meters or fabric changes
  useEffect(() => {
    if (form.qty_meters_ordered && form.fabric_id) {
      const selectedFabric = fabrics.find(f => f.fabric_id === parseInt(form.fabric_id));
      if (selectedFabric) {
        const gsm = parseFloat(selectedFabric.gsm) || 100;
        const width = parseFloat(selectedFabric.width_inches) || 58;
        const widthM = width * 0.0254;
        const computedKg = ((parseFloat(form.qty_meters_ordered) * widthM * gsm) / 1000).toFixed(2);
        setForm(prev => ({ ...prev, qty_kg_ordered: computedKg }));
      }
    }
  }, [form.qty_meters_ordered, form.fabric_id, fabrics]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/job-orders', {
        ...form,
        party_id: parseInt(form.party_id),
        broker_id: form.broker_id ? parseInt(form.broker_id) : null,
        fabric_id: parseInt(form.fabric_id),
        shade_id: form.shade_id ? parseInt(form.shade_id) : null,
        process_template_id: form.process_template_id ? parseInt(form.process_template_id) : null,
        qty_meters_ordered: parseFloat(form.qty_meters_ordered),
        qty_kg_ordered: parseFloat(form.qty_kg_ordered),
        rate_per_meter: parseFloat(form.rate_per_meter || 0),
        rate_per_kg: parseFloat(form.rate_per_kg || 0)
      });
      setIsCreateOpen(false);
      setForm({
        party_id: '', broker_id: '', fabric_id: '', grey_fabric_state: 'GREY',
        ownership_type: 'CUSTOMER_OWNED', qty_meters_ordered: '', qty_kg_ordered: '',
        shade_id: '', process_type: 'FULL_PROCESS', process_template_id: '',
        required_delivery_date: '', rate_per_meter: '', rate_per_kg: '',
        billing_uom: 'METER', customer_po_ref: '', inward_challan_ref: '', special_instructions: ''
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateGrn = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/grns', {
        ...grnForm,
        party_id: parseInt(grnForm.party_id),
        fabric_id: parseInt(grnForm.fabric_id),
        challan_meters: parseFloat(grnForm.challan_meters || 0),
        challan_kg: parseFloat(grnForm.challan_kg || 0),
        actual_meters: parseFloat(grnForm.actual_meters || 0),
        actual_kg: parseFloat(grnForm.actual_kg || 0),
      });
      setIsGrnModalOpen(false);
      setGrnForm({
        grn_no: '', party_id: '', fabric_id: '', challan_no: '',
        challan_meters: '', challan_kg: '', actual_meters: '', actual_kg: '',
        discrepancy_flagged: false, remarks: ''
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await api.post(`/api/v1/job-orders/${orderId}/confirm`);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewDetail = async (order) => {
    try {
      const details = await api.get(`/api/v1/job-orders/${order.job_order_id}`);
      setSelectedOrder(details);
      setOrderLots(details.lots || []);
      setIsDetailOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'PENDING') return o.status === 'DRAFT';
    if (activeTab === 'IN_PROCESS') return o.status === 'CONFIRMED' || o.status === 'IN_PROCESS';
    if (activeTab === 'COMPLETED') return o.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Top Level Module Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setModuleTab('ORDERS')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${moduleTab === 'ORDERS' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'}`}>Job Orders</button>
        <button onClick={() => setModuleTab('GRN')} className={`px-4 py-2 text-sm font-semibold rounded-lg ${moduleTab === 'GRN' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'}`}>GRN Inwarding</button>
      </div>

      {moduleTab === 'ORDERS' && (
        <>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex gap-2 border-b border-slate-200">
              {['ALL', 'PENDING', 'IN_PROCESS', 'COMPLETED'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === t ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5 bg-emerald-600">
              <Plus size={16} /> New Job Order
            </Button>
          </div>

      {/* Orders Table */}
      <Card title={`${activeTab.replace('_', ' ')} Job Orders`}>
        <Table headers={['Job Order No', 'Trader Party', 'Fabric Name', 'Shade Reference', 'Ordered Qty', 'Rate (₹/m)', 'Delivery Date', 'Status', 'Actions']}>
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan="9" className="px-6 py-10 text-center text-slate-400">
                No job orders found. Click 'New Job Order' to create.
              </td>
            </tr>
          ) : (
            filteredOrders.map((o) => (
              <tr key={o.job_order_id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono font-bold text-xs text-slate-800">{o.job_order_no}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800">{o.party_name}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">{o.ownership_type.replace('_', ' ')}</div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-600">{o.fabric_name}</td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs">{o.shade_card_no || '—'}</span>
                  <div className="text-[10px] text-slate-400 font-semibold">{o.shade_name || 'RFD'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-slate-700">{parseFloat(o.qty_meters_ordered)} m</span>
                  <div className="text-[10px] text-slate-400">{parseFloat(o.qty_kg_ordered)} kg</div>
                </td>
                <td className="px-6 py-4 font-mono font-semibold">₹{parseFloat(o.rate_per_meter)}</td>
                <td className="px-6 py-4 font-medium text-slate-600">{new Date(o.required_delivery_date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <Badge status={o.status}>{o.status}</Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetail(o)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                      title="View Details & Lots"
                    >
                      <Eye size={16} />
                    </button>
                    {o.status === 'DRAFT' && (
                      <button
                        onClick={() => handleConfirmOrder(o.job_order_id)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 p-1 px-2 rounded text-xs font-bold flex items-center gap-0.5"
                        title="Confirm & Generate Lots"
                      >
                        <CheckCircle size={12} /> Confirm
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>
      </Card>
      </>
      )}

      {moduleTab === 'GRN' && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Greige GRN Inwarding</h2>
            <Button onClick={() => setIsGrnModalOpen(true)} className="flex items-center gap-1.5 bg-emerald-600">
              <Plus size={16} /> New GRN Entry
            </Button>
          </div>
          <Card>
            <Table headers={['GRN No', 'Date', 'Party', 'Fabric', 'Challan Mtrs', 'Actual Mtrs', 'Discrepancy (M)', 'Status']}>
              {grns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-slate-400">No GRN records found.</td>
                </tr>
              ) : (
                grns.map(g => (
                  <tr key={g.grn_id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-mono font-bold">{g.grn_no}</td>
                    <td className="px-6 py-3 text-sm">{new Date(g.inward_date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 font-semibold">{g.party_name}</td>
                    <td className="px-6 py-3 text-sm">{g.fabric_name}</td>
                    <td className="px-6 py-3 text-slate-500">{parseFloat(g.challan_meters)}</td>
                    <td className="px-6 py-3 font-bold">{parseFloat(g.actual_meters)}</td>
                    <td className="px-6 py-3 font-mono">
                      {parseFloat(g.discrepancy_meters) < 0 ? (
                        <span className="text-rose-600 font-bold">{parseFloat(g.discrepancy_meters)}</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">+{parseFloat(g.discrepancy_meters)}</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Badge status={g.discrepancy_flagged ? 'cancelled' : 'confirmed'}>
                        {g.discrepancy_flagged ? 'Flagged' : 'OK'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </Table>
          </Card>
        </>
      )}

      {/* GRN Create Modal */}
      <Modal isOpen={isGrnModalOpen} onClose={() => setIsGrnModalOpen(false)} title="Create GRN (Greige Fabric Receipt)" className="max-w-3xl">
        <form onSubmit={handleCreateGrn} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="GRN No" value={grnForm.grn_no} onChange={e => setGrnForm({...grnForm, grn_no: e.target.value})} required />
            <Input label="Challan No" value={grnForm.challan_no} onChange={e => setGrnForm({...grnForm, challan_no: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Party (Customer/Supplier)" value={grnForm.party_id} onChange={e => setGrnForm({...grnForm, party_id: e.target.value})} options={[{value:'',label:'Select Party'}, ...parties.map(p=>({value:p.party_id,label:p.trade_name}))]} required />
            <Select label="Fabric" value={grnForm.fabric_id} onChange={e => setGrnForm({...grnForm, fabric_id: e.target.value})} options={[{value:'',label:'Select Fabric'}, ...fabrics.map(f=>({value:f.fabric_id,label:f.fabric_name}))]} required />
          </div>
          
          <div className="grid grid-cols-2 gap-6 mt-2">
            <div className="p-4 bg-slate-50 border rounded-lg">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Challan Details</h3>
              <div className="flex flex-col gap-3">
                <Input label="Challan Meters" type="number" step="0.01" value={grnForm.challan_meters} onChange={e => setGrnForm({...grnForm, challan_meters: e.target.value})} required />
                <Input label="Challan KG" type="number" step="0.01" value={grnForm.challan_kg} onChange={e => setGrnForm({...grnForm, challan_kg: e.target.value})} />
              </div>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3">Actual Received</h3>
              <div className="flex flex-col gap-3">
                <Input label="Actual Meters" type="number" step="0.01" value={grnForm.actual_meters} onChange={e => setGrnForm({...grnForm, actual_meters: e.target.value})} required />
                <Input label="Actual KG" type="number" step="0.01" value={grnForm.actual_kg} onChange={e => setGrnForm({...grnForm, actual_kg: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="flag" checked={grnForm.discrepancy_flagged} onChange={e => setGrnForm({...grnForm, discrepancy_flagged: e.target.checked})} className="w-4 h-4 text-emerald-600" />
            <label htmlFor="flag" className="text-sm font-semibold text-rose-600">Flag for Discrepancy (Hold Payment / Job)</label>
          </div>
          <Input label="Remarks" value={grnForm.remarks} onChange={e => setGrnForm({...grnForm, remarks: e.target.value})} />

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsGrnModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save GRN</Button>
          </div>
        </form>
      </Modal>

      {/* Create Job Order Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Job Order / Work Lot" className="max-w-2xl">
        <form onSubmit={handleCreate} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Trader / Merchant"
              value={form.party_id}
              onChange={e => setForm({ ...form, party_id: e.target.value })}
              options={[{ value: '', label: '-- Select Trader --' }, ...parties.filter(p => p.party_type === 'TRADER_MERCHANT').map(p => ({ value: p.party_id, label: p.trade_name || p.legal_name }))]}
              required
            />
            <Select
              label="Broker / Agent (Optional)"
              value={form.broker_id}
              onChange={e => setForm({ ...form, broker_id: e.target.value })}
              options={[{ value: '', label: '-- Select Agent --' }, ...parties.filter(p => p.party_type === 'BROKER_AGENT').map(p => ({ value: p.party_id, label: p.trade_name || p.legal_name }))]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Fabric Quality"
              value={form.fabric_id}
              onChange={e => setForm({ ...form, fabric_id: e.target.value })}
              options={[{ value: '', label: '-- Select Fabric Quality --' }, ...fabrics.map(f => ({ value: f.fabric_id, label: `${f.fabric_name} (${f.gsm} GSM)` }))]}
              required
            />
            <Select
              label="Shade Color card"
              value={form.shade_id}
              onChange={e => setForm({ ...form, shade_id: e.target.value })}
              options={[{ value: '', label: '-- RFD / White / Custom Shade --' }, ...shades.map(s => ({ value: s.shade_id, label: `${s.shade_card_no} - ${s.shade_name}` }))]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Grey Fabric State"
              value={form.grey_fabric_state}
              onChange={e => setForm({ ...form, grey_fabric_state: e.target.value })}
              options={[{ value: 'GREY', label: 'Raw Grey Rolls' }, { value: 'SEMI_PROCESSED', label: 'RFD / Scoured' }]}
            />
            <Select
              label="Ownership Type"
              value={form.ownership_type}
              onChange={e => setForm({ ...form, ownership_type: e.target.value })}
              options={[{ value: 'CUSTOMER_OWNED', label: 'Job Work (Trader Owned)' }, { value: 'MILL_OWNED', label: 'Own Stock Mill Sale' }]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ordered Quantity (meters)"
              type="number"
              value={form.qty_meters_ordered}
              onChange={e => setForm({ ...form, qty_meters_ordered: e.target.value })}
              required
            />
            <Input
              label="Weight Quantity (kg - auto computed)"
              type="number"
              value={form.qty_kg_ordered}
              onChange={e => setForm({ ...form, qty_kg_ordered: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Processing Stage Route"
              value={form.process_type}
              onChange={e => setForm({ ...form, process_type: e.target.value })}
              options={[
                { value: 'FULL_PROCESS', label: 'Full Process (Dye + Print + Finish)' },
                { value: 'DYEING_ONLY', label: 'Dyeing only' },
                { value: 'DYEING_FINISHING', label: 'Dyeing & Finishing' }
              ]}
            />
            <Select
              label="Process Routing Template"
              value={form.process_template_id}
              onChange={e => setForm({ ...form, process_template_id: e.target.value })}
              options={[{ value: '', label: '-- None (Manual Routing) --' }, ...templates.map(t => ({ value: t.template_id, label: t.template_name }))]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Rate per Meter (₹)"
              type="number"
              step="0.01"
              value={form.rate_per_meter}
              onChange={e => setForm({ ...form, rate_per_meter: e.target.value })}
              required
            />
            <Input
              label="Inward Challan Ref"
              value={form.inward_challan_ref}
              onChange={e => setForm({ ...form, inward_challan_ref: e.target.value })}
            />
            <Input
              label="Required Delivery Date"
              type="date"
              value={form.required_delivery_date}
              onChange={e => setForm({ ...form, required_delivery_date: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Special Instructions</label>
            <textarea
              className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 shadow-sm"
              rows="3"
              value={form.special_instructions}
              onChange={e => setForm({ ...form, special_instructions: e.target.value })}
              placeholder="Tension settings, customized width requirements..."
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Job Card</Button>
          </div>
        </form>
      </Modal>

      {/* Job Order Details & Lots Modal */}
      {selectedOrder && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Job Order: ${selectedOrder.job_order_no}`} className="max-w-3xl">
          <div className="flex flex-col gap-6 text-xs text-slate-700">
            {/* Header Details */}
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Trader Party</span>
                <span className="font-bold text-slate-800 text-sm">{selectedOrder.party_name}</span>
                <span className="text-[10px] text-slate-400 block font-mono">{selectedOrder.party_gstin}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Fabric Quality</span>
                <span className="font-bold text-slate-800 text-sm">{selectedOrder.fabric_name}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">{selectedOrder.gsm} GSM | {selectedOrder.width_inches}" Width</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Required Shade</span>
                <span className="font-bold text-slate-800 text-sm">{selectedOrder.shade_name || 'RFD'}</span>
              </div>
            </div>

            {/* Lots Breakdown */}
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[11px] mb-3">Shopfloor Production Lots</h4>
              <Table headers={['Lot Number', 'Barcode Code', 'Grey Input', 'Finished Output', 'Shrinkage %', 'Status']}>
                {orderLots.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-slate-400">
                      No active production lots generated yet.
                    </td>
                  </tr>
                ) : (
                  orderLots.map(l => (
                    <tr key={l.lot_id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono font-bold">{l.lot_no}</td>
                      <td className="px-6 py-3 font-mono text-xs">{l.barcode_value}</td>
                      <td className="px-6 py-3">{parseFloat(l.grey_qty_meters_in)} m ({parseFloat(l.grey_qty_kg_in)} kg)</td>
                      <td className="px-6 py-3 font-bold">{parseFloat(l.finished_qty_meters)} m</td>
                      <td className="px-6 py-3 text-amber-600 font-bold">{l.cumulative_shrinkage_pct}%</td>
                      <td className="px-6 py-3"><Badge status={l.current_status}>{l.current_status}</Badge></td>
                    </tr>
                  ))
                )}
              </Table>
            </div>

            <div className="flex justify-end gap-3 mt-4 border-t pt-4">
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>Close Window</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
