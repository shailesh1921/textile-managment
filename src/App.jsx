import React, { useState, useEffect } from 'react';
import { api } from './lib/api';
import Login from './pages/Login';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Masters from './pages/masters/Masters';
import JobOrders from './pages/jobs/JobOrders';
import Production from './pages/production/Production';
import Quality from './pages/quality/Quality';
import Inventory from './pages/inventory/Inventory';
import Dispatch from './pages/dispatch/Dispatch';
import Finance from './pages/finance/Finance';
import Reports from './pages/reports/Reports';

const pages = { dashboard: Dashboard, masters: Masters, jobs: JobOrders, production: Production, quality: Quality, inventory: Inventory, dispatch: Dispatch, finance: Finance, reports: Reports };

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (api.getToken()) {
        try { setUser(await api.get('/api/auth/me')); } catch { api.logout(); }
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Login onLoginSuccess={setUser} />;
  const Page = pages[tab] || Dashboard;
  return <Layout activeTab={tab} setActiveTab={setTab}><Page /></Layout>;
}
