export type CategoriaProduto = 
  | 'Mercearia'
  | 'Hortifruti'
  | 'Carnes e Aves'
  | 'Laticínios e Frios'
  | 'Bebidas'
  | 'Mat. Limpeza'
  | 'Higiene e Perfumaria'
  | 'Farmácia e Medicamentos'
  | 'Outros';

export interface Usuario {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cidade: string;
  bairro: string;
  latitude: number;
  longitude: number;
  avatarUrl?: string;
  preferenciasNotificacao: boolean;
  notificarAbaixoMedia: boolean;
}

export interface Estabelecimento {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  bairro: string;
  latitude: number;
  longitude: number;
  categoria: 'Supermercado' | 'Farmácia' | 'Atacado' | 'Conveniência' | 'Outro';
  distanciaKm?: number;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: CategoriaProduto;
  codigoBarras?: string;
  unidadeMedida: 'un' | 'kg' | 'g' | 'L' | 'ml' | 'cx' | 'pct';
  imagemUrl?: string;
  precoMedioRegional: number;
  precoMinimoRegional: number;
  precoMaximoRegional: number;
  melhorLoja?: string;
}

export interface ItemNota {
  produtoId: string;
  nomeProduto: string;
  categoria: CategoriaProduto;
  precoPago: number;
  quantidade: number;
  unidadeMedida: string;
  precoMedioRegional: number;
  statusPreco: 'abaixo' | 'na_media' | 'acima';
  porcentagemDiferenca: number; // ex: -14.2% ou +8.5%
}

export interface RegistroPreco {
  id: string;
  usuarioId: string;
  produtoId: string;
  nomeProduto: string;
  categoria: CategoriaProduto;
  estabelecimentoId: string;
  nomeEstabelecimento: string;
  cnpjEstabelecimento: string;
  preco: number;
  quantidade: number;
  unidadeMedida: string;
  precoMedioNaData: number;
  data: string; // YYYY-MM-DD ou ISO
  latitude: number;
  longitude: number;
  origem: 'qrcode' | 'manual' | 'foto_ia';
  chaveNFCe?: string;
  statusSincronizacao?: 'pendente' | 'sincronizado';
  sincronizadoEm?: string;
}

export interface NotaFiscalEscaneada {
  id: string;
  estabelecimento: Estabelecimento;
  data: string;
  itens: ItemNota[];
  valorTotalPago: number;
  valorTotalMedioRegional: number;
  economiaTotal: number;
  chaveNFCe?: string;
  origem: 'qrcode' | 'manual' | 'foto_ia';
}

export interface AlertaOferta {
  id: string;
  produtoId: string;
  nomeProduto: string;
  categoria: CategoriaProduto;
  estabelecimentoNome: string;
  bairro: string;
  precoAtual: number;
  precoMedio: number;
  descontoPorcentagem: number;
  distanciaKm: number;
  validadoEm: string;
}

export interface SampleNFCe {
  id: string;
  titulo: string;
  descricao: string;
  estabelecimento: string;
  cnpj: string;
  cidade: string;
  bairro: string;
  total: number;
  data: string;
  itens: {
    nome: string;
    preco: number;
    quantidade: number;
    unidade: string;
    categoria: CategoriaProduto;
    codigoBarras?: string;
  }[];
}

export interface ConsultaPrecoCached {
  id: string;
  termoBusca: string;
  dataHora: string;
  produtoId: string;
  nomeProduto: string;
  categoria: CategoriaProduto;
  precoMedio: number;
  precoMinimo: number;
  precoMaximo: number;
  melhorLoja?: string;
  variacaoPreco?: number;
}

export interface ItemListaCompras {
  id: string;
  nome: string;
  quantidade: number;
  unidadeMedida: string;
  categoria: CategoriaProduto;
  produtoId?: string;
  precoMedioEstimado: number;
  precoMinimoEstimado: number;
  melhorLojaEstimada?: string;
  concluido: boolean;
}
