import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingDown, Sparkles, X, ShoppingBag, ArrowRight, Store, CheckCircle2 } from 'lucide-react';
import { formatarMoeda } from '../utils/location';

export interface ToastDataPriceDrop {
  id: string;
  itemNome: string;
  lojaNome: string;
  precoAnterior: number;
  precoNovoMinimo: number;
  economia: number;
  descontoPorcentagem: number;
}

interface PriceDropToastProps {
  toast: ToastDataPriceDrop | null;
  onClose: () => void;
  onVerNaLista: () => void;
  onAplicarPrecoNovo?: (toast: ToastDataPriceDrop) => void;
}

export const PriceDropToast: React.FC<PriceDropToastProps> = ({
  toast,
  onClose,
  onVerNaLista,
  onAplicarPrecoNovo,
}) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 380, damping: 25 }}
          className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 pointer-events-auto"
        >
          <div className="bg-[#18181B]/95 backdrop-blur-xl border-2 border-emerald-500/70 rounded-3xl p-4 shadow-[0_10px_30px_rgba(16,185,129,0.25)] text-white space-y-3 relative overflow-hidden ring-1 ring-emerald-500/30">
            {/* Background Glow Effect */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Header / Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-sora font-extrabold text-[10px] tracking-wider uppercase">
                  <TrendingDown className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Caiu Abaixo do Mínimo Regional!</span>
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="flex items-start space-x-3 pt-0.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Sparkles className="w-5 h-5 stroke-[2px]" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-sora font-extrabold text-sm text-white truncate leading-tight">
                  {toast.itemNome}
                </h4>

                <div className="flex items-center space-x-1.5 text-xs text-slate-300 mt-1">
                  <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate font-medium">{toast.lojaNome}</span>
                </div>

                {/* Price comparison badge */}
                <div className="mt-2.5 flex items-center justify-between bg-[#0F0F12] p-2.5 rounded-2xl border border-emerald-500/25">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sora">Preço Mínimo Detectado</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="font-sora font-black text-base text-emerald-400">
                        {formatarMoeda(toast.precoNovoMinimo)}
                      </span>
                      {toast.precoAnterior > 0 && (
                        <span className="text-xs text-slate-400 line-through font-sora">
                          {formatarMoeda(toast.precoAnterior)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right bg-emerald-500/15 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                    <span className="text-[10px] font-sora font-bold text-emerald-400 block">
                      -{toast.descontoPorcentagem}%
                    </span>
                    <span className="text-[9px] font-sora font-semibold text-emerald-300">
                      Economize {formatarMoeda(toast.economia)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 flex items-center justify-end space-x-2">
              {onAplicarPrecoNovo && (
                <button
                  onClick={() => {
                    onAplicarPrecoNovo(toast);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-sora font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Atualizar Preço na Lista</span>
                </button>
              )}

              <button
                onClick={() => {
                  onVerNaLista();
                  onClose();
                }}
                className="px-3 py-1.5 bg-[#27272A] hover:bg-zinc-700 text-white font-sora font-bold text-xs rounded-xl border border-zinc-600 transition-all flex items-center space-x-1"
              >
                <span>Ver na Lista</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
