import {
  Usuario,
  Estabelecimento,
  Produto,
  RegistroPreco,
  AlertaOferta,
  SampleNFCe
} from '../types';

export const USUARIO_PADRAO: Usuario = {
  id: 'usr-101',
  nome: 'Gabriel Guimarães',
  telefone: '(16) 99782-4102',
  email: 'gabriel.guimaraes@exemplo.com.br',
  cidade: 'Araraquara',
  bairro: 'Centro',
  latitude: -21.7946,
  longitude: -48.1766,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  preferenciasNotificacao: true,
  notificarAbaixoMedia: true,
};

export const ESTABELECIMENTOS_INICIAIS: Estabelecimento[] = [];

export const PRODUTOS_INICIAIS: Produto[] = [];

export const REGISTROS_PRECOS_HISTORICO: RegistroPreco[] = [];

export const SAMPLE_NFCE_QRCODES: SampleNFCe[] = [
  {
    id: 'sample-1',
    titulo: 'Cupom Atacadão - Compra de Mantimentos',
    descricao: 'Arroz Prato Fino 5kg, Feijão Camil 1kg e Detergente Ypê',
    estabelecimento: 'Atacadão - Unidade Araraquara',
    cnpj: '75.315.333/0018-20',
    cidade: 'Araraquara',
    bairro: 'Vila Xavier',
    total: 33.99,
    data: '2026-07-28',
    itens: [
      {
        nome: 'Arroz Prato Fino Tipo 1 5kg',
        preco: 24.90,
        quantidade: 1,
        unidade: 'pct',
        categoria: 'Mercearia',
        codigoBarras: '7896006711124',
      },
      {
        nome: 'Feijão Carioca Camil 1kg',
        preco: 6.89,
        quantidade: 1,
        unidade: 'pct',
        categoria: 'Mercearia',
        codigoBarras: '7896006700012',
      },
      {
        nome: 'Detergente Líquido Ypê Neutro 500ml',
        preco: 2.20,
        quantidade: 1,
        unidade: 'un',
        categoria: 'Mat. Limpeza',
        codigoBarras: '7896098900110',
      },
    ],
  },
  {
    id: 'sample-2',
    titulo: 'Farmácia Drogasil - Medicamentos',
    descricao: 'Dorflex 10 cprs e Dipirona Gotas 20ml',
    estabelecimento: 'Drogasil - Praça da Matriz',
    cnpj: '61.585.865/0421-88',
    cidade: 'Araraquara',
    bairro: 'Centro',
    total: 13.40,
    data: '2026-07-28',
    itens: [
      {
        nome: 'Dorflex Analgésico 10 Comprimidos',
        preco: 8.90,
        quantidade: 1,
        unidade: 'cx',
        categoria: 'Farmácia e Medicamentos',
        codigoBarras: '7891058001234',
      },
      {
        nome: 'Dipirona Sódica Medley 500mg/ml Gotas 20ml',
        preco: 4.50,
        quantidade: 1,
        unidade: 'ml',
        categoria: 'Farmácia e Medicamentos',
        codigoBarras: '7896422500100',
      },
    ],
  },
  {
    id: 'sample-3',
    titulo: 'Tonin Superatacado - Limpeza & Café',
    descricao: 'Café Pilão 500g, Sabão Omo 1.6kg e Azeite Gallo',
    estabelecimento: 'Tonin Superatacado - Roseiras',
    cnpj: '18.910.123/0002-11',
    cidade: 'Araraquara',
    bairro: 'Jardim das Roseiras',
    total: 76.70,
    data: '2026-07-27',
    itens: [
      {
        nome: 'Café Pilão Torrado e Moído 500g',
        preco: 16.90,
        quantidade: 1,
        unidade: 'pct',
        categoria: 'Mercearia',
        codigoBarras: '7896005800100',
      },
      {
        nome: 'Sabão em Pó Omo Lavagem Perfeita 1.6kg',
        preco: 21.90,
        quantidade: 1,
        unidade: 'cx',
        categoria: 'Mat. Limpeza',
        codigoBarras: '7891038000500',
      },
      {
        nome: 'Azeite de Oliva Extra Virgem Gallo 500ml',
        preco: 37.90,
        quantidade: 1,
        unidade: 'ml',
        categoria: 'Mercearia',
        codigoBarras: '5601006001200',
      },
    ],
  },
];

export const ALERTAS_INICIAIS: AlertaOferta[] = [];
