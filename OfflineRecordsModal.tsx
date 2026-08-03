import React, { useState, useEffect } from 'react';
import {
  WifiOff,
  Wifi,
  CloudOff,
  CloudUpload,
  CheckCircle2,
  Trash2,
  RefreshCw,
  X,
  Plus,
  ShoppingBag,
  Store,
  Clock,
  Sparkles,
  AlertCircle,
  Database,
  Tag,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RegistroPreco, CategoriaProduto } from '../types';
import {
  getOfflineRegistros,
  markOfflineRegistrosSynced,
  deleteOfflineRegistro,
  saveOfflineRegistro,
} from '../utils/offlineCache';
import { formatarMoeda } from '../utils/location';

interface OfflineRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  theme?: 'dark' | 'light';
  onRecordsUpdated?: () => void;
}

export const OfflineRecordsModal: React.FC<OfflineRecordsModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  theme = 'dark',
  onRecordsUpdated,
}) => {
  const isDark = theme === 'dark';

  const [records, setRecords] = useState<RegistroPreco[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pendente' | 'sincronizado'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Quick manual add offline form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newPreco, setNewPreco] = useState('');
  const [newLoja, setNewLoja] = useState('');
  const [newCategoria, setNewCategoria] = useState<CategoriaProduto>('Mercearia');

  useEffect(() => {
    if (isOpen) {
      const stored = getOfflineRegistros();
      setRecords(stored);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingRecords = records.filter((r) => r.statusSincronizacao === 'pendente' || !r.statusSincronizacao);
  const syncedRecords = records.filter((r) => r.statusSincronizacao === 'sincronizado');

  const filteredRecords = records.filter((r) => {
    if (activeFilter === 'pendente') return r.statusSincronizacao === 'pendente' || !r.statusSincronizacao;
    if (activeFilter === 'sincronizado') return r.statusSincronizacao === 'sincronizado';
    return true;
  });

  const handleSyncAll = async () => {
    if (pendingRecords.length === 0) return;
    setIsSyncing(true);
    setSyncSuccessMsg(null);

    // Simulate batch cloud sync with slight network delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const updated = markOfflineRegistrosSynced();
    setRecords(updated);
    setIsSyncing(false);
    setSyncSuccessMsg(`${pendingRecords.length} ${pendingRecords.length === 1 ? 'registro sincronizado' : 'registros sincronizados'} com sucesso!`);

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    if (onRecordsUpdated) onRecordsUpdated();

    setTimeout(() => {
      setSyncSuccessMsg(null);
    }, 4000);
  };

  const handleSyncSingle = async (id: string) => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const updated = markOfflineRegistrosSynced([id]);
    setRecords(updated);
    setIsSyncing(false);
    if (onRecordsUpdated) onRecordsUpdated();
  };

  const handleDelete = (id: string) => {
    const updated = deleteOfflineRegistro(id);
    setRecords(updated);
    if (onRecordsUpdated) onRecordsUpdated();
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim() || !newPreco) return;

    const priceVal = parseFloat(newPreco.replace(',', '.'));
    if (isNaN(priceVal) || priceVal <= 0) return;

    const newRecord: RegistroPreco = {
      id: `off-rec-${Date.now()}`,
      usuarioId: 'usr-guest',
      produtoId: `prod-off-${Date.now()}`,
      nomeProduto: newNome.trim(),
      categoria: newCategoria,
      estabelecimentoId: 'est-local-off',
      nomeEstabelecimento: newLoja.trim() || 'Mercado Local',
      cnpjEstabelecimento: '00.000.000/0001-00',
      preco: priceVal,
      quantidade: 1,
      unidadeMedida: 'un',
      precoMedioNaData: priceVal,
      data: new Date().toISOString(),
      latitude: -21.7946,
      longitude: -48.1766,
      origem: 'manual',
      statusSincronizacao: 'pendente',
    };

    const updated = saveOfflineRegistro(newRecord);
    setRecords(updated);
    setNewNome('');
    setNewPreco('');
    setNewLoja('');
    setIsAddingNew(false);
    if (onRecordsUpdated) onRecordsUpdated();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-md animate-fade-in ${
      isDark ? 'bg-black/80 text-slate-100' : 'bg-slate-900/40 text-slate-900'
    }`}>
      <div className={`rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border flex flex-col max-h-[92vh] ${
        isDark ? 'bg-[#18181B] border-[#27272A]' : 'bg-white border-slate-200'
      }`}>
        {/* Modal Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'bg-[#0F0F12] border-[#27272A] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 stroke-[2px]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-sora font-extrabold text-base tracking-tight leading-none">
                  Registros de Preços Off-line
                </h2>
                {pendingRecords.length > 0 && (
                  <span className="bg-amber-500/15 border border-amber-500/40 text-amber-500 text-[10px] font-sora font-extrabold px-2 py-0.5 rounded-full">
                    {pendingRecords.length} {pendingRecords.length === 1 ? 'Pendente' : 'Pendentes'}
                  </span>
                )}
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Pesquisas e notas gravadas localmente no seu dispositivo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark ? 'hover:bg-[#27272A] text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className={`p-3.5 border-b shrink-0 ${
          isOnline
            ? isDark ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : isDark ? 'bg-amber-950/40 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-2.5">
              {isOnline ? (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Wifi className="w-4 h-4 stroke-[2px]" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <WifiOff className="w-4 h-4 stroke-[2px] animate-pulse" />
                </div>
              )}

              <div className="space-y-0.5">
                <span className="font-sora font-extrabold text-xs uppercase tracking-tight block">
                  {isOnline ? 'Conexão On-line Ativa' : 'Modo Off-line Ativo'}
                </span>
                <p className="text-[11px] leading-snug opacity-90">
                  {isOnline
                    ? pendingRecords.length > 0
                      ? 'Você voltou a ficar on-line! Sincronize seus registros pendentes com o índice regional de preços.'
                      : 'Todos os seus registros locais já estão sincronizados com a nuvem!'
                    : 'Sem internet no momento. Seus registros são guardados com segurança e prontos para sincronizar.'}
                </p>
              </div>
            </div>

            {isOnline && pendingRecords.length > 0 && (
              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                className={`px-3 py-2 rounded-xl text-xs font-sora font-bold shrink-0 transition-all flex items-center space-x-1.5 ${
                  isDark
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'light-relevo-btn-primary bg-emerald-600 text-white'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
              </button>
            )}
          </div>

          {syncSuccessMsg && (
            <div className="mt-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-sora font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Filter Tabs & Quick Action */}
        <div className={`p-3 border-b flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center space-x-1 bg-[#18181B]/50 p-1 rounded-xl border border-[#27272A]/40">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-sora font-bold rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#FF6B00] text-white shadow-xs'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({records.length})
            </button>
            <button
              onClick={() => setActiveFilter('pendente')}
              className={`px-2.5 py-1 text-[11px] font-sora font-bold rounded-lg transition-all flex items-center space-x-1 ${
                activeFilter === 'pendente'
                  ? 'bg-[#FF6B00] text-white shadow-xs'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pendentes</span>
              {pendingRecords.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
              <span>({pendingRecords.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('sincronizado')}
              className={`px-2.5 py-1 text-[11px] font-sora font-bold rounded-lg transition-all ${
                activeFilter === 'sincronizado'
                  ? 'bg-[#FF6B00] text-white shadow-xs'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sincronizados ({syncedRecords.length})
            </button>
          </div>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className={`px-2.5 py-1.5 text-xs font-sora font-bold rounded-xl border transition-all flex items-center space-x-1 ${
              isDark
                ? 'bg-[#18181B] hover:bg-[#27272A] text-white border-[#27272A]'
                : 'light-relevo-btn-secondary'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>{isAddingNew ? 'Cancelar' : 'Novo Registro'}</span>
          </button>
        </div>

        {/* Collapsible Manual Add Form */}
        {isAddingNew && (
          <form onSubmit={handleAddSubmit} className={`p-4 border-b space-y-3 animate-fade-in ${
            isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className="text-xs font-sora font-bold text-[#FF6B00] uppercase tracking-wider">
              Registrar Preço no Modo Off-line
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[10px] font-sora font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  placeholder="Ex: Café Torrado 500g"
                  required
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#FF6B00] ${
                    isDark ? 'bg-[#18181B] text-white border-[#27272A]' : 'bg-white text-slate-900 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-sora font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Preço Encontrado (R$)
                </label>
                <input
                  type="text"
                  value={newPreco}
                  onChange={(e) => setNewPreco(e.target.value)}
                  placeholder="Ex: 18,90"
                  required
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#FF6B00] ${
                    isDark ? 'bg-[#18181B] text-white border-[#27272A]' : 'bg-white text-slate-900 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[10px] font-sora font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Estabelecimento / Mercado
                </label>
                <input
                  type="text"
                  value={newLoja}
                  onChange={(e) => setNewLoja(e.target.value)}
                  placeholder="Ex: Supermercado Dia"
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#FF6B00] ${
                    isDark ? 'bg-[#18181B] text-white border-[#27272A]' : 'bg-white text-slate-900 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-sora font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Categoria
                </label>
                <select
                  value={newCategoria}
                  onChange={(e) => setNewCategoria(e.target.value as CategoriaProduto)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#FF6B00] ${
                    isDark ? 'bg-[#18181B] text-white border-[#27272A]' : 'bg-white text-slate-900 border-slate-200'
                  }`}
                >
                  <option value="Mercearia">Mercearia</option>
                  <option value="Hortifruti">Hortifruti</option>
                  <option value="Carnes e Aves">Carnes e Aves</option>
                  <option value="Laticínios e Frios">Laticínios e Frios</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Mat. Limpeza">Mat. Limpeza</option>
                  <option value="Higiene e Perfumaria">Higiene e Perfumaria</option>
                  <option value="Farmácia e Medicamentos">Farmácia</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#FF6B00] text-white font-sora font-bold text-xs rounded-xl shadow-md hover:bg-[#E05D00]"
            >
              Salvar Registro Off-line
            </button>
          </form>
        )}

        {/* Offline Records List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredRecords.length === 0 ? (
            <div className={`p-8 rounded-2xl text-center space-y-2 border ${
              isDark ? 'bg-[#0F0F12] border-[#27272A] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <CloudOff className="w-8 h-8 text-[#FF6B00] mx-auto opacity-80" />
              <p className="font-sora font-bold text-sm">Nenhum registro encontrado nesta categoria.</p>
              <p className="text-xs">
                {activeFilter === 'pendente'
                  ? 'Todos os seus registros estão sincronizados com a nuvem!'
                  : 'Nenhum item gravado off-line no momento.'}
              </p>
            </div>
          ) : (
            filteredRecords.map((item) => {
              const isPendente = item.statusSincronizacao === 'pendente' || !item.statusSincronizacao;
              const formattedDate = new Date(item.data).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 relative ${
                    isDark
                      ? 'bg-[#0F0F12] border-[#27272A] hover:border-slate-700'
                      : 'light-relevo-card hover:brightness-[0.99]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-sora font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.nomeProduto}
                        </h3>
                        <span className={`text-[10px] font-sora font-semibold px-2 py-0.5 rounded-full border ${
                          isDark ? 'bg-[#18181B] border-[#27272A] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {item.categoria}
                        </span>
                      </div>

                      <div className={`flex items-center space-x-3 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        <span className="flex items-center space-x-1">
                          <Store className="w-3.5 h-3.5 text-[#FF6B00]" />
                          <span>{item.nomeEstabelecimento}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-sora font-extrabold text-base text-[#FF6B00] block">
                        {formatarMoeda(item.preco)}
                      </span>
                      <span className={`text-[10px] block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {item.quantidade} {item.unidadeMedida || 'un'}
                      </span>
                    </div>
                  </div>

                  {/* Prominent Pending Sync Indicator Badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#27272A]/40">
                    <div className="flex items-center space-x-2">
                      {isPendente ? (
                        <div className="bg-amber-500/15 border border-amber-500/40 text-amber-500 px-3 py-1 rounded-full text-xs font-sora font-extrabold flex items-center space-x-1.5 shadow-xs">
                          <CloudOff className="w-3.5 h-3.5 animate-pulse" />
                          <span>Sincronização Pendente</span>
                        </div>
                      ) : (
                        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 px-3 py-1 rounded-full text-xs font-sora font-extrabold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Sincronizado na Nuvem</span>
                        </div>
                      )}

                      <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        Origem: {item.origem === 'qrcode' ? 'NFC-e QR' : 'Manual'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {isPendente && isOnline && (
                        <button
                          onClick={() => handleSyncSingle(item.id)}
                          disabled={isSyncing}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-sora font-bold flex items-center space-x-1 border border-emerald-500/30"
                          title="Sincronizar agora"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>Sincronizar</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-red-500/20 text-zinc-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                        }`}
                        title="Excluir registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t shrink-0 flex items-center justify-between ${
          isDark ? 'bg-[#0F0F12] border-[#27272A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
            <Database className="w-4 h-4 text-[#FF6B00]" />
            <span>{records.length} registros no armazenamento local</span>
          </div>

          <button
            onClick={onClose}
            className={`px-4 py-2 font-sora font-bold text-xs rounded-xl transition-all ${
              isDark
                ? 'bg-[#18181B] hover:bg-[#27272A] text-white border border-[#27272A]'
                : 'light-relevo-btn-secondary'
            }`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
