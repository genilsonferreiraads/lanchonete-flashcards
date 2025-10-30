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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Adicionar Produto</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Produto adicionado com sucesso!
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Código *
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Ex: 250"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Produto *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Ex: Novo Produto"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 rounded-lg px-4 py-3 font-medium hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 bg-green-600 text-white rounded-lg px-4 py-3 font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adicionando...' : success ? 'Adicionado!' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;

