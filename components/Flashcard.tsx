
import React, { useState, useEffect } from 'react';

interface FlashcardProps {
  frontContent: string;
  backContent: string;
  isFlipped: boolean;
  onFlip: () => void;
}

// Typing animation component
const TypingText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 30 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return <span>{displayedText}<span className="animate-pulse">|</span></span>;
};

// Fade-in animation component
const FadeInText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <span className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {text}
    </span>
  );
};

const Flashcard: React.FC<FlashcardProps> = ({ frontContent, backContent, isFlipped, onFlip }) => {
  return (
    <div className="flip-card aspect-[3/2]">
      <div 
        className={`flip-card-inner rounded-xl shadow-xl border border-slate-200/80 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
        aria-live="polite"
      >
        {/* Front Face */}
        <div className="flip-card-front w-full h-full flex flex-col items-center justify-between bg-white p-6 rounded-xl overflow-hidden">
          <div className="text-center flex-grow flex flex-col justify-center px-2">
            <p className="text-text-light-secondary text-sm font-semibold tracking-wider uppercase mb-4">Produto</p>
            <div className="text-text-light-primary text-3xl font-bold leading-tight tracking-[-0.015em] break-words">
              {!isFlipped ? (
                <TypingText text={frontContent} delay={30} />
              ) : (
                <span>{frontContent}</span>
              )}
            </div>
          </div>
          {!isFlipped && (
            <div className="flex justify-center w-full pt-4">
              <button 
                onClick={onFlip}
                className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-white text-primary text-sm font-bold leading-normal border-2 border-primary hover:bg-primary hover:text-white active:scale-95 transition-all duration-200"
              >
                <span className="truncate">Mostrar</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Back Face */}
        <div className="flip-card-back w-full h-full flex flex-col items-center justify-center bg-white p-6 rounded-xl">
          <div className="text-text-light-secondary text-lg font-medium leading-tight tracking-[-0.015em] text-center px-2 mb-6">
            <FadeInText text={frontContent} delay={200} />
          </div>
          <p className="text-text-light-secondary text-sm font-semibold tracking-wider uppercase mb-2">Código</p>
          <div className="text-text-light-primary text-7xl font-bold leading-tight tracking-[-0.015em]">
            <FadeInText text={backContent} delay={400} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;