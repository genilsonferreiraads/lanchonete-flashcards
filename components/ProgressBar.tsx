
import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 px-4">
      <div className="flex justify-between items-center">
        <p className="text-text-light-primary text-sm font-medium leading-normal">Progresso</p>
        <p className="text-text-light-secondary text-xs font-normal leading-normal">
          Card {current} de {total}
        </p>
      </div>
      <div className="rounded-full bg-slate-200">
        <div 
          className="h-1.5 rounded-full bg-primary transition-all duration-300 ease-in-out" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;