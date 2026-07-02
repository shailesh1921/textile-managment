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
  const [salesOrders, setSalesOrders] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const summary = await api.get('/api/reports/summary');
        setMetrics(summary);
        
        const ords = await api.get('/api/sales/sales-orders');
        setSalesOrders(ords || []);
        
        const insps = await api.get('/api/quality/inspections');
        setInspections(insps || []);

        const stockInfo = await api.get('/api/inventory/stock-dashboard');
        setMaterials(stockInfo.stock || []);
      } catch (err) {
        console.error('Error fetching report diagnostics:', err.message);
      }
    };
    fetchReportData();
  }, []);

  const pieData = [
    { name: 'Passed Inspections', value: metrics?.qc_inspections ? Math.round((metrics.qc_pass_rate / 100) * metrics.qc_inspections) : 5 },
    { name: 'Failed / Rejected', value: metrics?.qc_inspections ? metrics.qc_inspections - Math.round((metrics.qc_pass_rate / 100) * metrics.qc_inspections) : 0 }
  ];

  const COLORS = ['#10b981', '#f43f5e'];

  const mockTimelineData = [
    { month: 'Jan', yield: 1200, sales: 264000 },
    { month: 'Feb', yield: 1900, sales: 418000 },
    { month: 'Mar', yield: 1700, sales: 374000 },
    { month: 'Apr', yield: 2400, sales: 528000 },
    { month: 'May', yield: 3100, sales: 682000 },
    { month: 'Jun', yield: 2800, sales: 616000 },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setReportTab('summary')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            reportTab === 'summary' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Performance Analytics
        </button>
        <button
          onClick={() => setReportTab('sheets')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all ${
            reportTab === 'sheets' ? 'border-emerald-600 text-emerald-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Export Data sheets
        </button>
      </div>

      {reportTab === 'summary' ? (
        <div className="flex flex-col gap-6">
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

          {/* Revenue line chart */}
          <Card title="Sales Growth Progression (MoM Revenue)">
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Invoiced Sales (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : (
        /* Sheets list tab */
        <div className="flex flex-col gap-6">
          <Card title="Active Invoiced Ledger Sheet">
            <div className="mt-4">
              <Table headers={['SO Ref', 'Customer Partner', 'Order Date', 'Tax GST (5%)', 'Net Payable', 'Status']}>
                {salesOrders.map((so) => (
                  <tr key={so.so_id}>
                    <td className="px-6 py-3 font-bold text-slate-800 text-xs">{so.so_number}</td>
                    <td className="px-6 py-3 font-semibold">{so.customer_name}</td>
                    <td className="px-6 py-3">{new Date(so.order_date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-slate-500">₹{parseFloat(so.tax_amount).toFixed(2)}</td>
                    <td className="px-6 py-3 font-bold">₹{parseFloat(so.net_amount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-3">
                      <Badge status={so.status}>{so.status}</Badge>
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          </Card>

          <Card title="Quality Control Inspection Logs">
            <div className="mt-4">
              <Table headers={['Inspection Ref', 'Work Order Number', 'Batch Number', 'Inspected Yards', 'Result', 'Audited Date']}>
                {inspections.map((ins) => (
                  <tr key={ins.inspection_id}>
                    <td className="px-6 py-3 font-mono font-bold text-slate-700 text-xs">{ins.inspection_number}</td>
                    <td className="px-6 py-3 font-semibold">{ins.wo_number || 'N/A'}</td>
                    <td className="px-6 py-3 font-mono text-xs">{ins.batch_number}</td>
                    <td className="px-6 py-3">{parseFloat(ins.quantity_inspected)} m</td>
                    <td className="px-6 py-3">
                      <Badge status={ins.result}>{ins.result}</Badge>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-400">
                      {new Date(ins.inspection_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
