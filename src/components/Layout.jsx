import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, ClipboardList, Activity, CheckSquare, 
  Package, Truck, FileBarChart, LogOut, Search, Bell, Menu, X 
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from './ui';

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'masters', name: 'Master Data', icon: Users },
  { id: 'jobs', name: 'Job Orders', icon: ClipboardList },
  { id: 'production', name: 'Production', icon: Activity },
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
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card shadow-sm transition-all duration-300 md:relative",
          isSidebarCollapsed ? "w-[72px]" : "w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold shrink-0">
              SK
            </div>
            {!isSidebarCollapsed && (
              <span className="font-bold text-sm truncate whitespace-nowrap">SK Dyeing & Finishing</span>
            )}
          </div>
          {/* Mobile close button */}
          <button className="md:hidden text-muted-foreground" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1 custom-scrollbar">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                title={isSidebarCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active 
                    ? "bg-primary/10 text-primary border-r-2 border-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-r-2 border-transparent"
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-3 shrink-0">
          <div className={cn("flex items-center gap-3", isSidebarCollapsed ? "justify-center" : "")}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold shrink-0">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate overflow-hidden">
                <span className="text-sm font-semibold truncate">{user?.full_name}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.role}</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => { api.logout(); window.location.reload(); }} 
            className={cn(
              "mt-3 flex w-full items-center gap-2 rounded-md text-sm text-destructive hover:bg-destructive/10 px-2 py-1.5 transition-colors",
              isSidebarCollapsed ? "justify-center" : ""
            )}
            title="Sign Out"
          >
            <LogOut size={16} className="shrink-0" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="text-muted-foreground md:hidden" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <button 
              className="hidden text-muted-foreground md:block" 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold tracking-tight hidden sm:block">
              {navigation.find(n => n.id === activeTab)?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search batches, orders..."
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={20} />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive border border-background"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
