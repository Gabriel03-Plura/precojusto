import React, { useEffect } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Store,
  Check,
  X,
  Share2,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SampleNFCe, CategoriaProduto, Produto } from '../types';
import { formatarMoeda, getStatusPreco } from '../utils/location';

interface ScanResultModalProps {
  isOpen: boolean;
  scannedInvoice: SampleNFCe | null;
  onClose: () => void;
  onSaveAndAdd: (invoice: SampleNFCe) => void;
  regionalProducts: Produto[];
  theme?: 'dark' | 'light';
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  isOpen,
  scannedInvoice,
  onClose,
  onSaveAndAdd,
  regionalProducts,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  useEffect(() => {
    if (isOpen && scannedInvoice) {
      let totalPago = 0;
      let totalMedio = 0;

      scannedInvoice.itens.forEach((item) => {
        const prodMatch = regionalProducts.find(
          (p) => p.nome.toLowerCase() === item.nome.toLowerCase()
        );
        const pm = prodMatch ? prodMatch.precoMedioRegional : item.preco;
        totalPago += item.preco * item.quantidade;
        totalMedio += pm * item.quantidade;
      });

      if (totalPago < totalMedio) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // fallback ignore
        }
      }
    }
  }, [isOpen, scannedInvoice]);

  if (!isOpen || !scannedInvoice) return null;

  const itemsWithStats = scannedInvoice.itens.map((item) => {
    const prodMatch = regionalProducts.find(
      (p) => p.nome.toLowerCase().includes(item.nome.toLowerCase()) || item.nome.toLowerCase().includes(p.nome.toLowerCase())
    );

    const precoMedio = prodMatch ? prodMatch.precoMedioRegional : item.preco;
    const statusObj = getStatusPreco(item.preco, precoMedio);
    const diferencaPorItem = (precoMedio - item.preco) * item.quantidade;

    return {
      ...item,
      precoMedio,
      statusObj,
      diferencaPorItem,
      melhorLoja: prodMatch?.melhorLoja || scannedInvoice.estabelecimento,
      precoMinimo: prodMatch ? prodMatch.precoMinimoRegional : item.preco,
    };
  });

  const totalPagoVal = scannedInvoice.itens.reduce(
    (acc, it) => acc + it.preco * it.quantidade,
    0
  );

  const totalMedioVal = itemsWithStats.reduce(
    (acc, it) => acc + it.precoMedio * it.quantidade,
    0
  );

  const economiaTotal = totalMedioVal - totalPagoVal;

  const isEconomia = economiaTotal > 0.05;
  const isPrecoSalgado = economiaTotal < -0.05;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-md animate-fade-in ${
      isDark ? 'bg-black/80 text-slate-100' : 'bg-slate-900/40 text-slate-900'
    }`}>
      <div className={`rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border flex flex-col max-h-[92vh] ${
        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
      }`}>
        {/* Top Banner */}
        <div className={`p-4 shrink-0 border-b ${
          isDark ? 'bg-[#0F0F12] text-white border-[#27272A]' : 'bg-slate-50 text-slate-900 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-sora font-extrabold uppercase bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] px-2.5 py-0.5 rounded-full">
              Comparativo Regional NFC-e
            </span>
            <button
              onClick={onClose}
              className={`p-1 rounded-lg transition-colors ${
                isDark ? 'hover:bg-[#27272A] text-white' : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${
              isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
            }`}>
              {isEconomia ? (
                <TrendingDown className="w-6 h-6 text-[#FF6B00] stroke-[1.75px]" />
              ) : isPrecoSalgado ? (
                <TrendingUp className="w-6 h-6 text-amber-500 stroke-[1.75px]" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 stroke-[1.75px]" />
              )}
            </div>

            <div>
              <h3 className={`font-sora font-extrabold text-base leading-tight tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {isEconomia
                  ? 'Preço Justo! Você Economizou'
                  : isPrecoSalgado
                  ? 'Acima da Média Regional'
                  : 'Preço Dentro da Média'}
              </h3>
              <p className={`text-xs font-normal mt-0.5 ${
                isDark ? 'text-zinc-400' : 'text-slate-600'
              }`}>
                {scannedInvoice.estabelecimento} ({scannedInvoice.bairro})
              </p>
            </div>
          </div>
        </div>

        {/* Big Savings Metric Card */}
        <div className={`p-4 border-b shrink-0 ${
          isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className={`p-3.5 rounded-2xl border shadow-xs ${
              isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
            }`}>
              <span className={`text-[10px] font-sora font-bold uppercase block mb-0.5 ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}>
                Total Pago na Nota
              </span>
              <span className={`text-base font-sora font-extrabold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {formatarMoeda(totalPagoVal)}
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border shadow-xs ${
              isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
            }`}>
              <span className={`text-[10px] font-sora font-bold uppercase block mb-0.5 ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}>
                {isEconomia ? 'Sua Economia' : isPrecoSalgado ? 'Diferença a Mais' : 'Média Regional'}
              </span>
              <span className="text-base font-sora font-extrabold text-[#FF6B00] block">
                {isEconomia
                  ? `- ${formatarMoeda(economiaTotal)}`
                  : isPrecoSalgado
                  ? `+ ${formatarMoeda(Math.abs(economiaTotal))}`
                  : formatarMoeda(totalMedioVal)}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Item List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className={`font-sora font-bold text-xs uppercase tracking-wider ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              Itens do Cupom ({scannedInvoice.itens.length})
            </h4>
            <span className="text-[11px] text-[#FF6B00] font-sora font-bold">
              Comparação Regional
            </span>
          </div>

          {itemsWithStats.map((item, idx) => {
            const { statusObj } = item;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border shadow-xs space-y-2 ${
                  isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className={`font-sora font-bold text-sm leading-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {item.nome}
                    </h5>
                    <p className={`text-[11px] mt-0.5 font-normal ${
                      isDark ? 'text-zinc-400' : 'text-slate-600'
                    }`}>
                      {item.quantidade} {item.unidade} • Cat: {item.categoria}
                    </p>
                  </div>
                  <span className={`font-sora font-extrabold text-sm ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {formatarMoeda(item.preco * item.quantidade)}
                  </span>
                </div>

                {/* Price Indicator Badge */}
                <div
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs font-sora font-semibold ${statusObj.corBg} ${statusObj.corBorda} ${statusObj.corTexto}`}
                >
                  <div className="flex items-center space-x-1.5">
                    {statusObj.status === 'abaixo' && <TrendingDown className="w-4 h-4 shrink-0 stroke-[1.75px]" />}
                    {statusObj.status === 'acima' && <TrendingUp className="w-4 h-4 shrink-0 stroke-[1.75px]" />}
                    {statusObj.status === 'na_media' && <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[1.75px]" />}
                    <span>{statusObj.rotulo}</span>
                  </div>

                  <span className="text-[11px] opacity-80 font-normal">
                    Média: {formatarMoeda(item.precoMedio)}
                  </span>
                </div>

                {/* Cheaper alternative recommendation if overpaid */}
                {statusObj.status === 'acima' && item.melhorLoja && (
                  <div className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between font-normal ${
                    isDark ? 'bg-[#18181B] border-[#27272A] text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span>💡 Encontrado por <strong className="text-[#FF6B00]">{formatarMoeda(item.precoMinimo)}</strong> no {item.melhorLoja}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className={`p-4 border-t shrink-0 space-y-2 ${
          isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            onClick={() => {
              onSaveAndAdd(scannedInvoice);
              onClose();
            }}
            id="save-invoice-btn"
            className="w-full py-3 bg-[#FF6B00] hover:bg-[#E05D00] text-white font-sora font-bold text-xs rounded-2xl shadow-md shadow-[#FF6B00]/20 transition-all flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4 stroke-[2px]" />
            <span>Salvar no Histórico & Atualizar Médias</span>
          </button>
        </div>
      </div>
    </div>
  );
};
