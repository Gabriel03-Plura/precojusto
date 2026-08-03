import React, { useState, useMemo } from 'react';
import {
  History,
  Calendar,
  Filter,
  ShoppingBag,
  Trash2,
  QrCode,
  Edit3,
  Sparkles,
  ChevronLeft,
  SlidersHorizontal,
  ChevronDown,
  Tag,
  PieChart as ChartIcon,
  Receipt,
  TrendingUp,
  TrendingDown,
  Download,
  FileSpreadsheet,
  ArrowUpRight,
  Wallet,
  CloudOff,
  Database,
  RefreshCw,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { RegistroPreco, CategoriaProduto } from '../types';
import { formatarMoeda, getStatusPreco } from '../utils/location';

interface HistoryViewProps {
  historico: RegistroPreco[];
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  theme?: 'dark' | 'light';
  onOpenOfflineRecords?: () => void;
  pendingOfflineRecordsCount?: number;
}

const COLOR_MAP: Record<string, string> = {
  'Mercearia': '#FF6B00',
  'Hortifruti': '#FB923C',
  'Carnes e Aves': '#E05D00',
  'Laticínios e Frios': '#C2410C',
  'Bebidas': '#F59E0B',
  'Mat. Limpeza': '#38BDF8',
  'Higiene e Perfumaria': '#C084FC',
  'Farmácia e Medicamentos': '#F43F5E',
  'Outros': '#64748B',
};

// Custom Tooltip for AreaChart
const SavingsTooltip = ({ active, payload, label, isDark = true }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={`p-3.5 rounded-2xl shadow-2xl border space-y-1.5 font-sans text-xs ${
        isDark ? 'bg-[#18181B] text-white border-[#27272A]' : 'bg-white text-slate-900 border-slate-200'
      }`}>
        <p className="font-sora font-extrabold text-[#FF6B00] text-[11px] uppercase tracking-wider">
          Mês de {label}
        </p>
        <div className="flex items-center justify-between gap-5">
          <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Economia Obtida:</span>
          <span className="font-sora font-extrabold text-[#FF6B00] text-sm">
            {formatarMoeda(data.economia)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-5 text-[11px]">
          <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>Volume Comprado:</span>
          <span className={`font-sora font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            {formatarMoeda(data.gastos)}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const HistoryView: React.FC<HistoryViewProps> = ({
  historico,
  onDeleteRecord,
  onClearAll,
  theme = 'dark',
  onOpenOfflineRecords,
  pendingOfflineRecordsCount = 0,
}) => {
  const isDark = theme === 'dark';
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '12M' | 'max'>('3M');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);

  // Filter history based on timeframe
  const historicoFiltrado = useMemo(() => {
    const agora = Date.now();
    const diaMs = 24 * 60 * 60 * 1000;

    let limiteMs = 365 * diaMs * 10; // default max
    if (timeframe === '1M') limiteMs = 30 * diaMs;
    if (timeframe === '3M') limiteMs = 90 * diaMs;
    if (timeframe === '6M') limiteMs = 180 * diaMs;
    if (timeframe === '12M') limiteMs = 365 * diaMs;

    return historico.filter((rec) => {
      const dataRec = new Date(rec.data).getTime();
      const matchesTime = agora - dataRec <= limiteMs;
      const matchesCat = filtroCategoria === 'Todas' || rec.categoria === filtroCategoria;
      const matchesSlice = !selectedSlice || rec.categoria === selectedSlice;
      return matchesTime && matchesCat && matchesSlice;
    });
  }, [historico, timeframe, filtroCategoria, selectedSlice]);

  // Total metrics
  const totalGasto = useMemo(() => {
    return historicoFiltrado.reduce((acc, rec) => acc + rec.preco * rec.quantidade, 0);
  }, [historicoFiltrado]);

  const totalEconomizado = useMemo(() => {
    return historicoFiltrado.reduce((acc, rec) => {
      const diff = (rec.precoMedioNaData - rec.preco) * rec.quantidade;
      return acc + (diff > 0 ? diff : 0);
    }, 0);
  }, [historicoFiltrado]);

  const percentualEconomia = totalGasto > 0 ? Math.round((totalEconomizado / totalGasto) * 100) : 0;

  // Generate category pie data
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};

    historico.forEach((rec) => {
      const cat = rec.categoria || 'Outros';
      const val = rec.preco * rec.quantidade;
      map[cat] = (map[cat] || 0) + val;
    });

    if (Object.keys(map).length === 0) {
      return [];
    }

    return Object.entries(map).map(([catName, val]) => ({
      name: catName,
      value: Number(val.toFixed(2)),
      color: COLOR_MAP[catName] || '#06b6d4',
    }));
  }, [historico]);

  const displayTotal = totalGasto;

  // Generate monthly savings data for the Recharts AreaChart
  const monthlyData = useMemo(() => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const hoje = new Date();
    const result: { mes: string; economia: number; gastos: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesIndex = d.getMonth();
      const ano = d.getFullYear();
      const label = meses[mesIndex];

      const itemDoMes = historico.filter((rec) => {
        const recDate = new Date(rec.data);
        return recDate.getMonth() === mesIndex && recDate.getFullYear() === ano;
      });

      const ec = itemDoMes.reduce((acc, r) => {
        const diff = (r.precoMedioNaData - r.preco) * r.quantidade;
        return acc + (diff > 0 ? diff : 0);
      }, 0);

      const gst = itemDoMes.reduce((acc, r) => acc + r.preco * r.quantidade, 0);

      result.push({
        mes: label,
        economia: Number(ec.toFixed(2)),
        gastos: Number(gst.toFixed(2)),
      });
    }

    return result;
  }, [historico]);

  const economiaUltimoMes = monthlyData[monthlyData.length - 1]?.economia || 0;
  const economiaMesAnterior = monthlyData[monthlyData.length - 2]?.economia || 0;
  const variacaoPercentual = economiaMesAnterior > 0
    ? Math.round(((economiaUltimoMes - economiaMesAnterior) / economiaMesAnterior) * 100)
    : 0;
  const totalEconomizado6Meses = monthlyData.reduce((acc, d) => acc + d.economia, 0);

  const exportarParaCSV = () => {
    const dadosParaExportar = historicoFiltrado.length > 0 ? historicoFiltrado : historico;
    if (dadosParaExportar.length === 0) return;

    const cabecalhos = [
      'Data',
      'Produto',
      'Categoria',
      'Estabelecimento',
      'Quantidade',
      'Unidade',
      'Preço Unitário (R$)',
      'Total Pago (R$)',
      'Preço Médio Regional (R$)',
      'Origem',
    ];

    const linhas = dadosParaExportar.map((rec) => [
      `"${rec.data}"`,
      `"${(rec.nomeProduto || '').replace(/"/g, '""')}"`,
      `"${(rec.categoria || 'Outros').replace(/"/g, '""')}"`,
      `"${(rec.nomeEstabelecimento || '').replace(/"/g, '""')}"`,
      rec.quantidade,
      `"${rec.unidadeMedida || 'un'}"`,
      rec.preco.toFixed(2).replace('.', ','),
      (rec.preco * rec.quantidade).toFixed(2).replace('.', ','),
      (rec.precoMedioNaData || 0).toFixed(2).replace('.', ','),
      `"${rec.origem || 'qrcode'}"`,
    ]);

    const csvContent =
      '\uFEFF' + [cabecalhos.join(';'), ...linhas.map((l) => l.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `precojusto_gastos_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-5 pb-20 animate-fade-in ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Top Main Heading */}
      <div className="text-center space-y-1 py-1">
        <h2 className={`text-xl font-sora font-extrabold tracking-tight flex items-center justify-center space-x-2 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          <History className="w-5 h-5 text-[#FF6B00] stroke-[1.75px]" />
          <span>Histórico de Compras NFC-e</span>
        </h2>
        <p className={`text-xs max-w-xs mx-auto leading-relaxed ${
          isDark ? 'text-[#94A3B8]' : 'text-slate-600'
        }`}>
          Acompanhe a sua evolução de economia mensal e o detalhamento de cupons.
        </p>
      </div>

      {/* OFFLINE RECORDS QUICK ACCESS CARD */}
      {onOpenOfflineRecords && (
        <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
          isDark ? 'bg-[#18181B] border-[#27272A]' : 'light-relevo-card'
        }`}>
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <CloudOff className="w-4 h-4 stroke-[2px] animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className={`font-sora font-extrabold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Registros de Preços Off-line
                </span>
                {pendingOfflineRecordsCount > 0 && (
                  <span className="bg-amber-500/20 text-amber-500 text-[10px] font-sora font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                    {pendingOfflineRecordsCount} pendentes
                  </span>
                )}
              </div>
              <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Visualizar, gerenciar e sincronizar pesquisas salvas sem internet
              </p>
            </div>
          </div>

          <button
            onClick={onOpenOfflineRecords}
            className={`px-3 py-1.5 font-sora font-bold text-xs rounded-xl transition-all shrink-0 flex items-center space-x-1 ${
              isDark
                ? 'bg-[#0F0F12] hover:bg-[#27272A] text-white border border-[#27272A]'
                : 'light-relevo-btn-primary hover:brightness-105'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Ver Registros</span>
          </button>
        </div>
      )}

      {/* DASHBOARD: Monthly Savings Recharts AreaChart Card */}
      <div className={`rounded-[28px] p-5 border space-y-4 relative overflow-hidden transition-all ${
        isDark
          ? 'bg-[#18181B] text-white border-[#27272A] shadow-xl'
          : 'light-relevo-card text-slate-900'
      }`}>
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Dashboard Top Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-[#27272A]' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-pulse shadow-[0_0_8px_#FF6B00]" />
              <h3 className={`text-sm font-sora font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Dashboard de Economia Mensal
              </h3>
            </div>
            <p className={`text-[11px] font-normal mt-0.5 ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Evolução da sua poupança com ofertas locais
            </p>
          </div>

          <span className="text-[10px] font-sora font-bold text-[#FF6B00] bg-[#FF6B00]/10 px-2.5 py-1 rounded-full border border-[#FF6B00]/25 flex items-center space-x-1 shadow-sm">
            <ArrowUpRight className="w-3 h-3 text-[#FF6B00]" />
            <span>+{variacaoPercentual}% Mês</span>
          </span>
        </div>

        {/* Fintech KPI Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className={`p-3.5 rounded-2xl border space-y-1 ${
            isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-[10px] uppercase font-sora font-bold block tracking-wider ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Economia no Mês
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-sora font-extrabold text-[#FF6B00] tracking-tight">
                {formatarMoeda(economiaUltimoMes)}
              </span>
            </div>
          </div>

          <div className={`p-3.5 rounded-2xl border space-y-1 ${
            isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-[10px] uppercase font-sora font-bold block tracking-wider ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Total 6 Meses
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-lg font-sora font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {formatarMoeda(totalEconomizado6Meses)}
              </span>
            </div>
          </div>
        </div>

        {/* Recharts AreaChart Section */}
        <div className="pt-2 space-y-1">
          <div className={`flex items-center justify-between text-xs font-sora font-semibold px-1 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <span>Tendência de Economia (R$)</span>
            <span className={`text-[10px] font-normal ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Últimos 6 Meses</span>
          </div>

          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEconomia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" opacity={0.8} />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#A1A1AA', fontFamily: 'Sora, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip content={<SavingsTooltip />} />
                <Area
                  type="monotone"
                  dataKey="economia"
                  stroke="#FF6B00"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorEconomia)"
                  activeDot={{ r: 6, fill: '#FF8833', stroke: '#0F0F12', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modern Dark Frame Container */}
      <div className="bg-[#18181B] text-white rounded-[32px] p-5 border border-[#27272A] shadow-2xl space-y-5 relative overflow-hidden">
        {/* Card Internal Top Bar */}
        <div className="flex items-center justify-between text-xs font-sora font-bold text-slate-300 pb-3 border-b border-[#27272A]">
          <button className="p-1 rounded-full hover:bg-[#27272A] text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-sora font-extrabold tracking-wide text-white">Histórico e Categorias</span>
          <button
            onClick={() => {
              setSelectedSlice(null);
              setFiltroCategoria('Todas');
            }}
            className="p-1.5 rounded-xl bg-[#0F0F12] hover:bg-[#27272A] text-slate-300 hover:text-white border border-[#27272A] transition-colors"
            title="Resetar filtros"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section Title & Subtitle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-sora font-bold text-white tracking-tight">Distribuição de Gastos</h3>
            <p className="text-[11px] text-zinc-400 font-normal mt-0.5">Divisão por Categoria</p>
          </div>

          <div className="flex items-center space-x-1 text-xs font-sora font-semibold text-slate-300 bg-[#0F0F12] px-3 py-1 rounded-full border border-[#27272A]">
            <span>Ano 2026</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Donut Chart with Center Display */}
        <div className="relative h-60 w-full flex items-center justify-center py-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                onClick={(entry) => {
                  if (selectedSlice === entry.name) {
                    setSelectedSlice(null);
                  } else {
                    setSelectedSlice(entry.name);
                  }
                }}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#0F0F12"
                    strokeWidth={2}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [formatarMoeda(val), 'Valor Total']}
                contentStyle={{
                  backgroundColor: '#18181B',
                  borderColor: '#27272A',
                  borderRadius: '16px',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Central hole text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none space-y-0.5">
            <span className="block text-2xl font-sora font-extrabold text-[#FF6B00] tracking-tight">
              {percentualEconomia}%
            </span>
            <span className="block text-xs font-sora font-bold text-white">
              {formatarMoeda(totalEconomizado)}
            </span>
            <span className="block text-[10px] uppercase tracking-wider font-sora font-bold text-zinc-400">
              Economia
            </span>
          </div>
        </div>

        {/* Total Valor Box */}
        <div className="bg-[#0F0F12] p-4 rounded-2xl border border-[#27272A] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-sora font-bold tracking-widest text-zinc-400 block mb-0.5">
              Total Registrado
            </span>
            <span className="text-2xl font-sora font-extrabold text-white tracking-tight">
              {formatarMoeda(displayTotal)}
            </span>
          </div>

          <button className="w-10 h-10 rounded-xl bg-[#18181B] border border-[#27272A] text-[#FF6B00] flex items-center justify-center shadow-md">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Category Legend */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-1">
          {pieData.map((item) => {
            const isSelected = selectedSlice === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setSelectedSlice(isSelected ? null : item.name)}
                className={`flex items-center space-x-2 text-left p-1.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#0F0F12] ring-1 ring-[#FF6B00]/50'
                    : 'hover:bg-[#0F0F12]/60'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-white/10"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-xs font-sora font-bold text-slate-200 truncate">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Timeframe Pill Selectors */}
        <div className="pt-3 border-t border-[#27272A] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sora font-bold text-slate-300 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Filtrar por Período</span>
            </span>

            {historico.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-sora font-bold transition-colors"
              >
                Limpar Tudo
              </button>
            )}
          </div>

          <div className="flex items-center justify-between space-x-1.5 bg-[#0F0F12] p-1.5 rounded-2xl border border-[#27272A]">
            {(['1M', '3M', '6M', '12M', 'max'] as const).map((tf) => {
              const labelMap = {
                '1M': 'De 1M',
                '3M': '3M',
                '6M': '6M',
                '12M': '12M',
                'max': 'Máximo',
              };
              const isActive = timeframe === tf;
              return (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`flex-1 py-1.5 text-xs font-sora font-bold rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#FF6B00] text-white shadow-md font-extrabold'
                      : 'text-zinc-400 hover:text-slate-200'
                  }`}
                >
                  {labelMap[tf]}
                </button>
              );
            })}
          </div>
        </div>

        {/* CSV Export Action Card */}
        <div className="pt-3 border-t border-[#27272A] flex items-center justify-between bg-[#0F0F12] p-3.5 rounded-2xl border border-[#27272A]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-xs font-sora font-extrabold text-white block leading-none">
                Exportar Estatísticas
              </span>
              <span className="text-[10px] text-zinc-400 font-normal">
                Planilha CSV com seus cupons
              </span>
            </div>
          </div>

          <button
            onClick={exportarParaCSV}
            id="download-csv-card-btn"
            className="px-3.5 py-2 bg-[#FF6B00] hover:bg-[#E05D00] text-white font-sora font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar CSV</span>
          </button>
        </div>
      </div>

      {/* Detailed NFC-e Transactions List below */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-sora font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
            <History className="w-4 h-4 text-[#FF6B00]" />
            <span>Itens Registrados ({historicoFiltrado.length})</span>
          </h4>

          <div className="flex items-center space-x-2">
            {selectedSlice && (
              <span className="text-[11px] font-sora font-bold text-white bg-[#FF6B00] px-2.5 py-0.5 rounded-full">
                Filtro: {selectedSlice}
              </span>
            )}

            <button
              onClick={exportarParaCSV}
              id="export-csv-btn"
              className="flex items-center space-x-1 px-2.5 py-1 bg-[#18181B] hover:bg-[#27272A] border border-[#27272A] text-[#FF6B00] font-sora font-bold text-[11px] rounded-lg transition-all"
              title="Baixar planilha de gastos CSV"
            >
              <Download className="w-3 h-3 text-[#FF6B00]" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {historicoFiltrado.length === 0 ? (
          <div className="p-6 text-center bg-[#18181B] rounded-3xl border border-[#27272A] space-y-2">
            <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="font-sora font-bold text-slate-300 text-xs">
              Nenhum item encontrado no período ({timeframe})
            </h3>
            <p className="text-[11px] text-zinc-500">
              Escaneie uma NFC-e para adicionar cupons e produtos ao seu histórico.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {historicoFiltrado.map((item) => {
              const statusObj = getStatusPreco(item.preco, item.precoMedioNaData);
              const dataFmt = new Date(item.data).toLocaleDateString('pt-BR');

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-[#18181B] rounded-2xl border border-[#27272A] shadow-sm space-y-2 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 mb-0.5">
                        {item.origem === 'qrcode' && (
                          <span className="flex items-center text-[10px] font-sora font-bold text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-full border border-[#FF6B00]/30">
                            <QrCode className="w-3 h-3 mr-1 text-[#FF6B00]" /> NFC-e
                          </span>
                        )}
                        {item.origem === 'manual' && (
                          <span className="flex items-center text-[10px] font-sora font-bold text-slate-300 bg-[#0F0F12] px-2 py-0.5 rounded-full border border-[#27272A]">
                            <Edit3 className="w-3 h-3 mr-1 text-slate-400" /> Manual
                          </span>
                        )}
                        {item.origem === 'foto_ia' && (
                          <span className="flex items-center text-[10px] font-sora font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-500/30">
                            <Sparkles className="w-3 h-3 mr-1 text-sky-400" /> IA Gemini
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">{dataFmt}</span>
                      </div>

                      <h4 className="font-sora font-bold text-sm text-white leading-tight">
                        {item.nomeProduto}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.nomeEstabelecimento} • {item.quantidade} {item.unidadeMedida}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-sora font-extrabold text-sm text-[#FF6B00] block">
                        {formatarMoeda(item.preco * item.quantidade)}
                      </span>
                      <button
                        onClick={() => onDeleteRecord(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors mt-1"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Price Status Badge */}
                  <div
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs font-sora font-semibold ${statusObj.corBg} ${statusObj.corBorda} ${statusObj.corTexto}`}
                  >
                    <span>{statusObj.rotulo}</span>
                    <span className="text-[11px] opacity-80 font-normal">
                      Média: {formatarMoeda(item.precoMedioNaData)}
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
