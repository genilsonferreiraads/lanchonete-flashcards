import React, { useMemo, useState } from 'react';
import { CARDS } from '../constants';
import { fetchProductsFromSupabase } from '../supabase';
import { compareProductsByLearningRank, getProductTypeMeta, inferProductTypeFromProduct } from '../productCategories';

interface CodesListProps {
  onClose: () => void;
}

type FilterCategory = 'all' | 'missed' | 'high' | 'medium' | 'low';

const filters: Array<{ value: FilterCategory; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'missed', label: 'Errados' },
  { value: 'high', label: 'Muito usados' },
  { value: 'medium', label: 'Às vezes' },
  { value: 'low', label: 'Pouco usados' },
];

const getUsageLabel = (category?: string) => {
  if (category === 'medium') return 'Usado às vezes';
  if (category === 'low') return 'Pouco usado';
  return 'Muito usado';
};

const getUsageClasses = (category?: string) => {
  if (category === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (category === 'low') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const getMissedProductIds = () => {
  const ids = new Set<number>();

  try {
    const todayMisses = JSON.parse(localStorage.getItem('incorrectAnswers') || '[]');
    if (Array.isArray(todayMisses)) {
      todayMisses.forEach((id) => {
        const numericId = Number(id);
        if (Number.isFinite(numericId)) ids.add(numericId);
      });
    }
  } catch {
    // Ignore invalid local history.
  }

  try {
    const spacedState = JSON.parse(localStorage.getItem('spaced_repetition_state') || '{}');
    Object.values(spacedState || {}).forEach((stats: any) => {
      const incorrectAttempts = Number(stats?.totalAttempts || 0) - Number(stats?.correctAttempts || 0);
      const numericId = Number(stats?.id);
      if (incorrectAttempts > 0 && Number.isFinite(numericId)) ids.add(numericId);
    });
  } catch {
    // Ignore invalid local history.
  }

  return ids;
};

const CodesList: React.FC<CodesListProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState(CARDS);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [missedProductIds, setMissedProductIds] = useState<Set<number>>(() => getMissedProductIds());

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
    setMissedProductIds(getMissedProductIds());
  }, []);

  const filteredCards = useMemo(() => {
    let list = [...products];

    if (filterCategory === 'missed') {
      list = list.filter((card) => missedProductIds.has(card.id));
    } else if (filterCategory === 'high') {
      list = list.filter((card) => !card.usage_category || card.usage_category === 'high');
    } else if (filterCategory === 'medium') {
      list = list.filter((card) => card.usage_category === 'medium');
    } else if (filterCategory === 'low') {
      list = list.filter((card) => card.usage_category === 'low');
    }

    list.sort(compareProductsByLearningRank);

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter((card) => {
      return card.back.toLowerCase().includes(query) || card.front.toLowerCase().includes(query);
    });
  }, [products, filterCategory, searchQuery, missedProductIds]);

  return (
    <div className="fixed inset-0 z-50 touch-pan-y overflow-y-auto overscroll-contain bg-emerald-50 pt-[env(safe-area-inset-top)] text-slate-950">
      <div className="mx-auto flex min-h-[calc(100dvh-env(safe-area-inset-top))] w-full max-w-3xl flex-col bg-emerald-50 px-4 pb-8 pt-0 sm:px-6">
        <header className="-mx-4 border-b border-emerald-100 bg-emerald-50 px-4 pb-4 pt-2 sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">Códigos</p>
              <h1 className="truncate text-2xl font-black tracking-tight text-slate-950">Lista de Códigos</h1>
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-slate-500 shadow-sm transition hover:bg-emerald-50 hover:text-emerald-700"
              title="Fechar"
              aria-label="Fechar lista de códigos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 space-y-4 py-4">
          <section className="rounded-3xl border border-emerald-100 bg-white p-3 shadow-sm">
            <div className="relative">
              <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar código ou produto"
                className="min-h-[52px] w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-base font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Limpar busca"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setFilterCategory(filter.value)}
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black transition ${
                    filterCategory === filter.value
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-black text-slate-800">
              {filteredCards.length} produto{filteredCards.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs font-bold text-slate-500">
              {filterCategory === 'missed' ? 'Produtos para revisar' : 'Ordenado por relevância'}
            </p>
          </div>

          <section className="space-y-3">
            {filteredCards.length > 0 ? (
              filteredCards.map((card) => (
                <article
                  key={card.id}
                  className="flex touch-pan-y items-center gap-3 rounded-3xl border border-emerald-100 bg-white p-3 shadow-sm transition-colors hover:border-emerald-200"
                >
                  <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-xl font-black tabular-nums text-emerald-800">
                    {card.back}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black text-slate-950">{card.front}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getUsageClasses(card.usage_category)}`}>
                        {getUsageLabel(card.usage_category)}
                      </span>
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                        {getProductTypeMeta(inferProductTypeFromProduct(card)).label}
                      </span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-8 text-center">
                <p className="text-lg font-black text-slate-900">
                  {filterCategory === 'missed' ? 'Nenhum produto errado' : 'Nenhum resultado encontrado'}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {filterCategory === 'missed'
                    ? 'Quando errar algum código, ele aparece aqui para revisão.'
                    : 'Tente buscar por outro código ou produto.'}
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default CodesList;
