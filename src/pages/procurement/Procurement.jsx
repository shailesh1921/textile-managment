import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Button, Badge, Modal, Input, Select } from '../../components/ui';
import { Plus, Eye, ShoppingCart, UserCheck } from 'lucide-react';

export default function Procurement() {
  // Tabs: 'pos' or 'suppliers'
  const [procTab, setProcTab] = useState('pos');
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPos] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isViewPoModalOpen, setIsViewPoModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    supplier_code: '', name: '', contact_person: '', email: '', phone: '', address: '', city: '', state: '', country: 'India', postal_code: '', tax_id: '', payment_terms: '30 Days', credit_limit: ''
  });

  const [poForm, setPoForm] = useState({
    supplier_id: '', order_date: new Date().toISOString().split('T')[0], expected_delivery_date: '', notes: ''
  });
  const [poItems, setPoItems] = useState([{ material_id: '', quantity: 1, unit_price: 0 }]);

  const fetchData = async () => {
    try {
      const sups = await api.get('/api/procurement/suppliers');
      setSuppliers(sups);
      const orders = await api.get('/api/procurement/purchase-orders');
      setPos(orders);
      const mats = await api.get('/api/inventory/materials');
      setMaterials(mats);
    } catch (err) {
      console.error('Error fetching procurement data:', err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/procurement/suppliers', supplierForm);
      setIsSupplierModalOpen(false);
      setSupplierForm({
        supplier_code: '', name: '', contact_person: '', email: '', phone: '', address: '', city: '', state: '', country: 'India', postal_code: '', tax_id: '', payment_terms: '30 Days', credit_limit: ''
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddPoItem = () => {
    setPoItems([...poItems, { material_id: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemovePoItem = (index) => {
    setPoItems(poItems.filter((_, idx) => idx !== index));
  };

  const handlePoItemChange = (index, field, value) => {
    const updated = [...poItems];
    updated[index][field] = value;
    setPoItems(updated);
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/procurement/purchase-orders', {
        ...poForm,
        items: poItems
      });
      setIsPoModalOpen(false);
      setPoForm({
        supplier_id: '', order_date: new Date().toISOString().split('T')[0], expected_delivery_date: '', notes: ''
      });
      setPoItems([{ material_id: '', quantity: 1, unit_price: 0 }]);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewPo = async (poId) => {
    try {
      const details = await api.get(`/api/procurement/purchase-orders/${poId}`);
      setSelectedPo(details);
      setIsViewPoModalOpen(true);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setProcTab('pos')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            procTab === 'pos' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Purchase Orders
        </button>
        <button
          onClick={() => setProcTab('suppliers')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            procTab === 'suppliers' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Suppliers Directory
        </button>
      </div>

      {procTab === 'pos' ? (
        <Card 
          title="Purchase Orders Registry" 
          headerActions={
            <Button onClick={() => setIsPoModalOpen(true)} className="flex items-center gap-1.5 bg-emerald-600">
              <Plus size={16} /> Create PO
            </Button>
          }
        >
          <div className="mt-4">
            <Table headers={['PO Number', 'Supplier', 'Order Date', 'Net Amount', 'Status', 'Actions']}>
              {pos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                    No purchase orders recorded yet. Click 'Create PO' to log transactions.
                  </td>
                </tr>
              ) : (
                pos.map((po) => (
                  <tr key={po.po_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">{po.po_number}</td>
                    <td className="px-6 py-4 font-semibold">{po.supplier_name}</td>
                    <td className="px-6 py-4">{new Date(po.order_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold">₹{parseFloat(po.net_amount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <Badge status={po.status}>{po.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleViewPo(po.po_id)}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 text-xs bg-emerald-50 px-2.5 py-1 rounded"
                      >
                        <Eye size={12} /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </Table>
          </div>
        </Card>
      ) : (
        <Card 
          title="Vendors & Raw Suppliers" 
          headerActions={
            <Button onClick={() => setIsSupplierModalOpen(true)} className="flex items-center gap-1.5 bg-emerald-600">
              <Plus size={16} /> Add Supplier
            </Button>
          }
        >
          <div className="mt-4">
            <Table headers={['Code', 'Name', 'Contact', 'Phone / Email', 'Location', 'Rating']}>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                    No suppliers listed yet. Add vendors to manage feedstock.
                  </td>
                </tr>
              ) : (
                suppliers.map((sup) => (
                  <tr key={sup.supplier_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono font-bold text-xs">{sup.supplier_code}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{sup.name}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">{sup.contact_person}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div>{sup.phone}</div>
                      <div>{sup.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">{sup.city}, {sup.state}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">⭐ {sup.rating || '5.0'}</td>
                  </tr>
                ))
              )}
            </Table>
          </div>
        </Card>
      )}

      {/* Supplier Modal */}
      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Add Supplier Profile">
        <form onSubmit={handleAddSupplier} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Supplier Code" placeholder="e.g. SUP-YRN-03" value={supplierForm.supplier_code} onChange={(e) => setSupplierForm({...supplierForm, supplier_code: e.target.value})} required />
            <Input label="Company Name" placeholder="Vendor company name" value={supplierForm.name} onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Person" placeholder="Name" value={supplierForm.contact_person} onChange={(e) => setSupplierForm({...supplierForm, contact_person: e.target.value})} />
            <Input label="Phone" placeholder="Mobile number" value={supplierForm.phone} onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" placeholder="email@vendor.com" value={supplierForm.email} onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})} />
            <Input label="Tax ID (GSTIN)" placeholder="GST code" value={supplierForm.tax_id} onChange={(e) => setSupplierForm({...supplierForm, tax_id: e.target.value})} />
          </div>
          <Input label="Address" placeholder="Street address details" value={supplierForm.address} onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" value={supplierForm.city} onChange={(e) => setSupplierForm({...supplierForm, city: e.target.value})} />
            <Input label="State" value={supplierForm.state} onChange={(e) => setSupplierForm({...supplierForm, state: e.target.value})} />
            <Input label="Credit Limit" type="number" placeholder="in ₹" value={supplierForm.credit_limit} onChange={(e) => setSupplierForm({...supplierForm, credit_limit: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsSupplierModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Supplier</Button>
          </div>
        </form>
      </Modal>

      {/* PO Create Modal */}
      <Modal isOpen={isPoModalOpen} onClose={() => setIsPoModalOpen(false)} title="Draft Purchase Order" className="max-w-3xl">
        <form onSubmit={handleCreatePo} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Select Supplier"
              value={poForm.supplier_id}
              onChange={(e) => setPoForm({...poForm, supplier_id: e.target.value})}
              options={[{ value: '', label: '-- Select Supplier --' }, ...suppliers.map(s => ({ value: s.supplier_id, label: s.name }))]}
              required
            />
            <Input label="Order Date" type="date" value={poForm.order_date} onChange={(e) => setPoForm({...poForm, order_date: e.target.value})} required />
            <Input label="Expected Delivery" type="date" value={poForm.expected_delivery_date} onChange={(e) => setPoForm({...poForm, expected_delivery_date: e.target.value})} required />
          </div>

          <div className="border-t border-slate-100 pt-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Item Catalog details</h4>
              <Button onClick={handleAddPoItem} variant="secondary" className="py-1 text-xs flex items-center gap-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                <Plus size={12} /> Add Item
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {poItems.map((item, idx) => (
                <div key={idx} className="flex items-end gap-3 p-3 border border-slate-100 bg-slate-50/50 rounded-lg">
                  <Select
                    label="Material / Item"
                    value={item.material_id}
                    onChange={(e) => handlePoItemChange(idx, 'material_id', e.target.value)}
                    options={[{ value: '', label: '-- Select Material --' }, ...materials.map(m => ({ value: m.material_id, label: `${m.name} (${m.unit})` }))]}
                    className="flex-1"
                    required
                  />
                  <Input
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handlePoItemChange(idx, 'quantity', e.target.value)}
                    className="w-28"
                    required
                  />
                  <Input
                    label="Unit Price (₹)"
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handlePoItemChange(idx, 'unit_price', e.target.value)}
                    className="w-28"
                    required
                  />
                  {poItems.length > 1 && (
                    <Button onClick={() => handleRemovePoItem(idx)} variant="danger" className="p-2 mb-0.5 rounded-lg">
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Input label="Internal Notes" placeholder="Special requirements, shipping parameters..." value={poForm.notes} onChange={(e) => setPoForm({...poForm, notes: e.target.value})} />

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsPoModalOpen(false)}>Discard</Button>
            <Button type="submit" variant="primary">Confirm Order</Button>
          </div>
        </form>
      </Modal>

      {/* PO View Modal */}
      <Modal isOpen={isViewPoModalOpen} onClose={() => setIsViewPoModalOpen(false)} title={`PO details: ${selectedPo?.po_number}`} className="max-w-2xl">
        {selectedPo && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-1.5">Supplier Details</h4>
                <p className="font-bold text-slate-800 text-base">{selectedPo.supplier_name}</p>
                <p className="text-slate-500 mt-1">{selectedPo.address}</p>
                <p className="text-slate-500">{selectedPo.city}, {selectedPo.state}</p>
                <p className="text-slate-600 mt-2 font-semibold">📞 {selectedPo.phone} | ✉️ {selectedPo.email}</p>
              </div>
              <div className="flex flex-col items-end text-right">
                <Badge status={selectedPo.status}>{selectedPo.status}</Badge>
                <div className="mt-4 flex flex-col gap-1 text-slate-500 text-xs">
                  <span>Order Date: <strong>{new Date(selectedPo.order_date).toLocaleDateString()}</strong></span>
                  <span>Expected Delivery: <strong>{selectedPo.expected_delivery_date ? new Date(selectedPo.expected_delivery_date).toLocaleDateString() : 'N/A'}</strong></span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-3">Line Items</h4>
              <Table headers={['Material Code', 'Description', 'Quantity', 'Unit Rate', 'Subtotal']}>
                {selectedPo.items?.map((item, idx) => (
                  <tr key={idx} className="text-xs">
                    <td className="px-6 py-3 font-mono font-bold text-slate-700">{item.material_code}</td>
                    <td className="px-6 py-3 font-semibold">{item.material_name}</td>
                    <td className="px-6 py-3">{parseFloat(item.quantity)} {item.unit}</td>
                    <td className="px-6 py-3">₹{parseFloat(item.unit_price).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-3 font-bold">₹{parseFloat(item.total_price).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </Table>
            </div>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 items-end text-sm">
              <div className="flex justify-between w-64 text-slate-500">
                <span>Subtotal:</span>
                <span>₹{parseFloat(selectedPo.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between w-64 text-slate-500">
                <span>GST Tax (18%):</span>
                <span>₹{parseFloat(selectedPo.tax_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between w-64 text-base font-bold text-slate-800 border-t pt-2 mt-1">
                <span>Total Net Amount:</span>
                <span>₹{parseFloat(selectedPo.net_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {selectedPo.notes && (
              <div className="bg-slate-50 p-4 border rounded-lg text-xs text-slate-600 mt-2">
                <span className="font-bold uppercase tracking-wider block text-[10px] text-slate-400 mb-1">Supplier/PO Notes</span>
                {selectedPo.notes}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
