import React, { useState } from 'react';
import { supabase } from '../supabase';

interface LoginProps {
  onLoginSuccess: () => void;
  onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validar email antes de enviar
      if (!email || !email.includes('@')) {
        setError('Email inválido');
        setLoading(false);
        return;
      }

      if (!password || password.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres');
        setLoading(false);
        return;
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginError) {
        console.error('Login error details:', loginError);
        
        // Mensagens de erro mais específicas
        if (loginError.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else if (loginError.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu email antes de fazer login');
        } else if (loginError.message.includes('Email rate limit')) {
          setError('Muitas tentativas. Aguarde alguns minutos.');
        } else {
          setError(loginError.message || 'Erro ao fazer login');
        }
      } else if (data?.user) {
        onLoginSuccess();
      } else {
        setError('Erro desconhecido ao fazer login');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Erro ao fazer login. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Login</h2>
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

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white rounded-lg px-4 py-3 font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

