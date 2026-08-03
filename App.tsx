import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  Search,
  History,
  Bell,
  User,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  MapPin,
  Sparkles,
  Plus,
  Shield,
  Smartphone,
  ChevronRight,
  Store,
  CheckCircle2,
  Navigation,
  LogOut,
  Globe,
  LockKeyhole,
  PiggyBank,
  Receipt,
  LogIn,
  UserPlus,
} from 'lucide-react';
import {
  Usuario,
  Estabelecimento,
  Produto,
  RegistroPreco,
  SampleNFCe,
  AlertaOferta,
  ItemListaCompras,
} from './types';
import {
  USUARIO_PADRAO,
  ESTABELECIMENTOS_INICIAIS,
  PRODUTOS_INICIAIS,
  ALERTAS_INICIAIS,
  SAMPLE_NFCE_QRCODES,
} from './data/mockData';
import { Header } from './components/Header';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { Navigation as BottomNavigation, TabType } from './components/Navigation';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { QRScannerModal } from './components/QRScannerModal';
import { ManualInputModal } from './components/ManualInputModal';
import { ScanResultModal } from './components/ScanResultModal';
import { PriceSearch } from './components/PriceSearch';
import { HomeView } from './components/HomeView';
import { ShoppingListView } from './components/ShoppingListView';
import { HistoryView } from './components/HistoryView';
import { DealsAlertsView } from './components/DealsAlertsView';
import { ProfileModal } from './components/ProfileModal';
import { PriceDropToast, ToastDataPriceDrop } from './components/PriceDropToast';
import { formatarMoeda, getStatusPreco, obterLocalizacaoGPS } from './utils/location';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { saveProdutosCache, getConsultasCached } from './utils/offlineCache';
import { classificarCategoriaProduto } from './utils/categoryClassifier';
import {
  auth,
  logoutFirebase,
  saveRegistroToFirestore,
  deleteRegistroFromFirestore,
  saveUserProfileToFirestore,
  saveProdutoToFirestore,
  saveEstabelecimentoToFirestore,
  subscribeUserRegistros,
  subscribeAllRegistros,
  subscribeProdutos,
  subscribeEstabelecimentos,
} from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  // Online/Offline status & offline cache management
  const { isOnline, wasOffline, dismissReestablishedNotification } = useOnlineStatus();
  const cachedQueriesCount = getConsultasCached().length;

  // State management
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('precojusto_usuario');
    return saved ? JSON.parse(saved) : null;
  });

  const [historico, setHistorico] = useState<RegistroPreco[]>([]);
  const [allRegistros, setAllRegistros] = useState<RegistroPreco[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>(PRODUTOS_INICIAIS);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>(ESTABELECIMENTOS_INICIAIS);
  const [alertas, setAlertas] = useState<AlertaOferta[]>(ALERTAS_INICIAIS);
  const [toastPriceDrop, setToastPriceDrop] = useState<ToastDataPriceDrop | null>(null);

  // One-time cleanup of stale local cache entries with old simulation/Tio João data
  useEffect(() => {
    try {
      const cachedQueries = localStorage.getItem('precojusto_cached_queries');
      if (cachedQueries) {
        const parsed = JSON.parse(cachedQueries);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((q: any) => {
            const term = (q.termoBusca || '').toLowerCase();
            const name = (q.nomeProduto || '').toLowerCase();
            return !term.includes('tio joã') && !term.includes('tio joa') && !name.includes('tio joã') && !name.includes('tio joa');
          });
          localStorage.setItem('precojusto_cached_queries', JSON.stringify(cleaned));
        }
      }
      const cachedProds = localStorage.getItem('precojusto_cached_products');
      if (cachedProds) {
        const parsed = JSON.parse(cachedProds);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((p: any) => {
            const name = (p.nome || '').toLowerCase();
            return !name.includes('tio joã') && !name.includes('tio joa') && !p.id?.startsWith('prod-');
          });
          localStorage.setItem('precojusto_cached_products', JSON.stringify(cleaned));
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Shopping list state with local persistence
  const [listaCompras, setListaCompras] = useState<ItemListaCompras[]>(() => {
    const saved = localStorage.getItem('precojusto_lista_compras');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out mock items if present
          return parsed.filter((item: any) => !['list-1', 'list-2', 'list-3'].includes(item.id));
        }
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('precojusto_lista_compras', JSON.stringify(listaCompras));
  }, [listaCompras]);

  const handleAplicarPrecoNovo = (toast: ToastDataPriceDrop) => {
    setListaCompras((prev) =>
      prev.map((i) => {
        if (i.id === toast.id || i.nome.toLowerCase() === toast.itemNome.toLowerCase()) {
          return {
            ...i,
            precoMinimoEstimado: toast.precoNovoMinimo,
            precoMedioEstimado: toast.precoNovoMinimo,
            melhorLojaEstimada: toast.lojaNome,
          };
        }
        return i;
      })
    );
  };

  const handleAddListaItem = (item: Omit<ItemListaCompras, 'id'>) => {
    const newItem: ItemListaCompras = {
      ...item,
      id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setListaCompras((prev) => [newItem, ...prev]);

    // Check if newly added item has a regional minimum price lower than estimated price
    const match = produtos.find(
      (p) =>
        p.id === item.produtoId ||
        p.nome.toLowerCase().includes(item.nome.toLowerCase()) ||
        item.nome.toLowerCase().includes(p.nome.toLowerCase())
    );
    if (match && match.precoMinimoRegional > 0 && match.precoMinimoRegional < item.precoMedioEstimado) {
      const econ = Math.round((item.precoMedioEstimado - match.precoMinimoRegional) * 100) / 100;
      const pct = Math.round((econ / item.precoMedioEstimado) * 100);
      setToastPriceDrop({
        id: newItem.id,
        itemNome: newItem.nome,
        lojaNome: match.melhorLoja || 'Supermercado Regional',
        precoAnterior: item.precoMedioEstimado,
        precoNovoMinimo: match.precoMinimoRegional,
        economia: econ,
        descontoPorcentagem: pct > 0 ? pct : 15,
      });
    }
  };

  const handleToggleListaItem = (id: string) => {
    setListaCompras((prev) =>
      prev.map((i) => (i.id === id ? { ...i, concluido: !i.concluido } : i))
    );
  };

  const handleDeleteListaItem = (id: string) => {
    setListaCompras((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateQuantityListaItem = (id: string, delta: number) => {
    setListaCompras((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newQty = Math.max(1, i.quantidade + delta);
          return { ...i, quantidade: newQty };
        }
        return i;
      })
    );
  };

  const handleClearLista = () => {
    setListaCompras([]);
  };

  const handleClearCompletedLista = () => {
    setListaCompras((prev) => prev.filter((i) => !i.concluido));
  };

  const handleAddTemplateListLista = (items: Omit<ItemListaCompras, 'id'>[]) => {
    const newItems: ItemListaCompras[] = items.map((it) => ({
      ...it,
      id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    }));
    setListaCompras((prev) => [...newItems, ...prev]);
  };

  // Persist products catalog to offline cache
  useEffect(() => {
    if (produtos.length > 0) {
      saveProdutosCache(produtos);
    }
  }, [produtos]);

  // App UI State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('precojusto_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('precojusto_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [currentScannedInvoice, setCurrentScannedInvoice] = useState<SampleNFCe | null>(null);

  // Active Alert Item IDs
  const [activeAlertProductIds, setActiveAlertProductIds] = useState<string[]>(['prod-1', 'prod-6']);

  // Auto-Detect GPS Location on Mount
  useEffect(() => {
    obterLocalizacaoGPS().then((loc) => {
      if (loc.preciso) {
        setUsuario((prev) => {
          if (!prev) return prev;
          const updated: Usuario = {
            ...prev,
            cidade: loc.cidade,
            bairro: loc.bairro,
            latitude: loc.latitude,
            longitude: loc.longitude,
          };
          saveUserProfileToFirestore(updated);
          return updated;
        });
      }
    });
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    if (usuario) {
      localStorage.setItem('precojusto_usuario', JSON.stringify(usuario));
    }
  }, [usuario]);

  // Firestore Subscriptions: Products & Stores catalog
  useEffect(() => {
    const unsubProds = subscribeProdutos((firestoreProds) => {
      if (firestoreProds.length > 0) {
        setProdutos(firestoreProds);
      }
    });

    const unsubStores = subscribeEstabelecimentos((firestoreStores) => {
      if (firestoreStores.length > 0) {
        setEstabelecimentos(firestoreStores);
      }
    });

    const unsubAllRecords = subscribeAllRegistros((records) => {
      setAllRegistros(records);
    });

    return () => {
      unsubProds();
      unsubStores();
      unsubAllRecords();
    };
  }, []);

  // Dynamically recalculate average product prices from all crowdsourced records
  useEffect(() => {
    if (allRegistros.length === 0 || produtos.length === 0) return;

    setProdutos((prevProds) =>
      prevProds.map((prod) => {
        const prodRecords = allRegistros.filter(
          (r) => r.produtoId === prod.id || r.nomeProduto.toLowerCase() === prod.nome.toLowerCase()
        );

        if (prodRecords.length === 0) return prod;

        const prices = prodRecords.map((r) => r.preco);
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        const avgP = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;

        return {
          ...prod,
          precoMedioRegional: avgP,
          precoMinimo: minP,
          precoMaximo: maxP,
          quantidadeRegistros: prodRecords.length,
        };
      })
    );
  }, [allRegistros]);

  // Firebase Auth & User History Realtime Subscription
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const savedLocal = localStorage.getItem('precojusto_usuario');
        const parsedLocal: Partial<Usuario> = savedLocal ? JSON.parse(savedLocal) : {};

        const u: Usuario = {
          id: firebaseUser.uid,
          nome: parsedLocal.nome || firebaseUser.displayName || 'Consumidor PreçoJusto',
          email: parsedLocal.email || firebaseUser.email || undefined,
          telefone: parsedLocal.telefone || firebaseUser.phoneNumber || '(16) 99782-4102',
          cidade: parsedLocal.cidade || usuario?.cidade || 'Araraquara',
          bairro: parsedLocal.bairro || usuario?.bairro || 'Centro',
          latitude: parsedLocal.latitude || usuario?.latitude || -21.7946,
          longitude: parsedLocal.longitude || usuario?.longitude || -48.1766,
          avatarUrl: parsedLocal.avatarUrl || firebaseUser.photoURL || undefined,
          preferenciasNotificacao: true,
          notificarAbaixoMedia: true,
        };
        setUsuario(u);

        const unsubscribeRecords = subscribeUserRegistros(firebaseUser.uid, (firestoreRecords) => {
          setHistorico(firestoreRecords);
        });

        return () => unsubscribeRecords();
      } else {
        // Guest mode - filter allRegistros by guest user
        const guestRecords = allRegistros.filter(
          (r) => r.usuarioId === (usuario?.id || 'usr-guest')
        );
        setHistorico(guestRecords);
      }
    });

    return () => unsubscribeAuth();
  }, [allRegistros]);

  // Handle scanned receipt submission
  const handleScanSuccess = (invoice: SampleNFCe) => {
    setCurrentScannedInvoice(invoice);
    setIsScannerOpen(false);
    setIsResultOpen(true);
  };

  const handleSaveInvoiceToHistory = async (invoice: SampleNFCe) => {
    // 1. Create or Save Store in Firestore
    const storeId = `est-${invoice.estabelecimento.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newStore: Estabelecimento = {
      id: storeId,
      nome: invoice.estabelecimento,
      cnpj: invoice.cnpj || '00.000.000/0000-00',
      endereco: `${invoice.bairro || 'Centro'}, ${invoice.cidade || 'Araraquara'}`,
      cidade: invoice.cidade || usuario?.cidade || 'Araraquara',
      bairro: invoice.bairro || usuario?.bairro || 'Centro',
      latitude: usuario?.latitude || -21.7946,
      longitude: usuario?.longitude || -48.1766,
      categoria: 'Supermercado',
    };
    await saveEstabelecimentoToFirestore(newStore);
    setEstabelecimentos((prev) => {
      if (prev.some((s) => s.id === newStore.id)) return prev;
      return [newStore, ...prev];
    });

    // 2. Process and save each item to Firestore with automatic categorization
    const newRecords: RegistroPreco[] = [];
    for (let idx = 0; idx < invoice.itens.length; idx++) {
      const item = invoice.itens[idx];
      const autoCategoria = classificarCategoriaProduto(item.nome, item.categoria);

      let prodMatch = produtos.find(
        (p) =>
          p.nome.toLowerCase().trim() === item.nome.toLowerCase().trim() ||
          item.nome.toLowerCase().includes(p.nome.toLowerCase()) ||
          p.nome.toLowerCase().includes(item.nome.toLowerCase())
      );

      if (!prodMatch) {
        const prodId = `prod-${Date.now()}-${idx}`;
        prodMatch = {
          id: prodId,
          nome: item.nome,
          categoria: autoCategoria,
          unidadeMedida: item.unidade || 'un',
          precoMedioRegional: item.preco,
          precoMinimo: item.preco,
          precoMaximo: item.preco,
          quantidadeRegistros: 1,
          imagemUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
          historicoPrecos: [
            {
              estabelecimentoId: storeId,
              nomeEstabelecimento: invoice.estabelecimento,
              preco: item.preco,
              data: invoice.data || new Date().toISOString().split('T')[0],
              distanciaKm: 0.5,
            },
          ],
        };
        await saveProdutoToFirestore(prodMatch);
      } else if (prodMatch.categoria === 'Outros' && autoCategoria !== 'Outros') {
        prodMatch = { ...prodMatch, categoria: autoCategoria };
        await saveProdutoToFirestore(prodMatch);
      }

      const newRec: RegistroPreco = {
        id: `rec-${Date.now()}-${idx}`,
        usuarioId: usuario?.id || 'usr-guest',
        produtoId: prodMatch.id,
        nomeProduto: item.nome,
        categoria: autoCategoria,
        estabelecimentoId: storeId,
        nomeEstabelecimento: invoice.estabelecimento,
        cnpjEstabelecimento: invoice.cnpj,
        preco: item.preco,
        quantidade: item.quantidade,
        unidadeMedida: item.unidade,
        precoMedioNaData: prodMatch.precoMedioRegional,
        data: new Date().toISOString(),
        latitude: usuario?.latitude || -21.7946,
        longitude: usuario?.longitude || -48.1766,
        origem: invoice.id.startsWith('manual') ? 'manual' : 'qrcode',
      };

      newRecords.push(newRec);
      await saveRegistroToFirestore(newRec);
    }

    setHistorico((prev) => [...newRecords, ...prev]);
  };

  const handleDeleteRecord = async (id: string) => {
    setHistorico((prev) => prev.filter((item) => item.id !== id));
    await deleteRegistroFromFirestore(id);
  };

  const handleUpdateUsuario = async (updated: Usuario) => {
    setUsuario(updated);
    try {
      localStorage.setItem('precojusto_usuario', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving user to localStorage:', e);
    }
    await saveUserProfileToFirestore(updated);
  };

  const handleLogout = async () => {
    await logoutFirebase();
    localStorage.removeItem('precojusto_usuario');
    setUsuario(null);
    setIsProfileOpen(false);
  };

  // Toggle alert on product
  const handleToggleAlertProduct = (produto: Produto) => {
    if (activeAlertProductIds.includes(produto.id)) {
      setActiveAlertProductIds((prev) => prev.filter((id) => id !== produto.id));
    } else {
      setActiveAlertProductIds((prev) => [...prev, produto.id]);
    }
  };

  // Calculate totals
  const totalGastoGeral = historico.reduce((acc, rec) => acc + rec.preco * rec.quantidade, 0);
  const totalEconomiaGeral = historico.reduce((acc, rec) => {
    const diff = (rec.precoMedioNaData - rec.preco) * rec.quantidade;
    return acc + (diff > 0 ? diff : 0);
  }, 0);

  if (!usuario) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
          theme === 'dark' ? 'bg-[#09090B] text-white' : 'bg-slate-100 text-slate-900'
        }`}
      >
        <AuthScreen onSuccess={(u) => handleUpdateUsuario(u)} theme={theme} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-start font-sans antialiased selection:bg-[#FF6B00] selection:text-white transition-colors ${
        theme === 'dark' ? 'bg-[#09090B] text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Centered App Viewport */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative">
        {/* App Top Bar Header */}
        <Header
          usuario={usuario}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenLocationChange={() => setIsProfileOpen(true)}
          onOpenAlerts={() => setActiveTab('alerts')}
          unreadAlertsCount={alertas.length}
          theme={theme}
          onToggleTheme={toggleTheme}
          isOnline={isOnline}
        />

        {/* Connection Status Indicator Banner */}
        <OfflineStatusBanner
          isOnline={isOnline}
          wasOffline={wasOffline}
          onDismissReestablished={dismissReestablishedNotification}
          cachedQueriesCount={cachedQueriesCount}
          onOpenOfflineCache={() => setActiveTab('search')}
          theme={theme}
        />

        {/* Main Body View Container */}
        <main className="flex-1 p-4 sm:p-5 pb-28 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* TAB 1: INÍCIO / DASHBOARD */}
              {(activeTab === 'home' || activeTab === 'scan') && (
                <HomeView
                  usuario={usuario}
                  produtos={produtos}
                  historico={historico}
                  estabelecimentos={estabelecimentos}
                  alertas={alertas}
                  lista={listaCompras}
                  totalEconomiaGeral={totalEconomiaGeral}
                  isOnline={isOnline}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onOpenManualInput={() => setIsManualInputOpen(true)}
                  onSelectProduto={(p) => {
                    // Navigate to search tab with selected product
                    setActiveTab('search');
                  }}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  theme={theme}
                />
              )}

              {/* TAB 2: BUSCAR PREÇO MÉDIO */}
              {activeTab === 'search' && (
                <PriceSearch
                  produtos={produtos}
                  estabelecimentos={estabelecimentos}
                  userLat={usuario?.latitude || -21.7946}
                  userLng={usuario?.longitude || -48.1766}
                  onAddAlert={handleToggleAlertProduct}
                  activeAlertProductIds={activeAlertProductIds}
                  isOnline={isOnline}
                  registrosHistoricos={allRegistros.length > 0 ? allRegistros : historico}
                  theme={theme}
                />
              )}

              {/* TAB 3: LISTA DE COMPRAS */}
              {activeTab === 'shopping' && (
                <ShoppingListView
                  produtos={produtos}
                  lista={listaCompras}
                  onAddItem={handleAddListaItem}
                  onToggleItem={handleToggleListaItem}
                  onDeleteItem={handleDeleteListaItem}
                  onUpdateQuantity={handleUpdateQuantityListaItem}
                  onClearList={handleClearLista}
                  onClearCompleted={handleClearCompletedLista}
                  onAddTemplateList={handleAddTemplateListLista}
                  onTriggerPriceDropToast={(data) => setToastPriceDrop(data)}
                  theme={theme}
                />
              )}

              {/* TAB 4: HISTÓRICO */}
              {activeTab === 'history' && (
                <HistoryView
                  historico={historico}
                  onDeleteRecord={handleDeleteRecord}
                  onClearAll={() => {
                    historico.forEach((r) => deleteRegistroFromFirestore(r.id));
                    setHistorico([]);
                  }}
                  theme={theme}
                />
              )}

              {/* TAB 4: OFERTAS & ALERTAS */}
              {activeTab === 'alerts' && (
                <DealsAlertsView
                  alertas={alertas}
                  produtos={produtos}
                  notificacaoAtiva={usuario?.preferenciasNotificacao ?? true}
                  onToggleNotificacao={(ativa) => {
                    if (usuario) {
                      const updated = { ...usuario, preferenciasNotificacao: ativa };
                      handleUpdateUsuario(updated);
                    }
                  }}
                  userLat={usuario?.latitude || -21.7946}
                  userLng={usuario?.longitude || -48.1766}
                  theme={theme}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'scan') {
              setIsScannerOpen(true);
            }
          }}
          unreadAlertsCount={alertas.length}
          theme={theme}
        />

        {/* Modals */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(u) => handleUpdateUsuario(u)}
          theme={theme}
        />

        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          onOpenManualInput={() => setIsManualInputOpen(true)}
          theme={theme}
        />

        <ManualInputModal
          isOpen={isManualInputOpen}
          onClose={() => setIsManualInputOpen(false)}
          onSubmitManualItem={handleScanSuccess}
          theme={theme}
        />

        <ScanResultModal
          isOpen={isResultOpen}
          scannedInvoice={currentScannedInvoice}
          onClose={() => setIsResultOpen(false)}
          onSaveAndAdd={handleSaveInvoiceToHistory}
          regionalProducts={produtos}
          theme={theme}
        />

        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          usuario={usuario}
          onUpdateUsuario={handleUpdateUsuario}
          onLogout={handleLogout}
          onOpenAuth={() => setIsAuthOpen(true)}
          theme={theme}
        />

        {/* Global Visual Notification Toast for Price Drops Below Regional Minimum */}
        <PriceDropToast
          toast={toastPriceDrop}
          onClose={() => setToastPriceDrop(null)}
          onVerNaLista={() => setActiveTab('shopping')}
          onAplicarPrecoNovo={handleAplicarPrecoNovo}
        />
      </div>
    </div>
  );
}

