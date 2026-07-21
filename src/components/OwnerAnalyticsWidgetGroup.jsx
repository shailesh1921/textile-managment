import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, Table, Badge, Button } from './ui';
import { AlertTriangle, Clock, PieChart, TrendingUp, Truck } from 'lucide-react';

export function OwnerAnalyticsWidgetGroup() {
  const [lateOrders, setLateOrders] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [vendorTurnaround, setVendorTurnaround] = useState([]);
  const [productionVolume, setProductionVolume] = useState([]);
  const [volumePeriod, setVolumePeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [late, status, turnaround, volume] = await Promise.all([
          api.get('/api/v1/owner-analytics/late-orders').catch(() => []),
          api.get('/api/v1/owner-analytics/status-breakdown').catch(() => []),
          api.get('/api/v1/owner-analytics/job-work-turnaround').catch(() => []),
          api.get(`/api/v1/owner-analytics/production-volume?period=${volumePeriod}`).catch(() => [])
        ]);
        setLateOrders(late);
        setStatusBreakdown(status);
        setVendorTurnaround(turnaround);
        setProductionVolume(volume);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [volumePeriod]);

  return (
    <div className="flex flex-col gap-6 mt-6">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <TrendingUp className="text-primary" size={22} /> Executive Owner Analytics
        </h2>
        <span className="text-xs text-muted-foreground">Tenant-Isolated Mill Intelligence</span>
      </div>

      {/* Grid: 4 Target Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Widget 1: Late Orders */}
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> 1. Late Orders (Past Delivery Date)
            </h3>
            <Badge status={lateOrders.length > 0 ? "delayed" : "approved"}>
              {lateOrders.length} Late
            </Badge>
          </div>

          {lateOrders.length === 0 ? (
            <div className="text-xs text-muted-foreground py-6 text-center">
              All active job orders are on schedule. No overdue deliveries.
            </div>
          ) : (
            <Table
              headers={['Order #', 'Party', 'Fabric', 'Due Date', 'Days Overdue', 'Status']}
              rows={lateOrders.slice(0, 5).map(o => [
                o.job_order_no,
                o.party_name,
                o.fabric_name,
                new Date(o.required_delivery_date).toLocaleDateString('en-IN'),
                <span className="text-red-500 font-semibold">{o.days_late} days</span>,
                <Badge status="pending">{o.status}</Badge>
              ])}
            />
          )}
        </Card>

        {/* Widget 2: Order Status Breakdown */}
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <PieChart size={16} className="text-blue-500" /> 2. Order Status Breakdown
            </h3>
            <span className="text-xs text-muted-foreground">All Time Range</span>
          </div>

          <div className="grid grid-cols-3 gap-3 my-2">
            {['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'COMPLETED', 'PARTIALLY_DISPATCHED'].map(st => {
              const match = statusBreakdown.find(s => s.status === st);
              const count = match ? parseInt(match.count, 10) : 0;
              return (
                <div key={st} className="p-3 rounded-lg bg-muted/50 border flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">{st.replace('_', ' ')}</span>
                  <span className="text-xl font-bold text-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Widget 3: Job-Work Turnaround */}
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Truck size={16} className="text-purple-500" /> 3. External Job-Work Vendor Turnaround
            </h3>
            <span className="text-xs text-muted-foreground">Avg Days to Return</span>
          </div>

          {vendorTurnaround.length === 0 ? (
            <div className="text-xs text-muted-foreground py-6 text-center">
              No completed job-work vendor dispatches recorded.
            </div>
          ) : (
            <Table
              headers={['Vendor Unit', 'Total Orders', 'Avg Return Days', 'Performance']}
              rows={vendorTurnaround.slice(0, 5).map(v => [
                v.unit_name,
                v.total_orders,
                `${v.avg_turnaround_days} days`,
                <Badge status={parseFloat(v.avg_turnaround_days) > 7 ? "delayed" : "approved"}>
                  {parseFloat(v.avg_turnaround_days) > 7 ? 'Slow Vendor' : 'Fast Vendor'}
                </Badge>
              ])}
            />
          )}
        </Card>

        {/* Widget 4: Labor & Production Volume */}
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Clock size={16} className="text-emerald-500" /> 4. Production & Labor Volume
            </h3>
            <div className="flex gap-1">
              <Button size="xs" variant={volumePeriod === 'weekly' ? 'default' : 'outline'} onClick={() => setVolumePeriod('weekly')}>Weekly</Button>
              <Button size="xs" variant={volumePeriod === 'monthly' ? 'default' : 'outline'} onClick={() => setVolumePeriod('monthly')}>Monthly</Button>
            </div>
          </div>

          {productionVolume.length === 0 ? (
            <div className="text-xs text-muted-foreground py-6 text-center">
              No production entries recorded for selected period.
            </div>
          ) : (
            <Table
              headers={['Period', 'Total Output (Meters)', 'Total Output (Kg)', 'Operators']}
              rows={productionVolume.slice(0, 5).map(p => [
                p.period_label,
                `${parseFloat(p.total_output_meters).toLocaleString()} m`,
                `${parseFloat(p.total_output_kg).toLocaleString()} kg`,
                `${p.active_operators} active`
              ])}
            />
          )}
        </Card>

      </div>
    </div>
  );
}
