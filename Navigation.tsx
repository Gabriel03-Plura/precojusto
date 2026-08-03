import React from 'react';
import { Home, Search, QrCode, History, Bell, User, ListChecks } from 'lucide-react';

export type TabType = 'home' | 'search' | 'scan' | 'shopping' | 'history' | 'alerts';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  unreadAlertsCount: number;
  theme?: 'dark' | 'light';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  unreadAlertsCount,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const tabs: { id: TabType; label: string; icon: React.FC<any>; isPrimary: boolean; badge?: number | null }[] = [
    {
      id: 'home' as TabType,
      label: 'Início',
      icon: Home,
      isPrimary: false,
    },
    {
      id: 'search' as TabType,
      label: 'Buscar',
      icon: Search,
      isPrimary: false,
    },
    {
      id: 'scan' as TabType,
      label: 'Escanear',
      icon: QrCode,
      isPrimary: true,
    },
    {
      id: 'shopping' as TabType,
      label: 'Lista',
      icon: ListChecks,
      isPrimary: false,
    },
    {
      id: 'history' as TabType,
      label: 'Histórico',
      icon: History,
      isPrimary: false,
    },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-30 transition-all ${
        isDark
          ? 'bg-[#18181B]/95 border-t border-[#27272A] text-white backdrop-blur-xl'
          : 'light-relevo-nav text-slate-900'
      }`}
    >
      <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                id={`tab-${tab.id}`}
                className="flex flex-col items-center focus:outline-none group px-1 shrink-0"
              >
                <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'bg-[#FF6B00] shadow-md shadow-[#FF6B00]/30'
                    : 'light-relevo-btn-primary'
                }`}>
                  <Icon className="w-5 h-5 stroke-[2px] text-white" />
                </div>
                <span
                  className={`text-[10px] font-sora font-semibold mt-1 ${
                    isDark ? 'text-neutral-300' : 'text-slate-700'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              id={`tab-${tab.id}`}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all focus:outline-none shrink-0 ${
                isActive
                  ? 'text-[#FF6B00] font-sora font-semibold'
                  : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative flex flex-col items-center">
                <Icon className={`w-4.5 h-4.5 transition-transform ${isActive ? 'stroke-[2px] text-[#FF6B00]' : 'stroke-[1.5px]'}`} />
                {tab.badge && (
                  <span className={`absolute -top-1 -right-2 px-1 py-0.2 bg-[#FF6B00] text-white font-sora font-bold text-[8px] rounded-full flex items-center justify-center ring-2 ${
                    isDark ? 'ring-black' : 'ring-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-none">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#FF6B00] mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
