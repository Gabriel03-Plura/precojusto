import React from 'react';
import { ShoppingBag, MapPin, User as UserIcon, Bell, Sun, Moon, CloudOff } from 'lucide-react';
import { Usuario } from '../types';

interface HeaderProps {
  usuario: Usuario | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenLocationChange: () => void;
  onOpenAlerts?: () => void;
  unreadAlertsCount?: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isOnline?: boolean;
  onOpenOfflineRecords?: () => void;
  pendingOfflineRecordsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  usuario,
  onOpenAuth,
  onOpenProfile,
  onOpenLocationChange,
  onOpenAlerts,
  unreadAlertsCount = 0,
  theme,
  onToggleTheme,
  isOnline = true,
  onOpenOfflineRecords,
  pendingOfflineRecordsCount = 0,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-30 transition-all ${
        isDark
          ? 'bg-[#18181B]/95 text-white border-b border-[#27272A] backdrop-blur-md'
          : 'light-relevo-header text-slate-900'
      }`}
    >
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center font-bold shadow-md shadow-[#FF6B00]/25 shrink-0 relative border border-[#E05D00]/50">
            <ShoppingBag className="w-4 h-4 text-white stroke-[2px]" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                isDark ? 'border-[#18181B]' : 'border-white'
              } ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}
              title={isOnline ? 'Online' : 'Off-line'}
            />
          </div>
          <div>
            <h1 className={`font-sora font-bold text-sm tracking-tight leading-none ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Preço<span className="text-[#FF6B00]">Justo</span>
            </h1>
            <p className={`text-[10px] font-normal leading-tight mt-0.5 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Comparador Regional
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {/* Offline Pending Sync Records Button */}
          {onOpenOfflineRecords && (pendingOfflineRecordsCount > 0 || !isOnline) && (
            <button
              onClick={onOpenOfflineRecords}
              id="header-offline-records-btn"
              className={`relative p-2 rounded-xl transition-all ${
                isDark
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-500 hover:bg-amber-500/25'
                  : 'bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200'
              }`}
              title="Registros Off-line & Sincronização"
            >
              <CloudOff className="w-4 h-4 stroke-[2px] animate-pulse" />
              {pendingOfflineRecordsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-1 bg-amber-500 text-black font-sora font-extrabold text-[8px] rounded-full flex items-center justify-center ring-2 ring-black">
                  {pendingOfflineRecordsCount}
                </span>
              )}
            </button>
          )}

          {/* Deals & Alerts Notification Bell */}
          {onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              id="header-alerts-btn"
              className={`relative p-2 rounded-xl transition-all ${
                isDark
                  ? 'bg-[#18181B] hover:bg-[#27272A] text-neutral-300 hover:text-white border border-[#27272A]'
                  : 'light-relevo-btn-secondary hover:brightness-95'
              }`}
              title="Ofertas e Alertas"
            >
              <Bell className="w-4 h-4 stroke-[1.75px]" />
              {unreadAlertsCount > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[14px] h-3.5 px-1 bg-[#FF6B00] text-white font-sora font-bold text-[8px] rounded-full flex items-center justify-center ring-2 ${
                  isDark ? 'ring-black' : 'ring-white'
                }`}>
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          )}

          {/* Location button */}
          <button
            onClick={onOpenLocationChange}
            id="location-picker-btn"
            className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-xl transition-all ${
              isDark
                ? 'bg-[#18181B] hover:bg-[#27272A] text-neutral-300 border border-[#27272A]'
                : 'light-relevo-btn-secondary hover:brightness-95'
            }`}
            title="Alterar Localização"
          >
            <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0 stroke-[1.75px]" />
            <span className="max-w-[85px] truncate font-medium text-[11px]">
              {usuario ? `${usuario.bairro}` : 'Araraquara'}
            </span>
          </button>

          {/* Theme Toggle Button (Light / Dark Mode) */}
          <button
            onClick={onToggleTheme}
            id="toggle-theme-btn"
            className={`p-1.5 rounded-xl transition-all border flex items-center justify-center ${
              isDark
                ? 'bg-[#18181B] text-[#FF6B00] border-[#27272A] hover:bg-[#27272A]'
                : 'bg-slate-100 text-[#FF6B00] border-slate-200 hover:bg-slate-200'
            }`}
            title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro (Preto & Laranja)'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 stroke-[2px]" />
            ) : (
              <Moon className="w-4 h-4 stroke-[2px]" />
            )}
          </button>

          {/* Profile or Login */}
          {usuario ? (
            <button
              onClick={onOpenProfile}
              id="profile-btn"
              className="w-7 h-7 rounded-full border border-[#FF6B00]/60 overflow-hidden bg-neutral-900 focus:outline-none transition-all"
            >
              {usuario.avatarUrl ? (
                <img
                  src={usuario.avatarUrl}
                  alt={usuario.nome}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-sora font-bold text-[11px] text-white bg-[#FF6B00]">
                  {usuario.nome.charAt(0)}
                </div>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              id="login-btn"
              className="text-xs font-sora font-semibold bg-[#FF6B00] hover:bg-[#E05D00] text-white px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm shadow-[#FF6B00]/20"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


