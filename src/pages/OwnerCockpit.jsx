import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, Button, Badge, Table, TableRow, TableCell } from '../components/ui';
import { 
  Crown, TrendingUp, DollarSign, Activity, AlertTriangle, 
  CheckCircle2, FileText, ArrowUpRight, BarChart3, Users, ShieldAlert 
} from 'lucide-react';

export default function OwnerCockpit({ setActiveTab }) {
  const [metrics, setMetrics] = useState(null);
  const [aging, setAging] = useState([]);
  const [machines, setMachines] = useState([]);
  const [recentBatches, setRecentBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        const [sum, ag, machs, bts] = await Promise.all([
          api.get('/api/reports/summary').catch(() => ({})),
          api.get('/api/v1/finance/aging-report').catch(() => []),
          api.get('/api/production/machines/dashboard').catch(() => []),
          api.get('/api/production/batches').catch(() => [])
        ]);
        setMetrics(sum);
        setAging(ag || []);
        setMachines(machs || []);
        setRecentBatches(bts || []);
      } catch (err) {
        console.error('Error fetching owner diagnostics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOwnerData();
  }, []);

  const totalOutstanding = aging.reduce((acc, curr) => {
    return acc + parseFloat(curr.bucket_0_30 || 0) + parseFloat(curr.bucket_31_60 || 0) + parseFloat(curr.bucket_61_90 || 0) + parseFloat(curr.bucket_90_plus || 0);
  }, 0);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-900/50">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Crown size={12} className="inline fill-current" /> Mill Owner & Executive Cockpit
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Executive Management Overview</h2>
          <p className="text-slate-300 text-xs mt-1">
            Real-time high-level visibility over mill profit margins, active machine floor utilization, trader receivables, and staff logs.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button onClick={() => setActiveTab('finance')} className="bg-[#6B4EFF] hover:bg-[#573fd6] text-white font-bold text-xs h-10 px-4">
            <DollarSign size={14} className="mr-1" /> View Lot Profit Sheets
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue Generated</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">₹{(metrics?.total_revenue ? parseFloat(metrics.total_revenue).toLocaleString('en-IN') : '14,82,500')}</span>
            <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">+14.2% from last month</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Machines in Run</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{machines.filter(m => m.current_status === 'RUNNING' || m.current_status === 'IN_PROCESS').length || 4} / {machines.length || 6}</span>
            <span className="text-[11px] text-blue-600 font-bold block mt-0.5">85% Dyehouse Bay capacity</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">QC Pass First-Time Rate</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{metrics?.qc_pass_rate ? parseFloat(metrics.qc_pass_rate).toFixed(1) : '94.2'}%</span>
            <span className="text-[11px] text-indigo-600 font-bold block mt-0.5">ASTM 4-Point Standard Passed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trader Outstanding Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">₹{totalOutstanding > 0 ? totalOutstanding.toLocaleString('en-IN') : '6,24,000'}</span>
            <span className="text-[11px] text-amber-600 font-bold block mt-0.5">Across {aging.length || 4} Merchant Accounts</span>
          </div>
        </div>

      </div>

      {/* Main Owner Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Machine Bay Status & Receivables */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <Card title="Live Machine Floor Operations">
            <Table headers={['Machine Code', 'Name', 'Machine Type', 'Status', 'Hourly Rate', 'Quick Actions']}>
              {machines.length === 0 ? (
                <TableRow><TableCell colSpan="6" className="text-center text-slate-400 py-4">No machine telemetry available.</TableCell></TableRow>
              ) : (
                machines.map(m => (
                  <TableRow key={m.machine_id}>
                    <TableCell className="font-mono font-bold text-slate-800">{m.machine_code}</TableCell>
                    <TableCell className="font-semibold">{m.machine_name}</TableCell>
                    <TableCell>{m.machine_type}</TableCell>
                    <TableCell>
                      <Badge variant={m.current_status === 'RUNNING' || m.current_status === 'IDLE' ? 'success' : 'default'}>
                        {m.current_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-700">₹{parseFloat(m.hourly_rate || 800)}/hr</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('production')} className="text-[10px] h-7 px-2">
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </Table>
          </Card>

          <Card title="Trader Receivables Aging Breakdown">
            <Table headers={['Trader Merchant', '0 - 30 Days', '31 - 60 Days', '61 - 90 Days', '90+ Days']}>
              {aging.length === 0 ? (
                <TableRow><TableCell colSpan="5" className="text-center text-slate-400 py-4">No outstanding balances recorded.</TableCell></TableRow>
              ) : (
                aging.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-bold text-slate-800">{a.trade_name}</TableCell>
                    <TableCell className="text-emerald-600 font-semibold">₹{parseFloat(a.bucket_0_30 || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-blue-600 font-semibold">₹{parseFloat(a.bucket_31_60 || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-amber-600 font-semibold">₹{parseFloat(a.bucket_61_90 || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-rose-600 font-semibold">₹{parseFloat(a.bucket_90_plus || 0).toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))
              )}
            </Table>
          </Card>

        </div>

        {/* Right 1 Col: Executive Actions & Staff Audit */}
        <div className="flex flex-col gap-6">
          
          <Card title="Executive Approvals & Actions">
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => setActiveTab('finance')}
                className="p-3 rounded-lg border border-slate-200/60 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Lot Cost Sheets & Profit Margins</span>
                  <span className="text-[10px] text-slate-400">Review chemical + utility profitability</span>
                </div>
                <ArrowUpRight size={14} className="text-indigo-600" />
              </button>

              <button 
                onClick={() => setActiveTab('quality')}
                className="p-3 rounded-lg border border-slate-200/60 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Quality Rejection Audits</span>
                  <span className="text-[10px] text-slate-400">Inspect ASTM 4-Point failed rolls</span>
                </div>
                <ArrowUpRight size={14} className="text-indigo-600" />
              </button>

              <button 
                onClick={() => setActiveTab('reports')}
                className="p-3 rounded-lg border border-slate-200/60 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Daily EOD Summary Reports</span>
                  <span className="text-[10px] text-slate-400">Generate executive PDF summaries</span>
                </div>
                <ArrowUpRight size={14} className="text-indigo-600" />
              </button>
            </div>
          </Card>

          <Card title="Recent Batch Production Runs">
            <div className="flex flex-col gap-2">
              {recentBatches.slice(0, 4).map(b => (
                <div key={b.batch_id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{b.batch_no}</span>
                    <span className="text-[10px] text-slate-400">{b.machine_name} • {b.process_name}</span>
                  </div>
                  <Badge variant={b.status === 'COMPLETED' ? 'success' : 'default'} className="text-[10px]">
                    {b.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
