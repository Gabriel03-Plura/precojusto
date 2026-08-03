import { ConsultaPrecoCached, Produto, RegistroPreco } from '../types';

const CACHE_QUERIES_KEY = 'precojusto_cached_queries';
const CACHE_PRODUCTS_KEY = 'precojusto_cached_products';
const CACHE_OFFLINE_RECORDS_KEY = 'precojusto_offline_records';

// Initial sample offline price records for immediate user demo/testing
const SAMPLE_OFFLINE_RECORDS: RegistroPreco[] = [
  {
    id: 'off-rec-101',
    usuarioId: 'usr-guest',
    produtoId: 'prod-201',
    nomeProduto: 'Arroz Tipo 1 - 5kg',
    categoria: 'Mercearia',
    estabelecimentoId: 'est-supermercado-bahia',
    nomeEstabelecimento: 'Supermercado Bahia',
    cnpjEstabelecimento: '12.345.678/0001-90',
    preco: 21.90,
    quantidade: 1,
    unidadeMedida: 'pct',
    precoMedioNaData: 24.50,
    data: new Date(Date.now() - 3600000 * 2).toISOString(),
    latitude: -21.7946,
    longitude: -48.1766,
    origem: 'qrcode',
    statusSincronizacao: 'pendente',
  },
  {
    id: 'off-rec-102',
    usuarioId: 'usr-guest',
    produtoId: 'prod-202',
    nomeProduto: 'Leite Integral 1L',
    categoria: 'Laticínios e Frios',
    estabelecimentoId: 'est-supermercado-sao-jose',
    nomeEstabelecimento: 'Supermercado São José',
    cnpjEstabelecimento: '98.765.432/0001-10',
    preco: 4.49,
    quantidade: 3,
    unidadeMedida: 'L',
    precoMedioNaData: 5.10,
    data: new Date(Date.now() - 3600000 * 5).toISOString(),
    latitude: -21.7946,
    longitude: -48.1766,
    origem: 'manual',
    statusSincronizacao: 'pendente',
  },
];

// Save a price query to cache
export function saveConsultaCache(consulta: ConsultaPrecoCached): ConsultaPrecoCached[] {
  try {
    const existing = getConsultasCached();
    // Filter out previous entry for same product/search term to avoid duplicate spam
    const filtered = existing.filter(
      (item) => item.produtoId !== consulta.produtoId && item.termoBusca.toLowerCase() !== consulta.termoBusca.toLowerCase()
    );
    // Add to start, max 20 entries
    const updated = [consulta, ...filtered].slice(0, 20);
    localStorage.setItem(CACHE_QUERIES_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao salvar consulta em cache:', err);
    return [];
  }
}

// Retrieve cached price queries
export function getConsultasCached(): ConsultaPrecoCached[] {
  try {
    const saved = localStorage.getItem(CACHE_QUERIES_KEY);
    if (!saved) return [];
    const list: ConsultaPrecoCached[] = JSON.parse(saved);
    if (!Array.isArray(list)) return [];
    return list.filter((item) => {
      const term = (item.termoBusca || '').toLowerCase();
      const name = (item.nomeProduto || '').toLowerCase();
      return (
        !term.includes('tio joão') &&
        !term.includes('tio joao') &&
        !name.includes('tio joão') &&
        !name.includes('tio joao') &&
        !item.produtoId.startsWith('prod-')
      );
    });
  } catch (err) {
    console.error('Erro ao ler consultas do cache:', err);
    return [];
  }
}

// Clear cached queries
export function clearConsultasCached(): void {
  try {
    localStorage.removeItem(CACHE_QUERIES_KEY);
  } catch (err) {
    console.error('Erro ao limpar cache:', err);
  }
}

// Save product list snapshot to offline cache
export function saveProdutosCache(produtos: Produto[]): void {
  try {
    if (produtos && produtos.length > 0) {
      localStorage.setItem(CACHE_PRODUCTS_KEY, JSON.stringify(produtos));
    }
  } catch (err) {
    console.error('Erro ao salvar produtos no cache:', err);
  }
}

// Get cached products list snapshot
export function getProdutosCached(): Produto[] {
  try {
    const saved = localStorage.getItem(CACHE_PRODUCTS_KEY);
    if (!saved) return [];
    const list: Produto[] = JSON.parse(saved);
    if (!Array.isArray(list)) return [];
    return list.filter((p) => {
      const name = (p.nome || '').toLowerCase();
      return (
        !name.includes('tio joão') &&
        !name.includes('tio joao') &&
        !p.id.startsWith('prod-')
      );
    });
  } catch (err) {
    console.error('Erro ao ler produtos do cache:', err);
    return [];
  }
}

// Get offline price records
export function getOfflineRegistros(): RegistroPreco[] {
  try {
    const saved = localStorage.getItem(CACHE_OFFLINE_RECORDS_KEY);
    if (!saved) {
      localStorage.setItem(CACHE_OFFLINE_RECORDS_KEY, JSON.stringify(SAMPLE_OFFLINE_RECORDS));
      return SAMPLE_OFFLINE_RECORDS;
    }
    const list: RegistroPreco[] = JSON.parse(saved);
    if (!Array.isArray(list)) return SAMPLE_OFFLINE_RECORDS;
    return list;
  } catch (err) {
    console.error('Erro ao ler registros offline:', err);
    return SAMPLE_OFFLINE_RECORDS;
  }
}

// Save a new offline price record
export function saveOfflineRegistro(record: RegistroPreco): RegistroPreco[] {
  try {
    const existing = getOfflineRegistros();
    const updated = [{ ...record, statusSincronizacao: 'pendente' as const }, ...existing];
    localStorage.setItem(CACHE_OFFLINE_RECORDS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao salvar registro offline:', err);
    return [];
  }
}

// Mark offline price records as synced
export function markOfflineRegistrosSynced(ids?: string[]): RegistroPreco[] {
  try {
    const existing = getOfflineRegistros();
    const updated = existing.map((r) => {
      if (!ids || ids.includes(r.id)) {
        return {
          ...r,
          statusSincronizacao: 'sincronizado' as const,
          sincronizadoEm: new Date().toISOString(),
        };
      }
      return r;
    });
    localStorage.setItem(CACHE_OFFLINE_RECORDS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao marcar registros como sincronizados:', err);
    return [];
  }
}

// Delete an offline price record
export function deleteOfflineRegistro(id: string): RegistroPreco[] {
  try {
    const existing = getOfflineRegistros();
    const updated = existing.filter((r) => r.id !== id);
    localStorage.setItem(CACHE_OFFLINE_RECORDS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Erro ao deletar registro offline:', err);
    return [];
  }
}

