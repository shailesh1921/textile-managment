import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Button, Badge, Modal, Input, Select } from '../../components/ui';
import { Plus, MoveUpRight, ArrowUpRight, ArrowDownLeft, Settings } from 'lucide-react';

export default function Inventory() {
  const [invTab, setInvTab] = useState('stock');
  const [stock, setStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  // Form states
  const [materialForm, setMaterialForm] = useState({
    material_code: '', name: '', description: '', category: 'raw_material', unit: 'kg', reorder_level: '', reorder_quantity: '', unit_cost: '', hsn_code: ''
  });

  const [movementForm, setMovementForm] = useState({
    material_id: '', movement_type: 'receipt', quantity: '', batch_number: '', location: 'Warehouse A', notes: ''
  });

  const fetchData = async () => {
    try {
      const info = await api.get('/api/inventory/stock-dashboard');
      setStock(info.stock || []);
      const logs = await api.get('/api/inventory/movements');
      setMovements(logs || []);
      const mats = await api.get('/api/inventory/materials');
      setMaterials(mats || []);
    } catch (err) {
      console.error('Error fetching inventory details:', err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory/materials', materialForm);
      setIsMaterialModalOpen(false);
      setMaterialForm({
        material_code: '', name: '', description: '', category: 'raw_material', unit: 'kg', reorder_level: '', reorder_quantity: '', unit_cost: '', hsn_code: ''
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddMovement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory/movements', movementForm);
      setIsMovementModalOpen(false);
      setMovementForm({
        material_id: '', movement_type: 'receipt', quantity: '', batch_number: '', location: 'Warehouse A', notes: ''
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const categories = [
    { value: 'raw_material', label: 'Raw Material (Yarn)' },
    { value: 'consumable', label: 'Consumables & Chemicals' },
    { value: 'finished_goods', label: 'Finished Fabric Rolls' },
    { value: 'spare_parts', label: 'Machine Spare Parts' }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setInvTab('stock')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            invTab === 'stock' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Material Stock Levels
        </button>
        <button
          onClick={() => setInvTab('movements')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            invTab === 'movements' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Stock Movements Log
        </button>
      </div>

      {invTab === 'stock' ? (
        <Card 
          title="Stock Control Registry"
          headerActions={
            <div className="flex gap-2">
              <Button onClick={() => setIsMaterialModalOpen(true)} className="flex items-center gap-1.5 bg-emerald-600">
                <Plus size={16} /> Add Material Code
              </Button>
              <Button onClick={() => setIsMovementModalOpen(true)} variant="secondary" className="flex items-center gap-1.5 border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                <MoveUpRight size={16} /> Log Movement
              </Button>
            </div>
          }
        >
          <div className="mt-4">
            <Table headers={['Code', 'Material / Chemical Name', 'Category', 'Unit Rate', 'Current Stock', 'Safety Level', 'Estimated Value']}>
              {stock.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                    No material stock records found. Click 'Add Material Code' to begin.
                  </td>
                </tr>
              ) : (
                stock.map((item) => {
                  const isLow = parseFloat(item.current_stock) <= parseFloat(item.reorder_level);
                  return (
                    <tr key={item.material_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700 text-xs">{item.material_code}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{item.name}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                        {item.category.replace('_', ' ').toUpperCase()}
                      </td>
                      <td className="px-6 py-4">₹{parseFloat(item.unit_cost).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-bold">
                        <span className={isLow ? 'text-rose-600 font-extrabold bg-rose-50 px-2 py-1 rounded' : 'text-slate-800'}>
                          {parseFloat(item.current_stock)} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-semibold">{parseFloat(item.reorder_level)} {item.unit}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        ₹{parseFloat(item.total_value).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </Table>
          </div>
        </Card>
      ) : (
        <Card title="Stock Movements Trail">
          <div className="mt-4">
            <Table headers={['Timestamp', 'Material Code', 'Material Name', 'Type', 'Quantity', 'Batch Number', 'Location / Target', 'Logged By']}>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-slate-400">
                    No movement records logged yet. Run a production log or PO receipt to see feed.
                  </td>
                </tr>
              ) : (
                movements.map((move) => (
                  <tr key={move.movement_id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(move.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-xs">{move.material_code}</td>
                    <td className="px-6 py-4 font-semibold">{move.material_name}</td>
                    <td className="px-6 py-4">
                      {move.movement_type === 'receipt' ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded w-max">
                          <ArrowDownLeft size={12} /> INBOUND
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded w-max">
                          <ArrowUpRight size={12} /> OUTBOUND
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold">{parseFloat(move.quantity)}</td>
                    <td className="px-6 py-4 font-mono text-xs">{move.batch_number || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{move.to_location || 'Warehouse Main'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{move.logged_by}</td>
                  </tr>
                ))
              )}
            </Table>
          </div>
        </Card>
      )}

      {/* Create Material Modal */}
      <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title="Create Material Profile">
        <form onSubmit={handleAddMaterial} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Material Code" placeholder="e.g. MAT-YRN-03" value={materialForm.material_code} onChange={(e) => setMaterialForm({...materialForm, material_code: e.target.value})} required />
            <Input label="Material Name" placeholder="Chemical name or yarn spec" value={materialForm.name} onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={materialForm.category}
              onChange={(e) => setMaterialForm({...materialForm, category: e.target.value})}
              options={categories}
              required
            />
            <Input label="Unit (e.g. kg, meter)" value={materialForm.unit} onChange={(e) => setMaterialForm({...materialForm, unit: e.target.value})} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Unit Cost (₹)" type="number" value={materialForm.unit_cost} onChange={(e) => setMaterialForm({...materialForm, unit_cost: e.target.value})} required />
            <Input label="Safety Reorder Level" type="number" value={materialForm.reorder_level} onChange={(e) => setMaterialForm({...materialForm, reorder_level: e.target.value})} required />
            <Input label="Reorder Quantity" type="number" value={materialForm.reorder_quantity} onChange={(e) => setMaterialForm({...materialForm, reorder_quantity: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="HSN Tax Code" placeholder="8-digit code" value={materialForm.hsn_code} onChange={(e) => setMaterialForm({...materialForm, hsn_code: e.target.value})} />
            <Input label="Description" placeholder="Notes, suppliers etc." value={materialForm.description} onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsMaterialModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Material</Button>
          </div>
        </form>
      </Modal>

      {/* Log Movement Modal */}
      <Modal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} title="Log Stock Transaction">
        <form onSubmit={handleAddMovement} className="flex flex-col gap-4">
          <Select
            label="Select Material"
            value={movementForm.material_id}
            onChange={(e) => setMovementForm({...movementForm, material_id: e.target.value})}
            options={[{ value: '', label: '-- Select Material --' }, ...materials.map(m => ({ value: m.material_id, label: `${m.name} (${m.material_code})` }))]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Transaction Type"
              value={movementForm.movement_type}
              onChange={(e) => setMovementForm({...movementForm, movement_type: e.target.value})}
              options={[
                { value: 'receipt', label: 'INBOUND (Receive Stock)' },
                { value: 'issue', label: 'OUTBOUND (Deduct / Issue)' }
              ]}
              required
            />
            <Input label="Quantity" type="number" value={movementForm.quantity} onChange={(e) => setMovementForm({...movementForm, quantity: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Batch Number" placeholder="e.g. BATCH-YRN-985" value={movementForm.batch_number} onChange={(e) => setMovementForm({...movementForm, batch_number: e.target.value})} />
            <Input label="Location (e.g. Bin B4)" value={movementForm.location} onChange={(e) => setMovementForm({...movementForm, location: e.target.value})} />
          </div>
          <Input label="Notes / Reference ID" placeholder="PO reference or reason..." value={movementForm.notes} onChange={(e) => setMovementForm({...movementForm, notes: e.target.value})} />

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsMovementModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Post Entry</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
