import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Button, Input, Select, Table, Badge, Modal } from '../../components/ui';
import { Truck, Plus, ArrowRightLeft, CheckCircle2, AlertCircle, Building2, PackageCheck } from 'lucide-react';

export default function JobWork() {
  const [units, setUnits] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'units'

  // Modals
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Forms
  const [unitForm, setUnitForm] = useState({ unit_name: '', contact_person: '', phone: '', address: '' });
  const [orderForm, setOrderForm] = useState({ job_work_unit_id: '', fabric_id: '', quantity_sent: '', process_type: 'DYEING', expected_return_date: '' });
  const [returnForm, setReturnForm] = useState({ quantity_returned: '', return_date: new Date().toISOString().slice(0, 10), quality_notes: '', defect_quantity: '0' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [unitsData, ordersData, fabricsData] = await Promise.all([
        api.get('/api/v1/job-work/units'),
        api.get('/api/v1/job-work/orders'),
        api.get('/api/v1/fabrics')
      ]);
      setUnits(unitsData);
      setOrders(ordersData);
      setFabrics(fabricsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/v1/job-work/units', unitForm);
      setSuccess('Job-work unit added successfully!');
      setIsUnitModalOpen(false);
      setUnitForm({ unit_name: '', contact_person: '', phone: '', address: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to add unit');
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/v1/job-work/orders', orderForm);
      setSuccess('Job-work dispatch order created!');
      setIsOrderModalOpen(false);
      setOrderForm({ job_work_unit_id: '', fabric_id: '', quantity_sent: '', process_type: 'DYEING', expected_return_date: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create order');
    }
  };

  const handleLogReturn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/api/v1/job-work/orders/${selectedOrder.id}/returns`, returnForm);
      setSuccess('Return recorded successfully!');
      setIsReturnModalOpen(false);
      setSelectedOrder(null);
      setReturnForm({ quantity_returned: '', return_date: new Date().toISOString().slice(0, 10), quality_notes: '', defect_quantity: '0' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to log return');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Returned': return <Badge status="completed">Returned</Badge>;
      case 'Partially Returned': return <Badge status="in_progress">Partially Returned</Badge>;
      default: return <Badge status="pending">Sent</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="text-primary" size={24} /> External Job-Work Tracking
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage dispatches to outside processing units and track partial or complete fabric returns.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant={activeTab === 'orders' ? 'default' : 'outline'} onClick={() => setActiveTab('orders')}>
            Dispatches & Returns
          </Button>
          <Button variant={activeTab === 'units' ? 'default' : 'outline'} onClick={() => setActiveTab('units')}>
            Processing Vendors ({units.length})
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'orders' ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base">Job-Work Dispatch Orders</h3>
            {units.length > 0 ? (
              <Button onClick={() => setIsOrderModalOpen(true)} className="gap-2">
                <Plus size={16} /> Create Dispatch Order
              </Button>
            ) : null}
          </div>

          {/* Hard Constraint 7: Empty state for zero units */}
          {units.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl">
              <Building2 size={48} className="text-muted-foreground mb-3" />
              <h4 className="font-semibold text-lg text-foreground mb-1">No Job-Work Units Setup Yet</h4>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Before creating a dispatch order, add your first external processing vendor or unit.
              </p>
              <Button onClick={() => setIsUnitModalOpen(true)} className="gap-2">
                <Plus size={16} /> Add Your First Job-Work Unit
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No job-work dispatch orders recorded yet.
            </div>
          ) : (
            <Table
              headers={['Order ID', 'Vendor Unit', 'Fabric', 'Sent Qty', 'Returned Qty', 'Process', 'Status', 'Actions']}
              rows={orders.map(o => [
                `#JWO-${o.id}`,
                o.unit_name,
                o.fabric_name,
                `${o.quantity_sent} m`,
                `${o.total_returned} m`,
                o.process_type,
                getStatusBadge(o.status),
                <div className="flex gap-2" key={o.id}>
                  {o.status !== 'Returned' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => { setSelectedOrder(o); setIsReturnModalOpen(true); }}
                      className="gap-1 text-xs"
                    >
                      <PackageCheck size={14} /> Log Return
                    </Button>
                  )}
                </div>
              ])}
            />
          )}
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base">External Job-Work Units & Vendors</h3>
            <Button onClick={() => setIsUnitModalOpen(true)} className="gap-2">
              <Plus size={16} /> Add Vendor Unit
            </Button>
          </div>

          {units.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No job-work vendor units configured yet.
            </div>
          ) : (
            <Table
              headers={['Unit ID', 'Unit Name', 'Contact Person', 'Phone', 'Address']}
              rows={units.map(u => [
                `#UNIT-${u.id}`,
                u.unit_name,
                u.contact_person || 'N/A',
                u.phone || 'N/A',
                u.address || 'Surat'
              ])}
            />
          )}
        </Card>
      )}

      {/* Modal: Add Unit */}
      <Modal isOpen={isUnitModalOpen} onClose={() => setIsUnitModalOpen(false)} title="Add Job-Work Unit / Vendor">
        <form onSubmit={handleCreateUnit} className="flex flex-col gap-4">
          <Input label="Unit / Vendor Name" value={unitForm.unit_name} onChange={e => setUnitForm({ ...unitForm, unit_name: e.target.value })} placeholder="e.g. Surat Digital Prints" required />
          <Input label="Contact Person" value={unitForm.contact_person} onChange={e => setUnitForm({ ...unitForm, contact_person: e.target.value })} placeholder="e.g. Suresh Bhai" />
          <Input label="Phone Number" value={unitForm.phone} onChange={e => setUnitForm({ ...unitForm, phone: e.target.value })} placeholder="+91 98765 43210" />
          <Input label="Address" value={unitForm.address} onChange={e => setUnitForm({ ...unitForm, address: e.target.value })} placeholder="Plot 14, Sachin GIDC, Surat" />
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsUnitModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Unit</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Dispatch Order */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Create External Dispatch Order">
        <form onSubmit={handleCreateOrder} className="flex flex-col gap-4">
          <Select 
            label="Target Processing Unit" 
            value={orderForm.job_work_unit_id} 
            onChange={e => setOrderForm({ ...orderForm, job_work_unit_id: e.target.value })}
            options={[{ value: '', label: 'Select Vendor Unit' }, ...units.map(u => ({ value: u.id, label: u.unit_name }))]}
            required
          />
          <Select 
            label="Fabric Quality" 
            value={orderForm.fabric_id} 
            onChange={e => setOrderForm({ ...orderForm, fabric_id: e.target.value })}
            options={[{ value: '', label: 'Select Fabric' }, ...fabrics.map(f => ({ value: f.fabric_id, label: f.fabric_name }))]}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity Sent (Meters)" type="number" step="0.01" value={orderForm.quantity_sent} onChange={e => setOrderForm({ ...orderForm, quantity_sent: e.target.value })} required />
            <Input label="Process Type" value={orderForm.process_type} onChange={e => setOrderForm({ ...orderForm, process_type: e.target.value })} placeholder="e.g. Printing, Washing" required />
          </div>
          <Input label="Expected Return Date" type="date" value={orderForm.expected_return_date} onChange={e => setOrderForm({ ...orderForm, expected_return_date: e.target.value })} />
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOrderModalOpen(false)}>Cancel</Button>
            <Button type="submit">Dispatch Work</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Return */}
      {selectedOrder && (
        <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title={`Log Fabric Return (Order #${selectedOrder.id})`}>
          <form onSubmit={handleLogReturn} className="flex flex-col gap-4">
            <div className="p-3 rounded-lg bg-muted text-xs flex flex-col gap-1">
              <div><strong>Fabric:</strong> {selectedOrder.fabric_name}</div>
              <div><strong>Vendor:</strong> {selectedOrder.unit_name}</div>
              <div><strong>Sent Qty:</strong> {selectedOrder.quantity_sent} meters | <strong>Already Returned:</strong> {selectedOrder.total_returned} meters</div>
              <div><strong>Remaining:</strong> {(parseFloat(selectedOrder.quantity_sent) - parseFloat(selectedOrder.total_returned)).toFixed(2)} meters</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Quantity Returned (Meters)" type="number" step="0.01" value={returnForm.quantity_returned} onChange={e => setReturnForm({ ...returnForm, quantity_returned: e.target.value })} required />
              <Input label="Defect Quantity (Meters)" type="number" step="0.01" value={returnForm.defect_quantity} onChange={e => setReturnForm({ ...returnForm, defect_quantity: e.target.value })} />
            </div>
            <Input label="Return Date" type="date" value={returnForm.return_date} onChange={e => setReturnForm({ ...returnForm, return_date: e.target.value })} required />
            <Input label="Quality Notes / Inspection Remarks" value={returnForm.quality_notes} onChange={e => setReturnForm({ ...returnForm, quality_notes: e.target.value })} placeholder="e.g. Minor shade variation in 10m" />

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
              <Button type="submit">Log Return</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
