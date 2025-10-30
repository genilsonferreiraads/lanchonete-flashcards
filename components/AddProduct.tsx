import React, { useState, useEffect, useMemo } from 'react';
import { supabase, fetchProductsFromSupabase } from '../supabase';
import type { FlashcardData } from '../types';

interface AddProductProps {
  onClose: () => void;
  onProductAdded: () => void;
}

interface Product extends FlashcardData {
  id: number;
}

const AddProduct: React.FC<AddProductProps> = ({ onClose, onProductAdded }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

  // Carregar produtos ao montar
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const supabaseProducts = await fetchProductsFromSupabase();
      setProducts(supabaseProducts as Product[]);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('🔵 Iniciando adição de produto:', { code: code.trim(), name: name.trim() });

      // Se está editando
      if (editingProduct) {
        const { error: updateError } = await supabase
          .from('flashcard_products')
          .update({
            code: code.trim(),
            name: name.trim(),
          })
          .eq('id', editingProduct.id);

        if (updateError) {
          console.error('❌ Erro ao atualizar:', updateError);
          setError(updateError.message || 'Erro ao atualizar produto');
          return;
        }

        console.log('✅ Produto atualizado com sucesso');
        setSuccess(true);
        setCode('');
        setName('');
        setEditingProduct(null);
        
        setTimeout(() => {
          setSuccess(false);
          loadProducts();
          onProductAdded();
        }, 1500);
        return;
      }

      // Buscar o próximo ID disponível
      const { data: existingProducts, error: fetchError } = await supabase
        .from('flashcard_products')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('❌ Erro ao buscar produtos:', fetchError);
        throw fetchError;
      }

      const nextId = existingProducts && existingProducts.length > 0 
        ? existingProducts[0].id + 1 
        : 1;

      const newProduct = {
        id: nextId,
        code: code.trim(),
        name: name.trim(),
      };

      console.log('💾 Tentando inserir:', newProduct);

      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Sessão de autenticação:', session ? '✅ Autenticado' : '❌ Não autenticado');

      // Inserir novo produto
      const { data: insertedData, error: insertError } = await supabase
        .from('flashcard_products')
        .insert(newProduct)
        .select();

      console.log('📥 Resultado do insert:', { insertedData, insertError });

      if (insertError) {
        console.error('❌ Erro detalhado no insert:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
        });

        if (insertError.code === '23505') {
          setError('Este código já existe. Escolha outro código.');
        } else if (insertError.message.includes('permission denied') || insertError.message.includes('policy')) {
          setError('Erro de permissão. Verifique se as políticas RLS estão configuradas corretamente. Execute o arquivo supabase_auth_policy.sql no Supabase.');
        } else {
          setError(`Erro: ${insertError.message || 'Erro ao adicionar produto'}`);
        }
      } else if (insertedData && insertedData.length > 0) {
        console.log('✅ Produto inserido com sucesso:', insertedData[0]);
        setSuccess(true);
        setCode('');
        setName('');
        
        setTimeout(() => {
          setSuccess(false);
          loadProducts();
          onProductAdded();
        }, 1500);
      } else {
        console.error('⚠️ Insert retornou sucesso mas sem dados:', { insertedData, insertError });
        setError('Produto pode ter sido adicionado, mas não foi possível confirmar. Verifique no Supabase.');
        setTimeout(() => {
          loadProducts();
          onProductAdded();
        }, 1500);
      }
    } catch (err: any) {
      console.error('❌ Erro geral ao adicionar produto:', err);
      setError(err?.message || 'Erro ao adicionar produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId: number) => {
    if (expandedProductId === productId) {
      // Se já está expandido, fecha
      setExpandedProductId(null);
      setDeleteConfirm(null);
    } else {
      // Fecha o anterior (se houver) e abre o novo
      setExpandedProductId(productId);
      setDeleteConfirm(null);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setCode(product.back);
    setName(product.front);
    setError('');
    setSuccess(false);
    setExpandedProductId(null); // Fechar a barra ao editar
    // Scroll para o topo do formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setCode('');
    setName('');
    setError('');
    setSuccess(false);
  };

  const handleDelete = async (productId: number) => {
    try {
      const { error } = await supabase
        .from('flashcard_products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Erro ao excluir:', error);
        setError('Erro ao excluir produto: ' + error.message);
        return;
      }

      setDeleteConfirm(null);
      setExpandedProductId(null); // Fechar a barra após excluir
      loadProducts();
      onProductAdded();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      setError('Erro ao excluir produto');
    }
  };

  // Ordenar produtos por código
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const codeA = parseInt(a.back, 10);
      const codeB = parseInt(b.back, 10);
      return codeA - codeB;
    });
  }, [products]);

  // Filtrar produtos pela busca
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedProducts;
    }
    const query = searchQuery.toLowerCase().trim();
    return sortedProducts.filter((product) => {
      const codeMatch = product.back.toLowerCase().includes(query);
      const nameMatch = product.front.toLowerCase().includes(query);
      return codeMatch || nameMatch;
    });
  }, [sortedProducts, searchQuery]);

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="relative min-h-screen p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-600 bg-white shadow-sm z-10"
          title="Fechar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="max-w-4xl mx-auto pt-12 pb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gerenciar Produtos</h1>
            <p className="text-base text-gray-600">Adicione, edite ou exclua produtos</p>
          </div>

          {/* Formulário de Adicionar/Editar */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingProduct ? '✏️ Editar Produto' : '➕ Adicionar Novo Produto'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  ✅ {editingProduct ? 'Produto atualizado!' : 'Produto adicionado com sucesso!'}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Código *
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    placeholder="Ex: 250"
                  />
                  <p className="mt-1 text-xs text-gray-500">Apenas números</p>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    placeholder="Ex: Novo Produto"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {editingProduct && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-lg px-4 py-3 font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancelar Edição
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || success}
                  className="flex-1 bg-green-600 text-white rounded-lg px-6 py-4 text-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading 
                    ? (editingProduct ? 'Atualizando...' : 'Adicionando...') 
                    : (editingProduct ? 'Atualizar Produto' : 'Adicionar Produto')
                  }
                </button>
              </div>
            </form>
          </div>

          {/* Barra de Busca */}
          <div className="mb-6">
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
                placeholder="Buscar por código ou nome do produto..."
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
                {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Lista de Produtos */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="max-h-[500px] overflow-y-auto">
              {filteredProducts.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      {/* Informações do Produto - Clicável */}
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => handleProductClick(product.id)}
                      >
                        <span className="text-2xl font-bold text-green-600 font-mono flex-shrink-0">
                          {product.back}
                        </span>
                        <span className="text-lg text-gray-800 break-words flex-1 min-w-0">
                          {product.front}
                        </span>
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedProductId === product.id ? 'rotate-180' : ''}`}
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      
                      {/* Botões de Ação - Aparecem quando expandido */}
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          expandedProductId === product.id ? 'max-h-20 opacity-100 mt-3 pt-3 border-t border-gray-200' : 'max-h-0 opacity-0 mt-0 pt-0'
                        }`}
                      >
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleEdit(product)}
                            className="flex-1 min-w-[120px] px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 border border-gray-200 transition-all duration-200 text-sm"
                            title="Editar"
                          >
                            Editar
                          </button>
                          {deleteConfirm === product.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="flex-1 min-w-[80px] px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all duration-200 text-sm"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 min-w-[80px] px-3 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 border border-gray-200 transition-all duration-200 text-sm"
                              >
                                Não
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(product.id)}
                              className="flex-1 min-w-[120px] px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 border border-gray-200 transition-all duration-200 text-sm"
                              title="Excluir"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchQuery ? 'Tente buscar por código ou nome diferente' : 'Adicione seu primeiro produto acima'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Total: {products.length} produto{products.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
