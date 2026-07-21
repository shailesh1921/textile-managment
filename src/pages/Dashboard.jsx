import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, Badge, Button } from '../components/ui';
import { 
  TrendingUp, Package, Activity, AlertTriangle, MessageSquare, RefreshCw, 
  ArrowRight, CheckCircle2, Clock, CheckCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { MarketDataWidget } from '../components/MarketDataWidget';
import { ClientPortalModal } from '../components/ClientPortalModal';
import { OwnerAnalyticsWidgetGroup } from '../components/OwnerAnalyticsWidgetGroup';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [dailyProd, setDailyProd] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summary, prod, stockInfo] = await Promise.all([
        api.get('/api/reports/summary'),
        api.get('/api/reports/daily-production'),
        api.get('/api/v1/inventory/stock-dashboard')
      ]);
      setMetrics(summary);
      // Format daily production for chart
      const chartData = (prod || []).slice(0, 14).map(p => ({
        date: p.shift_date.substring(5, 10), // MM-DD
        meters: parseFloat(p.output_meters)
      })).reverse();
      setDailyProd(chartData);
      setAlerts(stockInfo.alerts || []);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const pipelineStages = [
    { name: 'Grey Fabric', count: 12, status: 'completed' },
    { name: 'Dyeing', count: metrics?.active_machines || 5, status: 'active' },
    { name: 'Finishing', count: 3, status: 'pending' },
    { name: 'QC', count: 8, status: 'pending' },
    { name: 'Dispatch', count: 2, status: 'pending' },
  ];

  const recentActivity = [
    { id: 1, message: 'Batch BAT-1024 completed dyeing', time: '10 mins ago', type: 'success' },
    { id: 2, message: 'QC Failed for Lot SKD-RP-120', time: '1 hour ago', type: 'error' },
    { id: 3, message: 'New Job Order received from Om Fabrics', time: '2 hours ago', type: 'info' },
    { id: 4, message: 'Machine Jet-1 under maintenance', type: 'warning' },
  ];

  const dyeUsageData = [
    { name: 'Reactive Red', value: 400, color: '#ef4444' },
    { name: 'Disperse Blue', value: 300, color: '#3b82f6' },
    { name: 'Vat Yellow', value: 300, color: '#eab308' },
    { name: 'Direct Black', value: 200, color: '#1f2937' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground text-sm">Real-time indicators, market index & factory telemetry.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsClientPortalOpen(true)} className="gap-2">
            Client Order Tracker (OTP)
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading} className="gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Market Data Commodity Index Widget */}
      <MarketDataWidget />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 flex flex-col gap-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-sm font-medium">Today's Production</span>
            <Activity size={16} />
          </div>
          <span className="text-2xl font-bold mt-2">
            {metrics ? (12500).toLocaleString('en-IN') : '0'} <span className="text-sm font-normal text-muted-foreground">m</span>
          </span>
          <span className="text-xs text-emerald-600 font-medium flex items-center mt-1">
            <TrendingUp size={12} className="mr-1" /> +12% from yesterday
          </span>
        </Card>

        <Card className="p-6 flex flex-col gap-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-sm font-medium">Active Batches</span>
            <RefreshCw size={16} />
          </div>
          <span className="text-2xl font-bold mt-2">
            {metrics?.active_machines || '0'}
          </span>
          <span className="text-xs text-muted-foreground mt-1">Across 8 machines</span>
        </Card>

        <Card className="p-6 flex flex-col gap-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-sm font-medium">Pending Orders</span>
            <Package size={16} />
          </div>
          <span className="text-2xl font-bold mt-2">
            {metrics?.pending_job_orders || '0'}
          </span>
          <span className="text-xs text-muted-foreground mt-1">Requiring fulfillment</span>
        </Card>

        <Card className="p-6 flex flex-col gap-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-sm font-medium">Dye Stock Alerts</span>
            <AlertTriangle size={16} className={alerts.length > 0 ? "text-amber-500" : ""} />
          </div>
          <span className="text-2xl font-bold mt-2 text-amber-600">
            {alerts.length}
          </span>
          <span className="text-xs text-muted-foreground mt-1">Items below safety level</span>
        </Card>
      </div>

      {/* Pipeline Visual */}
      <Card title="Production Pipeline" className="bg-card/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-2">
          {pipelineStages.map((stage, idx) => (
            <React.Fragment key={stage.name}>
              <div className="flex flex-col items-center gap-2 flex-1 w-full relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 bg-background transition-colors ${
                  stage.status === 'completed' ? 'border-primary text-primary' : 
                  stage.status === 'active' ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 
                  'border-muted text-muted-foreground'
                }`}>
                  <span className="font-bold">{stage.count}</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stage.name}</span>
              </div>
              {idx < pipelineStages.length - 1 && (
                <div className="hidden md:block h-[2px] flex-1 bg-border relative -top-3">
                  <div className={`absolute inset-0 transition-all ${
                    stage.status === 'completed' ? 'bg-primary' : 'bg-transparent'
                  }`} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart */}
        <Card title="Output Trend (14 Days)" className="lg:col-span-2 flex flex-col">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyProd.length ? dailyProd : [{date: '01', meters: 0}, {date: '02', meters: 1000}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="meters" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activity & Donut */}
        <div className="flex flex-col gap-6">
          <Card title="Dye Consumption" className="flex-1">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dyeUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dyeUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-muted-foreground mt-2">
              {dyeUsageData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                  {d.name}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Activity Feed" className="flex-1">
            <div className="flex flex-col gap-4 mt-2">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-1.5 ${
                    activity.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    activity.type === 'error' ? 'bg-rose-100 text-rose-600' :
                    activity.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.type === 'success' ? <CheckCircle size={14} /> :
                     activity.type === 'error' ? <AlertTriangle size={14} /> :
                     activity.type === 'warning' ? <Clock size={14} /> :
                     <MessageSquare size={14} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Phase 5 Owner Analytics Widgets */}
      <OwnerAnalyticsWidgetGroup />

      <ClientPortalModal isOpen={isClientPortalOpen} onClose={() => setIsClientPortalOpen(false)} />
    </div>
  );
}
