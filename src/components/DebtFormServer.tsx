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

    const debtorId = formData.get('debtorId') as string;
    const amount = formData.get('amount') as string;
    const dueDate = formData.get('dueDate') as string;

    if (!debtorId) {
      setError('Selecione quem está devendo');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('O valor deve ser maior que zero');
      return;
    }

    if (!dueDate) {
      setError('Selecione a data de promessa de pagamento');
      return;
    }

    try {
      const result = await createDebtAction(formData);
      
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        onSuccess?.();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao cadastrar dívida');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Cadastrar Nova Dívida</h2>
      
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="debtorId" className="block text-sm font-medium text-gray-700">
            Quem está me devendo? *
          </label>
          <select
            id="debtorId"
            name="debtorId"
            required
            disabled={loading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {loading ? 'Carregando usuários...' : 'Selecione um usuário'}
            </option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name || user.username} {user.name && `(${user.username})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Valor emprestado (R$) *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            step="0.01"
            min="0.01"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="0,00"
          />
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            Data de promessa de pagamento *
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descrição (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Detalhes sobre o empréstimo..."
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Cadastrar Dívida
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
    </div>
  );
};
