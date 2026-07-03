import { createClient } from '@supabase/supabase-js';
import type { FlashcardData } from './types';
import { inferProductTypeFromProduct } from './productCategories';

const supabaseUrl = 'https://cvjwpgphpvefxnrsdiwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2andwZ3BocHZlZnhucnNkaXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNTI5NDgsImV4cCI6MjA1MjYyODk0OH0.4BaGXn3ypP11Ao-wGg84YzNrfU9gt5WKH0a4nENYgKs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PRODUCTS_CACHE_TTL = 2 * 60 * 1000;
let productsCache: FlashcardData[] | null = null;
let productsCacheTime = 0;
let productsRequest: Promise<FlashcardData[]> | null = null;

function mapProducts(data: any[]): FlashcardData[] {
  return data.map((product) => ({
    id: product.id,
    back: product.code,
    front: product.name,
    usage_category: product.usage_category,
    product_type: inferProductTypeFromProduct({
      front: product.name,
      back: product.code,
      product_type: product.product_type,
    }),
  }));
}

export function primeProductsCache(products: FlashcardData[]): void {
  productsCache = products;
  productsCacheTime = Date.now();
}

export function invalidateProductsCache(): void {
  productsCache = null;
  productsCacheTime = 0;
  productsRequest = null;
}

export async function fetchProductsFromSupabase(options: { force?: boolean } = {}): Promise<FlashcardData[]> {
  const isCacheFresh = productsCache && Date.now() - productsCacheTime < PRODUCTS_CACHE_TTL;
  if (!options.force && isCacheFresh) {
    return productsCache;
  }

  if (!options.force && productsRequest) {
    return productsRequest;
  }

  productsRequest = fetchProductsFromSupabaseUncached();
  const products = await productsRequest;
  productsRequest = null;
  return products;
}

async function fetchProductsFromSupabaseUncached(): Promise<FlashcardData[]> {
  try {
    const { data, error } = await supabase
      .from('flashcard_products')
      .select('id, code, name, usage_category, product_type')
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching products from Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    const products = mapProducts(data);
    primeProductsCache(products);
    return products;
  } catch (error) {
    console.error('Error fetching products from Supabase:', error);
    return [];
  }
}
