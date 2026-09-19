import React, { useState, useEffect, lazy, Suspense } from 'react';
import { api } from './lib/api';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
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
const Procurement = lazy(() => import('./pages/procurement/Procurement'));
const Sales = lazy(() => import('./pages/sales/Sales'));
const StaffEntry = lazy(() => import('./pages/StaffEntry'));
const OwnerCockpit = lazy(() => import('./pages/OwnerCockpit'));
const MillProfile = lazy(() => import('./pages/settings/MillProfile'));
import { MillDigitalTwin } from './pages/production/MillDigitalTwin';
import { AIVisionQC } from './pages/quality/AIVisionQC';
import { WhatsAppGateway } from './pages/dispatch/WhatsAppGateway';
import { RecipeOptimizer } from './pages/production/RecipeOptimizer';
import { ESGSustainability } from './pages/reports/ESGSustainability';

import { OnboardingWizardModal } from './components/OnboardingWizardModal';

const pages = { 
  dashboard: Dashboard, 
  owner_cockpit: OwnerCockpit,
  staff_entry: StaffEntry,
  settings: MillProfile,
  digital_twin: MillDigitalTwin,
  ai_vision_qc: AIVisionQC,
  whatsapp_gateway: WhatsAppGateway,
  recipe_optimizer: RecipeOptimizer,
  esg_sustainability: ESGSustainability,
  masters: Masters, 
  jobs: JobOrders, 
  production: Production, 
  jobwork: JobWork, 
  quality: Quality, 
  inventory: Inventory, 
  procurement: Procurement,
  dispatch: Dispatch, 
  sales: Sales,
  finance: Finance, 
  reports: Reports 
};

export default function App() {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [demoLoading, setDemoLoading] = useState(false);

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
    setShowLogin(false);
    if (tenantObj) {
      setTenant(tenantObj);
      if (!tenantObj.onboarding_completed) {
        setIsOnboardingOpen(true);
      }
    }
  };

  // 1-Click Demo: auto-login with demo credentials
  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const data = await api.post('/api/auth/login', { username: 'admin', password: 'admin123' });
      api.setToken(data.access_token);
      api.setUser(data.user);
      handleLoginSuccess(data.user, data.tenant);
    } catch {
      // Fallback: if demo login fails, show the login page
      setShowLogin(true);
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading || demoLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F1F7] text-slate-700">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm font-semibold tracking-wide text-slate-600">
          {demoLoading ? 'Launching Interactive Demo...' : 'Loading Surat Textile ERP...'}
        </span>
      </div>
    </div>
  );

  if (!user) {
    // Show Login page if user clicked "Sign In" or "Register", otherwise show Landing Page
    if (showLogin) {
      return (
        <Login 
          initialTab={authMode}
          onLoginSuccess={handleLoginSuccess} 
          onBack={() => setShowLogin(false)} 
        />
      );
    }
    return (
      <LandingPage 
        onSignIn={() => { setAuthMode('signin'); setShowLogin(true); }} 
        onRegister={() => { setAuthMode('signup'); setShowLogin(true); }}
        onDemo={handleDemoLogin} 
      />
    );
  }

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
