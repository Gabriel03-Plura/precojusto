import React, { useState, useMemo } from 'react';
import {
  QrCode,
  TrendingDown,
  ShoppingBag,
  Search,
  MapPin,
  Store,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Tag,
  Zap,
  BarChart3,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  Usuario,
  Produto,
  RegistroPreco,
  Estabelecimento,
  AlertaOferta,
  CategoriaProduto,
  ItemListaCompras,
} from '../types';
import { formatarMoeda, getStatusPreco, calcularDistanciaKm } from '../utils/location';
import { TabType } from './Navigation';

interface HomeViewProps {
  usuario: Usuario | null;
  produtos: Produto[];
  historico: RegistroPreco[];
  estabelecimentos: Estabelecimento[];
  alertas: AlertaOferta[];
  lista?: ItemListaCompras[];
  totalEconomiaGeral: number;
  isOnline: boolean;
  onOpenScanner: () => void;
  onOpenManualInput?: () => void;
  onSelectProduto: (produto: Produto) => void;
  onNavigateTab: (tab: TabType) => void;
  theme?: 'dark' | 'light';
}

const CATEGORY_TAGS: { name: CategoriaProduto; icon: string }[] = [
  { name: 'Mercearia', icon: '🌾' },
  { name: 'Hortifruti', icon: '🍎' },
  { name: 'Carnes e Aves', icon: '🥩' },
  { name: 'Laticínios e Frios', icon: '🧀' },
  { name: 'Bebidas', icon: '🥤' },
  { name: 'Mat. Limpeza', icon: '🧹' },
  { name: 'Higiene e Perfumaria', icon: '🧴' },
  { name: 'Farmácia e Medicamentos', icon: '💊' },
];

const CustomBarTooltip = ({ active, payload, label, isDark = true }: any) => {
  if (active && payload && payload.length) {
    const valorGasto = payload[0].value;
    const economia = payload[0].payload.economia || Math.round(valorGasto * 0.14);
    return (
      <div className={`p-3.5 rounded-2xl shadow-2xl border space-y-1.5 font-sans ${
        isDark ? 'bg-[#181818] text-white border-[#2E2E2E]' : 'bg-white text-slate-900 border-slate-200 shadow-xl'
      }`}>
        <div className="flex items-center justify-between space-x-3">
          <p className="font-bold text-[#FF6B00] text-xs uppercase tracking-wider">{label}</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] font-semibold border border-[#FF6B00]/20">
            NFC-e
          </span>
        </div>
        <div className="pt-1 flex items-baseline space-x-2">
          <span className={`text-xs ${isDark ? 'text-[#A0A0A0]' : 'text-slate-500'}`}>Gasto Total:</span>
          <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatarMoeda(valorGasto)}
          </span>
        </div>
        <div className={`flex items-baseline space-x-2 pt-1 border-t ${isDark ? 'border-[#2E2E2E]' : 'border-slate-100'}`}>
          <span className={`text-xs ${isDark ? 'text-[#A0A0A0]' : 'text-slate-500'}`}>Economia Estimada:</span>
          <span className="font-bold text-emerald-500 text-xs">
            +{formatarMoeda(economia)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const HomeView: React.FC<HomeViewProps> = ({
  usuario,
  produtos,
  historico,
  estabelecimentos,
  alertas,
  lista = [],
  totalEconomiaGeral,
  isOnline,
  onOpenScanner,
  onOpenManualInput,
  onSelectProduto,
  onNavigateTab,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [quickQuery, setQuickQuery] = useState('');

  // Calculate shopping list totals for summary card
  const totalItensLista = lista.length;
  const totalConcluidosLista = lista.filter((i) => i.concluido).length;
  const orcamentoEstimadoLista = useMemo(() => {
    return lista.reduce((acc, i) => acc + i.precoMedioEstimado * i.quantidade, 0);
  }, [lista]);

  // Compute 6-month spending evolution data from user history
  const monthlySpendingData = useMemo(() => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const hoje = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesIndex = d.getMonth();
      const ano = d.getFullYear();
      const label = meses[mesIndex];

      const itemDoMes = historico.filter((rec) => {
        const recDate = new Date(rec.data);
        return recDate.getMonth() === mesIndex && recDate.getFullYear() === ano;
      });

      const gasto = itemDoMes.reduce((acc, r) => acc + r.preco * (r.quantidade || 1), 0);
      const economia = itemDoMes.reduce((acc, r) => {
        const diff = (r.precoMedioNaData - r.preco) * (r.quantidade || 1);
        return acc + (diff > 0 ? diff : 0);
      }, 0);

      result.push({
        mes: label,
        gasto: Number(gasto.toFixed(2)),
        economia: Number(economia.toFixed(2)),
      });
    }

    return result;
  }, [historico]);

  // Calculate average spending
  const mediaGastoMensal = useMemo(() => {
    const soma = monthlySpendingData.reduce((acc, m) => acc + m.gasto, 0);
    return monthlySpendingData.length > 0 ? soma / monthlySpendingData.length : 0;
  }, [monthlySpendingData]);

  // Calculate dynamic comparison against previous months' average spending
  const comparacaoMediaData = useMemo(() => {
    if (monthlySpendingData.length === 0) return null;
    const mesAtualGasto = monthlySpendingData[monthlySpendingData.length - 1]?.gasto || 0;
    const mesesAnteriores = monthlySpendingData.slice(0, monthlySpendingData.length - 1);
    const mesesComGasto = mesesAnteriores.filter((m) => m.gasto > 0);

    if (mesAtualGasto === 0 || mesesComGasto.length === 0) {
      return null;
    }

    const somaAnteriores = mesesComGasto.reduce((acc, m) => acc + m.gasto, 0);
    const mediaAnteriores = somaAnteriores / mesesComGasto.length;

    if (mediaAnteriores === 0) return null;

    const diffPct = Math.round(((mesAtualGasto - mediaAnteriores) / mediaAnteriores) * 100);
    return {
      diffPct,
      isEconomia: diffPct <= 0,
      texto: diffPct <= 0 ? `${diffPct}% vs Média` : `+${diffPct}% vs Média`,
    };
  }, [monthlySpendingData]);

  // Filter top products matching quick query
  const quickSearchProducts = quickQuery.trim()
    ? produtos.filter((p) =>
        p.nome.toLowerCase().includes(quickQuery.toLowerCase())
      )
    : [];

  // Find top 4 best deal products in user neighborhood
  const topDeals = [...produtos]
    .sort(
      (a, b) =>
        (b.precoMedioRegional - b.precoMinimoRegional) / b.precoMedioRegional -
        (a.precoMedioRegional - a.precoMinimoRegional) / a.precoMedioRegional
    )
    .slice(0, 4);

  // Compute stats
  const totalCupons = historico.length;
  const avgDiscount = useMemo(() => {
    const totalGasto = historico.reduce((acc, h) => acc + h.preco * (h.quantidade || 1), 0);
    if (totalGasto === 0) return 0;
    return Math.round((totalEconomiaGeral / totalGasto) * 100);
  }, [historico, totalEconomiaGeral]);

  return (
    <div className={`space-y-4 animate-fade-in min-h-screen pb-16 font-sans max-w-md mx-auto ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* 1. WELCOME & LOCATION HEADER */}
      <div className="flex items-center justify-between gap-3 pt-1 px-1">
        <div>
          <span className={`text-xs font-normal ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
            Olá, <strong className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{usuario?.nome.split(' ')[0] || 'Economizador'}</strong>
          </span>
          <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Economize no Seu Bairro
          </h1>
        </div>

        <button
          onClick={() => onNavigateTab('history')}
          className={`px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 text-xs font-medium shrink-0 shadow-xs ${
            isDark
              ? 'bg-[#18181B] hover:bg-[#27272A] border-[#27272A] text-neutral-300 hover:text-white'
              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
          <span className="truncate max-w-[100px]">{usuario?.cidade || 'Araraquara'}</span>
        </button>
      </div>

      {/* 2. SCAN NFC-E HERO CARD - PRIMARY FOCUS */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDark
          ? 'bg-[#18181B] border-[#27272A] text-white shadow-sm'
          : 'light-relevo-card text-slate-900'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
            <span className="text-[11px] font-semibold text-[#FF6B00] uppercase tracking-wider">
              Comparador NFC-e
            </span>
          </div>
          <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Escanear Cupom de Compra
          </h2>
          <p className={`text-xs leading-relaxed font-normal ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Aproxime a câmera do QR Code da sua Nota Fiscal para registrar preços e comparar economias na sua região.
          </p>
        </div>

        <button
          onClick={onOpenScanner}
          id="home-open-scanner-btn"
          className={`w-full py-3 px-4 text-white font-semibold text-xs rounded-xl transition-all duration-150 active:scale-[0.99] flex items-center justify-center space-x-2 ${
            isDark
              ? 'bg-[#FF6B00] hover:bg-[#E05D00] shadow-sm shadow-[#FF6B00]/20'
              : 'light-relevo-btn-primary hover:brightness-105'
          }`}
        >
          <QrCode className="w-4 h-4 text-white stroke-[2px] shrink-0" />
          <span>Escanear QR Code com a Câmera</span>
        </button>
      </div>

      {/* 3. QUICK PRICE LOOKUP SEARCH BAR */}
      <div className="space-y-2">
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3.5 top-3 stroke-[1.75px] pointer-events-none ${
            isDark ? 'text-zinc-400' : 'text-slate-400'
          }`} />
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Pesquisar preço ex: Arroz, Leite, Café..."
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:border-[#FF6B00] transition-all text-xs font-normal ${
              isDark
                ? 'bg-[#18181B] text-white placeholder:text-neutral-500 border-[#27272A] shadow-xs'
                : 'light-relevo-input'
            }`}
          />
          {quickQuery && (
            <button
              onClick={() => setQuickQuery('')}
              className={`absolute right-3 top-2.5 text-xs font-medium ${
                isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Limpar
            </button>
          )}
        </div>

        {/* Search Results Drawer Overlay */}
        {quickQuery.trim() && (
          <div className={`p-3 border rounded-2xl space-y-2 max-h-60 overflow-y-auto shadow-lg ${
            isDark ? 'bg-[#18181B] border-[#27272A] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wider px-1 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Resultados ({quickSearchProducts.length})
            </p>

            {quickSearchProducts.length === 0 ? (
              <p className={`text-xs p-2 text-center ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Nenhum produto encontrado para "{quickQuery}".
              </p>
            ) : (
              quickSearchProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProduto(p);
                    onNavigateTab('search');
                  }}
                  className={`p-2.5 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-[#0F0F12] hover:bg-[#27272A] border-[#27272A]'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-sm">{p.imagem || '🛒'}</span>
                    <div>
                      <h3 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {p.nome}
                      </h3>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Melhor preço: <span className="text-[#FF6B00] font-semibold">{formatarMoeda(p.precoMinimoRegional)}</span> em {p.melhorLoja}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              ))
            )}
          </div>
        )}

        {/* Quick Category Tags Horizontal Carousel */}
        {!quickQuery && (
          <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORY_TAGS.map((cat) => (
              <button
                key={cat.name}
                onClick={() => onNavigateTab('search')}
                className={`px-3 py-1.5 border rounded-xl text-[11px] font-medium shrink-0 flex items-center space-x-1.5 transition-all shadow-xs ${
                  isDark
                    ? 'bg-[#18181B] hover:bg-[#27272A] border-[#27272A] text-neutral-300 hover:text-white'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3.5 SHOPPING LIST QUICK SUMMARY CARD */}
      <div className={`p-4 border rounded-2xl flex items-center justify-between gap-3 transition-all ${
        isDark ? 'bg-[#18181B] border-[#27272A] shadow-xs' : 'light-relevo-card-sm'
      }`}>
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 stroke-[1.75px]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Lista de Compras
            </h3>
            <p className={`text-[11px] mt-0.5 truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {totalItensLista > 0
                ? `${totalItensLista} ${totalItensLista === 1 ? 'item' : 'itens'} • ${totalConcluidosLista} no carrinho`
                : 'Planeje sua lista antes do mercado'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('shopping')}
          className={`px-3 py-1.5 font-medium text-xs rounded-xl transition-all flex items-center space-x-1 shrink-0 ${
            isDark
              ? 'bg-[#0F0F12] hover:bg-[#27272A] text-neutral-200 hover:text-white border border-[#27272A]'
              : 'light-relevo-btn-secondary hover:brightness-95'
          }`}
        >
          <span>{totalItensLista > 0 ? 'Ver Lista' : 'Criar Lista'}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#FF6B00]" />
        </button>
      </div>

      {/* 3.6 OFFERS & ALERTS QUICK CARD */}
      <div className={`p-4 border rounded-2xl flex items-center justify-between gap-3 transition-all ${
        isDark ? 'bg-[#18181B] border-[#27272A] shadow-xs' : 'light-relevo-card-sm'
      }`}>
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0 relative">
            <Bell className="w-4 h-4 stroke-[1.75px]" />
            {alertas.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF6B00]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Ofertas Regionais
            </h3>
            <p className={`text-[11px] mt-0.5 truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {alertas.length > 0
                ? `${alertas.length} ${alertas.length === 1 ? 'oferta em destaque' : 'ofertas em destaque'}`
                : 'Alertas de quedas de preços'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('alerts')}
          className={`px-3 py-1.5 font-medium text-xs rounded-xl transition-all flex items-center space-x-1 shrink-0 ${
            isDark
              ? 'bg-[#0F0F12] hover:bg-[#27272A] text-neutral-200 hover:text-white border border-[#27272A]'
              : 'light-relevo-btn-secondary hover:brightness-95'
          }`}
        >
          <span>Ver Ofertas</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#FF6B00]" />
        </button>
      </div>

      {/* 4. KEY KPI METRICS GRID */}
      <div className="grid grid-cols-2 gap-3">
        {/* KPI 1: Economia Acumulada */}
        <div className={`p-4 rounded-2xl border space-y-1 transition-all ${
          isDark ? 'bg-[#18181B] border-[#27272A] shadow-xs' : 'light-relevo-card-sm'
        }`}>
          <span className={`text-[10px] font-medium uppercase tracking-wider block ${
            isDark ? 'text-zinc-400' : 'text-slate-500'
          }`}>
            Economia Obtida
          </span>
          <span className="font-bold text-base text-[#FF6B00] tracking-tight block">
            {formatarMoeda(totalEconomiaGeral)}
          </span>
          <span className={`text-[10px] block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            +{avgDiscount}% de desconto médio
          </span>
        </div>

        {/* KPI 2: Cupons Processados */}
        <div className={`p-4 rounded-2xl border space-y-1 transition-all ${
          isDark ? 'bg-[#18181B] border-[#27272A] shadow-xs' : 'light-relevo-card-sm'
        }`}>
          <span className={`text-[10px] font-medium uppercase tracking-wider block ${
            isDark ? 'text-zinc-400' : 'text-slate-500'
          }`}>
            Cupons NFC-e
          </span>
          <span className={`font-bold text-base tracking-tight block ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalCupons} {totalCupons === 1 ? 'cupom' : 'cupons'}
          </span>
          <span className={`text-[10px] block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Registrados na sua conta
          </span>
        </div>
      </div>

      {/* 4.5 MONTHLY SPENDING BAR CHART (RECHARTS INTEGRATION) */}
      <div className={`p-5 border rounded-2xl space-y-4 transition-all ${
        isDark ? 'bg-[#18181B] border-[#27272A] shadow-xs' : 'light-relevo-card'
      }`}>
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 stroke-[1.75px]" />
            </div>
            <div>
              <h3 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Gastos Mensais
              </h3>
              <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Histórico de compras e economia
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[10px] font-medium block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Média
            </span>
            <span className="font-semibold text-xs text-[#FF6B00]">
              {formatarMoeda(mediaGastoMensal)}
            </span>
          </div>
        </div>

        {/* Recharts Bar Chart Canvas */}
        <div className="w-full pt-1">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={monthlySpendingData}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
            >
              <XAxis
                dataKey="mes"
                axisLine={false}
                tickLine={false}
                tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 10, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: isDark ? '#64748B' : '#94A3B8', fontSize: 10 }}
                tickFormatter={(val) => `R$${val}`}
              />
              <Tooltip
                content={<CustomBarTooltip isDark={isDark} />}
                cursor={{ fill: 'rgba(255, 107, 0, 0.05)', radius: 6 }}
              />
              <Bar dataKey="gasto" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {monthlySpendingData.map((entry, index) => {
                  const isCurrentMonth = index === monthlySpendingData.length - 1;
                  return (
                    <Cell
                      key={`bar-cell-${index}`}
                      fill={isCurrentMonth ? '#FF6B00' : (isDark ? '#27272A' : '#E2E8F0')}
                      className="transition-colors hover:fill-[#FF6B00] cursor-pointer"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Footer Indicator Legend */}
        <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${
          isDark ? 'border-[#27272A]' : 'border-slate-100'
        }`}>
          <div className="flex items-center space-x-3">
            <span className={`flex items-center space-x-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              <span className={`w-2 h-2 rounded-xs inline-block ${isDark ? 'bg-[#27272A]' : 'bg-slate-300'}`} />
              <span>Anteriores</span>
            </span>
            <span className={`flex items-center space-x-1 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span className="w-2 h-2 rounded-xs bg-[#FF6B00] inline-block" />
              <span>Mês Atual</span>
            </span>
          </div>

          {comparacaoMediaData && (
            <span
              className={`font-medium flex items-center space-x-1 ${
                comparacaoMediaData.isEconomia ? 'text-emerald-500' : 'text-amber-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{comparacaoMediaData.texto}</span>
            </span>
          )}
        </div>
      </div>

      {/* 5. HOT DEALS & OFFERS OF THE DAY IN NEIGHBORHOOD */}
      <div className={`p-4 border rounded-2xl space-y-3 transition-all ${
        isDark ? 'bg-[#18181B] border-[#27272A] shadow-xs' : 'light-relevo-card'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
            <h3 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Oportunidades de Economia
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('search')}
            className="text-[11px] font-medium text-[#FF6B00] hover:text-[#E05D00] flex items-center space-x-0.5"
          >
            <span>Ver tudo</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {topDeals.length === 0 ? (
          <div className={`p-5 border rounded-xl border-dashed text-center space-y-2 ${
            isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <ShoppingBag className="w-6 h-6 text-neutral-400 mx-auto stroke-[1.5]" />
            <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Nenhum produto cadastrado no catálogo ainda
            </p>
            <p className={`text-[11px] max-w-xs mx-auto leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              O catálogo de produtos e os comparativos de preços da sua região serão formados conforme você cadastrar compras.
            </p>
            <button
              type="button"
              onClick={onOpenScanner}
              className={`mt-1 inline-flex items-center space-x-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-xl transition-all ${
                isDark ? 'bg-[#FF6B00] hover:bg-[#E05D00]' : 'light-relevo-btn-primary hover:brightness-105'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Cadastrar Primeira Compra</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {topDeals.map((prod) => {
              const economiaItem = prod.precoMedioRegional - prod.precoMinimoRegional;
              const pctDesconto = Math.round((economiaItem / prod.precoMedioRegional) * 100);

              return (
                <div
                  key={prod.id}
                  onClick={() => {
                    onSelectProduto(prod);
                    onNavigateTab('search');
                  }}
                  className={`p-3 border rounded-xl cursor-pointer transition-all space-y-2 group min-w-0 ${
                    isDark
                      ? 'bg-[#0F0F12] hover:bg-[#27272A] border-[#27272A]'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-base shrink-0 ${
                      isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200 shadow-2xs'
                    }`}>
                      {prod.imagem || '🛒'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="text-[9px] font-semibold text-[#FF6B00] bg-[#FF6B00]/10 px-1.5 py-0.2 rounded border border-[#FF6B00]/20 inline-block shrink-0">
                          -{pctDesconto}%
                        </span>
                        <span className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          {prod.melhorLoja}
                        </span>
                      </div>
                      <h3 className={`font-semibold text-xs truncate group-hover:text-[#FF6B00] transition-colors mt-0.5 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {prod.nome}
                      </h3>
                    </div>
                  </div>

                  <div className={`pt-2 border-t flex items-center justify-between text-xs min-w-0 ${
                    isDark ? 'border-[#27272A]' : 'border-slate-200/60'
                  }`}>
                    <div className="flex items-baseline space-x-1.5 shrink-0">
                      <span className={`text-[10px] line-through ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                        {formatarMoeda(prod.precoMedioRegional)}
                      </span>
                      <span className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatarMoeda(prod.precoMinimoRegional)}
                      </span>
                    </div>

                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap shrink-0">
                      Economize {formatarMoeda(economiaItem)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. NEARBY SUPERMARKETS INDEX & REPUTATION */}
      <div className={`p-4 border rounded-2xl space-y-3 transition-all ${
        isDark ? 'bg-[#18181B] border-[#27272A] shadow-xs' : 'light-relevo-card'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <Store className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <h3 className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Supermercados no Seu Bairro
            </h3>
          </div>
          <span className={`text-[11px] font-medium shrink-0 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {estabelecimentos.length} locais
          </span>
        </div>

        <div className="space-y-2">
          {estabelecimentos.length === 0 ? (
            <div className={`p-5 border rounded-xl border-dashed text-center space-y-2 ${
              isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <Store className="w-6 h-6 text-neutral-400 mx-auto stroke-[1.5]" />
              <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Nenhum estabelecimento cadastrado ainda
              </p>
              <p className={`text-[11px] max-w-xs mx-auto leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Os estabelecimentos da sua cidade aparecerão aqui conforme as primeiras notas fiscais forem cadastradas.
              </p>
              <button
                type="button"
                onClick={onOpenScanner}
                className="mt-1 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#FF6B00] hover:bg-[#E05D00] text-white text-xs font-semibold rounded-xl transition-all"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Escanear Primeira Nota</span>
              </button>
            </div>
          ) : (
            estabelecimentos.slice(0, 4).map((est) => {
              const uLat = usuario?.latitude || -21.7946;
              const uLng = usuario?.longitude || -48.1766;
              const dist = est.distanciaKm ?? calcularDistanciaKm(uLat, uLng, est.latitude, est.longitude);

              return (
                <div
                  key={est.id}
                  className={`p-3 border rounded-xl flex items-center justify-between gap-3 min-w-0 ${
                    isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-lg border text-[#FF6B00] flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
                    }`}>
                      <Store className="w-4 h-4 stroke-[1.75px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <h3 className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {est.nome}
                        </h3>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border shrink-0 ${
                          isDark ? 'text-zinc-400 bg-[#18181B] border-[#27272A]' : 'text-slate-600 bg-white border-slate-200'
                        }`}>
                          {est.categoria}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 flex items-center space-x-1 truncate ${
                        isDark ? 'text-zinc-400' : 'text-slate-500'
                      }`}>
                        <MapPin className="w-3 h-3 text-[#FF6B00] shrink-0" />
                        <span className="truncate">{est.bairro} • {dist} km</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                      Preço Justo
                    </span>
                    <span className={`text-[10px] block mt-0.5 truncate ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                      {est.cidade} - SP
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 7. RECENT RECEIPTS STREAM PREVIEW */}
      <div className={`p-4 border rounded-2xl space-y-3 shadow-xs ${
        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Últimos Cupons
          </h3>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-[11px] font-medium text-[#FF6B00] hover:text-[#E05D00] transition-colors shrink-0"
          >
            Ver Histórico
          </button>
        </div>

        {historico.length === 0 ? (
          <div className={`p-4 text-center border rounded-xl space-y-1 ${
            isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Nenhum cupom fiscal escaneado ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {historico.slice(0, 3).map((item) => {
              const status = getStatusPreco(item.preco, item.precoMedioNaData);
              return (
                <div
                  key={item.id}
                  className={`p-3 border rounded-xl flex items-center justify-between gap-3 min-w-0 ${
                    isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
                    }`}>
                      <Tag className="w-3.5 h-3.5 text-[#FF6B00] stroke-[1.75px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-semibold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.nomeProduto}
                      </h3>
                      <p className={`text-[11px] mt-0.5 truncate ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {item.nomeEstabelecimento}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-semibold text-xs block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatarMoeda(item.preco)}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${status.corTexto}`}
                    >
                      {status.rotulo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

