
import React, { useState, useMemo } from 'react';
import { CARDS } from '../constants';
import { fetchProductsFromSupabase } from '../supabase';

interface CodesListProps {
  onClose: () => void;
}

const CodesList: React.FC<CodesListProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState(CARDS);
  const [filterCategory, setFilterCategory] = useState<'all' | 'high' | 'medium' | 'low'>('all');

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

  // Filtrar e ordenar cards baseado na busca e categoria selecionada
  const filteredCards = useMemo(() => {
    let list = [...products];

    // 1. Filtrar por categoria
    if (filterCategory === 'high') {
      list = list.filter(c => !c.usage_category || c.usage_category === 'high');
    } else if (filterCategory === 'medium') {
      list = list.filter(c => c.usage_category === 'medium');
    } else if (filterCategory === 'low') {
      list = list.filter(c => c.usage_category === 'low');
    }

    // 2. Ordenar
    if (filterCategory === 'all') {
      // Se for "todos", ordenar por ordem de importância (high > medium > low) e depois por código
      const categoryWeight = { high: 1, medium: 2, low: 3 };
      list.sort((a, b) => {
        const catA = a.usage_category || 'high';
        const catB = b.usage_category || 'high';
        const weightA = categoryWeight[catA as keyof typeof categoryWeight] || 1;
        const weightB = categoryWeight[catB as keyof typeof categoryWeight] || 1;
        
        if (weightA !== weightB) {
          return weightA - weightB;
        }
        
        return parseInt(a.back, 10) - parseInt(b.back, 10);
      });
    } else {
      // Se for categoria específica, ordenar por código numérico
      list.sort((a, b) => {
        return parseInt(a.back, 10) - parseInt(b.back, 10);
      });
    }

    // 3. Filtrar por busca
    if (!searchQuery.trim()) {
      return list;
    }
    const query = searchQuery.toLowerCase().trim();
    return list.filter((card) => {
      const codeMatch = card.back.toLowerCase().includes(query);
      const nameMatch = card.front.toLowerCase().includes(query);
      return codeMatch || nameMatch;
    });
  }, [products, filterCategory, searchQuery]);

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
          </div>
          
          {/* Filtros de Categoria */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
                filterCategory === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos (Por Relevância)
            </button>
            <button
              onClick={() => setFilterCategory('high')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
                filterCategory === 'high'
                  ? 'bg-green-600 text-white border-green-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Muito Usados
            </button>
            <button
              onClick={() => setFilterCategory('medium')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
                filterCategory === 'medium'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Usados às Vezes
            </button>
            <button
              onClick={() => setFilterCategory('low')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
                filterCategory === 'low'
                  ? 'bg-slate-500 text-white border-slate-500 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Pouco Usados
            </button>
          </div>

          {(searchQuery || filterCategory !== 'all') && (
            <p className="mb-3 text-xs text-gray-500">
              {filteredCards.length} resultado{filteredCards.length !== 1 ? 's' : ''} encontrado{filteredCards.length !== 1 ? 's' : ''}
            </p>
          )}
          
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
                        <td className="px-4 py-3 text-gray-700">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{card.front}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                              card.usage_category === 'low'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : card.usage_category === 'medium'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-green-50 text-green-700 border-green-200'
                            }`}>
                              {card.usage_category === 'low'
                                ? 'Pouco usado'
                                : card.usage_category === 'medium'
                                  ? 'Usado às vezes'
                                  : 'Muito usado'}
                            </span>
                          </div>
                        </td>
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

