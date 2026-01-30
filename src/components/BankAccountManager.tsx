'use client';

import React, { useState } from 'react';
import { BankAccount } from '@/types/financial';
import {
  createBankAccountAction,
  deleteBankAccountAction,
  recalibrateAccountBalanceAction,
  updateBankAccountAction
} from '@/lib/actions/financial';

interface Props {
  accounts: BankAccount[];
  onUpdate: () => void;
}

export const BankAccountManager: React.FC<Props> = ({ accounts, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createBankAccountAction(formData);

    if (result.success) {
      setShowForm(false);
      if (e.currentTarget) e.currentTarget.reset();
      onUpdate();
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAccount) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateBankAccountAction(editingAccount.id, formData);

    if (result.success) {
      setEditingAccount(null);
      onUpdate();
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      const res = await deleteBankAccountAction(id);
      if (res.success) {
        onUpdate();
      } else {
        alert(res.error);
      }
    }
  };

  const handleRecalibrate = async (id: string) => {
    const res = await recalibrateAccountBalanceAction(id);
    if (res.success) {
      onUpdate();
    } else {
      alert(res.error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-blue-500 transition-colors duration-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-gray-800 dark:text-gray-200">🏦 Saldo Projetado</h3>
        {accounts.length < 3 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 border-2 border-black text-sm"
          >
            + Nova Conta
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-blue-50 dark:bg-gray-700 rounded-xl border-2 border-blue-200 dark:border-blue-900">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nome da Conta (ex: Nubank, Itaú)</label>
              <input
                name="name"
                required
                className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                placeholder="Ex: Nubank"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Saldo Inicial</label>
              <input
                name="initialBalance"
                type="number"
                step="0.01"
                required
                className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                placeholder="0,00"
              />
            </div>
            {error && <p className="text-red-600 font-bold text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 border-2 border-black text-sm disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Conta'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-600 border-2 border-black text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account: BankAccount) => (
          <div
            key={account.id}
            className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-sm relative group"
          >
            <div className="flex gap-2 absolute top-2 right-2">
              <button
                onClick={() => handleRecalibrate(account.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:bg-blue-50 rounded transition-all"
                title="Recalibrar saldo (Corrigir desvios)"
              >
                🔄
              </button>
              <button
                onClick={() => setEditingAccount(account)}
                className="opacity-0 group-hover:opacity-100 p-1 text-yellow-500 hover:bg-yellow-50 rounded transition-all"
                title="Editar conta"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(account.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                title="Excluir conta"
              >
                🗑️
              </button>
            </div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">{account.name}</p>
            <p className={`text-2xl font-black ${account.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(account.currentBalance)}
            </p>
          </div>
        ))}
        {accounts.length === 0 && !showForm && (
          <p className="col-span-full text-center py-4 text-gray-500 font-bold">Nenhuma conta cadastrada.</p>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-right">
        {accounts.length}/3 contas utilizadas
      </p>
    </div>
  );
};
