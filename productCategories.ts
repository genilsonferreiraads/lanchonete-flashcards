import type { FlashcardData, ProductType } from './types';

export const PRODUCT_TYPE_OPTIONS: Array<{ value: ProductType; label: string; priority: number }> = [
  { value: 'lanches', label: 'Lanches', priority: 1 },
  { value: 'refeicoes', label: 'Refeição', priority: 2 },
  { value: 'bebidas', label: 'Bebidas e refrigerantes', priority: 3 },
  { value: 'salgadinhos', label: 'Salgadinhos', priority: 4 },
];

const usagePriority = {
  high: 1,
  medium: 2,
  low: 3,
} as const;

const productTypePriority: Record<ProductType, number> = {
  lanches: 1,
  refeicoes: 2,
  bebidas: 3,
  salgadinhos: 4,
};

const normalizeText = (text: string) => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

export const normalizeProductType = (value?: string | null): ProductType | undefined => {
  if (!value) return undefined;

  const normalized = normalizeText(value);
  if (normalized.includes('lanche')) return 'lanches';
  if (normalized.includes('refeicao') || normalized.includes('refeicoes') || normalized.includes('refeição')) return 'refeicoes';
  if (normalized.includes('bebida') || normalized.includes('refrigerante')) return 'bebidas';
  if (normalized.includes('salgadinho')) return 'salgadinhos';

  if (value === 'lanches' || value === 'refeicoes' || value === 'bebidas' || value === 'salgadinhos') {
    return value;
  }

  return undefined;
};

export const inferProductTypeFromProduct = (product: Pick<FlashcardData, 'front' | 'back' | 'product_type'>): ProductType => {
  const existing = normalizeProductType(product.product_type);
  if (existing) return existing;

  const name = normalizeText(product.front);

  if (
    name.includes('fandangos') ||
    name.includes('doritos') ||
    name.includes('cheetos') ||
    name.includes('cebolitos') ||
    name.includes('batata ')
  ) {
    return 'salgadinhos';
  }

  if (
    name.includes('coca') ||
    name.includes('fanta') ||
    name.includes('kuat') ||
    name.includes('sprite') ||
    name.includes('antarctica') ||
    name.includes('tonica') ||
    name.includes('agua') ||
    name.includes('cajuina') ||
    name.includes('suco') ||
    name.includes('jarra') ||
    name.includes('iogurte') ||
    name.includes('toddynho') ||
    name.includes('monster') ||
    name.includes('red bull') ||
    name.includes('power bull') ||
    name.includes('megaton') ||
    name.includes('guaraton') ||
    name.includes('del valle') ||
    name.includes('cafe') ||
    name.includes('leite') ||
    name.includes('coco') ||
    name.includes('golito')
  ) {
    return 'bebidas';
  }

  if (
    name === 'pf' ||
    name.includes('cuscus') ||
    name.includes('arroz') ||
    name.includes('bife') ||
    name.includes('frango') ||
    name.includes('costela') ||
    name.includes('bode') ||
    name.includes('sopa') ||
    name.includes('caldo') ||
    name.includes('macaxeira') ||
    name.includes('porcao') ||
    name.includes('feijao') ||
    name.includes('macarrao') ||
    name.includes('carne moida') ||
    name.includes('mocoto') ||
    name.includes('sol')
  ) {
    return 'refeicoes';
  }

  return 'lanches';
};

export const getProductTypeMeta = (value?: string | null) => {
  const productType = normalizeProductType(value) || 'lanches';
  return PRODUCT_TYPE_OPTIONS.find((option) => option.value === productType) || PRODUCT_TYPE_OPTIONS[0];
};

export const getUsagePriority = (value?: string | null) => {
  if (value === 'medium') return usagePriority.medium;
  if (value === 'low') return usagePriority.low;
  return usagePriority.high;
};

export const getProductTypePriority = (product: Pick<FlashcardData, 'front' | 'back' | 'product_type'>) => {
  return productTypePriority[inferProductTypeFromProduct(product)];
};

export const compareProductsByLearningRank = (a: FlashcardData, b: FlashcardData) => {
  const usageDiff = getUsagePriority(a.usage_category) - getUsagePriority(b.usage_category);
  if (usageDiff !== 0) return usageDiff;

  const typeDiff = getProductTypePriority(a) - getProductTypePriority(b);
  if (typeDiff !== 0) return typeDiff;

  const codeA = parseInt(a.back, 10);
  const codeB = parseInt(b.back, 10);
  if (Number.isNaN(codeA) || Number.isNaN(codeB)) return a.back.localeCompare(b.back);
  return codeA - codeB;
};
