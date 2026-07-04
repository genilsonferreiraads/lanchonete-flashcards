
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CARDS } from './constants';
import type { FlashcardData } from './types';

import CodesList from './components/CodesList';
import Login from './components/Login';
import AddProduct from './components/AddProduct';
import FlashcardExercise, { type AnswerResult, type ExerciseState } from './components/FlashcardExercise';
import { spacedRepetitionService } from './spacedRepetition';
import { fetchProductsFromSupabase, supabase } from './supabase';
import { compareProductsByLearningRank } from './productCategories';

const FIRST_MISS_REVIEW_GAP = 10;
const REPEATED_MISS_REVIEW_GAP = 5;

export default function App() {
  const [cards, setCards] = useState<FlashcardData[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [pendingQueue, setPendingQueue] = useState<number[] | null>(null);
  const [exerciseState, setExerciseState] = useState<ExerciseState>('answering');
  const [typedCode, setTypedCode] = useState('');
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
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
  const [incorrectAnswers, setIncorrectAnswers] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('incorrectAnswers');
      const lastDate = localStorage.getItem('lastSessionDate');
      const today = new Date().toDateString();

      if (lastDate !== today) {
        return new Set();
      }

      if (!saved) return new Set();
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? new Set(parsed) : new Set();
    } catch {
      return new Set();
    }
  });
  const [forceUpdate, setForceUpdate] = useState(0);
  const [filterCategory, setFilterCategory] = useState<'active' | 'all' | 'high' | 'medium' | 'low'>('active');
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const [showCodesList, setShowCodesList] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [openCreateOnProductPanel, setOpenCreateOnProductPanel] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const answerLockRef = useRef(false);
  
  // Refs para armazenar os timeouts do popup de erro

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
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          setIsAuthenticated(false);
          return;
        }
        
        // Verificar se a sessão é válida (não expirada)
        if (session && session.expires_at) {
          const expiresAt = session.expires_at * 1000; // Converter para milissegundos
          if (Date.now() > expiresAt) {
            // Sessão expirada, fazer logout
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            return;
          }
        }
        
        setIsAuthenticated(!!session);
      } catch (err) {
        console.error('Erro ao verificar autenticação:', err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Ouvir mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Tratar eventos de logout explicitamente
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setShowAddProduct(false);
        setOpenCreateOnProductPanel(false);
      } else {
        setIsAuthenticated(!!session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const themeColor = showAddProduct || showCodesList || showLogin ? '#ecfdf5' : '#f8fafc';
    const metaTheme = document.querySelector('meta[name="theme-color"]');

    if (metaTheme) {
      metaTheme.setAttribute('content', themeColor);
    }

    document.documentElement.classList.toggle('app-theme-emerald', themeColor === '#ecfdf5');
    document.documentElement.classList.toggle('app-theme-surface', themeColor === '#f8fafc');
    document.documentElement.style.backgroundColor = themeColor;
    document.body.style.backgroundColor = themeColor;

    return () => {
      if (metaTheme) {
        metaTheme.setAttribute('content', '#f8fafc');
      }
      document.documentElement.classList.remove('app-theme-emerald');
      document.documentElement.classList.add('app-theme-surface');
      document.documentElement.style.backgroundColor = '#f8fafc';
      document.body.style.backgroundColor = '#f8fafc';
    };
  }, [showAddProduct, showCodesList, showLogin]);

  // Buscar produtos do Supabase ao carregar
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const supabaseProducts = await fetchProductsFromSupabase();
        if (supabaseProducts.length > 0) {
          // Usar produtos do Supabase
          setCards([...supabaseProducts].sort(compareProductsByLearningRank));
        } else {
          // Fallback para produtos locais se Supabase estiver vazio
          console.log('Using local products as fallback');
          setCards([...CARDS].sort(compareProductsByLearningRank));
        }
      } catch (error) {
        console.error('Failed to load products from Supabase, using local fallback:', error);
        setCards([...CARDS].sort(compareProductsByLearningRank));
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
        setCards([...supabaseProducts].sort(compareProductsByLearningRank));
        setForceUpdate(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to reload products:', error);
    }
  }, []);

  // Limpar timeouts quando o componente desmontar



  // A fila principal sempre contempla todos os produtos. A prioridade muda a ordem,
  // mas não reduz o total que o visitante precisa estudar.
  const activeCards = useMemo(() => {
    if (filterCategory === 'high') return cards.filter(c => !c.usage_category || c.usage_category === 'high');
    if (filterCategory === 'medium') return cards.filter(c => c.usage_category === 'medium');
    if (filterCategory === 'low') return cards.filter(c => c.usage_category === 'low');
    return cards;
  }, [cards, filterCategory]);

  // Informações detalhadas sobre a fase atual de aprendizado para a interface
  const currentPhaseInfo = useMemo(() => {
    const isCardLearned = (id: number) => {
      const stats = spacedRepetitionService.getCardStats(id);
      return stats ? stats.repetitions >= 3 : false;
    };

    const highCards = cards.filter(c => !c.usage_category || c.usage_category === 'high');
    const mediumCards = cards.filter(c => c.usage_category === 'medium');
    const lowCards = cards.filter(c => c.usage_category === 'low');

    const unlearnedHigh = highCards.filter(c => !isCardLearned(c.id));
    const unlearnedMedium = mediumCards.filter(c => !isCardLearned(c.id));
    const unlearnedLow = lowCards.filter(c => !isCardLearned(c.id));

    if (filterCategory === 'high') {
      return {
        level: 'high',
        name: 'Filtro: Apenas Muito Usados',
        description: 'Treinando exclusivamente os códigos de alta importância.',
        learnedCount: highCards.length - unlearnedHigh.length,
        totalCount: highCards.length,
      };
    } else if (filterCategory === 'medium') {
      return {
        level: 'medium',
        name: 'Filtro: Apenas Usados às Vezes',
        description: 'Treinando exclusivamente os códigos de média importância.',
        learnedCount: mediumCards.length - unlearnedMedium.length,
        totalCount: mediumCards.length,
      };
    } else if (filterCategory === 'low') {
      return {
        level: 'low',
        name: 'Filtro: Apenas Pouco Usados',
        description: 'Treinando exclusivamente os códigos de baixa importância.',
        learnedCount: lowCards.length - unlearnedLow.length,
        totalCount: lowCards.length,
      };
    } else if (filterCategory === 'all') {
      const unlearnedAll = cards.filter(c => !isCardLearned(c.id));
      return {
        level: 'all',
        name: 'Filtro: Todos os Códigos',
        description: 'Treinando todos os códigos do sistema em ordem de importância.',
        learnedCount: cards.length - unlearnedAll.length,
        totalCount: cards.length,
      };
    }

    if (unlearnedHigh.length > 0 && highCards.length > 0) {
      return {
        level: 'high',
        name: 'Fase 1: Códigos Mais Usados',
        description: 'Foco nos códigos essenciais do dia a dia da lanchonete.',
        learnedCount: highCards.length - unlearnedHigh.length,
        totalCount: highCards.length,
      };
    } else if (unlearnedMedium.length > 0 && mediumCards.length > 0) {
      return {
        level: 'medium',
        name: 'Fase 2: Códigos Usados às Vezes',
        description: 'Muito bem! Você desbloqueou os códigos intermediários.',
        learnedCount: mediumCards.length - unlearnedMedium.length,
        totalCount: mediumCards.length,
      };
    } else {
      return {
        level: 'all',
        name: 'Fase 3: Todos os Códigos',
        description: 'Incrível! Você já domina a maior parte e agora treina o nível completo.',
        learnedCount: cards.length,
        totalCount: cards.length,
      };
    }
  }, [cards, forceUpdate, filterCategory]);

  // Initialize review queue with all cards due for review
  useEffect(() => {
    if (isLoadingProducts) return;

    const activeCardIds = activeCards.map(c => c.id);

    // Keep every product in the session. Spaced repetition and learning rank only
    // decide the order, so the progress total always represents all products.
    const sorted = spacedRepetitionService.sortCardsByPriority(activeCardIds, cards);
    setReviewQueue(sorted);
    
    // Check if it's a new day and reset if needed
    const lastDate = localStorage.getItem('lastSessionDate');
    const today = new Date().toDateString();
    
    if (lastDate !== today) {
      localStorage.setItem('lastSessionDate', today);
      localStorage.removeItem('correctAnswers');
      localStorage.removeItem('incorrectAnswers');
      setCorrectAnswers(new Set());
      setIncorrectAnswers(new Set());
    }
    
    setCurrentIndex(0);
    setPendingQueue(null);
    setTypedCode('');
    setAnswerResult(null);
    answerLockRef.current = false;
    setExerciseState(sorted.length > 0 ? 'answering' : 'completed');
  }, [activeCards, cards, isLoadingProducts]);

  const registerCorrectAnswer = useCallback((cardId: number) => {
    spacedRepetitionService.recordCorrectAnswer(cardId);

    const newCorrectAnswers = new Set(correctAnswers);
    newCorrectAnswers.add(cardId);
    setCorrectAnswers(newCorrectAnswers);

    localStorage.setItem('correctAnswers', JSON.stringify([...newCorrectAnswers]));
    localStorage.setItem('lastSessionDate', new Date().toDateString());

    return reviewQueue.filter((_, idx) => idx !== currentIndex);
  }, [correctAnswers, currentIndex, reviewQueue]);

  const registerIncorrectAnswer = useCallback((cardId: number) => {
    spacedRepetitionService.recordIncorrectAnswer(cardId);
    const stats = spacedRepetitionService.getCardStats(cardId);

    setIncorrectAnswers((current) => {
      const next = new Set(current);
      next.add(cardId);
      localStorage.setItem('incorrectAnswers', JSON.stringify([...next]));
      localStorage.setItem('lastSessionDate', new Date().toDateString());
      return next;
    });

    const newQueue = [...reviewQueue];
    const [movedCard] = newQueue.splice(currentIndex, 1);
    const reviewGap = (stats?.incorrectStreak || 0) > 1 ? REPEATED_MISS_REVIEW_GAP : FIRST_MISS_REVIEW_GAP;
    const insertPosition = Math.min(currentIndex + reviewGap, newQueue.length);
    newQueue.splice(insertPosition, 0, movedCard);

    return newQueue;
  }, [currentIndex, reviewQueue]);

  const finishAnswer = useCallback((nextState: Exclude<ExerciseState, 'answering' | 'completed'>, submittedCode: string) => {
    if (exerciseState !== 'answering' || answerLockRef.current) return;
    answerLockRef.current = true;
    const cardId = reviewQueue[currentIndex];
    const currentCardData = cards.find(c => c.id === cardId);
    if (!cardId || !currentCardData) return;

    const correctCode = String(currentCardData.back ?? '');
    const isCorrect = nextState === 'correct';
    const nextQueue = isCorrect ? registerCorrectAnswer(cardId) : registerIncorrectAnswer(cardId);

    setAnswerResult({
      productName: currentCardData.front,
      typedCode: submittedCode,
      correctCode,
    });
    setPendingQueue(nextQueue);
    setExerciseState(nextState);
  }, [cards, currentIndex, exerciseState, registerCorrectAnswer, registerIncorrectAnswer, reviewQueue]);

  const handleDigit = useCallback((digit: string) => {
    if (exerciseState !== 'answering') return;
    setTypedCode((current) => {
      const cardId = reviewQueue[currentIndex];
      const currentCardData = cards.find(c => c.id === cardId);
      const maxLength = currentCardData ? Math.max(String(currentCardData.back ?? '').length, 1) : 1;
      return current.length >= maxLength ? current : `${current}${digit}`;
    });
  }, [cards, currentIndex, exerciseState, reviewQueue]);

  const handleDeleteDigit = useCallback(() => {
    if (exerciseState !== 'answering') return;
    setTypedCode((current) => current.slice(0, -1));
  }, [exerciseState]);

  const handleConfirmCode = useCallback(() => {
    if (exerciseState !== 'answering' || !typedCode) return;
    const cardId = reviewQueue[currentIndex];
    const currentCardData = cards.find(c => c.id === cardId);
    if (!currentCardData) return;

    const correctCode = String(currentCardData.back ?? '');
    finishAnswer(typedCode === correctCode ? 'correct' : 'incorrect', typedCode);
  }, [cards, currentIndex, exerciseState, finishAnswer, reviewQueue, typedCode]);

  const handleUnknownAnswer = useCallback(() => {
    if (exerciseState !== 'answering') return;
    finishAnswer('unknown', typedCode);
  }, [exerciseState, finishAnswer, typedCode]);

  useEffect(() => {
    if (showLogin || showAddProduct || showCodesList) return;
    if (exerciseState !== 'answering') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTextInput) return;

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        handleDigit(event.key);
      } else if (event.key === 'Backspace') {
        event.preventDefault();
        handleDeleteDigit();
      } else if (event.key === 'Enter' && typedCode) {
        event.preventDefault();
        handleConfirmCode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exerciseState, handleConfirmCode, handleDeleteDigit, handleDigit, showAddProduct, showCodesList, showLogin, typedCode]);

  const resetAnswerState = useCallback(() => {
    setTypedCode('');
    setAnswerResult(null);
    setPendingQueue(null);
    answerLockRef.current = false;
    setExerciseState('answering');
    setCurrentIndex(0);
  }, []);

  const handleNextProduct = useCallback(() => {
    if (!pendingQueue) return;

    if (pendingQueue.length === 0) {
      setReviewQueue([]);
      setPendingQueue(null);
      setTypedCode('');
      setAnswerResult(null);
      setExerciseState('completed');
      setCurrentIndex(0);
      return;
    }

    setReviewQueue(pendingQueue);
    resetAnswerState();
  }, [pendingQueue, resetAnswerState]);

  const restartExercise = useCallback(() => {
    const activeCardIds = activeCards.map(card => card.id);
    const sorted = spacedRepetitionService.sortCardsByPriority(activeCardIds, cards);
    setCorrectAnswers(new Set());
    setIncorrectAnswers(new Set());
    localStorage.setItem('correctAnswers', JSON.stringify([]));
    localStorage.setItem('incorrectAnswers', JSON.stringify([]));
    localStorage.setItem('lastSessionDate', new Date().toDateString());
    setReviewQueue(sorted);
    setCurrentIndex(0);
    setPendingQueue(null);
    setTypedCode('');
    setAnswerResult(null);
    answerLockRef.current = false;
    setExerciseState(sorted.length > 0 ? 'answering' : 'completed');
  }, [activeCards, cards]);

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
    localStorage.removeItem('incorrectAnswers');

    window.location.reload();
  }, []);



  const handleOpenCodesList = useCallback(() => {
    setShowCodesList(true);
  }, []);

  const handleCloseCodesList = useCallback(() => {
    setShowCodesList(false);
  }, []);

  const handleAddProductClick = useCallback(() => {
    setOpenCreateOnProductPanel(false);
    if (isAuthenticated) {
      setShowAddProduct(true);
    } else {
      setShowLogin(true);
    }
  }, [isAuthenticated]);

  const handleNewProductClick = useCallback(() => {
    setOpenCreateOnProductPanel(true);
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
    try {
      // Fazer logout do Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
      }
      
      // Limpar estado local
      setIsAuthenticated(false);
      setShowAddProduct(false);
      setShowLogin(false);
      setOpenCreateOnProductPanel(false);
      
      // Verificar se a sessão foi realmente removida
      const { data: { session } } = await supabase.auth.getSession();
      
      // Se ainda houver sessão após signOut, limpar manualmente localStorage relacionados ao Supabase
      if (session) {
        // Limpar todas as chaves do localStorage relacionadas ao Supabase
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Forçar atualização da página após um pequeno delay para garantir que o estado foi limpo
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      // Mesmo em caso de erro, limpar estado e recarregar
      setIsAuthenticated(false);
      setShowAddProduct(false);
      window.location.reload();
    }
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
  const studiedProductIds = useMemo(() => new Set([...correctAnswers, ...incorrectAnswers]), [correctAnswers, incorrectAnswers]);
  const answeredCount = Math.min(studiedProductIds.size, totalCardsToLearn);
  const progressPercentage = totalCardsToLearn > 0 ? (answeredCount / totalCardsToLearn) * 100 : 0;
  const currentProgressCode = totalCardsToLearn > 0 ? Math.min(answeredCount + (hasCards ? 1 : 0), totalCardsToLearn) : 0;
  const maxCodeLength = useMemo(() => Math.max(...cards.map(card => String(card.back ?? '').length), 1), [cards]);
  const currentCodeLength = currentCard ? Math.max(String(currentCard.back ?? '').length, 1) : maxCodeLength;
  const isLastCard = (pendingQueue?.length ?? reviewQueue.length) === 0;
  const errorPopup: any = null;
  const closeErrorPopup = () => {};

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col text-text-light-primary">
      {showLogin && (
        <Login onLoginSuccess={handleLoginSuccess} onClose={() => setShowLogin(false)} />
      )}
      {showAddProduct && (
        <AddProduct
          onClose={() => {
            setShowAddProduct(false);
            setOpenCreateOnProductPanel(false);
          }}
          onProductAdded={handleProductAdded}
          initialProducts={cards}
          initialCreateOpen={openCreateOnProductPanel}
        />
      )}
      {showCodesList && (
        <CodesList onClose={handleCloseCodesList} />
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
              <button
                onClick={() => closeErrorPopup()}
                className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-bold hover:bg-green-700 transition-colors shadow-lg"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
      {showResetMenu && (
        <div 
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ${
            isClosing ? 'opacity-0' : isOpening ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={cancelReset}
        >
          <div 
            className={`bg-white rounded-2xl p-6 max-w-xs w-full mx-4 shadow-xl border border-slate-100 transition-all duration-300 ease-out ${
              isClosing ? 'opacity-0 scale-95' : isOpening ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-slate-800 text-lg text-center mb-2">Resetar Progresso?</h3>
            <p className="text-xs text-slate-500 mb-6 text-center leading-relaxed">Isso irá apagar todo o seu progresso de aprendizado e histórico de acertos no dispositivo.</p>
            <div className="flex gap-2.5">
              <button
                onClick={cancelReset}
                className="flex-1 bg-slate-100 text-slate-700 rounded-xl px-4 py-2.5 font-bold hover:bg-slate-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 bg-rose-500 text-white rounded-xl px-4 py-2.5 hover:bg-rose-600 transition-colors text-sm font-bold shadow-md shadow-rose-500/10"
              >
                Resetar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center p-4 sm:p-6 md:p-8">
          <div className="layout-content-container flex flex-col w-full max-w-md flex-1">
            <header className="relative w-full py-3 px-4 flex justify-between items-center gap-3 border border-emerald-100 bg-white sticky top-[env(safe-area-inset-top)] z-40 rounded-2xl shadow-sm shadow-slate-900/8 mb-1">
              {showUserMenu && (
                <button
                  type="button"
                  className="fixed inset-0 z-30 cursor-default"
                  aria-label="Fechar menu"
                  onClick={() => setShowUserMenu(false)}
                />
              )}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative z-40 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu((value) => !value)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                    title="Abrir menu"
                    aria-expanded={showUserMenu}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
                  </button>
                  {showUserMenu && (
                    <div className="absolute left-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-emerald-100 bg-white p-2 shadow-2xl shadow-slate-900/12">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          handleAddProductClick();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .64l-.03.08a2 2 0 1 1-3.94 0L10 20a1.7 1.7 0 0 0-1-.64 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-.64-1L3.92 14a2 2 0 1 1 0-3.94L4 10a1.7 1.7 0 0 0 .64-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-.64l.03-.08a2 2 0 1 1 3.94 0L14 4a1.7 1.7 0 0 0 1 .64 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9c.05.36.27.7.64 1l.08.03a2 2 0 1 1 0 3.94L20 14a1.7 1.7 0 0 0-.6 1Z"/></svg>
                        Gerenciar produtos
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          handleNewProductClick();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                        Novo produto
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          handleOpenCodesList();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/></svg>
                        Página de códigos
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          handleReset();
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        Resetar progresso
                      </button>
                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-3 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
                          Sair
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-base font-black tracking-tight text-slate-900">Restaurante Limarques</h1>
                  <div className="mt-1.5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] font-black text-slate-500">Código {currentProgressCode} de {totalCardsToLearn}</p>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-100">
                          {correctAnswers.size} acertos
                        </span>
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-600 ring-1 ring-rose-100">
                          {incorrectAnswers.size} erros
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-emerald-50">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative z-40 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((value) => !value)}
                  className="hidden"
                  title="Abrir menu"
                  aria-expanded={showUserMenu}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
                </button>
                {false && showUserMenu && (
                  <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-emerald-100 bg-white p-2 shadow-2xl shadow-slate-900/12">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleAddProductClick();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                      Gerenciar produtos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleOpenCodesList();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/></svg>
                      Página de códigos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleReset();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                      Resetar progresso
                    </button>
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-3 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
                        Sair
                      </button>
                    )}
                  </div>
                )}
                <button 
                  onClick={handleOpenCodesList}
                  className="hidden"
                  title="Ver códigos"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  <span className="hidden sm:inline">Códigos</span>
                </button>
                <button 
                  onClick={handleAddProductClick}
                  className="hidden"
                  title={isAuthenticated ? "Gerenciar produtos" : "Entrar como admin"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span className="hidden sm:inline">Painel</span>
                </button>
                {isAuthenticated && (
                  <button 
                    onClick={handleLogout}
                    className="hidden"
                    title="Sair"
                  >
                    Sair
                  </button>
                )}
                <button 
                  onClick={handleReset}
                  className="hidden"
                  title="Resetar progresso"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                </button>
              </div>
            </header>
            
            <main className="flex-grow flex flex-col justify-start gap-1 pt-1 sm:gap-1.5">
              {/* Filtros de Categoria */}
              <div className="hidden">
                <button
                  onClick={() => setFilterCategory('active')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap flex items-center gap-1 ${
                    filterCategory === 'active'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/10'
                      : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  💡 Sugerido (Fases)
                </button>
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap flex items-center gap-1 ${
                    filterCategory === 'all'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterCategory('high')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap flex items-center gap-1 ${
                    filterCategory === 'high'
                      ? 'bg-green-600 text-white border-green-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  Muito Usados
                </button>
                <button
                  onClick={() => setFilterCategory('medium')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap flex items-center gap-1 ${
                    filterCategory === 'medium'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  Usados às Vezes
                </button>
                <button
                  onClick={() => setFilterCategory('low')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap flex items-center gap-1 ${
                    filterCategory === 'low'
                      ? 'bg-slate-500 text-white border-slate-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  Pouco Usados
                </button>
              </div>

              {isLoadingProducts ? (
                <div className="px-4 pt-2">
                  <div className="mx-auto w-full max-w-sm animate-pulse space-y-5">
                    <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-100/70">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="h-4 w-24 rounded-full bg-slate-100" />
                          <div className="h-3 w-32 rounded-full bg-slate-100" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-16 rounded-full bg-emerald-50" />
                          <div className="h-7 w-14 rounded-full bg-rose-50" />
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-emerald-50">
                        <div className="h-2 w-1/5 rounded-full bg-emerald-100" />
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/70">
                      <div className="flex min-h-[420px] flex-col items-center justify-between">
                        <div className="w-full space-y-3 pt-8 text-center">
                          <div className="mx-auto h-3 w-20 rounded-full bg-slate-100" />
                          <div className="mx-auto h-8 w-44 rounded-full bg-slate-100" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-12 w-12 rounded-2xl bg-slate-100" />
                          <div className="h-12 w-12 rounded-2xl bg-slate-100" />
                          <div className="h-12 w-12 rounded-2xl bg-slate-100" />
                        </div>
                        <div className="grid w-full max-w-[280px] grid-cols-3 gap-3 pb-2">
                          {Array.from({ length: 12 }).map((_, index) => (
                            <div
                              key={index}
                              className={`h-16 rounded-2xl ${index === 9 || index === 11 ? 'bg-slate-50' : 'bg-slate-100'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : hasCards || exerciseState === 'completed' ? (
                <>
                  <div className="hidden">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">Progresso</p>
                        <p className="text-xs font-bold text-slate-500">Código {currentProgressCode} de {totalCardsToLearn}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100">
                          {correctAnswers.size} acertos
                        </span>
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-600 ring-1 ring-rose-100">
                          {incorrectAnswers.size} erros
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-emerald-50">
                      <div
                        className="h-2 rounded-full bg-emerald-500 transition-all duration-300 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="px-4 pt-2 pb-0 relative flex flex-none items-start justify-center scroll-mt-28">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl -z-10"></div>
                    <div className="w-full max-w-sm">
                      <FlashcardExercise
                        card={currentCard}
                        state={exerciseState}
                        typedCode={typedCode}
                        result={answerResult}
                        maxCodeLength={currentCodeLength}
                        isLastCard={isLastCard}
                        studiedCount={studiedProductIds.size}
                        correctCount={correctAnswers.size}
                        incorrectCount={incorrectAnswers.size}
                        onDigit={handleDigit}
                        onDelete={handleDeleteDigit}
                        onConfirm={handleConfirmCode}
                        onUnknown={handleUnknownAnswer}
                        onNext={handleNextProduct}
                        onStudyAgain={restartExercise}
                        onBackHome={restartExercise}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-5 text-center py-12 px-6 bg-white border border-slate-100 rounded-3xl shadow-sm mx-4">
                  <div className="text-6xl animate-bounce">🎉</div>
                  <h2 className="text-2xl font-black text-slate-800">Parabéns!</h2>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-xs">Você completou todas as revisões de hoje para os cartões desta fase.</p>
                  <p className="text-[11px] text-slate-400 font-medium">Volte amanhã para continuar praticando ou adicione novos produtos!</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

