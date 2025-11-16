'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loginAction } from '@/lib/actions/auth';

export const LoginFormServer: React.FC = () => {
  const { updateUser } = useAuth();
  const [error, setError] = useState<string>('');
  const [bgImage] = useState(() => Math.random() < 0.1 ? '/images/negao_da_picona.jpg' : '/images/back.jpg');

  const handleSubmit = async (formData: FormData) => {
    setError('');

    try {
      const result = await loginAction(formData);
      
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.user) {
        // Atualizar o contexto local
        updateUser(result.user);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao fazer login');
    }
  };
  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white/60 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-black dark:border-gray-700 p-8 transition-colors duration-200">
          <div>
            <h2 className="mt-6 text-center text-4xl font-black text-red-600 dark:text-red-400">
              🚨 CALOTEIROS DO GRUPO
            </h2>
            <p className="mt-4 text-center text-xl text-gray-800 dark:text-gray-200 font-bold">
              Entre aí pra ver quem tá devendo!
            </p>
          </div>
        
        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                👤 Seu nome de usuário:
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:border-red-500 dark:focus:border-red-600 text-lg font-bold transition-colors duration-200"
                placeholder="Digite seu nome aí..."
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                🔒 Sua senha:
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600 focus:border-red-500 dark:focus:border-red-600 text-lg font-bold transition-colors duration-200"
                placeholder="Digite sua senha aí..."
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 p-4 transition-colors duration-200">
              <div className="text-lg text-red-800 dark:text-red-300 font-bold text-center">❌ {error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-6 border-2 border-black dark:border-gray-700 text-xl font-black rounded-xl text-white bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-700 dark:to-orange-700 hover:from-red-700 hover:to-orange-700 dark:hover:from-red-600 dark:hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-600 shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              🚀 ENTRAR NO SISTEMA 🚀
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
