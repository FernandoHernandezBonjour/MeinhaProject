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
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Cadastrar Novo Usuário</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Nome de usuário *
          </label>
          <input
            type="text"
            id="username"
            name="username"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="nome_usuario"
            value={formData.username}
            onChange={handleChange}
          />
          <p className="mt-1 text-xs text-gray-500">
            Apenas letras, números e underscore. Sem espaços.
          </p>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Função *
          </label>
          <select
            id="role"
            name="role"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="user">Usuário</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 p-3 bg-yellow-50 rounded-md">
        <p className="text-sm text-yellow-700">
          <strong>Senha inicial:</strong> 123456
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          O usuário será obrigado a alterar esta senha no primeiro login.
        </p>
      </div>
    </div>
  );
};
