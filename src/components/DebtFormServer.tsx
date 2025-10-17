'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUsersAction, createDebtAction } from '@/lib/actions/debts';
import { User } from '@/types';

interface DebtFormServerProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DebtFormServer: React.FC<DebtFormServerProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getUsersAction();
        if (response.success) {
          // Filtrar o usuário atual da lista
          const otherUsers = response.users.filter(u => u.id !== user?.id);
          setUsers(otherUsers);
          console.log('Usuários carregados:', otherUsers.length);
        } else {
          setError(response.error || 'Erro ao carregar usuários');
          console.error('Erro ao carregar usuários:', response.error);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        setError('Erro ao carregar lista de usuários');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  const handleSubmit = async (formData: FormData) => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    const debtorId = formData.get('debtorId') as string;
    const amount = formData.get('amount') as string;
    const dueDate = formData.get('dueDate') as string;

    if (!debtorId) {
      setError('Selecione quem está devendo');
      setSubmitting(false);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('O valor deve ser maior que zero');
      setSubmitting(false);
      return;
    }

    if (!dueDate) {
      setError('Selecione a data de promessa de pagamento');
      setSubmitting(false);
      return;
    }

    try {
      const result = await createDebtAction(formData);
      
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('Dívida criada com sucesso! 💸');
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao cadastrar dívida');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border-4 border-black">
      <h2 className="text-3xl font-black text-red-600 mb-8 text-center">💸 CRIAR NOVA DÍVIDA 💸</h2>
      
      <form action={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="debtorId" className="block text-lg font-bold text-gray-800 mb-2">
            💸 Quem tá me devendo essa grana? *
          </label>
          <select
            id="debtorId"
            name="debtorId"
            required
            disabled={loading}
            className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {loading ? 'Carregando as vítimas...' : 'Escolha o caloteiro aí 👇'}
            </option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name || user.username} {user.name && `(${user.username})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-lg font-bold text-gray-800 mb-2">
            💰 Quanto ele(a) me deve? (R$) *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            step="0.01"
            min="0.01"
            required
            className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold"
            placeholder="0,00"
          />
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-lg font-bold text-gray-800 mb-2">
            📅 Quando ele(a) prometeu pagar? *
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            required
            className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-lg font-bold text-gray-800 mb-2">
            📝 Detalhes da dívida (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold"
            placeholder="Conta o que rolou... (ex: Emprestou 50 reais pra pizza, mas não pagou...)"
          />
        </div>

        <div>
          <label htmlFor="attachment" className="block text-lg font-bold text-gray-800 mb-2">
            📎 Anexar imagem (opcional)
          </label>
          <input
            type="file"
            id="attachment"
            name="attachment"
            accept="image/*"
            className="mt-1 block w-full px-4 py-3 border-2 border-gray-400 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-bold file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-red-100 file:text-red-700 hover:file:bg-red-200"
          />
          <p className="mt-2 text-sm text-gray-600 font-bold">
            📸 Pode ser print, foto do recibo, comprovante, etc. (PNG, JPG, GIF - máx. 5MB)
          </p>
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
            disabled={submitting}
            className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-xl hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-xl font-black border-2 border-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '💸 CRIANDO DÍVIDA...' : '💸 CRIAR DÍVIDA'}
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
    </div>
  );
};
