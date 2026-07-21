import React from 'react';
import { 
  LayoutDashboard, ClipboardList, Activity, ArrowRightLeft, PackageCheck 
} from 'lucide-react';
import { cn } from './ui';

const bottomTabs = [
  { id: 'dashboard', name: 'Overview', icon: LayoutDashboard },
  { id: 'jobs', name: 'Orders', icon: ClipboardList },
  { id: 'production', name: 'Production', icon: Activity },
  { id: 'jobwork', name: 'Job-Work', icon: ArrowRightLeft },
  { id: 'dispatch', name: 'Dispatch', icon: PackageCheck },
];

export function BottomNav({ activeTab, setActiveTab }) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0914]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl pb-safe">
      {bottomTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-3 py-1 rounded-xl transition-all duration-200 touch-manipulation",
              isActive 
                ? "text-[#ff5e36] bg-[#ff5e36]/10 font-bold scale-105" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Icon size={20} className={isActive ? "stroke-[2.5]" : "stroke-[1.75]"} />
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
}
