
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { CARDS } from './constants';
import type { FlashcardData } from './types';
import Flashcard from './components/Flashcard';
import ProgressBar from './components/ProgressBar';
import { spacedRepetitionService } from './spacedRepetition';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export default function App() {
  const [cards] = useState<FlashcardData[]>(() => shuffleArray(CARDS));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('correctAnswers');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showResetMenu, setShowResetMenu] = useState(false);

  // Initialize review queue with all cards due for review
  useEffect(() => {
    const now = Date.now();
    const cardIds = cards.map(c => c.id);
    
    // Get only cards that are due for review OR have never been initialized
    const due = cardIds.filter(id => {
      const stats = spacedRepetitionService.getCardStats(id);
      if (!stats) return true; // New cards
      return stats.nextReview <= now; // Due for review
    });

    // Sort by priority
    const sorted = spacedRepetitionService.sortCardsByPriority(due);
    setReviewQueue(sorted);
    // DON'T reset correctAnswers here - keep it from localStorage
    setCurrentIndex(0);
  }, [cards, forceUpdate]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleCorrectAnswer = useCallback(() => {
    if (reviewQueue.length === 0) return;
    
    const cardId = reviewQueue[currentIndex];
    spacedRepetitionService.recordCorrectAnswer(cardId);
    
    // Mark this card as correctly answered
    const newCorrectAnswers = new Set(correctAnswers);
    newCorrectAnswers.add(cardId);
    setCorrectAnswers(newCorrectAnswers);
    
    // Save to localStorage
    localStorage.setItem('correctAnswers', JSON.stringify([...newCorrectAnswers]));

    // Remove from queue and advance
    const newQueue = reviewQueue.filter((_, idx) => idx !== currentIndex);
    
    if (newQueue.length === 0) {
      // All cards answered correctly - finished!
      setReviewQueue([]);
    } else {
      // Continue with remaining cards
      setReviewQueue(newQueue);
      setCurrentIndex(0);
    }

    setIsFlipped(false);
  }, [currentIndex, reviewQueue, correctAnswers]);

  const handleIncorrectAnswer = useCallback(() => {
    if (reviewQueue.length === 0) return;
    
    const cardId = reviewQueue[currentIndex];
    spacedRepetitionService.recordIncorrectAnswer(cardId);

    // Move this card ahead based on queue size (like Anki does)
    // For larger lists, move further ahead
    const newQueue = [...reviewQueue];
    const [movedCard] = newQueue.splice(currentIndex, 1);
    
    // Calculate positions ahead: max(5, half of queue length)
    const positionsAhead = Math.max(5, Math.floor(newQueue.length / 2));
    const insertPosition = Math.min(currentIndex + positionsAhead, newQueue.length);
    newQueue.splice(insertPosition, 0, movedCard);

    setReviewQueue(newQueue);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [currentIndex, reviewQueue]);

  const handleReset = useCallback(() => {
    setShowResetMenu(true);
  }, []);

  const confirmReset = useCallback(() => {
    localStorage.removeItem('spaced_repetition_state');
    localStorage.removeItem('correctAnswers');
    window.location.reload();
  }, []);

  const cancelReset = useCallback(() => {
    setShowResetMenu(false);
  }, []);

  const currentCard = useMemo(() => {
    if (reviewQueue.length === 0) return null;
    const cardId = reviewQueue[currentIndex];
    return cards.find(c => c.id === cardId) || null;
  }, [reviewQueue, currentIndex, cards]);

  const hasCards = reviewQueue.length > 0;
  const totalCardsToLearn = reviewQueue.length + correctAnswers.size;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col text-text-light-primary">
      {showResetMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={cancelReset}>
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Resetar Progresso</h3>
            <p className="text-sm text-gray-600 mb-4">Tem certeza que deseja apagar todo o progresso?</p>
            <div className="flex gap-3">
              <button
                onClick={confirmReset}
                className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 transition-colors font-semibold"
              >
                Confirmar
              </button>
              <button
                onClick={cancelReset}
                className="flex-1 bg-gray-200 text-gray-800 rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center p-4 sm:p-6 md:p-8">
          <div className="layout-content-container flex flex-col w-full max-w-md flex-1">
            <header className="w-full py-8 text-center relative">
              <h1 className="text-3xl font-bold tracking-tight text-text-light-primary">Lanchonete Limarques</h1>
              <button 
                onClick={handleReset}
                className="absolute top-0 right-0 text-xs opacity-30 hover:opacity-60 transition-opacity"
                title="Resetar progresso"
              >
                Reset
              </button>
            </header>
            
            <main className="flex-grow flex flex-col justify-center gap-8">
              {hasCards ? (
                <>
                  <ProgressBar current={correctAnswers.size} total={totalCardsToLearn} />
                  
                  <div className="px-4">
                    {currentCard && (
                      <Flashcard 
                        frontContent={currentCard.front}
                        backContent={currentCard.back}
                        isFlipped={isFlipped}
                        onFlip={handleFlip}
                      />
                    )}
                  </div>

                  <div className={`flex flex-1 gap-4 flex-wrap px-4 pt-4 justify-between transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button 
                      onClick={handleIncorrectAnswer}
                      tabIndex={isFlipped ? 0 : -1}
                      className="flex-1 flex gap-2 min-w-[84px] items-center justify-center overflow-hidden rounded-full h-14 px-5 bg-white text-danger text-lg font-bold leading-normal tracking-[0.015em] border-2 border-danger hover:bg-danger/10 active:bg-danger/20 transition-all duration-200"
                      aria-hidden={!isFlipped}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      <span className="truncate">Errei</span>
                    </button>
                    <button 
                      onClick={handleCorrectAnswer}
                      tabIndex={isFlipped ? 0 : -1}
                      className="flex-1 flex gap-2 min-w-[84px] items-center justify-center overflow-hidden rounded-full h-14 px-5 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] hover:opacity-90 active:scale-95 transition-all duration-200"
                      aria-hidden={!isFlipped}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span className="truncate">Acertei</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <div className="text-6xl">🎉</div>
                  <h2 className="text-2xl font-bold">Parabéns!</h2>
                  <p className="text-lg opacity-75">Você completou todas as revisões de hoje.</p>
                  <p className="text-sm opacity-60">Volte amanhã para continuar aprendendo!</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}