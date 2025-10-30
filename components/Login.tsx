import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface LoginProps {
  onLoginSuccess: () => void;
  onClose: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos em milissegundos
const STORAGE_KEY = 'login_attempts';

interface LoginAttempts {
  count: number;
  lockoutUntil: number | null;
}

const getLoginAttempts = (): LoginAttempts => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const now = Date.now();
      
      // Se o bloqueio expirou, resetar
      if (data.lockoutUntil && now > data.lockoutUntil) {
        localStorage.removeItem(STORAGE_KEY);
        return { count: 0, lockoutUntil: null };
      }
      
      return data;
    }
  } catch (error) {
    console.error('Error reading login attempts:', error);
  }
  return { count: 0, lockoutUntil: null };
};

const incrementLoginAttempts = (): LoginAttempts => {
  const attempts = getLoginAttempts();
  const newCount = attempts.count + 1;
  
  let lockoutUntil: number | null = null;
  if (newCount >= MAX_ATTEMPTS) {
    lockoutUntil = Date.now() + LOCKOUT_DURATION;
  }
  
  const newData: LoginAttempts = {
    count: newCount,
    lockoutUntil,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  return newData;
};

const resetLoginAttempts = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState<LoginAttempts>(getLoginAttempts());
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Animação de entrada
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  // Atualizar tentativas ao montar
  useEffect(() => {
    const currentAttempts = getLoginAttempts();
    setAttempts(currentAttempts);
    
    // Calcular tempo restante inicial se houver bloqueio
    if (currentAttempts.lockoutUntil && Date.now() < currentAttempts.lockoutUntil) {
      setTimeRemaining(currentAttempts.lockoutUntil - Date.now());
    }
  }, []);

  // Timer para contar o tempo restante do bloqueio
  useEffect(() => {
    if (attempts.lockoutUntil && Date.now() < attempts.lockoutUntil) {
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, attempts.lockoutUntil! - now);
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          resetLoginAttempts();
          setAttempts({ count: 0, lockoutUntil: null });
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setTimeRemaining(0);
    }
  }, [attempts.lockoutUntil]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // Aguardar animação de saída
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se está bloqueado
    const currentAttempts = getLoginAttempts();
    if (currentAttempts.lockoutUntil && Date.now() < currentAttempts.lockoutUntil) {
      const remaining = currentAttempts.lockoutUntil - Date.now();
      setError(`Acesso bloqueado por ${MAX_ATTEMPTS} tentativas falhas. Aguarde ${formatTimeRemaining(remaining)} antes de tentar novamente.`);
      setAttempts(currentAttempts);
      return;
    }
    
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
        
        // Incrementar tentativas apenas em erro de credenciais
        if (loginError.message.includes('Invalid login credentials')) {
          const newAttempts = incrementLoginAttempts();
          setAttempts(newAttempts);
          
          const remainingAttempts = MAX_ATTEMPTS - newAttempts.count;
          
          if (newAttempts.lockoutUntil) {
            setError(`Muitas tentativas falhas. Acesso bloqueado por 15 minutos por segurança.`);
          } else {
            setError(`Email ou senha incorretos. ${remainingAttempts > 0 ? `${remainingAttempts} tentativa${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}.` : 'Última tentativa!'}`);
          }
        } else {
          // Mensagens de erro mais específicas para outros erros
          if (loginError.message.includes('Email logins are disabled') || loginError.message.includes('email is disabled')) {
            setError('Login por email está desabilitado. Por favor, habilite o Email Provider no Supabase Dashboard (Authentication → Providers → Email)');
          } else if (loginError.message.includes('Email not confirmed')) {
            setError('Por favor, confirme seu email antes de fazer login');
          } else if (loginError.message.includes('Email rate limit')) {
            setError('Muitas tentativas. Aguarde alguns minutos.');
          } else {
            setError(loginError.message || 'Erro ao fazer login');
          }
        }
      } else if (data?.user) {
        // Login bem-sucedido - resetar tentativas
        resetLoginAttempts();
        setAttempts({ count: 0, lockoutUntil: null });
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
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      <path d="M15.707 4.293a1 1 0 010 1.414l-11 11a1 1 0 01-1.414-1.414l11-11a1 1 0 011.414 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (attempts.lockoutUntil !== null && Date.now() < attempts.lockoutUntil)}
              className="w-full bg-green-600 text-white rounded-lg px-6 py-4 text-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Entrando...' : attempts.lockoutUntil && Date.now() < attempts.lockoutUntil ? `Bloqueado (${formatTimeRemaining(timeRemaining)})` : 'Entrar'}
            </button>
            
            {attempts.count > 0 && attempts.count < MAX_ATTEMPTS && !attempts.lockoutUntil && (
              <p className="text-sm text-center text-orange-600">
                ⚠️ {attempts.count} de {MAX_ATTEMPTS} tentativas falhas
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

