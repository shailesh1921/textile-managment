import React, { useState, useEffect } from 'react';
import { api } from './lib/api';
import Login from './pages/Login';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Procurement from './pages/procurement/Procurement';
import Inventory from './pages/inventory/Inventory';
import Production from './pages/production/Production';
import Quality from './pages/quality/Quality';
import Sales from './pages/sales/Sales';
import Reports from './pages/reports/Reports';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const userData = await api.get('/api/auth/me');
          setUser(userData);
        } catch (err) {
          console.warn('Session expired or token invalid');
          api.logout();
        }
      }
      setInitializing(false);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Initializing Systems...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'procurement' && <Procurement />}
      {activeTab === 'inventory' && <Inventory />}
      {activeTab === 'production' && <Production />}
      {activeTab === 'quality' && <Quality />}
      {activeTab === 'sales' && <Sales />}
      {activeTab === 'reports' && <Reports />}
    </Layout>
  );
}
