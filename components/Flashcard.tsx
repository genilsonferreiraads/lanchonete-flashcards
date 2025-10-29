
import React from 'react';

interface FlashcardProps {
  frontContent: string;
  backContent: string;
  isFlipped: boolean;
  onFlip: () => void;
}

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
            <p className="text-text-light-primary text-3xl font-bold leading-tight tracking-[-0.015em] break-words">{frontContent}</p>
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
          <p className="text-text-light-secondary text-sm font-semibold tracking-wider uppercase">Código</p>
          <p className="text-text-light-primary text-7xl font-bold leading-tight tracking-[-0.015em] mt-2">{backContent}</p>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;