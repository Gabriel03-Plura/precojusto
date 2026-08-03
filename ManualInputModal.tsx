import React, { useState } from 'react';
import { Edit3, Check, X, Store, Tag, DollarSign, MapPin, Sparkles } from 'lucide-react';
import { CategoriaProduto, SampleNFCe } from '../types';
import { classificarCategoriaProduto } from '../utils/categoryClassifier';

interface ManualInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitManualItem: (data: SampleNFCe) => void;
  theme?: 'dark' | 'light';
}

export const ManualInputModal: React.FC<ManualInputModalProps> = ({
  isOpen,
  onClose,
  onSubmitManualItem,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [nomeProduto, setNomeProduto] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [unidade, setUnidade] = useState<'un' | 'kg' | 'g' | 'L' | 'ml' | 'pct' | 'cx'>('un');
  const [categoria, setCategoria] = useState<CategoriaProduto>('Mercearia');
  const [userOverrodeCategory, setUserOverrodeCategory] = useState(false);
  const [nomeLoja, setNomeLoja] = useState('');
  const [bairro, setBairro] = useState('Centro');

  if (!isOpen) return null;

  const categoriasList: CategoriaProduto[] = [
    'Mercearia',
    'Hortifruti',
    'Carnes e Aves',
    'Laticínios e Frios',
    'Bebidas',
    'Mat. Limpeza',
    'Higiene e Perfumaria',
    'Farmácia e Medicamentos',
    'Outros',
  ];

  const handleNomeChange = (val: string) => {
    setNomeProduto(val);
    if (!userOverrodeCategory && val.trim().length >= 2) {
      const autoCat = classificarCategoriaProduto(val);
      if (autoCat && autoCat !== 'Outros') {
        setCategoria(autoCat);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProduto || !preco || !nomeLoja) return;

    const valPreco = parseFloat(preco.replace(',', '.'));
    const valQtd = parseFloat(quantidade) || 1;
    const finalCategory = userOverrodeCategory
      ? categoria
      : classificarCategoriaProduto(nomeProduto, categoria);

    const manualSample: SampleNFCe = {
      id: `manual-${Date.now()}`,
      titulo: 'Registro Manual de Compra',
      descricao: 'Cadastrado manualmente pelo usuário',
      estabelecimento: nomeLoja,
      cnpj: '00.000.000/0000-00',
      cidade: 'Araraquara',
      bairro: bairro || 'Centro',
      total: valPreco * valQtd,
      data: new Date().toISOString().split('T')[0],
      itens: [
        {
          nome: nomeProduto,
          preco: valPreco,
          quantidade: valQtd,
          unidade,
          categoria: finalCategory,
        },
      ],
    };

    onSubmitManualItem(manualSample);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-md animate-fade-in ${
      isDark ? 'bg-black/80 text-slate-100' : 'bg-slate-900/40 text-slate-900'
    }`}>
      <div className={`rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border ${
        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'bg-[#0F0F12] border-[#27272A] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-[#FF6B00] stroke-[1.75px]" />
            <h2 className="font-sora font-extrabold text-base tracking-tight">Inclusão Manual de Preço</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-[#27272A] text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nome do Produto */}
          <div>
            <label className={`block text-xs font-sora font-semibold mb-1.5 ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              Nome do Produto / Item
            </label>
            <input
              type="text"
              value={nomeProduto}
              onChange={(e) => handleNomeChange(e.target.value)}
              required
              placeholder="Ex: Arroz Prato Fino 5kg, Coca Cola 2L, Sabão Omo..."
              className={`w-full px-3.5 py-2.5 text-xs border rounded-xl focus:outline-none focus:border-[#FF6B00] transition-all font-sans ${
                isDark
                  ? 'bg-[#0F0F12] border-[#27272A] text-white placeholder:text-zinc-600'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
              }`}
            />
          </div>

          {/* Preço e Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-sora font-semibold mb-1.5 ${
                isDark ? 'text-zinc-400' : 'text-slate-600'
              }`}>
                Preço Pago (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-[#FF6B00] font-sora font-bold">R$</span>
                <input
                  type="text"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  required
                  placeholder="24,90"
                  className={`w-full pl-10 pr-3 py-2.5 text-xs font-sora font-bold border rounded-xl focus:outline-none focus:border-[#FF6B00] transition-all ${
                    isDark
                      ? 'bg-[#0F0F12] border-[#27272A] text-white placeholder:text-zinc-600'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-sora font-semibold mb-1.5 ${
                isDark ? 'text-zinc-400' : 'text-slate-600'
              }`}>
                Unidade
              </label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value as any)}
                className={`w-full px-3 py-2.5 text-xs border rounded-xl focus:outline-none focus:border-[#FF6B00] transition-all font-sans ${
                  isDark
                    ? 'bg-[#0F0F12] border-[#27272A] text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                }`}
              >
                <option value="un">Unidade (un)</option>
                <option value="pct">Pacote (pct)</option>
                <option value="kg">Quilo (kg)</option>
                <option value="g">Grama (g)</option>
                <option value="L">Litro (L)</option>
                <option value="ml">Mililitro (ml)</option>
                <option value="cx">Caixa (cx)</option>
              </select>
            </div>
          </div>

          {/* Categoria */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-xs font-sora font-semibold ${
                isDark ? 'text-zinc-400' : 'text-slate-600'
              }`}>
                Categoria
              </label>
              {!userOverrodeCategory && nomeProduto.trim().length >= 2 && (
                <span className="text-[10px] font-sora font-bold text-[#FF6B00] flex items-center space-x-1 bg-[#FF6B00]/10 px-2 py-0.5 rounded-full border border-[#FF6B00]/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Auto-detectada</span>
                </span>
              )}
            </div>
            <select
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value as CategoriaProduto);
                setUserOverrodeCategory(true);
              }}
              className={`w-full px-3 py-2.5 text-xs border rounded-xl focus:outline-none focus:border-[#FF6B00] transition-all font-sans ${
                isDark
                  ? 'bg-[#0F0F12] border-[#27272A] text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
              }`}
            >
              {categoriasList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Estabelecimento */}
          <div>
            <label className={`block text-xs font-sora font-semibold mb-1.5 ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              Supermercado ou Farmácia
            </label>
            <input
              type="text"
              value={nomeLoja}
              onChange={(e) => setNomeLoja(e.target.value)}
              required
              placeholder="Ex: Supermercado Extra Centro"
              className={`w-full px-3.5 py-2.5 text-xs border rounded-xl focus:outline-none focus:border-[#FF6B00] transition-all font-sans ${
                isDark
                  ? 'bg-[#0F0F12] border-[#27272A] text-white placeholder:text-zinc-600'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
              }`}
            />
          </div>

          {/* Bairro */}
          <div>
            <label className={`block text-xs font-sora font-semibold mb-1.5 ${
              isDark ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              Bairro / Região
            </label>
            <input
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Ex: Centro"
              className={`w-full px-3.5 py-2.5 text-xs border rounded-xl focus:outline-none focus:border-[#FF6B00] transition-all font-sans ${
                isDark
                  ? 'bg-[#0F0F12] border-[#27272A] text-white placeholder:text-zinc-600'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
              }`}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#FF6B00] hover:bg-[#E05D00] text-white font-sora font-bold text-xs rounded-xl shadow-md shadow-[#FF6B00]/20 transition-all flex items-center justify-center space-x-2 mt-2 active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2px]" />
            <span>Comparar com Média Regional</span>
          </button>
        </form>
      </div>
    </div>
  );
};
