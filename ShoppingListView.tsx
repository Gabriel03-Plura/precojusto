import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  Circle,
  Share2,
  Sparkles,
  Store,
  TrendingDown,
  DollarSign,
  Info,
  ChevronRight,
  Search,
  Zap,
  ListPlus,
  Copy,
  AlertCircle,
  X,
  Tag,
} from 'lucide-react';
import { ItemListaCompras, Produto, CategoriaProduto } from '../types';
import { formatarMoeda } from '../utils/location';
import { ToastDataPriceDrop } from './PriceDropToast';

interface ShoppingListViewProps {
  produtos: Produto[];
  lista: ItemListaCompras[];
  onAddItem: (item: Omit<ItemListaCompras, 'id'>) => void;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onClearList: () => void;
  onClearCompleted: () => void;
  onAddTemplateList: (templateItems: Omit<ItemListaCompras, 'id'>[]) => void;
  onTriggerPriceDropToast?: (data: ToastDataPriceDrop) => void;
  theme?: 'dark' | 'light';
}

const UNITS = ['un', 'kg', 'g', 'L', 'ml', 'pct', 'cx'];

const TEMPLATES: { name: string; icon: string; desc: string; items: { name: string; qty: number; unit: string; cat: CategoriaProduto }[] }[] = [
  {
    name: 'Cesta Básica Essencial',
    icon: '🛒',
    desc: 'Itens de primeira necessidade da semana',
    items: [
      { name: 'Arroz Tipo 1 5kg', qty: 1, unit: 'pct', cat: 'Mercearia' },
      { name: 'Feijão Carioca 1kg', qty: 2, unit: 'pct', cat: 'Mercearia' },
      { name: 'Óleo de Soja 900ml', qty: 2, unit: 'un', cat: 'Mercearia' },
      { name: 'Açúcar Refinado 1kg', qty: 2, unit: 'pct', cat: 'Mercearia' },
      { name: 'Café Torrado e Moído 500g', qty: 2, unit: 'pct', cat: 'Mercearia' },
      { name: 'Leite Integral 1L', qty: 6, unit: 'L', cat: 'Laticínios e Frios' },
    ],
  },
  {
    name: 'Feira Hortifruti',
    icon: '🍎',
    desc: 'Frutas, legumes e verduras frescas',
    items: [
      { name: 'Banana Prata', qty: 1, unit: 'kg', cat: 'Hortifruti' },
      { name: 'Tomate Italiano', qty: 1, unit: 'kg', cat: 'Hortifruti' },
      { name: 'Cebola', qty: 1, unit: 'kg', cat: 'Hortifruti' },
      { name: 'Batata Monalisa', qty: 2, unit: 'kg', cat: 'Hortifruti' },
      { name: 'Maçã Fuji', qty: 1, unit: 'kg', cat: 'Hortifruti' },
    ],
  },
  {
    name: 'Kit de Limpeza',
    icon: '🧹',
    desc: 'Produtos essenciais para casa',
    items: [
      { name: 'Detergente Líquido 500ml', qty: 3, unit: 'un', cat: 'Mat. Limpeza' },
      { name: 'Sabão em Pó 1.6kg', qty: 1, unit: 'cx', cat: 'Mat. Limpeza' },
      { name: 'Amaciante Concentrado 500ml', qty: 1, unit: 'un', cat: 'Mat. Limpeza' },
      { name: 'Papel Higiênico Folha Dupla 12un', qty: 1, unit: 'pct', cat: 'Mat. Limpeza' },
    ],
  },
];

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  produtos,
  lista,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onUpdateQuantity,
  onClearList,
  onClearCompleted,
  onAddTemplateList,
  onTriggerPriceDropToast,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  // Input form state
  const [itemNameInput, setItemNameInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemUnit, setItemUnit] = useState<string>('un');
  const [itemCategory, setItemCategory] = useState<CategoriaProduto>('Mercearia');
  const [customPriceInput, setCustomPriceInput] = useState<string>('');
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('Todas');

  // Trigger price drop toast check
  const handleCheckPriceDrops = () => {
    if (!onTriggerPriceDropToast) return;

    for (const item of lista) {
      const match = produtos.find(
        (p) =>
          p.id === item.produtoId ||
          p.nome.toLowerCase().includes(item.nome.toLowerCase()) ||
          item.nome.toLowerCase().includes(p.nome.toLowerCase())
      );

      const minPrice = match ? match.precoMinimoRegional : (item.precoMinimoEstimado || item.precoMedioEstimado * 0.82);
      const prevPrice = item.precoMedioEstimado > 0 ? item.precoMedioEstimado : (minPrice * 1.22);

      if (minPrice > 0 && minPrice < prevPrice) {
        const econ = Math.round((prevPrice - minPrice) * 100) / 100;
        const pct = Math.round((econ / prevPrice) * 100);
        onTriggerPriceDropToast({
          id: item.id,
          itemNome: item.nome,
          lojaNome: match?.melhorLoja || item.melhorLojaEstimada || 'Atacadão Regional',
          precoAnterior: prevPrice,
          precoNovoMinimo: minPrice,
          economia: econ,
          descontoPorcentagem: pct > 0 ? pct : 15,
        });
        return;
      }
    }

    if (lista.length > 0) {
      const first = lista[0];
      const prevP = first.precoMedioEstimado || 28.90;
      const minP = Number((prevP * 0.82).toFixed(2));
      const econ = Number((prevP - minP).toFixed(2));
      onTriggerPriceDropToast({
        id: first.id,
        itemNome: first.nome,
        lojaNome: first.melhorLojaEstimada || 'Atacadão Regional',
        precoAnterior: prevP,
        precoNovoMinimo: minP,
        economia: econ,
        descontoPorcentagem: 18,
      });
    }
  };

  // Matching catalog suggestions as user types
  const suggestions = useMemo(() => {
    if (!itemNameInput.trim() || itemNameInput.length < 2) return [];
    return produtos
      .filter((p) => p.nome.toLowerCase().includes(itemNameInput.toLowerCase()))
      .slice(0, 5);
  }, [itemNameInput, produtos]);

  // Handle selecting a catalog suggestion
  const handleSelectSuggestion = (prod: Produto) => {
    setSelectedProduct(prod);
    setItemNameInput(prod.nome);
    setItemUnit(prod.unidadeMedida);
    setItemCategory(prod.categoria);
    setCustomPriceInput(prod.precoMedioRegional.toString());
    setShowSuggestions(false);
  };

  // Submit adding item to list
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemNameInput.trim()) return;

    let precoMedio = selectedProduct ? selectedProduct.precoMedioRegional : 0;
    let precoMinimo = selectedProduct ? selectedProduct.precoMinimoRegional : 0;
    let melhorLoja = selectedProduct ? selectedProduct.melhorLoja : undefined;

    // If custom price manually entered
    if (customPriceInput && !isNaN(parseFloat(customPriceInput))) {
      precoMedio = parseFloat(customPriceInput);
      if (precoMinimo === 0) precoMinimo = precoMedio;
    }

    onAddItem({
      nome: itemNameInput.trim(),
      quantidade: itemQty > 0 ? itemQty : 1,
      unidadeMedida: itemUnit,
      categoria: itemCategory,
      produtoId: selectedProduct?.id,
      precoMedioEstimado: precoMedio,
      precoMinimoEstimado: precoMinimo,
      melhorLojaEstimada: melhorLoja,
      concluido: false,
    });

    // Reset Form
    setItemNameInput('');
    setSelectedProduct(null);
    setItemQty(1);
    setItemUnit('un');
    setItemCategory('Mercearia');
    setCustomPriceInput('');
    setShowSuggestions(false);
  };

  // Add template list items
  const handleApplyTemplate = (template: typeof TEMPLATES[0]) => {
    const formatted = template.items.map((it) => {
      // Find catalog match if available
      const match = produtos.find((p) => p.nome.toLowerCase().includes(it.name.toLowerCase()));
      return {
        nome: match ? match.nome : it.name,
        quantidade: it.qty,
        unidadeMedida: match ? match.unidadeMedida : it.unit,
        categoria: match ? match.categoria : it.cat,
        produtoId: match?.id,
        precoMedioEstimado: match ? match.precoMedioRegional : 0,
        precoMinimoEstimado: match ? match.precoMinimoRegional : 0,
        melhorLojaEstimada: match?.melhorLoja,
        concluido: false,
      };
    });
    onAddTemplateList(formatted);
  };

  // List calculations
  const totalItens = lista.length;
  const totalConcluidos = lista.filter((i) => i.concluido).length;

  const totalOrcamentoMedio = useMemo(() => {
    return lista.reduce((acc, item) => acc + item.precoMedioEstimado * item.quantidade, 0);
  }, [lista]);

  const totalOrcamentoMinimo = useMemo(() => {
    return lista.reduce((acc, item) => acc + (item.precoMinimoEstimado || item.precoMedioEstimado) * item.quantidade, 0);
  }, [lista]);

  const economiaPotencialTotal = Math.max(0, totalOrcamentoMedio - totalOrcamentoMinimo);

  // Filtered list items by active category filter
  const filteredList = useMemo(() => {
    if (filterCategory === 'Todas') return lista;
    return lista.filter((i) => i.categoria === filterCategory);
  }, [lista, filterCategory]);

  // Group list items by Category
  const groupedByCategory = useMemo(() => {
    const groups: { [key: string]: ItemListaCompras[] } = {};
    filteredList.forEach((item) => {
      const cat = item.categoria || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredList]);

  // Share formatted shopping list
  const handleShareList = () => {
    if (lista.length === 0) return;

    let text = `🛒 *MINHA LISTA DE COMPRAS - PREÇO JUSTO*\n\n`;
    lista.forEach((item, index) => {
      const statusIcon = item.concluido ? '✅' : '▫️';
      const valorItem = item.precoMedioEstimado > 0 
        ? `(~${formatarMoeda(item.precoMedioEstimado * item.quantidade)})`
        : '';
      text += `${statusIcon} ${item.quantidade}${item.unidadeMedida} ${item.nome} ${valorItem}\n`;
    });

    text += `\n💰 *Orçamento Médio Estimado:* ${formatarMoeda(totalOrcamentoMedio)}`;
    if (economiaPotencialTotal > 0) {
      text += `\n🏷️ *Potencial de Economia:* ${formatarMoeda(economiaPotencialTotal)} comprando nas melhores lojas!`;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    }
  };

  return (
    <div className={`space-y-5 animate-fade-in pb-8 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* 1. HEADER TITLE & QUICK OVERVIEW */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>Planejador de Compras</span>
            <span className="text-[10px] font-sora font-bold px-2 py-0.5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/25">
              Médias Regionais NFC-e
            </span>
          </div>
          <h2 className={`text-lg font-sora font-extrabold tracking-tight mt-0.5 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Minha Lista de Compras
          </h2>
        </div>

        {lista.length > 0 && (
          <button
            onClick={handleShareList}
            className={`p-2.5 rounded-2xl border transition-all flex items-center space-x-1.5 shadow-sm text-xs font-sora font-semibold shrink-0 ${
              isDark
                ? 'bg-[#18181B] hover:bg-[#27272A] border-[#27272A] text-slate-300 hover:text-white'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Compartilhar Lista"
          >
            <Share2 className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>
        )}
      </div>

      {/* Copy notification banner */}
      {copiedNotification && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 rounded-2xl text-xs font-sora font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Lista formatada copiada para a área de transferência!</span>
          </div>
          <button onClick={() => setCopiedNotification(false)}>
            <X className="w-4 h-4 text-emerald-500" />
          </button>
        </div>
      )}

      {/* 2. BUDGET SUMMARY CARD */}
      <div className={`p-5 rounded-[28px] border space-y-4 relative overflow-hidden transition-all ${
        isDark
          ? 'bg-[#18181B] text-white border-[#27272A] shadow-xl'
          : 'light-relevo-card text-slate-900'
      }`}>
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#FF6B00]/10 rounded-full blur-2xl pointer-events-none" />

        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-[#27272A]' : 'border-slate-200'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/25 text-[#FF6B00] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 stroke-[1.75px]" />
            </div>
            <div>
              <span className={`text-[10px] font-sora font-bold uppercase tracking-wider block ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}>
                Progresso
              </span>
              <span className={`font-sora font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {totalConcluidos} de {totalItens} {totalItens === 1 ? 'item carrinho' : 'itens no carrinho'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[10px] font-sora font-bold uppercase tracking-wider block ${
              isDark ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Orçamento Estimado
            </span>
            <span className="font-sora font-extrabold text-lg text-[#FF6B00]">
              {formatarMoeda(totalOrcamentoMedio)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {totalItens > 0 && (
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-[#0F0F12] rounded-full overflow-hidden border border-[#27272A]">
              <div
                className="h-full bg-gradient-to-r from-[#FF6B00] to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${totalItens > 0 ? (totalConcluidos / totalItens) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Potential Savings info */}
        {economiaPotencialTotal > 0 && (
          <div className="pt-1 space-y-2">
            <div className="flex items-center justify-between text-xs font-sora bg-[#0F0F12]/80 p-3 rounded-2xl border border-[#27272A]">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-zinc-400 text-[11px]">
                  Melhor compra combinada nas ofertas:
                </span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-emerald-400 text-xs">
                  {formatarMoeda(totalOrcamentoMinimo)}
                </span>
                <span className="text-[9px] text-zinc-400 block">
                  Economia de {formatarMoeda(economiaPotencialTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckPriceDrops}
              className="w-full py-2.5 px-3 bg-[#0F0F12] hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl text-xs font-sora font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98] shadow-sm"
            >
              <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Verificar Notificação de Preço Mínimo (Toast)</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. ADD ITEM INPUT FORM */}
      <form onSubmit={handleFormSubmit} className="p-4 bg-[#18181B] rounded-3xl border border-[#27272A] shadow-sm space-y-3 relative">
        <div className="flex items-center space-x-2">
          <ListPlus className="w-4 h-4 text-[#FF6B00]" />
          <h3 className="font-sora font-extrabold text-xs text-white uppercase tracking-wider">
            Adicionar Item à Lista
          </h3>
        </div>

        <div className="space-y-2.5">
          {/* Item Name Input with live autocomplete suggestions */}
          <div className="relative">
            <input
              type="text"
              value={itemNameInput}
              onChange={(e) => {
                setItemNameInput(e.target.value);
                setShowSuggestions(true);
                if (selectedProduct && e.target.value !== selectedProduct.nome) {
                  setSelectedProduct(null);
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Ex: Leite, Arroz, Café, Detergente..."
              className="w-full px-3.5 py-2.5 bg-[#0F0F12] text-xs font-sans text-white placeholder:text-[#94A3B8] rounded-2xl border border-[#27272A] focus:outline-none focus:border-[#FF6B00] transition-all"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0F0F12] border border-[#FF6B00]/40 rounded-2xl shadow-2xl z-30 divide-y divide-[#27272A] overflow-hidden">
                <div className="p-1.5 text-[9px] font-sora font-bold text-[#FF6B00] bg-[#18181B] uppercase tracking-wider px-3">
                  Produtos no Banco de Dados Regional
                </div>
                {suggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug)}
                    className="w-full px-3 py-2 text-left hover:bg-[#27272A] flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{sug.imagem || '🛒'}</span>
                      <div>
                        <span className="font-sora font-semibold text-white block truncate max-w-[180px]">
                          {sug.nome}
                        </span>
                        <span className="text-[10px] text-zinc-400">{sug.categoria}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-sora font-bold text-[#FF6B00] text-xs block">
                        {formatarMoeda(sug.precoMedioRegional)}
                      </span>
                      <span className="text-[9px] text-zinc-400">Média Regional</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity + Unit + Custom Price Row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400 font-sora font-semibold block mb-1">
                Qtd
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={itemQty}
                onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-[#0F0F12] text-xs font-sora font-bold text-white rounded-xl border border-[#27272A] focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-sora font-semibold block mb-1">
                Unidade
              </label>
              <select
                value={itemUnit}
                onChange={(e) => setItemUnit(e.target.value)}
                className="w-full px-2 py-2 bg-[#0F0F12] text-xs font-sora text-slate-200 rounded-xl border border-[#27272A] focus:outline-none focus:border-[#FF6B00]"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-sora font-semibold block mb-1">
                Preço Est. (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder={selectedProduct ? selectedProduct.precoMedioRegional.toFixed(2) : '0.00'}
                value={customPriceInput}
                onChange={(e) => setCustomPriceInput(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F0F12] text-xs font-sora text-white rounded-xl border border-[#27272A] focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          </div>

          {/* Add Button */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-[#FF6B00] hover:bg-[#E05D00] text-white font-sora font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar à Lista</span>
          </button>
        </div>
      </form>

      {/* 4. PRE-MADE LIST TEMPLATES */}
      {lista.length === 0 && (
        <div className="p-4 bg-[#18181B] rounded-3xl border border-[#27272A] shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#FF6B00]" />
            <h3 className="font-sora font-extrabold text-xs text-white uppercase tracking-wider">
              Listas Prontas Rápidas
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {TEMPLATES.map((tmpl, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#0F0F12] rounded-2xl border border-[#27272A] hover:border-[#FF6B00]/40 transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl p-2 bg-[#18181B] rounded-xl border border-[#27272A]">
                    {tmpl.icon}
                  </span>
                  <div>
                    <h4 className="font-sora font-bold text-xs text-white">
                      {tmpl.name}
                    </h4>
                    <p className="text-[10px] text-zinc-400">{tmpl.desc} • {tmpl.items.length} itens</p>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-3 py-1.5 bg-[#FF6B00]/10 hover:bg-[#FF6B00] text-[#FF6B00] hover:text-white border border-[#FF6B00]/30 rounded-xl text-xs font-sora font-bold transition-all shrink-0"
                >
                  Usar Lista
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SHOPPING LIST ITEMS LISTING */}
      {lista.length > 0 && (
        <div className="space-y-4">
          {/* List actions bar */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-sora font-bold text-zinc-400">
              Itens da Lista ({lista.length})
            </span>

            <div className="flex items-center space-x-2">
              {totalConcluidos > 0 && (
                <button
                  onClick={onClearCompleted}
                  className="text-[10px] font-sora font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Limpar Comprados
                </button>
              )}
              <button
                onClick={onClearList}
                className="text-[10px] font-sora font-semibold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Esvaziar Lista
              </button>
            </div>
          </div>

          {/* Grouped by Category */}
          {(Object.entries(groupedByCategory) as [string, ItemListaCompras[]][]).map(([categoria, items]) => (
            <div key={categoria} className="p-4 bg-[#18181B] rounded-3xl border border-[#27272A] shadow-sm space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-2">
                <span className="text-[11px] font-sora font-extrabold text-[#FF6B00] uppercase tracking-wider">
                  {categoria}
                </span>
                <span className="text-[10px] text-zinc-400 font-sora font-semibold">
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="space-y-2">
                {items.map((item) => {
                  const subtotal = item.precoMedioEstimado * item.quantidade;
                  const matchProd = produtos.find(
                    (p) =>
                      p.id === item.produtoId ||
                      p.nome.toLowerCase().includes(item.nome.toLowerCase()) ||
                      item.nome.toLowerCase().includes(p.nome.toLowerCase())
                  );
                  const minPriceRegional = matchProd ? matchProd.precoMinimoRegional : item.precoMinimoEstimado;
                  const temDescontoMinimo = minPriceRegional > 0 && minPriceRegional < item.precoMedioEstimado;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        temDescontoMinimo && !item.concluido
                          ? 'bg-[#0F0F12] border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                          : item.concluido
                          ? 'bg-[#0F0F12]/40 border-[#27272A] opacity-60'
                          : 'bg-[#0F0F12] border-[#27272A] hover:border-slate-700'
                      }`}
                    >
                      {/* Checkbox & Item Name */}
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <button
                          onClick={() => onToggleItem(item.id)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                            item.concluido
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-600 text-transparent hover:border-[#FF6B00]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </button>

                        <div className="min-w-0">
                          <span
                            className={`font-sora font-bold text-xs block truncate ${
                              item.concluido ? 'line-through text-slate-400' : 'text-white'
                            }`}
                          >
                            {item.nome}
                          </span>

                          <div className="flex items-center space-x-2 text-[10px] text-zinc-400 mt-0.5">
                            <span>
                              {item.quantidade} {item.unidadeMedida}
                            </span>
                            {item.melhorLojaEstimada && (
                              <span className="text-emerald-400 truncate max-w-[120px]">
                                • {item.melhorLojaEstimada}
                              </span>
                            )}
                          </div>

                          {temDescontoMinimo && !item.concluido && (
                            <div className="mt-1 flex items-center space-x-1 text-[9px] font-sora font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 w-fit">
                              <TrendingDown className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>Mínimo Regional: {formatarMoeda(minPriceRegional)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Item Subtotal & Quantity controls */}
                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <span className="font-sora font-extrabold text-xs text-[#FF6B00] block">
                            {subtotal > 0 ? formatarMoeda(subtotal) : 'Preço N/D'}
                          </span>
                          {item.quantidade > 1 && subtotal > 0 && (
                            <span className="text-[9px] text-zinc-400">
                              ({formatarMoeda(item.precoMedioEstimado)}/un)
                            </span>
                          )}
                        </div>

                        {/* Quantity decrement/increment */}
                        <div className="flex items-center space-x-1 bg-[#18181B] p-1 rounded-xl border border-[#27272A]">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-5 h-5 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="text-[10px] font-sora font-bold text-white px-1">
                            {item.quantidade}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-5 h-5 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
