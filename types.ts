
export interface FlashcardData {
  id: number;
  front: string;
  back: string;
  usage_category?: 'high' | 'medium' | 'low';
  product_type?: 'refeição' | 'lanches' | 'bebidas' | 'outros';
}

export interface CardStats {
  id: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: number;
  totalAttempts: number;
  correctAttempts: number;
  lastReviewDate: number | null;
}

export interface SpacedRepetitionState {
  [cardId: number]: CardStats;
}
