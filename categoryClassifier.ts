import { CategoriaProduto } from '../types';

/**
 * Normalizes string by lowering case and removing accents/diacritics for accurate matching.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Automatically classifies a product into a CategoriaProduto based on product name keywords.
 */
export function classificarCategoriaProduto(
  nomeProduto: string,
  categoriaSugerida?: string
): CategoriaProduto {
  if (!nomeProduto) {
    if (categoriaSugerida && isCategoriaValida(categoriaSugerida)) {
      return categoriaSugerida as CategoriaProduto;
    }
    return 'Outros';
  }

  const nameNorm = normalizeText(nomeProduto);

  // 1. Farmácia e Medicamentos
  if (
    /\b(dipirona|dorflex|paracetamol|neosaldina|ibuprofeno|aspirina|analgesico|antibiotico|pomada|xarope|vitamina|suplemento|curativo|bandaid|cimegrip|benegrip|buscopan|novalgina|tylenol|allegra|loratadina|omeprazol|simeticona|neosoro|comprimido|comprimidos|cpr|cprs|cps|capsula|capsulas|drogaria|farmacia|remedio|medicamento|glicose|nebulizador|termometro|soro)\b/i.test(
      nameNorm
    ) ||
    nameNorm.includes('medley') ||
    nameNorm.includes('eurofarma') ||
    nameNorm.includes('ems S/a')
  ) {
    return 'Farmácia e Medicamentos';
  }

  // 2. Hortifruti
  if (
    /\b(maca|banana|laranja|limao|uva|manga|mamao|melancia|abacaxi|morango|tomate|cebola|alho|batata|cenoura|alface|rucula|couve|brocolis|abobora|pimentao|ovos|ovo|fruta|verdura|legume|salada|maracuja|pera|caqui|melao|abacate|inhame|mandioca|vagem|chuchu|beterraba|repolho|salsa|salsinha|cebolinha|espinafre|hortelã|hortela|kiwi|ameixa|figo|goiaba)\b/i.test(
      nameNorm
    )
  ) {
    return 'Hortifruti';
  }

  // 3. Carnes e Aves
  if (
    /\b(carne|alcatra|picanha|contrafile|patinho|maminha|fraldinha|cupim|costela|bife|moida|acem|coxao|linguica|salsicha|bacon|frango|coxa|sobrecoxa|peito|file|filet|asa|tulipa|peru|chester|porco|suino|lombo|bisteca|costelinha|peixe|salmao|tilapia|camarao|sardinha|atum|quibe|hamburguer|picanha|alcatra|coracao|nugget|nuggets|empanado|bovina|suina|ave|frango)\b/i.test(
      nameNorm
    )
  ) {
    return 'Carnes e Aves';
  }

  // 4. Laticínios e Frios
  if (
    /\b(leite|queijo|mussarela|mozzarella|parmesao|requeijao|manteiga|margarina|iogurte|yogurte|danone|chambourcy|creme de leite|leite condensado|presunto|apresuntado|peito de peru|salame|salami|mortadela|ricota|cottage|provolone|gorgonzola|coalho|yakult|fermentado|nata|chantilly|catupiry|gorgonzola|brie|camembert|queijo prato|queijo minas|leite em po)\b/i.test(
      nameNorm
    )
  ) {
    return 'Laticínios e Frios';
  }

  // 5. Bebidas
  if (
    /\b(coca|cola|refrigerante|guarana|fanta|sprite|pepsi|suco|del valle|maguary|agua|cerveja|chopp|brahma|skol|heineken|stella|amstel|budweiser|eisenbahn|vinho|espumante|champagne|vodka|whisky|whiskey|gin|rum|cachaca|energetico|red bull|monster|isotonico|gatorade|cha|mate|kapo|toddynho|h2oh|tonica|redbull|long neck|latão|lata)\b/i.test(
      nameNorm
    )
  ) {
    return 'Bebidas';
  }

  // 6. Mat. Limpeza
  if (
    /\b(sabao|omo|ype|brilhante|ipe|detergente|desinfetante|amaciante|downy|comfort|fofo|agua sanitaria|cloro|veja|multiuso|limpador|saponaceo|desengordurante|esponja|bombril|palha de aco|papel higienico|neve|duetto|personal|papel toalha|saco de lixo|lixo|lustra moveis|inseticida|baygon|raid|sbp|lysoform|qboa|vanish|alvejante|desentupidor|lustrador)\b/i.test(
      nameNorm
    )
  ) {
    return 'Mat. Limpeza';
  }

  // 7. Higiene e Perfumaria
  if (
    /\b(shampoo|xampu|condicionador|sabonete|dove|lux|protex|rexona|pantene|seda|elseve|creme dental|pasta de dente|colgate|sorriso|sensodyne|fio dental|enxaguante|listerine|escova|desodorante|aerosol|roll-on|absorvente|always|intimus|fralda|pampers|huggies|lenco umedecido|lamina|gillette|prestobarba|algodao|cotonete|haste flexivel|acetona|esmalte|tintura|koleston|tresemme|monange)\b/i.test(
      nameNorm
    )
  ) {
    return 'Higiene e Perfumaria';
  }

  // 8. Mercearia
  if (
    /\b(arroz|feijao|macarrao|massa|farinha|acucar|sal|oleo|azeite|vinagre|molho|extrato|ketchup|mostarda|maionese|hellmanns|biscoito|bolacha|torrada|pao|bolo|cereal|cereais|sucrilhos|aveia|cafe|pilao|melitta|nescau|toddy|chocolate|lacta|garoto|bala|chiclete|pipoca|snack|salgadinho|doritos|lays|cheetos|fandango|castanha|amendoim|conserva|palmito|ervilha|sardinha em lata|atum em lata|panetone|gelatina|fermento|sopa|mistura|maizena|creme vegetal)\b/i.test(
      nameNorm
    )
  ) {
    return 'Mercearia';
  }

  // If a valid suggested category exists and is not 'Outros', use it
  if (categoriaSugerida && isCategoriaValida(categoriaSugerida) && categoriaSugerida !== 'Outros') {
    return categoriaSugerida as CategoriaProduto;
  }

  return 'Outros';
}

function isCategoriaValida(cat: string): boolean {
  const categoriasValidas: CategoriaProduto[] = [
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
  return categoriasValidas.includes(cat as CategoriaProduto);
}
