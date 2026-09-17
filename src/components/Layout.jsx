import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, ClipboardList, Activity, CheckSquare, 
  Package, Truck, FileBarChart, ArrowRightLeft, X, LogOut, Menu, Search, Bell, Settings, Globe,
  ShoppingCart, TrendingUp, Crown, UserCheck, ShieldCheck, ChevronDown, Check, Languages, Mic, Sparkles,
  Gauge, FlaskConical, Eye, MessageSquare, Leaf
} from 'lucide-react';
import { api } from '../lib/api';
import { cn } from './ui';
import { BottomNav } from './BottomNav';
import { useLanguage } from '../context/LanguageContext';
import { AIVoiceCopilotModal } from './AIVoiceCopilotModal';

export const Layout = ({ activeTab, setActiveTab, children }) => {
  const user = api.getUser();
  const { lang, setLang, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isVoiceCopilotOpen, setIsVoiceCopilotOpen] = useState(false);
  const [activeRole, setActiveRole] = useState('ADMIN'); // 'OWNER' | 'ADMIN' | 'STAFF'

  const navigation = [
    { id: 'owner_cockpit', name: t('nav_owner_cockpit'), icon: Crown, highlight: true },
    { id: 'dashboard', name: t('nav_admin_dashboard'), icon: LayoutDashboard },
    { id: 'staff_entry', name: t('nav_staff_entry'), icon: UserCheck, highlight: true },
    { id: 'digital_twin', name: 'Mill Digital Twin', icon: Gauge, badge: 'LIVE' },
    { id: 'recipe_optimizer', name: 'AI Recipe Lab', icon: FlaskConical },
    { id: 'ai_vision_qc', name: 'AI Defect Vision', icon: Eye },
    { id: 'whatsapp_gateway', name: 'WhatsApp Bot', icon: MessageSquare },
    { id: 'esg_sustainability', name: 'ESG Green Mill', icon: Leaf },
    { id: 'masters', name: t('nav_masters'), icon: Users },
    { id: 'jobs', name: t('nav_jobs'), icon: ClipboardList },
    { id: 'production', name: t('nav_production'), icon: Activity },
    { id: 'jobwork', name: t('nav_jobwork'), icon: ArrowRightLeft },
    { id: 'quality', name: t('nav_quality'), icon: CheckSquare },
    { id: 'inventory', name: t('nav_inventory'), icon: Package },
    { id: 'procurement', name: t('nav_procurement'), icon: ShoppingCart },
    { id: 'dispatch', name: t('nav_dispatch'), icon: Truck },
    { id: 'sales', name: t('nav_sales'), icon: TrendingUp },
    { id: 'finance', name: t('nav_finance'), icon: FileBarChart },
    { id: 'reports', name: t('nav_reports'), icon: FileBarChart },
  ];

  const handleSwitchRole = (role) => {
    setActiveRole(role);
    setIsRoleDropdownOpen(false);
    if (role === 'OWNER') setActiveTab('owner_cockpit');
    else if (role === 'STAFF') setActiveTab('staff_entry');
    else setActiveTab('dashboard');
  };

  const getRoleLabel = () => {
    switch (activeRole) {
      case 'OWNER': return { title: t('owner_title'), sub: t('owner_sub'), icon: Crown, color: 'bg-amber-500 text-white' };
      case 'STAFF': return { title: t('staff_title'), sub: t('staff_sub'), icon: UserCheck, color: 'bg-emerald-600 text-white' };
      default: return { title: t('admin_title'), sub: t('admin_sub'), icon: ShieldCheck, color: 'bg-[#6B4EFF] text-white' };
    }
  };

  const currentRole = getRoleLabel();

  const getLangBadge = () => {
    if (lang === 'hi') return 'HI (हिंदी)';
    if (lang === 'gu') return 'GU (ગુજરાતી)';
    return 'EN (English)';
  };

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-800 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
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
              <span className="font-extrabold text-sm text-slate-800 tracking-wide truncate">{t('mill_title')}</span>
            )}
          </div>
          <button 
            type="button"
            className="md:hidden text-slate-400 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:text-slate-600" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
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
                  "flex items-center gap-3 px-3 py-2 text-xs font-semibold tracking-wide transition-all duration-200 min-h-[40px] touch-manipulation text-left",
                  active 
                    ? "bg-[#6B4EFF]/10 text-[#6B4EFF] rounded-[8px] font-bold" 
                    : item.highlight 
                      ? "text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-[8px] border border-slate-200/50"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-[8px]"
                )}
              >
                <Icon size={16} className={cn("shrink-0 stroke-[2px]", active ? "text-[#6B4EFF]" : "text-slate-400")} />
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Pinned Role Switcher & Profile Info at Bottom */}
        <div className="border-t border-slate-100 p-3 shrink-0 bg-slate-50/50 relative">
          
          <button
            type="button"
            onClick={() => { setIsRoleDropdownOpen(!isRoleDropdownOpen); setIsLangDropdownOpen(false); }}
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
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1">{t('active_workspace')}</span>
              
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
                    <span className="block font-bold">{t('owner_title')}</span>
                    <span className="text-[9px] text-slate-400 font-normal">{t('owner_desc')}</span>
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
                    <span className="block font-bold">{t('admin_title')}</span>
                    <span className="text-[9px] text-slate-400 font-normal">{t('admin_desc')}</span>
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
                    <span className="block font-bold">{t('staff_title')}</span>
                    <span className="text-[9px] text-slate-400 font-normal">{t('staff_desc')}</span>
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
            title={t('sign_out')}
          >
            <LogOut size={14} className="shrink-0 stroke-[2px]" />
            {!isSidebarCollapsed && <span>{t('sign_out')}</span>}
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
          
          {/* Right alignment: AI Voice Copilot, Quick Role Pills, Language Switcher, Profile */}
          <div className="flex items-center gap-3">
            
            {/* AI Voice Copilot Button */}
            <button
              type="button"
              onClick={() => setIsVoiceCopilotOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#6B4EFF] to-[#4F46E5] hover:from-[#583CE0] hover:to-[#4338CA] text-white text-xs font-bold rounded-lg shadow-xs hover:shadow transition-all group active:scale-95"
              title="VastraAI Voice Copilot (वस्त्र-AI / વસ્ત્ર-AI)"
            >
              <Sparkles size={13} className="text-amber-300 animate-pulse" />
              <span className="hidden sm:inline font-extrabold">VastraAI</span>
              <Mic size={13} className="text-white/90" />
            </button>

            {/* 3 Top Role Quick Switcher Buttons */}
            <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60 gap-1">
              <button
                onClick={() => handleSwitchRole('OWNER')}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                  activeRole === 'OWNER' ? "bg-amber-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {t('owner_myself')}
              </button>
              <button
                onClick={() => handleSwitchRole('ADMIN')}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                  activeRole === 'ADMIN' ? "bg-[#6B4EFF] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {t('admin_role')}
              </button>
              <button
                onClick={() => handleSwitchRole('STAFF')}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                  activeRole === 'STAFF' ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {t('staff_role')}
              </button>
            </div>

            {/* Interactive Language Switcher Dropdown (English / Hindi / Gujarati) */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => { setIsLangDropdownOpen(!isLangDropdownOpen); setIsRoleDropdownOpen(false); }}
                className="flex items-center gap-1.5 text-slate-700 hover:text-[#6B4EFF] transition-colors text-xs font-bold px-2.5 py-1.5 rounded-[8px] border border-slate-200/80 bg-slate-50 hover:bg-white shadow-xs min-h-[36px]"
              >
                <Globe size={14} className="stroke-[2px] text-[#6B4EFF]" />
                <span>{getLangBadge()}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {/* Dropdown Menu for 3 Languages */}
              {isLangDropdownOpen && (
                <div className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 flex flex-col gap-1 w-44 animate-in fade-in slide-in-from-top-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1">{t('language')}</span>
                  
                  <button
                    onClick={() => { setLang('en'); setIsLangDropdownOpen(false); }}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left transition-all",
                      lang === 'en' ? "bg-[#6B4EFF]/10 text-[#6B4EFF] font-bold" : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <span>🇬🇧 English</span>
                    {lang === 'en' && <Check size={14} className="text-[#6B4EFF]" />}
                  </button>

                  <button
                    onClick={() => { setLang('hi'); setIsLangDropdownOpen(false); }}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left transition-all",
                      lang === 'hi' ? "bg-[#6B4EFF]/10 text-[#6B4EFF] font-bold" : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <span>🇮🇳 हिंदी (Hindi)</span>
                    {lang === 'hi' && <Check size={14} className="text-[#6B4EFF]" />}
                  </button>

                  <button
                    onClick={() => { setLang('gu'); setIsLangDropdownOpen(false); }}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-left transition-all",
                      lang === 'gu' ? "bg-[#6B4EFF]/10 text-[#6B4EFF] font-bold" : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <span>🇮🇳 ગુજરાતી (Gujarati)</span>
                    {lang === 'gu' && <Check size={14} className="text-[#6B4EFF]" />}
                  </button>
                </div>
              )}
            </div>

            {/* Interactive User Profile / Role Badge */}
            <div 
              onClick={() => { setIsRoleDropdownOpen(!isRoleDropdownOpen); setIsLangDropdownOpen(false); }}
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

        {/* Floating Voice Copilot Trigger */}
        <button
          type="button"
          onClick={() => setIsVoiceCopilotOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-6 z-40 flex items-center gap-2 bg-[#6B4EFF] hover:bg-[#583CE0] text-white px-3.5 py-2.5 rounded-full shadow-xl shadow-[#6B4EFF]/30 hover:scale-105 active:scale-95 transition-all group border-2 border-white"
          title="Speak with VastraAI (वस्त्र-AI / વસ્ત્ર-AI)"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute -inset-1 rounded-full bg-white/30 animate-ping" />
            <Mic size={17} className="relative z-10" />
          </div>
          <span className="text-xs font-extrabold pr-1 hidden md:inline">Ask VastraAI</span>
        </button>

        {/* AI Voice Copilot Modal */}
        <AIVoiceCopilotModal 
          isOpen={isVoiceCopilotOpen} 
          onClose={() => setIsVoiceCopilotOpen(false)} 
        />
      </div>
    </div>
  );
};
