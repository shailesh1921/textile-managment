import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Badge, Button, Modal, Input, Select } from '../../components/ui';
import { Truck, FileText, Plus, Package, RotateCcw } from 'lucide-react';

export default function Dispatch() {
  const [tab, setTab] = useState('ready');
  const [readyLots, setReadyLots] = useState([]);
  const [challans, setChallans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [parties, setParties] = useState([]);
  const [jobOrders, setJobOrders] = useState([]);
  
  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Challan form state
  const [challanForm, setChallanForm] = useState({
    job_order_id: '',
    party_id: '',
    transporter_id: '',
    vehicle_no: '',
    lr_no: '',
    lr_date: '',
    lines: []
  });

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    job_order_id: '',
    party_id: '',
    invoice_type: 'JOB_WORK_TAX_INVOICE',
    lines: []
  });

  const [taxPreview, setTaxPreview] = useState(null);

  const fetchData = async () => {
    try {
      const rl = await api.get('/api/v1/dispatch/ready-lots');
      setReadyLots(rl || []);
      const chs = await api.get('/api/v1/dispatch/challans');
      setChallans(chs || []);
      const invs = await api.get('/api/v1/dispatch/gst/invoices');
      setInvoices(invs || []);
      const pts = await api.get('/api/parties');
      setParties(pts || []);
      const jobs = await api.get('/api/v1/job-orders');
      setJobOrders(jobs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  // Set party from job order selection in challan form
  useEffect(() => {
    if (challanForm.job_order_id) {
      const selectedJob = jobOrders.find(j => j.job_order_id === parseInt(challanForm.job_order_id));
      if (selectedJob) {
        setChallanForm(prev => ({
          ...prev,
          party_id: selectedJob.party_id,
          // Filter ready lots for this job order to add to lines
          lines: readyLots
            .filter(r => r.job_order_id === selectedJob.job_order_id)
            .map(r => ({
              lot_id: r.lot_id,
              fg_stock_id: r.fg_stock_id,
              fabric_id: r.fabric_id,
              shade_id: r.shade_id,
              hsn_code: r.hsn_code || '5407',
              qty_meters: r.qty_meters,
              qty_kg: r.qty_kg,
              no_of_rolls: 1,
              lot_no: r.lot_no,
              selected: false
            }))
        }));
      }
    }
  }, [challanForm.job_order_id, jobOrders, readyLots]);

  // Auto-calculate GST tax for invoice when job order/party is selected
  useEffect(() => {
    const calculateTax = async () => {
      if (invoiceForm.job_order_id && invoiceForm.party_id) {
        const selectedJob = jobOrders.find(j => j.job_order_id === parseInt(invoiceForm.job_order_id));
        if (selectedJob) {
          // Find matching bills or complete job amount
          const rate = selectedJob.billing_uom === 'KG' ? selectedJob.rate_per_kg : selectedJob.rate_per_meter;
          const qty = selectedJob.billing_uom === 'KG' ? selectedJob.qty_kg_ordered : selectedJob.qty_meters_ordered;
          const taxableValue = parseFloat(qty) * parseFloat(rate);
          
          const payload = {
            party_id: parseInt(invoiceForm.party_id),
            lines: [{
              description: `Job Work Processing Charges for fabric: ${selectedJob.fabric_name}`,
              taxable_value: taxableValue,
              gst_rate: 18
            }]
          };

          try {
            const tax = await api.post('/api/v1/dispatch/gst/calculate-tax', payload);
            setTaxPreview(tax);
            setInvoiceForm(prev => ({
              ...prev,
              lines: payload.lines
            }));
          } catch (err) {
            console.error(err);
          }
        }
      }
    };
    calculateTax();
  }, [invoiceForm.job_order_id, invoiceForm.party_id, jobOrders]);

  const handleCreateChallan = async (e) => {
    e.preventDefault();
    const selectedLines = challanForm.lines.filter(l => l.selected);
    if (selectedLines.length === 0) {
      alert('Please select at least one lot to dispatch.');
      return;
    }

    try {
      await api.post('/api/v1/dispatch/challans', {
        job_order_id: parseInt(challanForm.job_order_id),
        party_id: parseInt(challanForm.party_id),
        transporter_id: challanForm.transporter_id ? parseInt(challanForm.transporter_id) : null,
        vehicle_no: challanForm.vehicle_no,
        lr_no: challanForm.lr_no,
        lr_date: challanForm.lr_date || null,
        lines: selectedLines.map(l => ({
          lot_id: l.lot_id,
          fg_stock_id: l.fg_stock_id,
          fabric_id: l.fabric_id,
          shade_id: l.shade_id,
          hsn_code: l.hsn_code,
          qty_meters: parseFloat(l.qty_meters),
          qty_kg: parseFloat(l.qty_kg),
          no_of_rolls: parseInt(l.no_of_rolls)
        }))
      });
      setIsChallanModalOpen(false);
      setChallanForm({ job_order_id: '', party_id: '', transporter_id: '', vehicle_no: '', lr_no: '', lr_date: '', lines: [] });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceForm.job_order_id || !invoiceForm.party_id) return;
    try {
      await api.post('/api/v1/dispatch/gst/invoices', {
        job_order_id: parseInt(invoiceForm.job_order_id),
        party_id: parseInt(invoiceForm.party_id),
        invoice_type: invoiceForm.invoice_type,
        lines: invoiceForm.lines
      });
      setIsInvoiceModalOpen(false);
      setInvoiceForm({ job_order_id: '', party_id: '', invoice_type: 'JOB_WORK_TAX_INVOICE', lines: [] });
      setTaxPreview(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub tabs */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-200">
        <div className="flex gap-2">
          {[
            { id: 'ready', label: 'QC Ready Stock' },
            { id: 'challans', label: 'Delivery Challans (143)' },
            { id: 'invoices', label: 'GST Tax Invoices' },
            { id: 'returns', label: 'Returns Tracking' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-2">
          {tab === 'challans' && (
            <Button onClick={() => setIsChallanModalOpen(true)} className="bg-emerald-600 flex items-center gap-1 text-xs">
              <Plus size={14} /> New Challan
            </Button>
          )}
          {tab === 'invoices' && (
            <Button onClick={() => setIsInvoiceModalOpen(true)} className="bg-emerald-600 flex items-center gap-1 text-xs">
              <Plus size={14} /> Raise Invoice
            </Button>
          )}
        </div>
      </div>

      {/* QC Ready Stock Tab */}
      {tab === 'ready' && (
        <Card title="Finished Goods Quality Passed & Ready for Dispatch">
          <Table headers={['Lot Number', 'Job Order', 'Fabric', 'Shade', 'Quality Grade', 'Meters', 'Weight (kg)', 'Ownership', 'Action']}>
            {readyLots.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-10 text-center text-slate-400">
                  No finished goods are currently ready. Approve lots in Quality Control first.
                </td>
              </tr>
            ) : (
              readyLots.map(l => (
                <tr key={l.fg_stock_id} className="hover:bg-slate-50 text-xs">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{l.lot_no}</td>
                  <td className="px-6 py-3.5 font-mono font-semibold">{l.job_order_no}</td>
                  <td className="px-6 py-3.5 font-medium">{l.fabric_name}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-600">{l.shade_name || 'RFD'}</td>
                  <td className="px-6 py-3.5">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[10px]">
                      Grade {l.quality_grade}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-bold text-slate-800">{parseFloat(l.qty_meters)} m</td>
                  <td className="px-6 py-3.5">{parseFloat(l.qty_kg)} kg</td>
                  <td className="px-6 py-3.5 uppercase text-[10px] text-slate-400 font-bold">{l.ownership_type.replace('_', ' ')}</td>
                  <td className="px-6 py-3.5">
                    <button
                      onClick={() => {
                        setChallanForm({
                          job_order_id: l.job_order_id.toString(),
                          party_id: '',
                          transporter_id: '',
                          vehicle_no: '',
                          lr_no: '',
                          lr_date: '',
                          lines: []
                        });
                        setIsChallanModalOpen(true);
                      }}
                      className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded font-bold hover:bg-blue-100"
                    >
                      Ship Lot
                    </button>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Challans Tab */}
      {tab === 'challans' && (
        <Card title="Job Work Delivery Challans (Section 143, CGST Rules)">
          <Table headers={['Challan Number', 'Trader Party', 'Dispatch Date', 'Total Meters', 'Total Weight', 'Vehicle No', 'LR Code', 'Status']}>
            {challans.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-slate-400">
                  No delivery challans generated.
                </td>
              </tr>
            ) : (
              challans.map(c => (
                <tr key={c.challan_id} className="hover:bg-slate-50 text-xs">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{c.challan_no}</td>
                  <td className="px-6 py-3.5 font-bold">{c.party_name}</td>
                  <td className="px-6 py-3.5 font-medium">{new Date(c.dispatch_date).toLocaleDateString()}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-700">{parseFloat(c.total_qty_meters)} m</td>
                  <td className="px-6 py-3.5">{parseFloat(c.total_qty_kg)} kg</td>
                  <td className="px-6 py-3.5 font-mono">{c.vehicle_no || '—'}</td>
                  <td className="px-6 py-3.5 text-slate-400 font-semibold">{c.lr_no || '—'}</td>
                  <td className="px-6 py-3.5"><Badge status={c.status}>{c.status}</Badge></td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Invoices Tab */}
      {tab === 'invoices' && (
        <Card title="GST Job Work Tax Invoices">
          <Table headers={['Invoice Number', 'Client Name', 'Invoice Date', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Invoice', 'Status']}>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-10 text-center text-slate-400">
                  No tax invoices generated yet.
                </td>
              </tr>
            ) : (
              invoices.map(i => (
                <tr key={i.invoice_id} className="hover:bg-slate-50 text-xs">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{i.invoice_no}</td>
                  <td className="px-6 py-3.5 font-bold">{i.party_name}</td>
                  <td className="px-6 py-3.5 font-medium">{new Date(i.invoice_date).toLocaleDateString()}</td>
                  <td className="px-6 py-3.5 font-semibold">₹{parseFloat(i.taxable_value).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-slate-400">₹{parseFloat(i.cgst_amount).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-slate-400">₹{parseFloat(i.sgst_amount).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-slate-400">₹{parseFloat(i.igst_amount).toLocaleString()}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-800">₹{parseFloat(i.total_amount).toLocaleString()}</td>
                  <td className="px-6 py-3.5"><Badge status={i.status}>{i.status}</Badge></td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Returns Tab */}
      {tab === 'returns' && (
        <Card title="Material Return Notes & Rejections">
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RotateCcw size={40} className="mb-4 text-slate-300" />
            <p className="text-sm font-semibold">Customer Material Returns tracking module coming soon.</p>
            <p className="text-xs text-slate-400 mt-1">Logs return challans and maps defects back to the machine history logs.</p>
          </div>
      </Card>
      )}

      {/* Create Challan Modal */}
      <Modal isOpen={isChallanModalOpen} onClose={() => setIsChallanModalOpen(false)} title="Generate Job-Work Delivery Challan (Rule 55)" className="max-w-3xl">
        <form onSubmit={handleCreateChallan} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Select Job Work Order"
              value={challanForm.job_order_id}
              onChange={e => setChallanForm({ ...challanForm, job_order_id: e.target.value })}
              options={[{ value: '', label: '-- Select Job Order --' }, ...jobOrders.map(j => ({ value: j.job_order_id, label: `${j.job_order_no} - ${j.party_name}` }))]}
              required
            />
            <Select
              label="Transporter Name"
              value={challanForm.transporter_id}
              onChange={e => setChallanForm({ ...challanForm, transporter_id: e.target.value })}
              options={[{ value: '', label: '-- Self Carrier / No Transporter --' }, ...parties.filter(p => p.party_type === 'TRANSPORTER').map(p => ({ value: p.party_id, label: p.trade_name || p.legal_name }))]}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Vehicle Number"
              value={challanForm.vehicle_no}
              onChange={e => setChallanForm({ ...challanForm, vehicle_no: e.target.value })}
              placeholder="GJ-05-XX-XXXX"
            />
            <Input
              label="LR/GR Number"
              value={challanForm.lr_no}
              onChange={e => setChallanForm({ ...challanForm, lr_no: e.target.value })}
              placeholder="LR-7762-C"
            />
            <Input
              label="LR Booking Date"
              type="date"
              value={challanForm.lr_date}
              onChange={e => setChallanForm({ ...challanForm, lr_date: e.target.value })}
            />
          </div>

          {challanForm.lines.length > 0 && (
            <div className="border rounded-lg overflow-hidden mt-2">
              <span className="bg-slate-50 p-2.5 font-bold uppercase text-[10px] block border-b">Select Lot Batches to Dispatch</span>
              <div className="max-h-60 overflow-y-auto">
                <Table headers={['Select', 'Lot No', 'HSN', 'Fabric / Shade', 'Quantity (meters)', 'Weight (kg)', 'Rolls']}>
                  {challanForm.lines.map((l, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-2.5">
                        <input
                          type="checkbox"
                          checked={l.selected}
                          onChange={e => {
                            const newLines = [...challanForm.lines];
                            newLines[index].selected = e.target.checked;
                            setChallanForm({ ...challanForm, lines: newLines });
                          }}
                        />
                      </td>
                      <td className="px-6 py-2.5 font-mono font-bold">{l.lot_no}</td>
                      <td className="px-6 py-2.5 font-mono text-[10px]">{l.hsn_code}</td>
                      <td className="px-6 py-2.5 text-slate-500 font-semibold">{l.lot_no ? 'Dyeing Mill Processed' : ''}</td>
                      <td className="px-6 py-2.5 font-bold">{parseFloat(l.qty_meters)} m</td>
                      <td className="px-6 py-2.5">{parseFloat(l.qty_kg)} kg</td>
                      <td className="px-6 py-2.5">
                        <input
                          type="number"
                          value={l.no_of_rolls}
                          onChange={e => {
                            const newLines = [...challanForm.lines];
                            newLines[index].no_of_rolls = parseInt(e.target.value) || 1;
                            setChallanForm({ ...challanForm, lines: newLines });
                          }}
                          className="w-16 border rounded px-1.5 py-0.5 text-center"
                        />
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsChallanModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate Delivery Challan</Button>
          </div>
        </form>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Generate GST Tax Invoice" className="max-w-2xl">
        <form onSubmit={handleCreateInvoice} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Select Job Work Order"
              value={invoiceForm.job_order_id}
              onChange={e => setInvoiceForm({ ...invoiceForm, job_order_id: e.target.value })}
              options={[{ value: '', label: '-- Select Job Order --' }, ...jobOrders.map(j => ({ value: j.job_order_id, label: `${j.job_order_no} - ${j.party_name}` }))]}
              required
            />
            <Select
              label="Trader Client"
              value={invoiceForm.party_id}
              onChange={e => setInvoiceForm({ ...invoiceForm, party_id: e.target.value })}
              options={[{ value: '', label: '-- Select Trader --' }, ...parties.filter(p => p.party_type === 'TRADER_MERCHANT').map(p => ({ value: p.party_id, label: p.trade_name || p.legal_name }))]}
              required
            />
          </div>

          {taxPreview && (
            <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl flex flex-col gap-2 mt-2">
              <span className="font-bold text-emerald-800 uppercase tracking-widest text-[10px]">GST Tax Invoice Breakdown</span>
              <div className="flex justify-between border-b border-emerald-100 pb-1.5 font-semibold text-slate-700">
                <span>Taxable Service Value:</span>
                <span>₹{taxPreview.taxable_value.toLocaleString()}</span>
              </div>
              {!taxPreview.is_interstate ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9%):</span>
                    <span>₹{taxPreview.cgst_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9%):</span>
                    <span>₹{taxPreview.sgst_amount.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>IGST (18%):</span>
                  <span>₹{taxPreview.igst_amount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800 text-sm border-t border-emerald-200 pt-2">
                <span>Gross Payable Invoice Value:</span>
                <span>₹{taxPreview.total_amount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="secondary" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Generate Tax Invoice</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
