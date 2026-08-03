import React, { useState } from 'react';
import { Bell, MapPin, Store, Smartphone } from 'lucide-react';
import { AlertaOferta, Produto } from '../types';
import { formatarMoeda } from '../utils/location';

interface DealsAlertsViewProps {
  alertas: AlertaOferta[];
  produtos: Produto[];
  notificacaoAtiva: boolean;
  onToggleNotificacao: (ativa: boolean) => void;
  userLat: number;
  userLng: number;
  theme?: 'dark' | 'light';
}

export const DealsAlertsView: React.FC<DealsAlertsViewProps> = ({
  alertas,
  produtos,
  notificacaoAtiva,
  onToggleNotificacao,
  userLat,
  userLng,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [simulatedPush, setSimulatedPush] = useState<string | null>(null);

  const handleSimulatePush = (alerta: AlertaOferta) => {
    setSimulatedPush(
      `🔔 Notificação: O item "${alerta.nomeProduto}" está R$ ${alerta.precoAtual.toFixed(
        2
      )} no ${alerta.estabelecimentoNome} (${alerta.descontoPorcentagem}% abaixo da média do seu bairro!)`
    );
    setTimeout(() => {
      setSimulatedPush(null);
    }, 6000);
  };

  return (
    <div className={`space-y-4 pb-20 animate-fade-in ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Top Banner */}
      <div className={`p-5 rounded-3xl border space-y-3 transition-all ${
        isDark
          ? 'bg-[#18181B] text-white border-[#27272A] shadow-lg'
          : 'light-relevo-card text-slate-900'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-[#FF6B00] stroke-[1.75px]" />
            <h2 className={`font-sora font-extrabold text-base tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>Alertas & Ofertas da Região</h2>
          </div>

          {/* Toggle Switch */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
            isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className={`text-[11px] font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Alertas:</span>
            <button
              onClick={() => onToggleNotificacao(!notificacaoAtiva)}
              className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${
                notificacaoAtiva ? 'bg-[#FF6B00]' : isDark ? 'bg-[#27272A]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                  notificacaoAtiva ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              ></div>
            </button>
          </div>
        </div>

        <p className={`text-xs font-normal leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
          Receba avisos no celular quando produtos frequentes da sua lista baixarem de preço nos supermercados e farmácias do seu bairro.
        </p>
      </div>

      {/* Simulated Push Toast Notification */}
      {simulatedPush && (
        <div className={`p-4 rounded-2xl border-2 border-[#FF6B00] shadow-xl flex items-start space-x-3 animate-bounce ${
          isDark ? 'bg-[#18181B] text-white' : 'bg-white text-slate-900'
        }`}>
          <Smartphone className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-sora font-semibold leading-snug">{simulatedPush}</p>
          </div>
        </div>
      )}

      {/* List of Deals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className={`font-sora font-bold text-xs uppercase tracking-wider ${
            isDark ? 'text-zinc-400' : 'text-slate-600'
          }`}>
            Preços Abaixo da Média por Perto ({alertas.length})
          </h3>
          <span className="text-[11px] text-[#FF6B00] font-sora font-bold">Raio de 5 km</span>
        </div>

        {alertas.map((alerta) => (
          <div
            key={alerta.id}
            className={`p-4 rounded-2xl border space-y-3 transition-all ${
              isDark
                ? 'bg-[#18181B] border-[#27272A] hover:border-slate-700 shadow-sm'
                : 'light-relevo-card hover:brightness-[0.99]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-sora font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/25 inline-block mb-1.5">
                  {alerta.descontoPorcentagem}% Abaixo da Média
                </span>
                <h4 className={`font-sora font-extrabold text-sm leading-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {alerta.nomeProduto}
                </h4>
                <p className={`text-[11px] mt-1 flex items-center space-x-1 ${
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                }`}>
                  <Store className="w-3.5 h-3.5 text-[#FF6B00] shrink-0 stroke-[1.75px]" />
                  <span>
                    {alerta.estabelecimentoNome} ({alerta.bairro})
                  </span>
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs line-through text-slate-400 block">
                  {formatarMoeda(alerta.precoMedio)}
                </span>
                <span className="font-sora font-extrabold text-base text-[#FF6B00] block mt-0.5">
                  {formatarMoeda(alerta.precoAtual)}
                </span>
              </div>
            </div>

            <div className={`pt-2.5 border-t flex items-center justify-between ${
              isDark ? 'border-[#27272A]' : 'border-slate-200'
            }`}>
              <span className={`text-[11px] flex items-center space-x-1 ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}>
                <MapPin className="w-3.5 h-3.5 text-slate-400 stroke-[1.75px]" />
                <span>
                  {alerta.distanciaKm} km • {alerta.validadoEm}
                </span>
              </span>

              <button
                onClick={() => handleSimulatePush(alerta)}
                className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#E05D00] text-white font-sora font-bold text-xs rounded-xl transition-all shadow-md shadow-[#FF6B00]/20 flex items-center space-x-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Testar Push Alert</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
