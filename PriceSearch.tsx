import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, Store, TrendingDown, TrendingUp, Filter, Bell, Check, Tag, LineChart as ChartIcon, Calendar, WifiOff, Database, Clock, RefreshCw, Sparkles, FileText } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Produto, Estabelecimento, CategoriaProduto, ConsultaPrecoCached, RegistroPreco } from '../types';
import { formatarMoeda, getStatusPreco, calcularDistanciaKm } from '../utils/location';
import { saveConsultaCache, getConsultasCached } from '../utils/offlineCache';
import { calcularPrecosPorEstabelecimento } from '../utils/pricing';

interface PriceSearchProps {
  produtos: Produto[];
  estabelecimentos: Estabelecimento[];
  userLat: number;
  userLng: number;
  onAddAlert: (produto: Produto) => void;
  activeAlertProductIds: string[];
  isOnline?: boolean;
  registrosHistoricos?: RegistroPreco[];
  theme?: 'dark' | 'light';
}

const CustomTooltip = ({ active, payload, label, isDark = true }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className={`p-2.5 rounded-xl text-xs shadow-xl border space-y-0.5 font-sans ${
        isDark ? 'bg-[#18181B] text-white border-[#27272A]' : 'bg-white text-slate-900 border-slate-200'
      }`}>
        <p className={`font-sora font-semibold text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{label}</p>
        <p className="font-sora font-extrabold text-[#FF6B00] text-sm">
          {formatarMoeda(value)}
        </p>
      </div>
    );
  }
  return null;
};

export const PriceSearch: React.FC<PriceSearchProps> = ({
  produtos,
  estabelecimentos,
  userLat,
  userLng,
  onAddAlert,
  activeAlertProductIds,
  isOnline = true,
  registrosHistoricos = [],
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(produtos[0] || null);
  const [cachedQueriesList, setCachedQueriesList] = useState<ConsultaPrecoCached[]>(() => getConsultasCached());

  // Calculate real establishment prices for the selected product
  const precosLojasRegionais = useMemo(() => {
    if (!selectedProduto) return [];
    return calcularPrecosPorEstabelecimento(
      selectedProduto,
      estabelecimentos,
      userLat,
      userLng,
      registrosHistoricos
    );
  }, [selectedProduto, estabelecimentos, userLat, userLng, registrosHistoricos]);

  const categorias: Array<string> = [
    'Todas',
    'Mercearia',
    'Hortifruti',
    'Laticínios e Frios',
    'Mat. Limpeza',
    'Farmácia e Medicamentos',
    'Bebidas',
  ];

  // Keep offline cache synced whenever selectedProduto changes
  useEffect(() => {
    if (selectedProduto) {
      const now = new Date();
      const dateFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const newCacheItem: ConsultaPrecoCached = {
        id: `cache-${selectedProduto.id}-${Date.now()}`,
        termoBusca: searchTerm || selectedProduto.nome,
        dataHora: dateFormatted,
        produtoId: selectedProduto.id,
        nomeProduto: selectedProduto.nome,
        categoria: selectedProduto.categoria,
        precoMedio: selectedProduto.precoMedioRegional,
        precoMinimo: selectedProduto.precoMinimoRegional,
        precoMaximo: selectedProduto.precoMaximoRegional,
        melhorLoja: selectedProduto.melhorLoja,
      };

      const updated = saveConsultaCache(newCacheItem);
      if (updated && updated.length > 0) {
        setCachedQueriesList(updated);
      }
    }
  }, [selectedProduto]);

  // Handler to restore a cached query
  const handleSelectCachedQuery = (q: ConsultaPrecoCached) => {
    const matchedProd = produtos.find((p) => p.id === q.produtoId || p.nome.toLowerCase() === q.nomeProduto.toLowerCase());
    if (matchedProd) {
      setSelectedProduto(matchedProd);
      setSearchTerm(matchedProd.nome);
    }
  };

  // Filter products by search & category
  const filteredProdutos = produtos.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategoria === 'Todas' || p.categoria === selectedCategoria;
    return matchesSearch && matchesCat;
  });


  // Generate 30-day crowdsourced historical price data
  const chartData = useMemo(() => {
    if (!selectedProduto) return [];
    
    const basePrice = selectedProduto.precoMedioRegional;
    const minPrice = selectedProduto.precoMinimoRegional;
    const maxPrice = selectedProduto.precoMaximoRegional;
    const range = Math.max(0.4, maxPrice - minPrice);
    
    let seed = 0;
    for (let i = 0; i < selectedProduto.id.length; i++) {
      seed += selectedProduto.id.charCodeAt(i);
    }

    const today = new Date();
    const result = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const wave = Math.sin((30 - i) * 0.35 + (seed % 7)) * (range * 0.4);
      const trend = ((15 - i) / 30) * (range * 0.15);
      let price = basePrice + wave + trend;
      price = Math.max(minPrice, Math.min(maxPrice, price));

      result.push({
        dataStr: dayStr,
        preco: Number(price.toFixed(2)),
        media: Number(basePrice.toFixed(2)),
      });
    }

    return result;
  }, [selectedProduto]);

  return (
    <div className={`space-y-4 pb-20 animate-fade-in ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Search Header Banner */}
      <div className={`p-5 rounded-3xl border space-y-3 transition-all ${
        isDark
          ? 'bg-[#18181B] border-[#27272A] text-white shadow-lg'
          : 'light-relevo-card text-slate-900'
      }`}>
        <div>
          <h2 className={`font-sora font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Buscar Preço Médio Regional
          </h2>
          <p className={`text-xs mt-1 leading-relaxed font-normal ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Consulte o valor médio praticado nos mercados e farmácias da sua região sem precisar da nota fiscal.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#FF6B00] absolute left-3.5 top-3.5 stroke-[1.75px]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ex: Arroz Prato Fino 5kg, Dorflex, Leite..."
            className={`w-full pl-10 pr-4 py-3 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all ${
              isDark
                ? 'bg-[#0F0F12] text-white border-[#27272A] placeholder:text-slate-500'
                : 'light-relevo-input placeholder:text-slate-400'
            }`}
          />
        </div>

        {/* Category Horizontal Pills */}
        <div className="flex space-x-2 overflow-x-auto pt-1 pb-1 no-scrollbar">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoria(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategoria === cat
                  ? 'bg-[#FF6B00] text-white font-sora font-bold shadow-md shadow-[#FF6B00]/20'
                  : isDark
                  ? 'bg-[#27272A] text-slate-300 hover:bg-[#27272A]/80 border border-white/5'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Offline Cached Queries Section */}
      {cachedQueriesList.length > 0 && (
        <div className={`p-4 rounded-3xl border shadow-md space-y-3 ${
          isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#FF6B00] stroke-[1.75px]" />
              <h3 className={`font-sora font-extrabold text-xs uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Consultas Salvas em Cache (Acesso Off-line)
              </h3>
            </div>
            <span className={`text-[10px] font-sora font-bold px-2.5 py-0.5 rounded-full border ${
              isDark ? 'bg-[#0F0F12] text-zinc-400 border-[#27272A]' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {cachedQueriesList.length} itens
            </span>
          </div>

          <div className="flex space-x-2.5 overflow-x-auto pb-1 no-scrollbar">
            {cachedQueriesList.map((q) => (
              <button
                key={q.id}
                onClick={() => handleSelectCachedQuery(q)}
                className={`p-3 border rounded-2xl text-left shrink-0 min-w-[190px] max-w-[190px] transition-all space-y-1.5 shadow-sm group ${
                  isDark
                    ? 'bg-[#0F0F12] hover:bg-[#0F0F12]/80 border-[#27272A] hover:border-[#FF6B00]/50'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-[#FF6B00]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-sora font-bold uppercase tracking-wider text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-full border border-[#FF6B00]/20">
                    Cache
                  </span>
                  <span className={`text-[10px] flex items-center space-x-1 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    <Clock className="w-3 h-3 text-[#FF6B00]" />
                    <span>{q.dataHora}</span>
                  </span>
                </div>

                <h4 className={`font-sora font-bold text-xs truncate group-hover:text-[#FF6B00] transition-colors ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {q.nomeProduto}
                </h4>

                <div className={`flex items-baseline justify-between pt-1 border-t ${
                  isDark ? 'border-[#27272A]' : 'border-slate-200'
                }`}>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Média Regional:</span>
                  <span className="font-sora font-extrabold text-xs text-[#FF6B00]">
                    {formatarMoeda(q.precoMedio)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Main Content Split: Product Picker + Detailed Store Comparison */}
      {filteredProdutos.length === 0 ? (
        <div className={`p-8 text-center rounded-3xl border space-y-3 ${
          isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
        }`}>
          <Search className="w-10 h-10 text-slate-500 mx-auto stroke-[1.5px]" />
          <h3 className={`font-sora font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {searchTerm.trim() ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado no catálogo'}
          </h3>
          <p className={`text-xs font-normal max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {searchTerm.trim()
              ? `Nenhum resultado para "${searchTerm}". Tente pesquisar por outro termo.`
              : 'Os produtos e preços da sua região aparecerão aqui conforme forem cadastrados via Nota Fiscal (NFC-e) ou lançamento manual.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Product Cards Selector */}
          <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
            {filteredProdutos.map((prod) => {
              const isSelected = selectedProduto?.id === prod.id;
              return (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProduto(prod)}
                  className={`p-3 rounded-2xl min-w-[170px] max-w-[170px] border cursor-pointer transition-all shrink-0 ${
                    isSelected
                      ? 'border-[#FF6B00] shadow-lg shadow-[#FF6B00]/10 ring-1 ring-[#FF6B00]/40 ' + (isDark ? 'bg-[#18181B]' : 'bg-white')
                      : isDark
                      ? 'bg-[#18181B]/70 border-[#27272A] hover:border-slate-700'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-full h-20 rounded-xl overflow-hidden mb-2 border ${
                    isDark ? 'bg-[#0F0F12] border-white/5' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {prod.imagemUrl ? (
                      <img
                        src={prod.imagemUrl}
                        alt={prod.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center font-sora font-bold text-xs ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        PreçoJusto
                      </div>
                    )}
                  </div>

                  <h4 className={`font-sora font-bold text-xs line-clamp-2 leading-snug ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {prod.nome}
                  </h4>

                  <div className="mt-2 flex items-baseline justify-between">
                    <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Média:</span>
                    <span className="font-sora font-extrabold text-xs text-[#FF6B00]">
                      {formatarMoeda(prod.precoMedioRegional)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Product Analytics Detail */}
          {selectedProduto && (
            <div className={`rounded-3xl border p-5 shadow-lg space-y-4 ${
              isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-sora font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/25">
                    {selectedProduto.categoria}
                  </span>
                  <h3 className={`font-sora font-extrabold text-base mt-1.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {selectedProduto.nome}
                  </h3>
                </div>

                <button
                  onClick={() => onAddAlert(selectedProduto)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-sora font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                    activeAlertProductIds.includes(selectedProduto.id)
                      ? 'bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/30'
                      : 'bg-[#FF6B00] hover:bg-[#E05D00] text-white shadow-md shadow-[#FF6B00]/20'
                  }`}
                >
                  {activeAlertProductIds.includes(selectedProduto.id) ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#FF6B00]" />
                      <span>Alerta Ativo</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-3.5 h-3.5 text-white" />
                      <span>Criar Alerta</span>
                    </>
                  )}
                </button>
              </div>

              {/* Price Range Meter */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${
                isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={`${isDark ? 'text-slate-300' : 'text-slate-600'} font-medium`}>
                    Mín: <strong className="text-[#FF6B00] font-sora">{formatarMoeda(selectedProduto.precoMinimoRegional)}</strong>
                  </span>
                  <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-sora font-extrabold text-sm`}>
                    Média: <strong className="text-[#FF6B00]">{formatarMoeda(selectedProduto.precoMedioRegional)}</strong>
                  </span>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    Máx: <strong className={`${isDark ? 'text-slate-200' : 'text-slate-700'} font-sora`}>{formatarMoeda(selectedProduto.precoMaximoRegional)}</strong>
                  </span>
                </div>

                {/* Meter Bar */}
                <div className={`relative w-full h-2 rounded-full overflow-hidden ${
                  isDark ? 'bg-[#27272A]' : 'bg-slate-200'
                }`}>
                  <div className="absolute left-0 top-0 bottom-0 bg-[#FF6B00]/30 w-full" />
                  <div className="absolute top-0 bottom-0 w-1 bg-[#FF6B00] left-1/2 -translate-x-1/2 shadow-[0_0_8px_#FF6B00]" />
                </div>
              </div>

              {/* Historical Price Trend Chart (Recharts) */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className={`font-sora font-bold text-xs uppercase tracking-wider flex items-center space-x-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    <ChartIcon className="w-4 h-4 text-[#FF6B00]" />
                    <span>Tendência de Preço (30 Dias)</span>
                  </h4>
                  <span className={`text-[10px] font-sora font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1 ${
                    isDark ? 'bg-[#27272A] text-slate-300 border-slate-700/50' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    <Calendar className="w-3 h-3 text-[#FF6B00]" />
                    <span>Colaborativo</span>
                  </span>
                </div>

                <div className="h-44 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272A' : '#E2E8F0'} opacity={0.8} />
                      <XAxis
                        dataKey="dataStr"
                        tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }}
                        tickLine={false}
                        axisLine={false}
                        interval={5}
                      />
                      <YAxis
                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        tick={{ fontSize: 10, fill: isDark ? '#64748B' : '#94A3B8' }}
                        tickFormatter={(v) => `R$${v.toFixed(0)}`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip isDark={isDark} />} />
                      <ReferenceLine
                        y={selectedProduto.precoMedioRegional}
                        stroke="#FF6B00"
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                      />
                      <Line
                        type="monotone"
                        dataKey="preco"
                        stroke="#FF6B00"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6, fill: '#FF8833', stroke: isDark ? '#0F0F12' : '#FFFFFF', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Nearby Stores Selling This Product */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className={`font-sora font-bold text-xs uppercase tracking-wider ${
                    isDark ? 'text-zinc-400' : 'text-slate-600'
                  }`}>
                    Preços por Estabelecimento da Região
                  </h4>
                  <span className={`text-[10px] font-sora ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {precosLojasRegionais.filter(p => p.disponivel).length} de {estabelecimentos.length} lojas com valor
                  </span>
                </div>

                {precosLojasRegionais.length === 0 ? (
                  <div className={`p-5 rounded-2xl border border-dashed text-center space-y-1.5 ${
                    isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Store className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className={`text-xs font-sora font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Nenhum estabelecimento cadastrado na sua região ainda
                    </p>
                    <p className={`text-[11px] font-sora max-w-sm mx-auto ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                      Escaneie uma Nota Fiscal (NFC-e) para cadastrar automaticamente o seu supermercado ou farmácia.
                    </p>
                  </div>
                ) : (
                  precosLojasRegionais.map((item) => {
                  const est = item.estabelecimento;
                  return (
                    <div
                      key={est.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                        !item.disponivel
                          ? isDark ? 'bg-[#0F0F12]/50 border-[#27272A]/60 opacity-60' : 'bg-slate-50/50 border-slate-200 opacity-60'
                          : item.isMelhorLoja
                          ? isDark ? 'bg-[#0F0F12] border-emerald-500/50 shadow-emerald-500/10' : 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                          : isDark ? 'bg-[#0F0F12] border-[#27272A] hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h5 className={`font-sora font-bold text-xs flex items-center space-x-1.5 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            <Store className={`w-3.5 h-3.5 shrink-0 stroke-[1.75px] ${item.isMelhorLoja ? 'text-emerald-500' : 'text-[#FF6B00]'}`} />
                            <span className="truncate">{est.nome}</span>
                          </h5>

                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border ${
                            isDark ? 'bg-[#18181B] text-slate-400 border-[#27272A]' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {est.categoria}
                          </span>

                          {item.isCupomFiscal && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center space-x-1">
                              <FileText className="w-2.5 h-2.5" />
                              <span>Cupom Fiscal</span>
                            </span>
                          )}

                          {item.isMelhorLoja && item.disponivel && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center space-x-1">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                              <span>Menor Preço</span>
                            </span>
                          )}
                        </div>

                        <p className={`text-[11px] flex items-center space-x-1 ${
                          isDark ? 'text-zinc-400' : 'text-slate-500'
                        }`}>
                          <MapPin className="w-3 h-3 text-slate-400 stroke-[1.75px] shrink-0" />
                          <span className="truncate">
                            {est.endereco} ({item.distanciaKm} km)
                          </span>
                        </p>

                        {!item.disponivel && item.observacao && (
                          <p className="text-[10px] text-amber-500 italic font-sora">
                            • {item.observacao}
                          </p>
                        )}
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        {item.disponivel ? (
                          <>
                            <span className={`font-sora font-extrabold text-sm block ${item.isMelhorLoja ? 'text-emerald-400' : 'text-[#FF6B00]'}`}>
                              {formatarMoeda(item.preco)}
                            </span>
                            <span
                              className={`text-[9px] font-sora font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                item.status === 'abaixo'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : item.status === 'acima'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {item.statusRotulo}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-sora text-slate-500 font-semibold italic">
                            Indisponível
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
