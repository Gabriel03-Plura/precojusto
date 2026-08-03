import React from 'react';
import { WifiOff, Wifi, Database, X, RefreshCw, CheckCircle2, CloudOff } from 'lucide-react';

interface OfflineStatusBannerProps {
  isOnline: boolean;
  wasOffline: boolean;
  onDismissReestablished: () => void;
  cachedQueriesCount: number;
  pendingRecordsCount?: number;
  onOpenOfflineRecords?: () => void;
  theme?: 'dark' | 'light';
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({
  isOnline,
  wasOffline,
  onDismissReestablished,
  cachedQueriesCount,
  pendingRecordsCount = 0,
  onOpenOfflineRecords,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  // If online and wasn't offline and no pending records, don't show the banner
  if (isOnline && !wasOffline && pendingRecordsCount === 0) {
    return null;
  }

  // Case 1: Currently Offline
  if (!isOnline) {
    return (
      <div
        className={`border-b px-4 py-3 shadow-lg relative overflow-hidden animate-fade-in z-20 ${
          isDark
            ? 'bg-[#18181B] border-[#FF6B00]/40 text-white'
            : 'bg-amber-50 border-amber-200 text-slate-900'
        }`}
      >
        {/* Subtle background warning glow */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#FF6B00]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-md mx-auto flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <WifiOff className="w-4 h-4 stroke-[2px] animate-pulse" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="font-sora font-extrabold text-xs text-[#FF6B00] tracking-tight uppercase">
                  Modo Off-line Ativo
                </span>
                <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-ping" />
              </div>
              <p className={`text-[11px] font-normal leading-snug ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Sem conexão com a internet. Registros de preços e consultas mantidos localmente no seu dispositivo.
              </p>

              <div className="pt-1.5 flex items-center space-x-2 flex-wrap gap-y-1">
                {pendingRecordsCount > 0 && (
                  <span className="text-[10px] font-sora font-extrabold px-2.5 py-0.5 rounded-full border bg-amber-500/15 text-amber-500 border-amber-500/30 flex items-center space-x-1">
                    <CloudOff className="w-3 h-3" />
                    <span>{pendingRecordsCount} {pendingRecordsCount === 1 ? 'sincronização pendente' : 'sincronizações pendentes'}</span>
                  </span>
                )}

                {cachedQueriesCount > 0 && (
                  <span className={`text-[10px] font-sora font-semibold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                    isDark
                      ? 'bg-[#0F0F12] text-slate-300 border-[#27272A]'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}>
                    <Database className="w-3 h-3 text-[#FF6B00]" />
                    <span>{cachedQueriesCount} em cache</span>
                  </span>
                )}

                {onOpenOfflineRecords && (
                  <button
                    onClick={onOpenOfflineRecords}
                    className="text-[10px] font-sora font-bold text-[#FF6B00] hover:underline bg-[#FF6B00]/10 px-2 py-0.5 rounded-lg border border-[#FF6B00]/20"
                  >
                    Ver Registros Off-line
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Online with Pending Records or Just Reconnected
  return (
    <div className={`border-b px-4 py-2.5 shadow-md relative overflow-hidden animate-fade-in z-20 ${
      isDark
        ? 'bg-[#0F0F12] border-emerald-500/40 text-white'
        : 'bg-emerald-50 border-emerald-200 text-slate-900'
    }`}>
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0">
            <Wifi className="w-3.5 h-3.5 stroke-[2px]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-sora font-bold text-xs text-emerald-600 dark:text-emerald-400 tracking-tight block leading-tight">
                Conexão Ativa!
              </span>
              {pendingRecordsCount > 0 && (
                <span className="bg-amber-500/20 text-amber-500 text-[10px] font-sora font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                  {pendingRecordsCount} {pendingRecordsCount === 1 ? 'sincronização pendente' : 'sincronizações pendentes'}
                </span>
              )}
            </div>
            <p className={`text-[10px] font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {pendingRecordsCount > 0
                ? 'Você possui registros salvos off-line prontos para enviar à nuvem.'
                : 'Sincronizando últimas ofertas NFC-e e médias regionais em tempo real.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {pendingRecordsCount > 0 && onOpenOfflineRecords && (
            <button
              onClick={onOpenOfflineRecords}
              className="px-2.5 py-1 text-[11px] font-sora font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-xs transition-all flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sincronizar</span>
            </button>
          )}

          <button
            onClick={onDismissReestablished}
            className={`p-1 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

