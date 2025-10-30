
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CARDS } from './constants';
import type { FlashcardData } from './types';
import Flashcard from './components/Flashcard';
import ProgressBar from './components/ProgressBar';
import Tutorial from './components/Tutorial';
import CodesList from './components/CodesList';
import Login from './components/Login';
import AddProduct from './components/AddProduct';
import { spacedRepetitionService } from './spacedRepetition';
import { fetchProductsFromSupabase, supabase } from './supabase';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export default function App() {
  const [cards, setCards] = useState<FlashcardData[]>(() => shuffleArray(CARDS));
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('correctAnswers');
      const lastDate = localStorage.getItem('lastSessionDate');
      const today = new Date().toDateString();
      
      // If it's a new day, reset progress
      if (lastDate !== today) {
        return new Set();
      }
      
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [errorPopup, setErrorPopup] = useState<{ productName: string; code: string; message: string; title: string } | null>(null);
  const [canCloseErrorPopup, setCanCloseErrorPopup] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCodesList, setShowCodesList] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Refs para armazenar os timeouts do popup de erro
  const errorPopupTimeoutsRef = useRef<{ showButton?: NodeJS.Timeout; autoClose?: NodeJS.Timeout }>({});

  // Educational messages variations
  const errorMessages = [
    { title: "Estude e memorize!", message: "Lembre-se: o código de {product} é {code}. Tente guardar esse número para a próxima vez!" },
    { title: "Continue aprendendo!", message: "O código correto de {product} é {code}. Pratique e você vai memorizar!" },
    { title: "Não desista!", message: "O código de {product} é {code}. Revise com atenção e você conseguirá!" },
    { title: "Foque no aprendizado!", message: "Memorize: {product} tem o código {code}. Você pode fazer isso!" },
    { title: "Tente novamente!", message: "Anote: o código de {product} é {code}. Continue praticando!" },
    { title: "Errar faz parte!", message: "O código de {product} é {code}. Use esse momento para aprender!" },
    { title: "Persistência é a chave!", message: "Lembre-se bem: {product} = código {code}. Continue estudando!" },
    { title: "Cada erro é um aprendizado!", message: "O código correto de {product} é {code}. Você vai memorizar!" },
    { title: "Foque no código!", message: "{product} tem o código {code}. Preste atenção neste número!" },
    { title: "Momento de estudo!", message: "O código de {product} é {code}. Tente visualizar e memorizar!" }
  ];

  // Verificar autenticação ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    // Ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Buscar produtos do Supabase ao carregar
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const supabaseProducts = await fetchProductsFromSupabase();
        if (supabaseProducts.length > 0) {
          // Usar produtos do Supabase
          setCards(shuffleArray(supabaseProducts));
        } else {
          // Fallback para produtos locais se Supabase estiver vazio
          console.log('Using local products as fallback');
        }
      } catch (error) {
        console.error('Failed to load products from Supabase, using local fallback:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Recarregar produtos após adicionar novo
  const handleProductAdded = useCallback(async () => {
    try {
      const supabaseProducts = await fetchProductsFromSupabase();
      if (supabaseProducts.length > 0) {
        setCards(shuffleArray(supabaseProducts));
        setForceUpdate(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to reload products:', error);
    }
  }, []);

  // Limpar timeouts quando o componente desmontar
  useEffect(() => {
    return () => {
      if (errorPopupTimeoutsRef.current.showButton) {
        clearTimeout(errorPopupTimeoutsRef.current.showButton);
      }
      if (errorPopupTimeoutsRef.current.autoClose) {
        clearTimeout(errorPopupTimeoutsRef.current.autoClose);
      }
    };
  }, []);

  // Check if tutorial should be shown (first time only)
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    const hasProgress = localStorage.getItem('spaced_repetition_state');
    
    // Show tutorial if never seen AND no progress exists (first time user)
    if (!hasSeenTutorial && !hasProgress) {
      setShowTutorial(true);
    }
  }, []);

  // Initialize review queue with all cards due for review
  useEffect(() => {
    const now = Date.now();
    const cardIds = cards.map(c => c.id);
    
    // Get cards that are due for review OR have never been initialized
    const due = cardIds.filter(id => {
      const stats = spacedRepetitionService.getCardStats(id);
      if (!stats) return true; // New cards
      return stats.nextReview <= now; // Due for review
    });

    // If no cards are due, show all cards (allow unlimited reviews)
    const cardsToReview = due.length > 0 ? due : cardIds;

    // Sort by priority
    const sorted = spacedRepetitionService.sortCardsByPriority(cardsToReview);
    setReviewQueue(sorted);
    
    // Check if it's a new day and reset if needed
    const lastDate = localStorage.getItem('lastSessionDate');
    const today = new Date().toDateString();
    
    if (lastDate !== today) {
      localStorage.setItem('lastSessionDate', today);
      localStorage.removeItem('correctAnswers');
      setCorrectAnswers(new Set());
    }
    
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
    localStorage.setItem('lastSessionDate', new Date().toDateString());

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

  const closeErrorPopup = useCallback((savedCardId?: number, savedIndex?: number, savedQueue?: number[]) => {
    // Limpar todos os timeouts
    if (errorPopupTimeoutsRef.current.showButton) {
      clearTimeout(errorPopupTimeoutsRef.current.showButton);
      errorPopupTimeoutsRef.current.showButton = undefined;
    }
    if (errorPopupTimeoutsRef.current.autoClose) {
      clearTimeout(errorPopupTimeoutsRef.current.autoClose);
      errorPopupTimeoutsRef.current.autoClose = undefined;
    }

    const cardId = savedCardId ?? reviewQueue[currentIndex];
    const index = savedIndex ?? currentIndex;
    const queue = savedQueue ?? reviewQueue;
    
    if (!cardId) return;
    
    spacedRepetitionService.recordIncorrectAnswer(cardId);

    // Move this card ahead based on queue size (like Anki does)
    const newQueue = [...queue];
    const [movedCard] = newQueue.splice(index, 1);
    
    // Calculate positions ahead: max(5, half of queue length)
    const positionsAhead = Math.max(5, Math.floor(newQueue.length / 2));
    const insertPosition = Math.min(index + positionsAhead, newQueue.length);
    newQueue.splice(insertPosition, 0, movedCard);

    setReviewQueue(newQueue);
    setCurrentIndex(0);
    setErrorPopup(null);
    setCanCloseErrorPopup(false);
    setShowContinueButton(false);
    setIsFlipped(false);
  }, [currentIndex, reviewQueue]);

  const handleIncorrectAnswer = useCallback(() => {
    if (reviewQueue.length === 0) return;
    
    // Limpar timeouts anteriores se existirem
    if (errorPopupTimeoutsRef.current.showButton) {
      clearTimeout(errorPopupTimeoutsRef.current.showButton);
      errorPopupTimeoutsRef.current.showButton = undefined;
    }
    if (errorPopupTimeoutsRef.current.autoClose) {
      clearTimeout(errorPopupTimeoutsRef.current.autoClose);
      errorPopupTimeoutsRef.current.autoClose = undefined;
    }
    
    const cardId = reviewQueue[currentIndex];
    const currentCardData = cards.find(c => c.id === cardId);
    
    if (currentCardData) {
      // Show educational popup with random message
      const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      setCanCloseErrorPopup(false);
      setShowContinueButton(false);
      setErrorPopup({
        productName: currentCardData.front,
        code: currentCardData.back,
        title: randomMessage.title,
        message: randomMessage.message
          .replace('{product}', currentCardData.front)
          .replace('{code}', currentCardData.back)
      });
      
      // Save cardId for later use
      const savedCardId = cardId;
      const savedIndex = currentIndex;
      const savedQueue = [...reviewQueue];
      
      // Show continue button after 5 seconds
      errorPopupTimeoutsRef.current.showButton = setTimeout(() => {
        setShowContinueButton(true);
        setCanCloseErrorPopup(true);
      }, 5000);
      
      // Auto-close after 10 seconds
      errorPopupTimeoutsRef.current.autoClose = setTimeout(() => {
        closeErrorPopup(savedCardId, savedIndex, savedQueue);
      }, 10000);
    }
    
    setIsFlipped(false);
  }, [currentIndex, reviewQueue, cards, closeErrorPopup]);

  const handleReset = useCallback(() => {
    setIsClosing(false);
    setIsOpening(false);
    setShowResetMenu(true);
    // Trigger opening animation
    setTimeout(() => setIsOpening(true), 10);
  }, []);

  const confirmReset = useCallback(() => {
    localStorage.removeItem('spaced_repetition_state');
    localStorage.removeItem('correctAnswers');
    localStorage.removeItem('hasSeenTutorial');
    window.location.reload();
  }, []);

  const handleTutorialClose = useCallback(() => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
  }, []);

  const handleOpenTutorial = useCallback(() => {
    setShowTutorial(true);
  }, []);

  const handleOpenCodesList = useCallback(() => {
    setShowCodesList(true);
  }, []);

  const handleCloseCodesList = useCallback(() => {
    setShowCodesList(false);
  }, []);

  const handleAddProductClick = useCallback(() => {
    if (isAuthenticated) {
      setShowAddProduct(true);
    } else {
      setShowLogin(true);
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = useCallback(() => {
    setShowLogin(false);
    setShowAddProduct(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setShowAddProduct(false);
  }, []);

  const cancelReset = useCallback(() => {
    setIsOpening(false);
    setIsClosing(true);
    setTimeout(() => {
      setShowResetMenu(false);
      setIsClosing(false);
    }, 200);
  }, []);

  const currentCard = useMemo(() => {
    if (reviewQueue.length === 0) return null;
    const cardId = reviewQueue[currentIndex];
    return cards.find(c => c.id === cardId) || null;
  }, [reviewQueue, currentIndex, cards]);

  const hasCards = reviewQueue.length > 0;
  const totalCards = cards.length;
  const totalCardsToLearn = totalCards;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col text-text-light-primary">
      {showLogin && (
        <Login onLoginSuccess={handleLoginSuccess} onClose={() => setShowLogin(false)} />
      )}
      {showAddProduct && (
        <AddProduct onClose={() => setShowAddProduct(false)} onProductAdded={handleProductAdded} />
      )}
      {showCodesList && (
        <CodesList onClose={handleCloseCodesList} />
      )}
      {showTutorial && (
        <Tutorial onClose={handleTutorialClose} />
      )}
      {errorPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="text-center">
              <div className="text-4xl mb-3">💡</div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">{errorPopup.title}</h3>
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">Produto:</p>
                <p className="text-2xl font-bold text-green-600 break-words">
                  {errorPopup.productName}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Código:</p>
                <div className="text-6xl font-bold text-green-600">
                  {errorPopup.code}
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                {errorPopup.message}
              </p>
              {!showContinueButton ? (
                <div className="w-full bg-gray-200 text-gray-500 rounded-lg px-4 py-2 font-medium text-center">
                  Aguarde 5 segundos...
                </div>
              ) : (
                <button
                  onClick={() => closeErrorPopup()}
                  className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-bold hover:bg-green-700 transition-colors shadow-lg"
                >
                  Continuar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showResetMenu && (
        <div 
          className={`fixed inset-0 bg-black/40 flex items-center justify-center z-50 transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : isOpening ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={cancelReset}
        >
          <div 
            className={`bg-white rounded-lg p-5 max-w-xs mx-4 shadow-lg transition-all duration-300 ease-out ${
              isClosing ? 'opacity-0 scale-95' : isOpening ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-gray-700 mb-4 text-center">Resetar progresso?</p>
            <div className="flex gap-2">
              <button
                onClick={cancelReset}
                className="flex-1 bg-gray-100 text-gray-700 rounded px-3 py-2 hover:bg-gray-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 bg-green-600 text-white rounded px-3 py-2 hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Confirmar
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
              <div className="absolute top-0 right-0 flex gap-2 items-center">
                <button 
                  onClick={handleAddProductClick}
                  className="w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded-full hover:bg-green-700 transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
                  title={isAuthenticated ? "Adicionar produto" : "Fazer login para adicionar produto"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                {isAuthenticated && (
                  <button 
                    onClick={handleLogout}
                    className="text-xs opacity-50 hover:opacity-80 transition-opacity text-gray-600"
                    title="Sair"
                  >
                    Sair
                  </button>
                )}
                <button 
                  onClick={handleOpenCodesList}
                  className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                  title="Ver códigos"
                >
                  Ver Códigos
                </button>
                <button 
                  onClick={handleOpenTutorial}
                  className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                  title="Ver tutorial"
                >
                  Tutorial
                </button>
                <button 
                  onClick={handleReset}
                  className="text-xs opacity-30 hover:opacity-60 transition-opacity"
                  title="Resetar progresso"
                >
                  Reset
                </button>
              </div>
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