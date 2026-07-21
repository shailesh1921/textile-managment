import React, { useState, useEffect, lazy, Suspense } from 'react';
import { api } from './lib/api';
import Login from './pages/Login';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';

// Lazy Load secondary routes for optimal initial bundle performance
const Masters = lazy(() => import('./pages/masters/Masters'));
const JobOrders = lazy(() => import('./pages/jobs/JobOrders'));
const Production = lazy(() => import('./pages/production/Production'));
const Quality = lazy(() => import('./pages/quality/Quality'));
const Inventory = lazy(() => import('./pages/inventory/Inventory'));
const Dispatch = lazy(() => import('./pages/dispatch/Dispatch'));
const Finance = lazy(() => import('./pages/finance/Finance'));
const Reports = lazy(() => import('./pages/reports/Reports'));
const JobWork = lazy(() => import('./pages/jobwork/JobWork'));

import { OnboardingWizardModal } from './components/OnboardingWizardModal';

const pages = { 
  dashboard: Dashboard, 
  masters: Masters, 
  jobs: JobOrders, 
  production: Production, 
  jobwork: JobWork, 
  quality: Quality, 
  inventory: Inventory, 
  dispatch: Dispatch, 
  finance: Finance, 
  reports: Reports 
};

export default function App() {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    (async () => {
      if (api.getToken()) {
        try { 
          const userData = await api.get('/api/auth/me'); 
          setUser(userData);
          if (userData.tenant_id && !userData.onboarding_completed) {
            setIsOnboardingOpen(true);
          }
        } catch { 
          api.logout(); 
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleLoginSuccess = (userObj, tenantObj) => {
    setUser(userObj);
    if (tenantObj) {
      setTenant(tenantObj);
      if (!tenantObj.onboarding_completed) {
        setIsOnboardingOpen(true);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09060f] text-slate-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#ff5e36] border-t-transparent animate-spin" />
        <span className="text-sm font-medium">Loading Surat Textile ERP...</span>
      </div>
    </div>
  );

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />;

  const Page = pages[tab] || Dashboard;
  return (
    <Layout activeTab={tab} setActiveTab={setTab}>
      <Suspense fallback={
        <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2" />
          Loading module...
        </div>
      }>
        <Page />
      </Suspense>

      <OnboardingWizardModal 
        isOpen={isOnboardingOpen} 
        onComplete={() => setIsOnboardingOpen(false)} 
      />
    </Layout>
  );
}
