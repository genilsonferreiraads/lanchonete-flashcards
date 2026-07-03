export type ProductType = 'lanches' | 'refeicoes' | 'bebidas' | 'salgadinhos';

export interface FlashcardData {
  id: number;
  front: string;
  back: string;
  usage_category?: 'high' | 'medium' | 'low';
  product_type?: ProductType;
}

export interface CardStats {
  id: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectStreak?: number;
  lastReviewDate: number | null;
}

export interface SpacedRepetitionState {
  [cardId: number]: CardStats;
}
