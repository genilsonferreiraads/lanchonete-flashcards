
import React, { useState, useMemo } from 'react';
import { CARDS } from '../constants';
import { fetchProductsFromSupabase } from '../supabase';

interface CodesListProps {
  onClose: () => void;
}

const CodesList: React.FC<CodesListProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState(CARDS);

  // Buscar produtos do Supabase ao montar
  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        const supabaseProducts = await fetchProductsFromSupabase();
        if (supabaseProducts.length > 0) {
          setProducts(supabaseProducts);
        }
      } catch (error) {
        console.error('Failed to load products from Supabase:', error);
      }
    };

    loadProducts();
  }, []);

  // Ordenar os cards por código numérico
  const sortedCards = useMemo(() => {
    return [...products].sort((a, b) => {
      const codeA = parseInt(a.back, 10);
      const codeB = parseInt(b.back, 10);
      return codeA - codeB;
    });
  }, [products]);

  // Filtrar cards baseado na busca
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedCards;
    }
    const query = searchQuery.toLowerCase().trim();
    return sortedCards.filter((card) => {
      const codeMatch = card.back.toLowerCase().includes(query);
      const nameMatch = card.front.toLowerCase().includes(query);
      return codeMatch || nameMatch;
    });
  }, [sortedCards, searchQuery]);

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
          
          {/* Barra de busca */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código ou produto..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600">
                {filteredCards.length} resultado{filteredCards.length !== 1 ? 's' : ''} encontrado{filteredCards.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-[70vh] overflow-y-auto">
              {filteredCards.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Código</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Produto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCards.map((card) => (
                      <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 font-mono font-semibold">{card.back}</td>
                        <td className="px-4 py-3 text-gray-700">{card.front}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-500 text-lg">Nenhum resultado encontrado</p>
                  <p className="text-gray-400 text-sm mt-2">Tente buscar por código ou nome do produto</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodesList;

