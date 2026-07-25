import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, ClipboardList, Activity, CheckSquare, 
  Package, Truck, FileBarChart, ArrowRightLeft, X, LogOut, Menu, Search, Bell, Settings, Globe
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from './ui';
import { BottomNav } from './BottomNav';

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'masters', name: 'Master Data', icon: Users },
  { id: 'jobs', name: 'Job Orders', icon: ClipboardList },
  { id: 'production', name: 'Production', icon: Activity },
  { id: 'jobwork', name: 'Job-Work Dispatches', icon: ArrowRightLeft },
  { id: 'quality', name: 'Quality Control', icon: CheckSquare },
  { id: 'inventory', name: 'Inventory', icon: Package },
  { id: 'dispatch', name: 'Dispatch & GST', icon: Truck },
  { id: 'finance', name: 'Finance', icon: FileBarChart },
  { id: 'reports', name: 'Reports', icon: FileBarChart },
];

export const Layout = ({ activeTab, setActiveTab, children }) => {
  const user = api.getUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-800 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Light Background, w-[220px] */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-100 bg-white shadow-sm transition-all duration-300 md:relative",
          isSidebarCollapsed ? "w-[72px]" : "w-[220px]",
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

        {/* Navigation Items (Icon + Label in Light Purple Background Pill) */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar bg-white">
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
                  "flex items-center gap-3 px-3 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 min-h-[44px] touch-manipulation",
                  active 
                    ? "bg-[#6B4EFF]/10 text-[#6B4EFF] rounded-[8px]" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-[8px]"
                )}
              >
                <Icon size={16} className={cn("shrink-0 stroke-[2px]", active ? "text-[#6B4EFF]" : "text-slate-400")} />
                {!isSidebarCollapsed && <span className="truncate uppercase">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Pinned Logout & Profile Info at Bottom */}
        <div className="border-t border-slate-50 p-4 shrink-0 bg-white">
          <div className={cn("flex items-center gap-2", isSidebarCollapsed ? "justify-center" : "")}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold shrink-0 border border-slate-200/50">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate overflow-hidden text-left">
                <span className="text-xs font-bold text-slate-800 truncate">{user?.full_name}</span>
                <span className="text-[10px] text-slate-400 font-semibold truncate uppercase mt-0.5">{user?.role}</span>
              </div>
            )}
          </div>
          <button 
            type="button"
            onClick={() => { api.logout(); window.location.reload(); }} 
            className={cn(
              "mt-3 flex w-full items-center gap-2.5 rounded-[8px] text-xs font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 px-3 py-2.5 transition-colors min-h-[44px] justify-start",
              isSidebarCollapsed ? "justify-center" : ""
            )}
            title="Sign Out"
          >
            <LogOut size={16} className="shrink-0 stroke-[2px]" />
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
          
          {/* Right alignment: Search, Locale, Settings, Profile */}
          <div className="flex items-center gap-3">
            
            {/* Search Input Bar */}
            <div className="relative hidden lg:block w-48 xl:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search index..."
                className="h-9 w-full rounded-[10px] border border-slate-200 bg-slate-50/50 pl-8 pr-4 text-xs shadow-xs transition-all focus:border-[#6B4EFF] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Locale Language Switcher */}
            <button 
              type="button"
              className="flex items-center gap-1.5 text-slate-500 hover:text-[#6B4EFF] transition-colors text-xs font-bold px-2.5 py-1.5 rounded-[8px] border border-slate-200/60 bg-slate-50 min-h-[36px]"
            >
              <Globe size={13} className="stroke-[2px]" />
              <span>EN / GU</span>
            </button>

            {/* Settings Button */}
            <button 
              type="button"
              className="text-slate-400 hover:text-slate-600 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-[8px] hover:bg-slate-50 transition-colors"
            >
              <Settings size={18} />
            </button>

            {/* User Profile Avatar details */}
            <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
              <div className="flex flex-col text-right hidden md:flex">
                <span className="text-xs font-bold text-slate-800 leading-tight">{user?.full_name}</span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">{user?.role}</span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6B4EFF]/10 text-[#6B4EFF] font-bold text-sm border border-[#6B4EFF]/20 shadow-xs shrink-0">
                {user?.full_name?.charAt(0) || 'U'}
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
