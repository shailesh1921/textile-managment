import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Badge, Button, Modal, Input, Select } from '../../components/ui';
import { Plus, Users, Layers, Palette, FlaskConical, Cog, BookOpen, Settings } from 'lucide-react';

const TABS = [
  { id: 'parties', label: 'Parties', icon: Users },
  { id: 'fabrics', label: 'Fabrics', icon: Layers },
  { id: 'shades', label: 'Shades', icon: Palette },
  { id: 'chemicals', label: 'Dyes & Chemicals', icon: FlaskConical },
  { id: 'machines', label: 'Machines', icon: Cog },
  { id: 'recipes', label: 'Recipes', icon: BookOpen },
  { id: 'templates', label: 'Process Templates', icon: Settings },
];

const PARTY_TYPES = [
  { value: 'TRADER_MERCHANT', label: 'Trader / Merchant' },
  { value: 'SUPPLIER', label: 'Supplier (Dyes/Chemicals)' },
  { value: 'TRANSPORTER', label: 'Transporter' },
  { value: 'BROKER_AGENT', label: 'Broker / Agent' },
];

const CHEMICAL_CATEGORIES = [
  { value: 'REACTIVE_DYE', label: 'Reactive Dye' },
  { value: 'DISPERSE_DYE', label: 'Disperse Dye' },
  { value: 'VAT_DYE', label: 'Vat Dye' },
  { value: 'ACID_DYE', label: 'Acid Dye' },
  { value: 'SALT', label: 'Salt' },
  { value: 'SODA_ASH', label: 'Soda Ash' },
  { value: 'SOFTENER', label: 'Softener' },
  { value: 'CAUSTIC_SODA', label: 'Caustic Soda' },
  { value: 'FIXING_AGENT', label: 'Fixing Agent' },
  { value: 'LEVELLING_AGENT', label: 'Levelling Agent' },
];

const MACHINE_TYPES = [
  { value: 'JIGGER', label: 'Jigger' },
  { value: 'SOFT_FLOW', label: 'Soft Flow' },
  { value: 'JET_DYEING', label: 'Jet Dyeing' },
  { value: 'STENTER', label: 'Stenter' },
  { value: 'CALENDAR', label: 'Calendar' },
  { value: 'SANFORIZING', label: 'Sanforizing' },
  { value: 'PADDING_MANGLE', label: 'Padding Mangle' },
  { value: 'SINGEING', label: 'Singeing' },
  { value: 'WASHING', label: 'Washing' },
  { value: 'INSPECTION_TABLE', label: 'Inspection Table' },
];

export default function Masters() {
  const [tab, setTab] = useState('parties');
  const [data, setData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [parties, setParties] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [partyForm, setPartyForm] = useState({
    party_type: 'TRADER_MERCHANT', legal_name: '', trade_name: '', gstin: '', pan: '',
    state_code: '24', billing_address: '', contact_person: '', mobile: '', email: '',
    credit_limit: 0, credit_period_days: 30
  });
  const [fabricForm, setFabricForm] = useState({
    fabric_code: '', fabric_name: '', fabric_category: 'WOVEN', construction_warp: '', construction_weft: '',
    width_inches: '', finished_width_inches: '', gsm: '', hsn_code: '', default_shrinkage_pct: ''
  });
  const [shadeForm, setShadeForm] = useState({
    shade_card_no: '', shade_name: '', pantone_ref: '', lab_l: '', lab_a: '', lab_b: '',
    delta_e_tolerance: 1.0, customer_party_id: ''
  });
  const [chemForm, setChemForm] = useState({
    item_code: '', item_name: '', category: 'REACTIVE_DYE', uom: 'KG', hsn_code: '3204',
    gst_rate_pct: 18, reorder_level: 0, reorder_qty: 0, preferred_supplier_id: '',
    track_batch_expiry: true, shelf_life_days: 365
  });

  const fetchData = async () => {
    try {
      const paths = {
        parties: '/api/v1/parties', fabrics: '/api/v1/fabrics', shades: '/api/v1/shades',
        chemicals: '/api/v1/dye-chemicals', machines: '/api/v1/machines',
        recipes: '/api/v1/recipes', templates: '/api/v1/process-templates'
      };
      const result = await api.get(paths[tab]);
      setData(result || []);
      if (tab === 'shades' || tab === 'chemicals') {
        const p = await api.get('/api/v1/parties');
        setParties(p || []);
        setSuppliers((p || []).filter(x => x.party_type === 'SUPPLIER'));
      }
    } catch (err) {
      console.error('Error fetching master data:', err.message);
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const handleCreateParty = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/parties', partyForm);
      setIsModalOpen(false);
      setPartyForm({ party_type: 'TRADER_MERCHANT', legal_name: '', trade_name: '', gstin: '', pan: '', state_code: '24', billing_address: '', contact_person: '', mobile: '', email: '', credit_limit: 0, credit_period_days: 30 });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleCreateFabric = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/fabrics', fabricForm);
      setIsModalOpen(false);
      setFabricForm({ fabric_code: '', fabric_name: '', fabric_category: 'WOVEN', construction_warp: '', construction_weft: '', width_inches: '', finished_width_inches: '', gsm: '', hsn_code: '', default_shrinkage_pct: '' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleCreateShade = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/shades', shadeForm);
      setIsModalOpen(false);
      setShadeForm({ shade_card_no: '', shade_name: '', pantone_ref: '', lab_l: '', lab_a: '', lab_b: '', delta_e_tolerance: 1.0, customer_party_id: '' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleCreateChemical = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/dye-chemicals', chemForm);
      setIsModalOpen(false);
      setChemForm({ item_code: '', item_name: '', category: 'REACTIVE_DYE', uom: 'KG', hsn_code: '3204', gst_rate_pct: 18, reorder_level: 0, reorder_qty: 0, preferred_supplier_id: '', track_batch_expiry: true, shelf_life_days: 365 });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const canCreate = ['parties', 'fabrics', 'shades', 'chemicals'].includes(tab);

  return (
    <div className="flex flex-col gap-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Data Card */}
      <Card
        title={TABS.find(t => t.id === tab)?.label}
        headerActions={canCreate && (
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 text-xs">
            <Plus size={14} /> Add {tab === 'parties' ? 'Party' : tab === 'fabrics' ? 'Fabric' : tab === 'shades' ? 'Shade' : 'Chemical'}
          </Button>
        )}
      >
        {/* Parties Table */}
        {tab === 'parties' && (
          <Table headers={['Code', 'Legal Name', 'Type', 'GSTIN', 'Contact', 'Credit Limit ₹', 'Outstanding ₹', 'Status']}>
            {data.map(r => (
              <tr key={r.party_id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-xs font-bold">{r.party_code}</td>
                <td className="px-6 py-3">
                  <div className="font-semibold text-slate-800">{r.legal_name}</div>
                  {r.trade_name && <div className="text-xs text-slate-400">{r.trade_name}</div>}
                </td>
                <td className="px-6 py-3"><Badge status={r.party_type === 'TRADER_MERCHANT' ? 'confirmed' : 'pending'}>{r.party_type.replace('_', ' ')}</Badge></td>
                <td className="px-6 py-3 font-mono text-xs">{r.gstin || '—'}</td>
                <td className="px-6 py-3 text-xs">{r.contact_person}<br/><span className="text-slate-400">{r.mobile}</span></td>
                <td className="px-6 py-3 font-semibold">₹{Number(r.credit_limit || 0).toLocaleString()}</td>
                <td className="px-6 py-3 font-bold text-rose-600">₹{Number(r.outstanding_balance || 0).toLocaleString()}</td>
                <td className="px-6 py-3"><Badge status={r.is_active ? 'active' : 'cancelled'}>{r.is_active ? 'Active' : 'Inactive'}</Badge></td>
              </tr>
            ))}
          </Table>
        )}

        {/* Fabrics Table */}
        {tab === 'fabrics' && (
          <Table headers={['Code', 'Fabric Name', 'Category', 'Construction (W/W)', 'Width (in)', 'GSM', 'HSN', 'Shrinkage %']}>
            {data.map(r => (
              <tr key={r.fabric_id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-xs font-bold">{r.fabric_code}</td>
                <td className="px-6 py-3 font-semibold">{r.fabric_name}</td>
                <td className="px-6 py-3"><Badge status="pending">{r.fabric_category}</Badge></td>
                <td className="px-6 py-3 text-xs">{r.construction_warp || '—'} / {r.construction_weft || '—'}</td>
                <td className="px-6 py-3">{r.width_inches}" → {r.finished_width_inches}"</td>
                <td className="px-6 py-3 font-bold">{r.gsm}</td>
                <td className="px-6 py-3 font-mono text-xs">{r.hsn_code}</td>
                <td className="px-6 py-3 text-amber-600 font-semibold">{r.default_shrinkage_pct}%</td>
              </tr>
            ))}
          </Table>
        )}

        {/* Shades Table */}
        {tab === 'shades' && (
          <Table headers={['Card No', 'Shade Name', 'Pantone', 'L*', 'a*', 'b*', 'ΔE Tolerance', 'Customer']}>
            {data.map(r => (
              <tr key={r.shade_id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-xs font-bold">{r.shade_card_no}</td>
                <td className="px-6 py-3 font-semibold flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-slate-300" style={{backgroundColor: `lab(${r.lab_l || 50} ${r.lab_a || 0} ${r.lab_b || 0})`}} />
                  {r.shade_name}
                </td>
                <td className="px-6 py-3 text-xs">{r.pantone_ref || '—'}</td>
                <td className="px-6 py-3 font-mono text-xs">{r.lab_l}</td>
                <td className="px-6 py-3 font-mono text-xs">{r.lab_a}</td>
                <td className="px-6 py-3 font-mono text-xs">{r.lab_b}</td>
                <td className="px-6 py-3">{r.delta_e_tolerance}</td>
                <td className="px-6 py-3 text-xs">{parties.find(p => p.party_id === r.customer_party_id)?.trade_name || '—'}</td>
              </tr>
            ))}
          </Table>
        )}

        {/* Dyes & Chemicals Table */}
        {tab === 'chemicals' && (
          <Table headers={['Code', 'Chemical Name', 'Category', 'UOM', 'GST %', 'Reorder Level', 'Supplier', 'Batch Expiry']}>
            {data.map(r => (
              <tr key={r.item_id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-xs font-bold">{r.item_code}</td>
                <td className="px-6 py-3 font-semibold">{r.item_name}</td>
                <td className="px-6 py-3"><Badge status={r.category.includes('DYE') ? 'confirmed' : 'pending'}>{r.category.replace(/_/g, ' ')}</Badge></td>
                <td className="px-6 py-3">{r.uom}</td>
                <td className="px-6 py-3">{r.gst_rate_pct}%</td>
                <td className="px-6 py-3 font-semibold">{r.reorder_level} {r.uom}</td>
                <td className="px-6 py-3 text-xs">{suppliers.find(s => s.party_id === r.preferred_supplier_id)?.trade_name || '—'}</td>
                <td className="px-6 py-3"><Badge status={r.track_batch_expiry ? 'active' : 'draft'}>{r.track_batch_expiry ? 'Tracked' : 'No'}</Badge></td>
              </tr>
            ))}
          </Table>
        )}

        {/* Machines Table */}
        {tab === 'machines' && (
          <Table headers={['Code', 'Machine Name', 'Type', 'Capacity', 'Status', 'Location', 'Rate ₹/hr']}>
            {data.map(r => (
              <tr key={r.machine_id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-xs font-bold">{r.machine_code}</td>
                <td className="px-6 py-3 font-semibold">{r.machine_name}</td>
                <td className="px-6 py-3"><Badge status="pending">{r.machine_type.replace(/_/g, ' ')}</Badge></td>
                <td className="px-6 py-3">{r.capacity_value} {r.capacity_uom}</td>
                <td className="px-6 py-3"><Badge status={r.current_status === 'IDLE' ? 'available' : r.current_status === 'RUNNING' ? 'in_progress' : 'maintenance'}>{r.current_status}</Badge></td>
                <td className="px-6 py-3 text-xs">{r.location}</td>
                <td className="px-6 py-3 font-semibold">₹{Number(r.hourly_rate).toLocaleString()}</td>
              </tr>
            ))}
          </Table>
        )}

        {/* Recipes Table */}
        {tab === 'recipes' && (
          <Table headers={['Code', 'Shade', 'Fabric', 'Machine Type', 'Temp °C', 'Cycle (min)', 'Liquor Ratio', 'Approved']}>
            {data.map(r => (
              <tr key={r.recipe_id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-mono text-xs font-bold">{r.recipe_code}</td>
                <td className="px-6 py-3 font-semibold">{r.shade_name || r.shade_id}</td>
                <td className="px-6 py-3">{r.fabric_name || r.fabric_id}</td>
                <td className="px-6 py-3"><Badge status="pending">{(r.machine_type || '').replace(/_/g, ' ')}</Badge></td>
                <td className="px-6 py-3">{r.process_temp_celsius}°C</td>
                <td className="px-6 py-3">{r.cycle_time_mins} min</td>
                <td className="px-6 py-3">1:{r.liquor_ratio}</td>
                <td className="px-6 py-3"><Badge status={r.is_approved ? 'approved' : 'draft'}>{r.is_approved ? 'Approved' : 'Pending'}</Badge></td>
              </tr>
            ))}
          </Table>
        )}

        {/* Process Templates Table */}
        {tab === 'templates' && (
          <Table headers={['Template Name', 'Fabric', 'Process Type', 'Status']}>
            {data.map(r => (
              <tr key={r.template_id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-semibold">{r.template_name}</td>
                <td className="px-6 py-3">{r.fabric_name || r.fabric_id || '—'}</td>
                <td className="px-6 py-3"><Badge status="confirmed">{(r.process_type || '').replace(/_/g, ' ')}</Badge></td>
                <td className="px-6 py-3"><Badge status={r.is_active ? 'active' : 'cancelled'}>{r.is_active ? 'Active' : 'Inactive'}</Badge></td>
              </tr>
            ))}
          </Table>
        )}

        {data.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No records found. {canCreate && 'Click the Add button to create one.'}</div>
        )}
      </Card>

      {/* Add Party Modal */}
      <Modal isOpen={isModalOpen && tab === 'parties'} onClose={() => setIsModalOpen(false)} title="Add New Party" className="max-w-2xl">
        <form onSubmit={handleCreateParty} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Party Type" value={partyForm.party_type} onChange={e => setPartyForm({...partyForm, party_type: e.target.value})}
              options={PARTY_TYPES} required />
            <Input label="State Code" value={partyForm.state_code} onChange={e => setPartyForm({...partyForm, state_code: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Legal Name" value={partyForm.legal_name} onChange={e => setPartyForm({...partyForm, legal_name: e.target.value})} required />
            <Input label="Trade Name" value={partyForm.trade_name} onChange={e => setPartyForm({...partyForm, trade_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="GSTIN" value={partyForm.gstin} onChange={e => setPartyForm({...partyForm, gstin: e.target.value})} placeholder="24AAAAA0000A1Z5" />
            <Input label="PAN" value={partyForm.pan} onChange={e => setPartyForm({...partyForm, pan: e.target.value})} placeholder="AAAAA0000A" />
          </div>
          <Input label="Billing Address" value={partyForm.billing_address} onChange={e => setPartyForm({...partyForm, billing_address: e.target.value})} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Contact Person" value={partyForm.contact_person} onChange={e => setPartyForm({...partyForm, contact_person: e.target.value})} />
            <Input label="Mobile" value={partyForm.mobile} onChange={e => setPartyForm({...partyForm, mobile: e.target.value})} />
            <Input label="Email" type="email" value={partyForm.email} onChange={e => setPartyForm({...partyForm, email: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Credit Limit ₹" type="number" value={partyForm.credit_limit} onChange={e => setPartyForm({...partyForm, credit_limit: e.target.value})} />
            <Input label="Credit Period (Days)" type="number" value={partyForm.credit_period_days} onChange={e => setPartyForm({...partyForm, credit_period_days: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Party</Button>
          </div>
        </form>
      </Modal>

      {/* Add Fabric Modal */}
      <Modal isOpen={isModalOpen && tab === 'fabrics'} onClose={() => setIsModalOpen(false)} title="Add New Fabric" className="max-w-2xl">
        <form onSubmit={handleCreateFabric} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fabric Code" value={fabricForm.fabric_code} onChange={e => setFabricForm({...fabricForm, fabric_code: e.target.value})} required placeholder="FAB-XXX-XX" />
            <Input label="Fabric Name" value={fabricForm.fabric_name} onChange={e => setFabricForm({...fabricForm, fabric_name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Category" value={fabricForm.fabric_category} onChange={e => setFabricForm({...fabricForm, fabric_category: e.target.value})}
              options={[{value:'WOVEN',label:'Woven'},{value:'KNITTED',label:'Knitted'},{value:'NON_WOVEN',label:'Non-Woven'}]} required />
            <Input label="Warp Count" value={fabricForm.construction_warp} onChange={e => setFabricForm({...fabricForm, construction_warp: e.target.value})} placeholder="40s" />
            <Input label="Weft Count" value={fabricForm.construction_weft} onChange={e => setFabricForm({...fabricForm, construction_weft: e.target.value})} placeholder="40s" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Input label="Grey Width (in)" type="number" value={fabricForm.width_inches} onChange={e => setFabricForm({...fabricForm, width_inches: e.target.value})} />
            <Input label="Finished Width" type="number" value={fabricForm.finished_width_inches} onChange={e => setFabricForm({...fabricForm, finished_width_inches: e.target.value})} />
            <Input label="GSM" type="number" value={fabricForm.gsm} onChange={e => setFabricForm({...fabricForm, gsm: e.target.value})} required />
            <Input label="HSN Code" value={fabricForm.hsn_code} onChange={e => setFabricForm({...fabricForm, hsn_code: e.target.value})} placeholder="5407" />
          </div>
          <Input label="Default Shrinkage %" type="number" value={fabricForm.default_shrinkage_pct} onChange={e => setFabricForm({...fabricForm, default_shrinkage_pct: e.target.value})} />
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Fabric</Button>
          </div>
        </form>
      </Modal>

      {/* Add Shade Modal */}
      <Modal isOpen={isModalOpen && tab === 'shades'} onClose={() => setIsModalOpen(false)} title="Add New Shade / Color" className="max-w-2xl">
        <form onSubmit={handleCreateShade} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Shade Card No" value={shadeForm.shade_card_no} onChange={e => setShadeForm({...shadeForm, shade_card_no: e.target.value})} required placeholder="SC-XXX-001" />
            <Input label="Shade Name" value={shadeForm.shade_name} onChange={e => setShadeForm({...shadeForm, shade_name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Pantone Reference" value={shadeForm.pantone_ref} onChange={e => setShadeForm({...shadeForm, pantone_ref: e.target.value})} />
            <Select label="Customer (optional)" value={shadeForm.customer_party_id} onChange={e => setShadeForm({...shadeForm, customer_party_id: e.target.value})}
              options={[{value:'',label:'— No specific customer —'}, ...parties.filter(p=>p.party_type==='TRADER_MERCHANT').map(p=>({value:p.party_id, label:p.trade_name||p.legal_name}))]} />
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">CIELAB Color Values</span>
            <div className="grid grid-cols-4 gap-4">
              <Input label="L* (Lightness)" type="number" value={shadeForm.lab_l} onChange={e => setShadeForm({...shadeForm, lab_l: e.target.value})} />
              <Input label="a* (Red-Green)" type="number" value={shadeForm.lab_a} onChange={e => setShadeForm({...shadeForm, lab_a: e.target.value})} />
              <Input label="b* (Yellow-Blue)" type="number" value={shadeForm.lab_b} onChange={e => setShadeForm({...shadeForm, lab_b: e.target.value})} />
              <Input label="ΔE Tolerance" type="number" value={shadeForm.delta_e_tolerance} onChange={e => setShadeForm({...shadeForm, delta_e_tolerance: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Shade</Button>
          </div>
        </form>
      </Modal>

      {/* Add Chemical Modal */}
      <Modal isOpen={isModalOpen && tab === 'chemicals'} onClose={() => setIsModalOpen(false)} title="Add Dye / Chemical" className="max-w-2xl">
        <form onSubmit={handleCreateChemical} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Item Code" value={chemForm.item_code} onChange={e => setChemForm({...chemForm, item_code: e.target.value})} required placeholder="DYE-XXX or CHM-XXX" />
            <Input label="Item Name" value={chemForm.item_name} onChange={e => setChemForm({...chemForm, item_name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Category" value={chemForm.category} onChange={e => setChemForm({...chemForm, category: e.target.value})}
              options={CHEMICAL_CATEGORIES} required />
            <Select label="Unit of Measure" value={chemForm.uom} onChange={e => setChemForm({...chemForm, uom: e.target.value})}
              options={[{value:'KG',label:'KG'},{value:'LTR',label:'Litre'},{value:'GM',label:'Gram'}]} />
            <Input label="HSN Code" value={chemForm.hsn_code} onChange={e => setChemForm({...chemForm, hsn_code: e.target.value})} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="GST Rate %" type="number" value={chemForm.gst_rate_pct} onChange={e => setChemForm({...chemForm, gst_rate_pct: e.target.value})} />
            <Input label="Reorder Level" type="number" value={chemForm.reorder_level} onChange={e => setChemForm({...chemForm, reorder_level: e.target.value})} />
            <Input label="Reorder Qty" type="number" value={chemForm.reorder_qty} onChange={e => setChemForm({...chemForm, reorder_qty: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Preferred Supplier" value={chemForm.preferred_supplier_id} onChange={e => setChemForm({...chemForm, preferred_supplier_id: e.target.value})}
              options={[{value:'',label:'— Select Supplier —'}, ...suppliers.map(s=>({value:s.party_id,label:s.trade_name||s.legal_name}))]} />
            <Input label="Shelf Life (Days)" type="number" value={chemForm.shelf_life_days} onChange={e => setChemForm({...chemForm, shelf_life_days: e.target.value})} />
          </div>
          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Chemical</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
