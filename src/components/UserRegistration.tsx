'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterFormData } from '@/types';
import { registerUserAction } from '@/lib/actions/users';

interface UserRegistrationProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UserRegistration: React.FC<UserRegistrationProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    role: 'user',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username.trim()) {
      setError('Nome de usuário é obrigatório');
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Nome de usuário deve conter apenas letras, números e underscore');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('role', formData.role);
      
      const result = await registerUserAction(formDataToSend);
      
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        onSuccess?.();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao cadastrar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'username' ? value.toLowerCase() : value,
    }));
  };

  return (
    <div className="max-w-md mx-auto bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-4 border-black">
      <h2 className="text-3xl font-black text-green-600 mb-8 text-center">👤 CADASTRAR NOVA VÍTIMA 👤</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-lg font-bold text-gray-800 mb-2">
            👤 Nome do novo membro *
          </label>
          <input
            type="text"
            id="username"
            name="username"
            required
            className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-bold"
            placeholder="nome_usuario"
            value={formData.username}
            onChange={handleChange}
          />
          <p className="mt-2 text-sm text-gray-600 font-bold">
            Só letras, números e underscore. Sem espaços.
          </p>
        </div>

        <div>
          <label htmlFor="role" className="block text-lg font-bold text-gray-800 mb-2">
            👑 Que tipo de usuário? *
          </label>
          <select
            id="role"
            name="role"
            required
            className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-bold"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="user">👤 Usuário Normal</option>
            <option value="admin">👑 Administrador (Chefe)</option>
          </select>
        </div>

        {error && (
          <div className="rounded-xl bg-red-100 border-2 border-red-400 p-4">
            <div className="text-lg text-red-800 font-bold text-center">❌ {error}</div>
          </div>
        )}

        <div className="flex space-x-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-800 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-black border-2 border-black shadow-lg"
          >
            {loading ? 'Cadastrando vítima...' : '✅ CADASTRAR'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gradient-to-r from-gray-400 to-gray-600 text-white px-6 py-4 rounded-xl hover:from-gray-500 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-xl font-black border-2 border-black shadow-lg"
            >
              ❌ CANCELAR
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl border-2 border-yellow-400">
        <p className="text-lg text-yellow-800 font-bold">
          🔑 <strong>Senha inicial:</strong> 123456
        </p>
        <p className="text-base text-yellow-700 font-bold mt-2">
          Ele vai ser obrigado a trocar essa senha no primeiro login.
        </p>
      </div>
    </div>
  );
};
