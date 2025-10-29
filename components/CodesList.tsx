
import React from 'react';
import { CARDS } from '../constants';

interface CodesListProps {
  onClose: () => void;
}

const CodesList: React.FC<CodesListProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="relative min-h-screen p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-600 bg-white shadow-sm"
          title="Fechar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="max-w-4xl mx-auto pt-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Lista de Códigos</h1>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Código</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Produto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {CARDS.map((card) => (
                    <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 font-mono font-semibold">{card.back}</td>
                      <td className="px-4 py-3 text-gray-700">{card.front}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodesList;

