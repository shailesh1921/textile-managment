import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card, Table, Badge } from '../../components/ui';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';

export default function Reports() {
  const [reportTab, setReportTab] = useState('summary');
  const [metrics, setMetrics] = useState(null);
  const [dailyProd, setDailyProd] = useState([]);
  const [variance, setVariance] = useState([]);
  const [machineUtil, setMachineUtil] = useState([]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const summary = await api.get('/api/reports/summary');
        setMetrics(summary);
        
        const dp = await api.get('/api/reports/daily-production');
        setDailyProd(dp || []);
        
        const cv = await api.get('/api/reports/consumption-variance');
        setVariance(cv || []);

        const mu = await api.get('/api/reports/machine-utilization');
        setMachineUtil(mu || []);
      } catch (err) {
        console.error('Error fetching report diagnostics:', err.message);
      }
    };
    fetchReportData();
  }, [reportTab]);

  const pieData = [
    { name: 'Passed Rate %', value: metrics?.qc_pass_rate ? parseFloat(metrics.qc_pass_rate) : 92.5 },
    { name: 'Failed / Rejected %', value: metrics?.qc_pass_rate ? 100 - parseFloat(metrics.qc_pass_rate) : 7.5 }
  ];

  const COLORS = ['#10b981', '#f43f5e'];

  const mockTimelineData = [
    { month: 'Jan', yield: 12000, sales: 264000 },
    { month: 'Feb', yield: 19000, sales: 418000 },
    { month: 'Mar', yield: 17000, sales: 374000 },
    { month: 'Apr', yield: 24000, sales: 528000 },
    { month: 'May', yield: 31000, sales: 682000 },
    { month: 'Jun', yield: 28000, sales: 616000 },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'summary', label: 'Mill Performance Analytics' },
          { id: 'production', label: 'Daily Yield Feed' },
          { id: 'variance', label: 'Chemical Dispensing Variance' },
          { id: 'utilization', label: 'Machine Utilization' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setReportTab(t.id)}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
              reportTab === t.id ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary Tab */}
      {reportTab === 'summary' && (
        <div className="flex flex-col gap-6">
          {/* Key KPI summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-slate-900 border-slate-800 text-white">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Active Worklots</span>
              <span className="text-3xl font-black block mt-2 text-emerald-400">{metrics?.pending_job_orders || 0} Lots</span>
            </Card>
            <Card className="bg-slate-900 border-slate-800 text-white">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Machine Uptime</span>
              <span className="text-3xl font-black block mt-2 text-blue-400">{metrics?.active_machines || 0} / {metrics?.total_machines || 0} Running</span>
            </Card>
            <Card className="bg-slate-900 border-slate-800 text-white">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Quality Pass Rate</span>
              <span className="text-3xl font-black block mt-2 text-teal-400">{metrics?.qc_pass_rate || '100'}%</span>
            </Card>
            <Card className="bg-slate-900 border-slate-800 text-white">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Average Shrinkage</span>
              <span className="text-3xl font-black block mt-2 text-amber-400">{metrics?.avg_shrinkage_pct || '0.00'}%</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production Yardage Yield Month-on-Month */}
            <Card title="Monthly Production Yield Outcome (meters)">
              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="yield" stroke="#059669" strokeWidth={3} activeDot={{ r: 8 }} name="Yield (m)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Quality Pass Rate pie distribution */}
            <Card title="Quality Control Batch Distribution">
              <div className="h-72 w-full mt-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Production Tab */}
      {reportTab === 'production' && (
        <Card title="Daily Output Shift Logs">
          <Table headers={['Shift Date', 'Shift Code', 'Machine Name', 'Machine Type', 'Output Meters', 'Wastage / Loss %']}>
            {dailyProd.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                  No production output entries recorded. Log yields in Shop Floor first.
                </td>
              </tr>
            ) : (
              dailyProd.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50 text-xs">
                  <td className="px-6 py-3.5 font-semibold">{new Date(p.shift_date).toLocaleDateString()}</td>
                  <td className="px-6 py-3.5 font-bold"><Badge status="pending">{p.shift} Shift</Badge></td>
                  <td className="px-6 py-3.5 font-medium">{p.machine_name}</td>
                  <td className="px-6 py-3.5 text-slate-500">{p.machine_type}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-800">{parseFloat(p.output_meters)} m</td>
                  <td className="px-6 py-3.5 font-bold text-rose-600">{parseFloat(p.loss)}%</td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {/* Variance Tab */}
      {reportTab === 'variance' && (
        <Card title="Dye & Chemical Dispensing Variance Report (Recipe Standard vs Actual)">
          <Table headers={['Dye / Auxiliary Item', 'Standard Dosed (kg)', 'Actual Dispensed (kg)', 'Variance (kg)', 'Avg Variance %']}>
            {variance.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                  No dispensing logs generated. Run batches on machines to see cost variances.
                </td>
              </tr>
            ) : (
              variance.map((v, idx) => {
                const isOver = Math.abs(parseFloat(v.avg_variance_pct)) > 5;
                return (
                  <tr key={idx} className="hover:bg-slate-50 text-xs">
                    <td className="px-6 py-3.5 font-bold text-slate-800">{v.item_name}</td>
                    <td className="px-6 py-3.5 font-mono">{parseFloat(v.standard_qty).toFixed(2)} kg</td>
                    <td className="px-6 py-3.5 font-mono">{parseFloat(v.actual_qty).toFixed(2)} kg</td>
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-700">{parseFloat(v.variance_qty).toFixed(2)} kg</td>
                    <td className="px-6 py-3.5">
                      <span className={`font-black ${isOver ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' : 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded'}`}>
                        {parseFloat(v.avg_variance_pct).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </Table>
        </Card>
      )}

      {/* Machine Utilization Tab */}
      {reportTab === 'utilization' && (
        <Card title="Machine Shopfloor Utilization & Batch Frequency">
          <Table headers={['Machine Name', 'Type Category', 'Total Batch Runs', 'Status Changes logged', 'Current Status']}>
            {machineUtil.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-slate-400">
                  No machinery metrics recorded.
                </td>
              </tr>
            ) : (
              machineUtil.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50 text-xs font-semibold">
                  <td className="px-6 py-3.5 font-bold text-slate-800">{m.machine_name}</td>
                  <td className="px-6 py-3.5 text-slate-500">{m.machine_type}</td>
                  <td className="px-6 py-3.5 font-black text-slate-700">{m.batches} Batches</td>
                  <td className="px-6 py-3.5 font-mono">{m.status_changes} Logs</td>
                  <td className="px-6 py-3.5"><Badge status={m.current_status}>{m.current_status}</Badge></td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}
    </div>
  );
}
