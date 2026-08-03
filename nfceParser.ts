import { SAMPLE_NFCE_QRCODES } from '../data/mockData';
import { NotaFiscalEscaneada, SampleNFCe, CategoriaProduto } from '../types';
import { classificarCategoriaProduto } from './categoryClassifier';

export function processarQrCodeTexto(qrText: string): SampleNFCe | null {
  if (!qrText) return null;

  let invoice: SampleNFCe | null = null;

  // Check if matches sample ID or title
  const sampleMatch = SAMPLE_NFCE_QRCODES.find(
    (s) => s.id === qrText || qrText.toLowerCase().includes(s.id.toLowerCase())
  );
  if (sampleMatch) {
    invoice = { ...sampleMatch };
  } else if (qrText.toLowerCase().includes('drogasil') || qrText.toLowerCase().includes('droga')) {
    invoice = { ...SAMPLE_NFCE_QRCODES[1] }; // Farmácia sample
  } else if (qrText.toLowerCase().includes('assai') || qrText.toLowerCase().includes('atacado')) {
    invoice = { ...SAMPLE_NFCE_QRCODES[2] }; // Assaí sample
  } else {
    // Parse NFC-e URL parameter 'p' or access key
    let chaveAcesso = '';
    if (qrText.includes('p=')) {
      const param = qrText.split('p=')[1];
      if (param) {
        chaveAcesso = param.split('|')[0] || param.substring(0, 44);
      }
    } else if (qrText.length >= 44 && /^\d+$/.test(qrText.trim())) {
      chaveAcesso = qrText.trim().substring(0, 44);
    }

    invoice = {
      id: `scan-${Date.now()}`,
      titulo: 'Nota Fiscal Eletrônica (NFC-e)',
      descricao: `Chave: ${chaveAcesso ? chaveAcesso.substring(0, 12) + '...' : 'NFC-e QR Code'}`,
      estabelecimento: 'Supermercado Extra - Unidade Centro',
      cnpj: '00.000.000/0001-00',
      cidade: 'Araraquara',
      bairro: 'Centro',
      total: 37.00,
      data: new Date().toISOString().split('T')[0],
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
          preco: 9.20,
          quantidade: 1,
          unidade: 'pct',
          categoria: 'Mercearia',
          codigoBarras: '7896006700012',
        },
        {
          nome: 'Detergente Líquido Ypê Neutro 500ml',
          preco: 2.90,
          quantidade: 1,
          unidade: 'un',
          categoria: 'Mat. Limpeza',
          codigoBarras: '7896098900110',
        },
      ],
    };
  }

  // Auto-categorize each item in the scanned invoice
  return {
    ...invoice,
    itens: invoice.itens.map((item) => ({
      ...item,
      categoria: classificarCategoriaProduto(item.nome, item.categoria),
    })),
  };
}
