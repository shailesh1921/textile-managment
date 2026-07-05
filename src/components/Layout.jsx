import React from 'react';
import { LayoutDashboard, Users, ClipboardList, Activity, CheckSquare, Package, Truck, FileBarChart, LogOut, UserCheck, IndianRupee } from 'lucide-react';
import { api } from '../lib/api';

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'masters', name: 'Master Data', icon: Users },
  { id: 'jobs', name: 'Job Orders', icon: ClipboardList },
  { id: 'production', name: 'Shop Floor', icon: Activity },
  { id: 'quality', name: 'Quality Control', icon: CheckSquare },
  { id: 'inventory', name: 'Inventory', icon: Package },
  { id: 'dispatch', name: 'Dispatch & GST', icon: Truck },
  { id: 'finance', name: 'Finance & Billing', icon: IndianRupee },
  { id: 'reports', name: 'Reports', icon: FileBarChart },
];

export const Layout = ({ activeTab, setActiveTab, children }) => {
  const user = api.getUser();
  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0">
        <div className="px-6 py-5 border-b border-slate-800">
          <h1 className="font-bold text-white text-base">SK Dyeing & Finishing</h1>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">Surat Mill ERP</span>
        </div>
        <nav className="flex-1 px-4 py-4 flex flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${active ? 'bg-emerald-600/10 text-emerald-400 font-semibold' : 'hover:bg-slate-800'}`}>
                <Icon size={16} />{item.name}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-white mb-2">{user?.full_name} · {user?.role}</div>
          <button onClick={() => { api.logout(); window.location.reload(); }} className="text-rose-400 text-sm flex items-center gap-2"><LogOut size={14}/>Sign Out</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b px-6 flex items-center"><span className="font-semibold text-slate-700">{navigation.find(n => n.id === activeTab)?.name}</span></header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
