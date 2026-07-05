import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Badge, Button, Modal, Input, Select } from '../../components/ui';
import { IndianRupee, FileText, Users, TrendingUp, Receipt } from 'lucide-react';

export default function Finance() {
  const [tab, setTab] = useState('billing');
  const [parties, setParties] = useState([]);
  const [jobOrders, setJobOrders] = useState([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ageingData, setAgeingData] = useState([]);
  
  // Billing state
  const [billingForm, setBillingForm] = useState({
    job_order_id: ''
  });

  // Lot cost sheet state
  const [searchLotId, setSearchLotId] = useState('');
  const [costSheet, setCostSheet] = useState(null);

  const fetchData = async () => {
    try {
      const pts = await api.get('/api/parties');
      setParties(pts || []);
      const jobs = await api.get('/api/v1/job-orders');
      setJobOrders(jobs || []);
      
      if (tab === 'ageing') {
        const ageing = await api.get('/api/v1/finance/ageing');
        setAgeingData(ageing || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  // Load ledger when party selection changes
  useEffect(() => {
    if (selectedPartyId) {
      api.get(`/api/v1/finance/ledger?party_id=${selectedPartyId}`)
        .then(setLedgerEntries)
        .catch(console.error);
    } else {
      setLedgerEntries([]);
    }
  }, [selectedPartyId]);

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    if (!billingForm.job_order_id) return;
    try {
      const bill = await api.post('/api/v1/finance/job-work/run', {
        job_order_id: parseInt(billingForm.job_order_id)
      });
      alert(`Job Work Bill generated successfully: ${bill.bill_no}\nGross Amount: ₹${parseFloat(bill.gross_amount).toLocaleString()}`);
      setBillingForm({ job_order_id: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFetchCostSheet = async (e) => {
    e.preventDefault();
    if (!searchLotId) return;
    try {
      const sheet = await api.get(`/api/v1/finance/lot-cost/${searchLotId}`);
      setCostSheet(sheet);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'billing', label: 'Job-Work Billing', icon: Receipt },
          { id: 'ledger', label: 'Party Ledgers', icon: Users },
          { id: 'ageing', label: 'Ageing Analysis', icon: TrendingUp },
          { id: 'costing', label: 'Lot Cost Sheets', icon: FileText }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Job Work Billing Tab */}
      {tab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card title="Raise Job Work Invoice">
              <form onSubmit={handleGenerateBill} className="flex flex-col gap-4 text-xs mt-2">
                <Select
                  label="Select Job Work Order (Completed)"
                  value={billingForm.job_order_id}
                  onChange={e => setBillingForm({ job_order_id: e.target.value })}
                  options={[
                    { value: '', label: '-- Select Completed Job --' },
                    ...jobOrders.filter(j => j.status === 'COMPLETED' || j.status === 'PARTIALLY_DISPATCHED').map(j => ({
                      value: j.job_order_id,
                      label: `${j.job_order_no} - ${j.party_name} (${parseFloat(j.qty_meters_ordered)} m)`
                    }))
                  ]}
                  required
                />
                <Button type="submit" className="bg-emerald-600 font-bold py-2.5 shadow-md">
                  Process Billing Run
                </Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="Seeded Billing Transactions">
              <Table headers={['Bill Ref No', 'Job Order', 'Billed Qty', 'Rate Charged', 'Net Billed Amount']}>
                {jobOrders.filter(j => j.status === 'COMPLETED' || j.status === 'PARTIALLY_DISPATCHED').length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                      No billed transactions found. Process completed jobs to generate invoices.
                    </td>
                  </tr>
                ) : (
                  jobOrders.filter(j => j.status === 'COMPLETED' || j.status === 'PARTIALLY_DISPATCHED').map((j, index) => (
                    <tr key={j.job_order_id} className="hover:bg-slate-50 text-xs">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">JW/BILL/2026/{1000 + index}</td>
                      <td className="px-6 py-4 font-mono font-semibold">{j.job_order_no}</td>
                      <td className="px-6 py-4">{parseFloat(j.qty_meters_ordered)} m</td>
                      <td className="px-6 py-4">₹{parseFloat(j.rate_per_meter)} / m</td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        ₹{(parseFloat(j.qty_meters_ordered) * parseFloat(j.rate_per_meter)).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </Table>
            </Card>
          </div>
        </div>
      )}

      {/* Party Ledgers Tab */}
      {tab === 'ledger' && (
        <div className="flex flex-col gap-4">
          <Card title="Trader Customer Account Ledger Statement">
            <div className="max-w-md mb-6">
              <Select
                label="Select Account / Trader Party"
                value={selectedPartyId}
                onChange={e => setSelectedPartyId(e.target.value)}
                options={[
                  { value: '', label: '-- Select Party --' },
                  ...parties.filter(p => p.party_type === 'TRADER_MERCHANT').map(p => ({
                    value: p.party_id,
                    label: `${p.legal_name} (${p.trade_name})`
                  }))
                ]}
              />
            </div>

            <Table headers={['Voucher Date', 'Voucher Type', 'Reference No', 'Debit (₹)', 'Credit (₹)', 'Statement Balance (₹)']}>
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                    {selectedPartyId ? 'No transaction records found for this account.' : 'Please select a trader party to load statement.'}
                  </td>
                </tr>
              ) : (
                ledgerEntries.map(e => (
                  <tr key={e.ledger_entry_id} className="hover:bg-slate-50 text-xs">
                    <td className="px-6 py-4 font-medium">{new Date(e.entry_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-slate-500">{e.voucher_type}</td>
                    <td className="px-6 py-4 font-mono font-semibold">{e.reference_no}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">{parseFloat(e.debit_amount) > 0 ? `₹${parseFloat(e.debit_amount).toLocaleString()}` : '—'}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{parseFloat(e.credit_amount) > 0 ? `₹${parseFloat(e.credit_amount).toLocaleString()}` : '—'}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">₹{parseFloat(e.balance).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </Table>
          </Card>
        </div>
      )}

      {/* Ageing Analysis Tab */}
      {tab === 'ageing' && (
        <Card title="Outstanding Ageing Balances (Trader Accounts Receivable)">
          <Table headers={['Customer Party / Trade Name', 'Credit Days', '0 - 30 Days', '31 - 60 Days', '61 - 90 Days', '90+ Days (Overdue)', 'Net Outstanding']}>
            {ageingData.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                  No credit balance records.
                </td>
              </tr>
            ) : (
              ageingData.map(a => (
                <tr key={a.party_id} className="hover:bg-slate-50 text-xs font-semibold">
                  <td className="px-6 py-4 font-bold text-slate-800">{a.trade_name}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono">{a.credit_period_days} Days</td>
                  <td className="px-6 py-4 text-emerald-600">₹{parseFloat(a.bucket_0_30).toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-600">₹{parseFloat(a.bucket_31_60).toLocaleString()}</td>
                  <td className="px-6 py-4 text-amber-600">₹{parseFloat(a.bucket_61_90).toLocaleString()}</td>
                  <td className="px-6 py-4 text-rose-600 font-bold bg-rose-50/20">₹{parseFloat(a.bucket_90_plus).toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 bg-slate-50 font-mono">₹{parseFloat(a.outstanding_balance).toLocaleString()}</td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Lot Costing Tab */}
      {tab === 'costing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card title="Analyze Lot Profitability">
              <form onSubmit={handleFetchCostSheet} className="flex flex-col gap-4 text-xs mt-2">
                <Input
                  label="Enter Lot Database ID / Reference"
                  type="number"
                  value={searchLotId}
                  onChange={e => setSearchLotId(e.target.value)}
                  placeholder="e.g. 1, 2"
                  required
                />
                <Button type="submit" className="bg-emerald-600 font-bold py-2.5">
                  Fetch Cost Analysis
                </Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {costSheet ? (
              <Card title="Cost Sheet & Profit Analysis">
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700 mt-2">
                  <div className="flex justify-between border-b pb-2">
                    <span>Recipe Chemical Cost:</span>
                    <strong className="text-slate-800">₹{parseFloat(costSheet.recipe_cost).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span>Machine Hours utility:</span>
                    <strong className="text-slate-800">₹{parseFloat(costSheet.machine_hour_cost || 0).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span>Labor Cost:</span>
                    <strong className="text-slate-800">₹{parseFloat(costSheet.labor_cost || 0).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span>Overhead margins:</span>
                    <strong className="text-slate-800">₹{parseFloat(costSheet.overhead_cost || 0).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 font-bold text-slate-800 bg-slate-50 p-2">
                    <span>Total Operational Cost:</span>
                    <span>₹{parseFloat(costSheet.total_cost).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 font-bold text-slate-800 bg-slate-50 p-2">
                    <span>Invoice Value:</span>
                    <span>₹{parseFloat(costSheet.billed_amount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 p-4 rounded-xl mt-6">
                  <div>
                    <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Estimated Profit Margin</span>
                    <span className="text-xl font-black text-emerald-700">₹{parseFloat(costSheet.profit_margin).toLocaleString()}</span>
                  </div>
                  <Badge status="approved">
                    {parseFloat(costSheet.profit_margin_pct)}% Margin
                  </Badge>
                </div>
              </Card>
            ) : (
              <div className="bg-white border rounded-xl p-10 text-center text-slate-400 text-sm">
                Enter a lot reference number on the left to review color and chemical cost calculations.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
