import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, ClipboardList, Activity, CheckSquare, 
  Package, Truck, FileBarChart, ArrowRightLeft, X, LogOut, Menu, Search, Bell, Settings, Globe,
  ShoppingCart, TrendingUp, Crown, UserCheck, ShieldCheck, ChevronDown, Check
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from './ui';
import { BottomNav } from './BottomNav';

const navigation = [
  { id: 'owner_cockpit', name: '👑 Owner Cockpit', icon: Crown, highlight: true },
  { id: 'dashboard', name: '⚙️ Admin Dashboard', icon: LayoutDashboard },
  { id: 'staff_entry', name: '👷‍♂️ Staff Data Entry', icon: UserCheck, highlight: true },
  { id: 'masters', name: 'Master Data', icon: Users },
  { id: 'jobs', name: 'Job Orders', icon: ClipboardList },
  { id: 'production', name: 'Production', icon: Activity },
  { id: 'jobwork', name: 'Job-Work Dispatches', icon: ArrowRightLeft },
  { id: 'quality', name: 'Quality Control', icon: CheckSquare },
  { id: 'inventory', name: 'Inventory', icon: Package },
  { id: 'procurement', name: 'Procurement', icon: ShoppingCart },
  { id: 'dispatch', name: 'Dispatch & GST', icon: Truck },
  { id: 'sales', name: 'Sales', icon: TrendingUp },
  { id: 'finance', name: 'Finance', icon: FileBarChart },
  { id: 'reports', name: 'Reports', icon: FileBarChart },
];

export const Layout = ({ activeTab, setActiveTab, children }) => {
  const user = api.getUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [activeRole, setActiveRole] = useState('ADMIN'); // 'OWNER' | 'ADMIN' | 'STAFF'

  const handleSwitchRole = (role) => {
    setActiveRole(role);
    setIsRoleDropdownOpen(false);
    if (role === 'OWNER') setActiveTab('owner_cockpit');
    else if (role === 'STAFF') setActiveTab('staff_entry');
    else setActiveTab('dashboard');
  };

  const getRoleLabel = () => {
    switch (activeRole) {
      case 'OWNER': return { title: 'Mill Owner (Myself)', sub: 'EXECUTIVE OVERVIEW', icon: Crown, color: 'bg-amber-500 text-white' };
      case 'STAFF': return { title: 'Floor Staff', sub: 'DATA ENTRY OPERATOR', icon: UserCheck, color: 'bg-emerald-600 text-white' };
      default: return { title: 'Mill Administrator', sub: 'FULL ADMIN CONTROL', icon: ShieldCheck, color: 'bg-[#6B4EFF] text-white' };
    }
  };

  const currentRole = getRoleLabel();

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-800 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Light Background, w-[230px] */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-100 bg-white shadow-sm transition-all duration-300 md:relative",
          isSidebarCollapsed ? "w-[72px]" : "w-[230px]",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand / Logo */}
        <div className="flex h-14 items-center justify-between border-b border-slate-50 px-4 shrink-0 bg-white">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#6B4EFF] text-white font-extrabold shadow-sm shrink-0">
              S
            </div>
            {!isSidebarCollapsed && (
              <span className="font-extrabold text-sm text-slate-800 tracking-wide truncate">Sarv Uttam Mill</span>
            )}
          </div>
          {/* Mobile close button */}
          <button 
            type="button"
            className="md:hidden text-slate-400 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-slate-600" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items (Icon + Label) */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1 custom-scrollbar bg-white">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button 
                type="button"
                key={item.id} 
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                title={isSidebarCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-200 min-h-[40px] touch-manipulation",
                  active 
                    ? "bg-[#6B4EFF]/10 text-[#6B4EFF] rounded-[8px] font-bold" 
                    : item.highlight 
                      ? "text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-[8px] border border-slate-200/50"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-[8px]"
                )}
              >
                <Icon size={16} className={cn("shrink-0 stroke-[2px]", active ? "text-[#6B4EFF]" : "text-slate-400")} />
                {!isSidebarCollapsed && <span className="truncate uppercase">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Pinned Role Switcher & Profile Info at Bottom */}
        <div className="border-t border-slate-100 p-3 shrink-0 bg-slate-50/50 relative">
          
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className={cn(
              "w-full flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 bg-white hover:border-[#6B4EFF] transition-all text-left shadow-xs",
              isSidebarCollapsed ? "justify-center" : "justify-between"
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg font-bold shrink-0 text-xs", currentRole.color)}>
                <currentRole.icon size={15} />
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col truncate overflow-hidden">
                  <span className="text-xs font-bold text-slate-800 truncate">{currentRole.title}</span>
                  <span className="text-[9px] text-slate-400 font-semibold truncate tracking-wider uppercase">{currentRole.sub}</span>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && <ChevronDown size={14} className="text-slate-400 shrink-0" />}
          </button>

          {/* Role Switcher Menu Popup */}
          {isRoleDropdownOpen && (
            <div className="absolute bottom-16 left-3 right-3 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1">Switch Active Workspace</span>
              
              <button 
                onClick={() => handleSwitchRole('OWNER')}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg text-xs font-bold text-left transition-all",
                  activeRole === 'OWNER' ? "bg-amber-50 text-amber-900 border border-amber-200" : "hover:bg-slate-50 text-slate-700"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-500 text-white flex items-center justify-center text-xs"><Crown size={12} /></div>
                  <div>
                    <span className="block font-bold">👑 Mill Owner (Myself)</span>
                    <span className="text-[9px] text-slate-400 font-normal">Executive P&L, profit margins & audit</span>
                  </div>
                </div>
                {activeRole === 'OWNER' && <Check size={14} className="text-amber-600" />}
              </button>

              <button 
                onClick={() => handleSwitchRole('ADMIN')}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg text-xs font-bold text-left transition-all",
                  activeRole === 'ADMIN' ? "bg-indigo-50 text-indigo-900 border border-indigo-200" : "hover:bg-slate-50 text-slate-700"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#6B4EFF] text-white flex items-center justify-center text-xs"><ShieldCheck size={12} /></div>
                  <div>
                    <span className="block font-bold">⚙️ Mill Administrator</span>
                    <span className="text-[9px] text-slate-400 font-normal">All masters, billing, settings & full data</span>
                  </div>
                </div>
                {activeRole === 'ADMIN' && <Check size={14} className="text-[#6B4EFF]" />}
              </button>

              <button 
                onClick={() => handleSwitchRole('STAFF')}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg text-xs font-bold text-left transition-all",
                  activeRole === 'STAFF' ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "hover:bg-slate-50 text-slate-700"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center text-xs"><UserCheck size={12} /></div>
                  <div>
                    <span className="block font-bold">👷‍♂️ Floor Staff</span>
                    <span className="text-[9px] text-slate-400 font-normal">Add inwards, batch runs, QC & packing</span>
                  </div>
                </div>
                {activeRole === 'STAFF' && <Check size={14} className="text-emerald-600" />}
              </button>
            </div>
          )}

          <button 
            type="button"
            onClick={() => { api.logout(); window.location.reload(); }} 
            className={cn(
              "mt-2 flex w-full items-center gap-2 rounded-[8px] text-[11px] font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 p-2 transition-colors justify-start",
              isSidebarCollapsed ? "justify-center" : ""
            )}
            title="Sign Out"
          >
            <LogOut size={14} className="shrink-0 stroke-[2px]" />
            {!isSidebarCollapsed && <span>SIGN OUT</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-slate-50/50">
        
        {/* Top Navbar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4 lg:px-6 shrink-0 shadow-xs">
          
          {/* Left alignment: Menu Toggle + Section Title */}
          <div className="flex items-center gap-4">
            <button 
              type="button"
              className="text-slate-500 hover:text-slate-800 md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <button 
              type="button"
              className="hidden text-slate-400 hover:text-slate-600 md:block p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 tracking-wider uppercase hidden sm:inline-block">SARV UTTAM</span>
              <span className="text-slate-300 font-normal hidden sm:inline-block">/</span>
              <h1 className="text-sm font-bold text-[#6B4EFF]">
                {navigation.find(n => n.id === activeTab)?.name || 'DASHBOARD'}
              </h1>
            </div>
          </div>
          
          {/* Right alignment: Quick Role Pills, Search, Locale, Profile */}
          <div className="flex items-center gap-3">
            
            {/* 3 Top Role Quick Switcher Buttons */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60 gap-1">
              <button
                onClick={() => handleSwitchRole('OWNER')}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                  activeRole === 'OWNER' ? "bg-amber-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                👑 Myself (Owner)
              </button>
              <button
                onClick={() => handleSwitchRole('ADMIN')}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                  activeRole === 'ADMIN' ? "bg-[#6B4EFF] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                ⚙️ Mill Admin
              </button>
              <button
                onClick={() => handleSwitchRole('STAFF')}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                  activeRole === 'STAFF' ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                👷‍♂️ Staff Entry
              </button>
            </div>

            {/* Locale Language Switcher */}
            <button 
              type="button"
              className="flex items-center gap-1.5 text-slate-500 hover:text-[#6B4EFF] transition-colors text-xs font-bold px-2.5 py-1.5 rounded-[8px] border border-slate-200/60 bg-slate-50 min-h-[36px]"
            >
              <Globe size={13} className="stroke-[2px]" />
              <span>EN / GU</span>
            </button>

            {/* Interactive User Profile / Role Badge */}
            <div 
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 border-l border-slate-100 pl-3 cursor-pointer select-none"
            >
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-slate-800 leading-tight">{currentRole.title}</span>
                <span className="text-[9px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">{currentRole.sub}</span>
              </div>
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg font-bold text-sm shadow-xs shrink-0 transition-transform active:scale-95", currentRole.color)}>
                <currentRole.icon size={16} />
              </div>
            </div>

          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar pb-24 md:pb-6 bg-[#F3F1F7]/40">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};
