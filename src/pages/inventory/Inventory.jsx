import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Button, Badge, Modal, Input, Select } from '../../components/ui';
import { Plus, MoveUpRight, ArrowUpRight, ArrowDownLeft, Settings, Info } from 'lucide-react';

export default function Inventory() {
  const [invTab, setInvTab] = useState('grey');
  const [greyStock, setGreyStock] = useState([]);
  const [chemicalStock, setChemicalStock] = useState([]);
  const [finishedStock, setFinishedStock] = useState([]);
  const [packingStock, setPackingStock] = useState([]);
  const [movements, setMovements] = useState([]);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const fetchData = async () => {
    try {
      if (invTab === 'grey') {
        const grey = await api.get('/api/v1/inventory/grey-fabric').catch(() => []);
        setGreyStock(grey || []);
      } else if (invTab === 'chemicals') {
        const chems = await api.get('/api/v1/inventory/dye-chemical-stock').catch(() => []);
        setChemicalStock(chems || []);
      } else if (invTab === 'finished') {
        const fg = await api.get('/api/v1/inventory/finished-goods').catch(() => []);
        setFinishedStock(fg || []);
      } else if (invTab === 'packing') {
        const pack = await api.get('/api/v1/inventory/packing-stock').catch(() => []);
        setPackingStock(pack || []);
      } else if (invTab === 'movements') {
        const moves = await api.get('/api/v1/inventory/movements').catch(() => []);
        setMovements(moves || []);
      }

      // Check alerts
      const dashboard = await api.get('/api/v1/inventory/stock-dashboard').catch(() => ({ alerts: [] }));
      setAlerts(dashboard.alerts || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [invTab]);

  return (
    <div className="flex flex-col gap-4">
      {/* Sub tabs and alerts */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-200">
        <div className="flex gap-2">
          {[
            { id: 'grey', label: 'Grey Fabric Stock' },
            { id: 'chemicals', label: 'Dyes & Chemicals Batches' },
            { id: 'finished', label: 'Finished Goods Stock' },
            { id: 'packing', label: 'Packing Materials' },
            { id: 'movements', label: 'Stock Movements Feed' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setInvTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                invTab === t.id ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {alerts.length > 0 && (
          <button
            onClick={() => setIsAlertOpen(true)}
            className="flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse"
          >
            <Info size={14} /> Low Chemical Alerts ({alerts.length})
          </button>
        )}
      </div>

      {/* Grey Fabric Stock Tab */}
      {invTab === 'grey' && (
        <Card title="Grey Fabric Inventory (Trader Job Work / Mill Owned)">
          <Table headers={['Lot Reference', 'Job Order', 'Trader Party', 'Fabric Quality', 'Input Length', 'Input Weight (kg)', 'Received Date', 'Ownership']}>
            {greyStock.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-slate-400">
                  No grey fabric stock matches in inventory. Confirm job orders to generate stock lines.
                </td>
              </tr>
            ) : (
              greyStock.map((g, idx) => (
                <tr key={idx} className="hover:bg-slate-50 text-xs">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">LOT-00{g.lot_id}</td>
                  <td className="px-6 py-3.5 font-mono font-semibold">{g.inward_challan_no || 'Manual Inward'}</td>
                  <td className="px-6 py-3.5 font-bold">{g.legal_name || 'Sarv Uttam Fabrics'}</td>
                  <td className="px-6 py-3.5 font-medium">{g.fabric_name}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-700">{parseFloat(g.qty_meters)} m</td>
                  <td className="px-6 py-3.5">{parseFloat(g.qty_kg)} kg</td>
                  <td className="px-6 py-3.5 text-slate-400">{new Date(g.received_date).toLocaleDateString()}</td>
                  <td className="px-6 py-3.5"><Badge status={g.ownership_type}>{g.ownership_type}</Badge></td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Dyes & Chemicals Stock Tab */}
      {invTab === 'chemicals' && (
        <Card title="Warehouse Dye & Chemical Batches (FIFO Stock Costing)">
          <Table headers={['Item Code', 'Chemical Name', 'Storage Batch Ref', 'Unit Cost', 'Stock on Hand', 'Warehouse Location', 'Expiry Date']}>
            {chemicalStock.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                  No batch chemical records in stock.
                </td>
              </tr>
            ) : (
              chemicalStock.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50 text-xs">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{c.item_code}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-700">{c.item_name}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-400">{c.batch_lot_no || 'GENERIC'}</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">₹{parseFloat(c.unit_cost)} / kg</td>
                  <td className="px-6 py-3.5">
                    <span className="font-extrabold text-slate-800">{parseFloat(c.qty_on_hand)} kg</span>
                  </td>
                  <td className="px-6 py-3.5 font-medium text-slate-500">{c.warehouse_location}</td>
                  <td className="px-6 py-3.5 font-medium text-rose-600">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : 'No Limit'}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Finished Goods Stock Tab */}
      {invTab === 'finished' && (
        <Card title="Finished Goods Inventory (Quality Grade Passed Rolls)">
          <Table headers={['Lot Reference', 'Job Order', 'Fabric Quality', 'Color Shade', 'Grade', 'Meters', 'Weight (kg)', 'Warehouse Location']}>
            {finishedStock.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-slate-400">
                  No finished fabric rolls in warehouse. Complete final inspections to add finished stock.
                </td>
              </tr>
            ) : (
              finishedStock.map((f, idx) => (
                <tr key={idx} className="hover:bg-slate-50 text-xs font-semibold">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">LOT-00{f.lot_id}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">JW/2026/001</td>
                  <td className="px-6 py-3.5 font-bold">{f.fabric_name}</td>
                  <td className="px-6 py-3.5 text-slate-500">{f.shade_name || 'RFD'}</td>
                  <td className="px-6 py-3.5">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                      Grade {f.quality_grade}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-bold text-slate-800">{parseFloat(f.qty_meters)} m</td>
                  <td className="px-6 py-3.5">{parseFloat(f.qty_kg)} kg</td>
                  <td className="px-6 py-3.5 font-medium text-slate-400">{f.location || 'Surat Main Yard'}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Packing Stock Tab */}
      {invTab === 'packing' && (
        <Card title="Packing Materials Stock levels">
          <Table headers={['Material Code', 'Item Name', 'Safety Reorder level', 'Stock on Hand', 'Warehouse Bin']}>
            {packingStock.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                  No packing material entries found.
                </td>
              </tr>
            ) : (
              packingStock.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 text-xs font-semibold">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{p.item_code}</td>
                  <td className="px-6 py-3.5 text-slate-700">{p.item_name}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-400">{parseFloat(p.reorder_level)} {p.uom}</td>
                  <td className="px-6 py-3.5 font-black text-slate-800">{parseFloat(p.qty_on_hand)} {p.uom}</td>
                  <td className="px-6 py-3.5 font-medium text-slate-400">{p.location || 'Packing bay 2'}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Movements Tab */}
      {invTab === 'movements' && (
        <Card title="Stock Movements Feed">
          <Table headers={['Timestamp', 'Movement type', 'Category', 'Quantity', 'Stock Batch', 'Reference Ref']}>
            {movements.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                  No stock movements found.
                </td>
              </tr>
            ) : (
              movements.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50 text-xs font-semibold">
                  <td className="px-6 py-3.5 text-slate-400">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="px-6 py-3.5"><Badge status={m.movement_type}>{m.movement_type}</Badge></td>
                  <td className="px-6 py-3.5">{m.item_category}</td>
                  <td className="px-6 py-3.5 font-bold">{parseFloat(m.qty)}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-400">BATCH-{m.stock_batch_id}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">{m.reference_type}-{m.reference_id}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Alerts Modal */}
      <Modal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} title="Low Stock Alerts" className="max-w-xl">
        <div className="flex flex-col gap-3">
          {alerts.map((a, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-rose-50 border border-rose-100 rounded-lg">
              <div>
                <div className="font-bold text-rose-800">{a.item_name} <span className="text-xs font-mono text-rose-600">({a.item_code})</span></div>
                <div className="text-xs text-rose-600 font-semibold mt-1">Reorder Level: {a.reorder_level}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-rose-700">{parseFloat(a.current_stock)}</div>
                <div className="text-[10px] uppercase font-bold text-rose-500">Current Stock</div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && <div className="p-4 text-center text-slate-500">No alerts!</div>}
        </div>
      </Modal>
    </div>
  );
}
