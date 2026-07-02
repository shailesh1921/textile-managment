import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, Badge } from '../components/ui';
import { 
  TrendingUp, 
  ShoppingCart, 
  Activity, 
  Cpu, 
  MessageSquare,
  RefreshCw,
  BellRing
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [commLogs, setCommLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const summary = await api.get('/api/reports/summary');
      setMetrics(summary);
      
      const stockInfo = await api.get('/api/inventory/stock-dashboard');
      setAlerts(stockInfo.alerts || []);
      
      const logs = await api.get('/api/communication-logs');
      setCommLogs(logs || []);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const dummyChartData = [
    { name: 'Jan', revenue: 4000, costs: 2400 },
    { name: 'Feb', revenue: 3000, costs: 1398 },
    { name: 'Mar', revenue: 2000, costs: 9800 },
    { name: 'Apr', revenue: 2780, costs: 3908 },
    { name: 'May', revenue: 1890, costs: 4800 },
    { name: 'Jun', revenue: 2390, costs: 3800 },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Upper header action area */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sarv Uttam Operations Center</h2>
          <p className="text-slate-500 text-sm mt-0.5">Real-time indicators and telemetry logs.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 bg-white text-slate-600 hover:text-slate-800 px-3 py-1.5 border border-slate-200 rounded-lg text-sm transition-all font-semibold shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sales Revenue</span>
              <span className="text-2xl font-black text-slate-800">
                ₹{metrics?.sales_revenue ? metrics.sales_revenue.toLocaleString('en-IN') : '0'}
              </span>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg border border-emerald-100">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-3 flex items-center gap-1">
            <span>+12.4%</span>
            <span className="text-slate-400 font-normal">from last month</span>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Procurement Costs</span>
              <span className="text-2xl font-black text-slate-800">
                ₹{metrics?.purchase_costs ? metrics.purchase_costs.toLocaleString('en-IN') : '0'}
              </span>
            </div>
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg border border-blue-100">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-3 flex items-center gap-1">
            <span>Net Procurement Expenses</span>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Runs</span>
              <span className="text-2xl font-black text-slate-800">
                {metrics?.active_work_orders || '0'} / {metrics?.active_machines || '0'}
              </span>
            </div>
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-lg border border-indigo-100">
              <Activity size={20} />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-3 flex items-center gap-1">
            <span>Work Orders & Machines running</span>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">QC Pass Rate</span>
              <span className="text-2xl font-black text-slate-800">
                {metrics?.qc_pass_rate || '100'}%
              </span>
            </div>
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg border border-amber-100">
              <Cpu size={20} />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-semibold mt-3 flex items-center gap-1">
            <span>{metrics?.qc_inspections || '0'} batch inspections completed</span>
          </div>
        </Card>
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main business flow chart */}
        <div className="lg:col-span-2">
          <Card title="Sales Revenue vs. Procurement Costs">
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dummyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Bar dataKey="revenue" fill="#10b981" name="Sales (₹)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costs" fill="#3b82f6" name="Purchases (₹)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card title="Inventory Reorder Warnings" headerActions={<BellRing className="text-slate-400" size={18} />}>
            <div className="flex flex-col gap-4 mt-2 max-h-[310px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  ✓ All stock levels exceed safety parameters.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.alert_id} className="p-3 border border-amber-100 bg-amber-50/50 rounded-lg flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-800 text-sm">{alert.material_name}</span>
                      <Badge status="critical">{alert.priority}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Stock: <strong className="text-rose-600">{parseFloat(alert.current_stock)}</strong> / {parseFloat(alert.reorder_level)}</span>
                      <span>Code: {alert.material_code}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Communications Gateway Feed */}
      <Card title="Live WhatsApp Gateway Logs">
        <div className="flex flex-col gap-4 mt-2">
          {/* Status banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">Twilio API Gateway Active</span>
                <span className="text-xs text-slate-400">Serving automatic notifications directly to Surat fabric traders</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {process.env.TWILLIO_ACCOUNT_SID ? 'PRODUCTION MODE' : 'SIMULATION MODE ACTIVE'}
            </div>
          </div>

          {/* Logs feed table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Trader / Customer</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Message Content</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                  {commLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                        No WhatsApp logs recorded yet. Create orders or complete batches to fire triggers.
                      </td>
                    </tr>
                  ) : (
                    commLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3.5 text-xs text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-800">
                          {log.customer_name || 'System Auto'}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs">
                          {log.recipient.replace('whatsapp:', '')}
                        </td>
                        <td className="px-6 py-3.5 text-xs max-w-sm truncate" title={log.message}>
                          {log.message}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge status={log.status}>{log.status}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
