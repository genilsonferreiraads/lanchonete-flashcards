import React, { useState } from 'react';
import { supabase } from '../supabase';

interface AddProductProps {
  onClose: () => void;
  onProductAdded: () => void;
}

const AddProduct: React.FC<AddProductProps> = ({ onClose, onProductAdded }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Buscar o próximo ID disponível
      const { data: existingProducts, error: fetchError } = await supabase
        .from('flashcard_products')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const nextId = existingProducts && existingProducts.length > 0 
        ? existingProducts[0].id + 1 
        : 1;

      // Inserir novo produto
      const { error: insertError } = await supabase
        .from('flashcard_products')
        .insert({
          id: nextId,
          code: code.trim(),
          name: name.trim(),
        });

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Este código já existe. Escolha outro código.');
        } else {
          setError(insertError.message || 'Erro ao adicionar produto');
        }
      } else {
        setSuccess(true);
        setCode('');
        setName('');
        
        // Chamar callback para atualizar a lista
        setTimeout(() => {
          onProductAdded();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError('Erro ao adicionar produto. Tente novamente.');
      console.error('Add product error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
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
        
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Adicionar Produto</h1>
            <p className="text-base text-gray-600">Cadastre um novo produto com código</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                ✅ Produto adicionado com sucesso!
              </div>
            )}

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
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
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
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                placeholder="Ex: Novo Produto"
              />
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-green-600 text-white rounded-lg px-6 py-4 text-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Adicionando...' : success ? 'Adicionado com sucesso!' : 'Adicionar Produto'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 rounded-lg px-6 py-3 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;

