import type { CardStats, SpacedRepetitionState, FlashcardData } from './types';
import { compareProductsByLearningRank } from './productCategories';

const STORAGE_KEY = 'spaced_repetition_state';
const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

export class SpacedRepetitionService {
  private state: SpacedRepetitionState = {};

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load spaced repetition state:', error);
      this.state = {};
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save spaced repetition state:', error);
    }
  }

  initializeCard(cardId: number): void {
    if (!this.state[cardId]) {
      this.state[cardId] = {
        id: cardId,
        interval: 0,
        repetitions: 0,
        easeFactor: INITIAL_EASE_FACTOR,
        nextReview: Date.now(),
        totalAttempts: 0,
        correctAttempts: 0,
        incorrectStreak: 0,
        lastReviewDate: null,
      };
      this.saveToStorage();
    }
  }

  recordCorrectAnswer(cardId: number): void {
    this.initializeCard(cardId);
    const stats = this.state[cardId];

    stats.totalAttempts++;
    stats.correctAttempts++;
    stats.incorrectStreak = 0;
    stats.lastReviewDate = Date.now();

    // SM-2 Algorithm
    if (stats.repetitions === 0) {
      stats.interval = 1;
    } else if (stats.repetitions === 1) {
      stats.interval = 3;
    } else {
      stats.interval = Math.round(stats.interval * stats.easeFactor);
    }

    stats.repetitions++;
    stats.easeFactor = Math.max(
      MIN_EASE_FACTOR,
      stats.easeFactor + 0.1
    );

    // Schedule next review
    stats.nextReview = Date.now() + stats.interval * 24 * 60 * 60 * 1000;

    this.saveToStorage();
  }

  recordIncorrectAnswer(cardId: number): void {
    this.initializeCard(cardId);
    const stats = this.state[cardId];

    stats.totalAttempts++;
    stats.incorrectStreak = (stats.incorrectStreak || 0) + 1;
    stats.lastReviewDate = Date.now();
    stats.repetitions = 0;
    stats.interval = 0;
    stats.easeFactor = Math.max(MIN_EASE_FACTOR, stats.easeFactor - 0.2);

    // Keep the card available in the current session. The app queue decides
    // whether it returns after 10 products or sooner after repeated misses.
    stats.nextReview = Date.now();

    this.saveToStorage();
  }

  getCardStats(cardId: number): CardStats | null {
    this.initializeCard(cardId);
    return this.state[cardId] || null;
  }

  getAllStats(): SpacedRepetitionState {
    return { ...this.state };
  }

  sortCardsByPriority(cardIds: number[], cardsList?: FlashcardData[]): number[] {
    const now = Date.now();
    
    const cardMap = new Map<number, FlashcardData>();
    if (cardsList) {
      cardsList.forEach(c => {
        cardMap.set(c.id, c);
      });
    }

    return [...cardIds].sort((a, b) => {
      // Initialize cards if they don't exist
      if (!this.state[a]) this.initializeCard(a);
      if (!this.state[b]) this.initializeCard(b);
      
      const statsA = this.state[a];
      const statsB = this.state[b];

      // Priority 1: Cards due for review (nextReview < now)
      const isDueA = statsA.nextReview < now;
      const isDueB = statsB.nextReview < now;

      if (isDueA && !isDueB) return -1;
      if (!isDueA && isDueB) return 1;

      // Priority 2: Learning rank (classification first, then product category)
      if (cardsList) {
        const cardA = cardMap.get(a);
        const cardB = cardMap.get(b);
        if (cardA && cardB) return compareProductsByLearningRank(cardA, cardB);
      }

      // Priority 3: Cards with lower easeFactor (more difficult)
      if (statsA.easeFactor !== statsB.easeFactor) {
        return statsA.easeFactor - statsB.easeFactor;
      }

      // Priority 4: Less reviewed cards
      return statsA.repetitions - statsB.repetitions;
    });
  }

  getStats(): { totalCards: number; masteredCards: number; reviewDueCount: number } {
    const now = Date.now();
    let masteredCards = 0;
    let reviewDueCount = 0;

    Object.values(this.state).forEach((stats) => {
      if (stats.nextReview < now) {
        reviewDueCount++;
      }
      if (stats.repetitions >= 5 && stats.easeFactor >= 2.3) {
        masteredCards++;
      }
    });

    return {
      totalCards: Object.keys(this.state).length,
      masteredCards,
      reviewDueCount,
    };
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();
