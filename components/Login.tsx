import React, { useState, useEffect } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);

  // Animação de entrada
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // Aguardar animação de saída
  };

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
        if (loginError.message.includes('Email logins are disabled') || loginError.message.includes('email is disabled')) {
          setError('Login por email está desabilitado. Por favor, habilite o Email Provider no Supabase Dashboard (Authentication → Providers → Email)');
        } else if (loginError.message.includes('Invalid login credentials')) {
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
    <div className={`fixed inset-0 bg-white z-50 overflow-y-auto transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-600 bg-white shadow-sm z-10"
          title="Fechar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className={`max-w-md w-full space-y-6 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Lanchonete Limarques</h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 border border-green-200 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span className="text-sm font-semibold text-green-700">Acesso Restrito</span>
            </div>
            <p className="text-base text-gray-600">Entre para gerenciar produtos</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white rounded-lg px-6 py-4 text-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

