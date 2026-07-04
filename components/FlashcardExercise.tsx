import React from 'react';
import type { FlashcardData } from '../types';

export type ExerciseState = 'answering' | 'correct' | 'incorrect' | 'unknown' | 'completed';

export interface AnswerResult {
  productName: string;
  typedCode: string;
  correctCode: string;
}

interface FlashcardExerciseProps {
  card: FlashcardData | null;
  state: ExerciseState;
  typedCode: string;
  result: AnswerResult | null;
  maxCodeLength: number;
  isLastCard: boolean;
  studiedCount: number;
  correctCount: number;
  incorrectCount: number;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  onUnknown: () => void;
  onNext: () => void;
  onStudyAgain: () => void;
  onBackHome: () => void;
}

const numberKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const CodePreview: React.FC<{ typedCode: string; maxCodeLength: number }> = ({ typedCode, maxCodeLength }) => {
  const markerCount = Math.max(maxCodeLength || 3, 1);
  const digits = typedCode.split('');

  return (
    <div className="flex min-h-[58px] items-center justify-center gap-2" aria-hidden={!typedCode}>
      {Array.from({ length: markerCount }).map((_, index) => (
        <span
          key={index}
          className={`flex h-12 w-10 items-center justify-center rounded-xl border shadow-inner shadow-slate-900/5 transition ${
            digits[index]
              ? 'border-emerald-200 bg-emerald-50 text-2xl font-black text-emerald-800'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          {digits[index] || <span className="h-2 w-2 rounded-full bg-slate-300" />}
        </span>
      ))}
    </div>
  );
};

const NumericKeypad: React.FC<Pick<FlashcardExerciseProps, 'typedCode' | 'maxCodeLength' | 'onDigit' | 'onDelete' | 'onConfirm'>> = ({
  typedCode,
  maxCodeLength,
  onDigit,
  onDelete,
  onConfirm,
}) => {
  const canConfirm = typedCode.length > 0;
  const canTypeMore = typedCode.length < maxCodeLength;

  const keyClass = 'flex h-14 min-h-14 items-center justify-center rounded-xl border border-slate-100 bg-white text-3xl font-medium text-slate-950 shadow-lg shadow-slate-900/8 transition active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-45 sm:h-16';

  return (
    <div className="mx-auto grid w-full max-w-[340px] grid-cols-3 gap-2.5 sm:gap-3">
      {numberKeys.map((digit) => (
        <button
          key={digit}
          type="button"
          className={keyClass}
          onClick={() => onDigit(digit)}
          disabled={!canTypeMore}
          aria-label={`Digitar ${digit}`}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        className="flex h-14 min-h-14 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-600 shadow-lg shadow-slate-900/8 transition active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 sm:h-16"
        onClick={onDelete}
        disabled={!typedCode}
        aria-label="Apagar último dígito"
        title="Apagar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 5H9l-7 7 7 7h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
          <path d="m12 9 6 6" />
          <path d="m18 9-6 6" />
        </svg>
      </button>
      <button
        type="button"
        className={keyClass}
        onClick={() => onDigit('0')}
        disabled={!canTypeMore}
        aria-label="Digitar 0"
      >
        0
      </button>
      <button
        type="button"
        className="flex h-14 min-h-14 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-600 px-2 text-sm font-black text-white shadow-lg shadow-emerald-700/15 transition active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:border-slate-200 disabled:bg-white disabled:text-slate-300 disabled:shadow-none sm:h-16"
        onClick={onConfirm}
        disabled={!canConfirm}
      >
        Enter
      </button>
    </div>
  );
};

const ResultCard: React.FC<{
  state: ExerciseState;
  result: AnswerResult;
  isLastCard: boolean;
  onNext: () => void;
}> = ({ state, result, isLastCard, onNext }) => {
  const isCorrect = state === 'correct';
  const isUnknown = state === 'unknown';

  return (
    <div className="w-full rounded-[1.75rem] border border-slate-200/80 bg-white px-5 py-9 text-center shadow-xl shadow-slate-900/10 sm:px-7" aria-live="assertive">
      {isCorrect ? (
        <>
          <p className="mb-8 text-3xl font-bold text-slate-400">{result.productName}</p>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-300">Código</p>
          <p className="mb-8 text-7xl font-black leading-none text-emerald-800">{result.correctCode}</p>
          <div className="flex items-center justify-center gap-3 text-4xl font-black text-emerald-600">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckIcon />
            </span>
            <span>Você acertou!</span>
          </div>
        </>
      ) : isUnknown ? (
        <>
          <p className="mb-2 text-sm font-black uppercase tracking-[0.18em] text-slate-300">Memorize</p>
          <p className="text-4xl font-black tracking-tight text-slate-950">{result.productName}</p>
          <div className="mx-auto mt-5 max-w-xs rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Código correto</p>
            <p className="mt-2 text-6xl font-black leading-none tabular-nums text-emerald-800">{result.correctCode}</p>
          </div>
          <p className="mx-auto mt-5 max-w-[15rem] text-sm font-bold leading-relaxed text-slate-500">
            Memorize produto e código antes de seguir.
          </p>
        </>
      ) : (
        <>
          <p className="mb-8 text-3xl font-bold text-slate-400">{result.productName}</p>
          <p className="mb-7 text-4xl font-black text-rose-800">Código incorreto</p>
          <p className="mb-7 text-2xl font-semibold text-slate-500">Você digitou: {result.typedCode || '-'}</p>
          <p className="text-4xl font-black text-emerald-800 sm:text-5xl">
            Código correto: {result.correctCode}
          </p>
        </>
      )}

      <button
        type="button"
        onClick={onNext}
        className="mt-10 flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 text-lg font-black text-white shadow-lg shadow-emerald-700/15 transition hover:bg-emerald-700 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        {isLastCard ? 'Ver resultado' : isUnknown ? 'Praticar agora' : 'Próximo produto'}
      </button>
    </div>
  );
};

const FinalResult: React.FC<Pick<FlashcardExerciseProps, 'studiedCount' | 'correctCount' | 'incorrectCount' | 'onStudyAgain' | 'onBackHome'>> = ({
  studiedCount,
  correctCount,
  incorrectCount,
  onStudyAgain,
  onBackHome,
}) => {
  const percentage = studiedCount > 0 ? Math.round((correctCount / studiedCount) * 100) : 0;

  return (
    <div className="w-full rounded-[1.75rem] border border-emerald-100 bg-white px-5 py-8 text-center shadow-xl shadow-slate-900/10" aria-live="polite">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-700/20">
        <CheckIcon />
      </div>
      <h2 className="mb-2 text-2xl font-black text-slate-950">Sessão concluída</h2>
      <p className="mb-6 text-sm font-semibold text-slate-500">Você terminou os produtos desta rodada.</p>

      <div className="grid grid-cols-2 gap-2.5 text-left">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Estudados</p>
          <p className="text-3xl font-black text-slate-950">{studiedCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-600">Acertos</p>
          <p className="text-3xl font-black text-emerald-700">{correctCount}</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-rose-500">Erros</p>
          <p className="text-3xl font-black text-rose-600">{incorrectCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Aproveitamento</p>
          <p className="text-3xl font-black text-slate-950">{percentage}%</p>
        </div>
      </div>

      <div className="mt-7 grid gap-3">
        <button
          type="button"
          onClick={onStudyAgain}
          className="flex h-14 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-base font-black text-white shadow-lg shadow-emerald-700/15 transition hover:bg-emerald-700 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          Estudar novamente
        </button>
        <button
          type="button"
          onClick={onBackHome}
          className="flex h-14 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 text-base font-black text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
};

const FlashcardExercise: React.FC<FlashcardExerciseProps> = (props) => {
  const {
    card,
    state,
    typedCode,
    result,
    maxCodeLength,
    isLastCard,
    studiedCount,
    correctCount,
    incorrectCount,
    onDigit,
    onDelete,
    onConfirm,
    onUnknown,
    onNext,
    onStudyAgain,
    onBackHome,
  } = props;

  if (state === 'completed') {
    return (
      <FinalResult
        studiedCount={studiedCount}
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        onStudyAgain={onStudyAgain}
        onBackHome={onBackHome}
      />
    );
  }

  if (!card) {
    return (
      <div className="w-full rounded-[1.75rem] border border-slate-100 bg-white px-5 py-10 text-center shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Nenhum produto disponível</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">Adicione produtos para começar o treino.</p>
      </div>
    );
  }

  if (state !== 'answering' && result) {
    return <ResultCard state={state} result={result} isLastCard={isLastCard} onNext={onNext} />;
  }

  return (
    <div className="w-full rounded-[1.75rem] border border-slate-200/80 bg-white px-4 py-6 shadow-xl shadow-slate-900/10 sm:px-6">
      <div className="mb-6 text-center">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Produto</p>
        <h2 className="text-4xl font-medium leading-tight text-slate-950">{card.front}</h2>
      </div>

      <div className="mb-7" aria-live="polite" aria-label={typedCode ? `Código digitado ${typedCode}` : 'Nenhum código digitado'}>
        <CodePreview typedCode={typedCode} maxCodeLength={maxCodeLength} />
      </div>

      <NumericKeypad
        typedCode={typedCode}
        maxCodeLength={maxCodeLength}
        onDigit={onDigit}
        onDelete={onDelete}
        onConfirm={onConfirm}
      />

      <button
        type="button"
        onClick={onUnknown}
        className="mx-auto mt-5 flex h-12 min-w-40 items-center justify-center rounded-full border-2 border-emerald-700 bg-white px-7 text-base font-black text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        Não sei
      </button>
    </div>
  );
};

export default FlashcardExercise;
