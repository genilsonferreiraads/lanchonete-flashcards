import { createClient } from '@supabase/supabase-js';
import type { FlashcardData } from './types';

const supabaseUrl = 'https://cvjwpgphpvefxnrsdiwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2andwZ3BocHZlZnhucnNkaXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNTI5NDgsImV4cCI6MjA1MjYyODk0OH0.4BaGXn3ypP11Ao-wGg84YzNrfU9gt5WKH0a4nENYgKs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchProductsFromSupabase(): Promise<FlashcardData[]> {
  try {
    const { data, error } = await supabase
      .from('flashcard_products')
      .select('id, code, name')
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching products from Supabase:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transformar os dados do Supabase para o formato FlashcardData
    return data.map((product) => ({
      id: product.id,
      back: product.code,
      front: product.name,
    }));
  } catch (error) {
    console.error('Error fetching products from Supabase:', error);
    return [];
  }
}

