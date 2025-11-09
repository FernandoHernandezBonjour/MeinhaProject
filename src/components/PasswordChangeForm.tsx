'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updatePasswordAction } from '@/lib/actions/users';

interface PasswordChangeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  forced?: boolean; // quando true, troca é obrigatória e não pode cancelar
  skipCurrentPassword?: boolean;
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onSuccess, onCancel, forced, skipCurrentPassword }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!skipCurrentPassword && !formData.currentPassword.trim()) {
      setError('Senha atual é obrigatória');
      setLoading(false);
      return;
    }

    if (!formData.newPassword.trim()) {
      setError('Nova senha é obrigatória');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Nova senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Confirmação de senha não confere');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      if (!skipCurrentPassword) {
        formDataToSend.append('currentPassword', formData.currentPassword);
      }
      formDataToSend.append('newPassword', formData.newPassword);
      formDataToSend.append('confirmPassword', formData.confirmPassword);
      
      const result = await updatePasswordAction(formDataToSend);
      
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('Senha alterada com sucesso! 🔒');

        if (user) {
          updateUser({
            ...user,
            passwordChanged: true,
            forcePasswordReset: false,
            skipCurrentPassword: false,
          });
        }

        if (forced && skipCurrentPassword) {
          setTimeout(() => {
            window.location.href = '/';
          }, 1200);
        } else {
          setTimeout(() => {
            onSuccess?.();
          }, 2000);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-md mx-auto bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-4 border-black">
      <h2 className="text-3xl font-black text-green-600 mb-2 text-center">🔒 ALTERAR SENHA 🔒</h2>
      {forced && (
        <p className="text-center text-sm font-bold text-gray-700 mb-6">
          {skipCurrentPassword
            ? 'Um administrador redefiniu sua senha. Escolha uma nova senha agora para continuar.'
            : 'Você entrou com a senha padrão. Por segurança, troque sua senha agora para continuar.'}
        </p>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {!skipCurrentPassword && (
          <div>
            <label htmlFor="currentPassword" className="block text-lg font-bold text-gray-800 mb-2">
              🔑 Senha atual:
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required
              className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-bold"
              placeholder="Digite sua senha atual..."
              value={formData.currentPassword}
              onChange={handleChange}
            />
          </div>
        )}

        <div>
          <label htmlFor="newPassword" className="block text-lg font-bold text-gray-800 mb-2">
            🆕 Nova senha:
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            required
            className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-bold"
            placeholder="Digite sua nova senha..."
            value={formData.newPassword}
            onChange={handleChange}
          />
          <p className="mt-2 text-sm text-gray-600 font-bold">
            Mínimo de 6 caracteres
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-lg font-bold text-gray-800 mb-2">
            ✅ Confirmar nova senha:
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-bold"
            placeholder="Digite novamente a nova senha..."
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-100 border-2 border-red-400 p-4">
            <div className="text-lg text-red-800 font-bold text-center">❌ {error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-green-100 border-2 border-green-400 p-4">
            <div className="text-lg text-green-800 font-bold text-center">✅ {success}</div>
          </div>
        )}

        <div className="flex space-x-4 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-black border-2 border-black shadow-lg"
          >
            {loading ? 'Alterando...' : '🔒 ALTERAR SENHA'}
          </button>

          {!forced && onCancel && (
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
    </div>
  );
};