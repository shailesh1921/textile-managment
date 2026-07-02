import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Activity, 
  CheckSquare, 
  TrendingUp, 
  FileBarChart, 
  LogOut,
  UserCheck
} from 'lucide-react';
import { api } from '../lib/api';

export const Layout = ({ activeTab, setActiveTab, children }) => {
  const user = api.getUser();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'procurement', name: 'Procurement', icon: ShoppingCart },
    { id: 'inventory', name: 'Inventory', icon: Package },
    { id: 'production', name: 'Production', icon: Activity },
    { id: 'quality', name: 'Quality Control', icon: CheckSquare },
    { id: 'sales', name: 'Sales & Orders', icon: TrendingUp },
    { id: 'reports', name: 'Analytics & Reports', icon: FileBarChart },
  ];

  const handleLogout = () => {
    api.logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Dark Sidebar Tech Aesthetic */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Sarv Uttam ERP</h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Enterprise Suite</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-emerald-600/10 text-emerald-400 border-l-4 border-emerald-500 font-semibold' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/40 rounded-lg">
            <UserCheck size={18} className="text-emerald-400" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'System User'}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{user?.role || 'Guest'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/20 transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* White Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1 rounded">
              Current Zone
            </span>
            <span className="text-sm font-bold text-slate-700">
              {navigation.find((n) => n.id === activeTab)?.name || 'ERP Console'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-xs text-slate-400 font-medium">Enterprise Portal</span>
              <span className="text-xs font-bold text-slate-600">Sarv Uttam Fabrics Pvt. Ltd.</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
              {user?.username ? user.username[0].toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
