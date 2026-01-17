'use client';

import React, { useState } from 'react';
import { CreditCard } from '@/types/financial';
import { createCreditCardAction, deleteCreditCardAction, recalibrateCreditCardLimitAction } from '@/lib/actions/financial';

interface Props {
  cards: CreditCard[];
  onUpdate: () => void;
}

export const CreditCardManager: React.FC<Props> = ({ cards, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createCreditCardAction(formData);

    if (result.success) {
      setShowForm(false);
      onUpdate();
    } else {
      setError(result.error || 'Erro ao criar cartão');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este cartão?')) {
      setLoading(true);
      const result = await deleteCreditCardAction(id);
      if (result.success) {
        onUpdate();
      } else {
        alert(result.error);
      }
      setLoading(false);
    }
  };

  const handleRecalibrate = async (id: string) => {
    setLoading(true);
    const result = await recalibrateCreditCardLimitAction(id);
    if (!result.success) {
      alert(result.error);
    }
    onUpdate();
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-purple-500 transition-colors duration-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-gray-800 dark:text-gray-200">💳 Meus Cartões</h3>
        {cards.length < 5 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 border-2 border-black text-sm"
          >
            + Novo Cartão
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-purple-50 dark:bg-gray-700 rounded-xl border-2 border-purple-200 dark:border-purple-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nome do Cartão (ex: Nubank Black)</label>
              <input
                name="name"
                required
                className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                placeholder="Ex: Nubank"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Limite Total</label>
              <input
                name="limit"
                type="number"
                step="0.01"
                required
                className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                placeholder="0,00"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Fechamento</label>
                <input
                  name="closingDay"
                  type="number"
                  min="1"
                  max="31"
                  required
                  className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                  placeholder="Dia"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Vencimento</label>
                <input
                  name="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  required
                  className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                  placeholder="Dia"
                />
              </div>
            </div>
          </div>
          {error && <p className="text-red-600 font-bold text-sm mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 border-2 border-black text-sm disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Cartão'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-600 border-2 border-black text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => {
          const usedPercentage = ((card.limit - card.availableLimit) / card.limit) * 100;
          return (
            <div
              key={card.id}
              className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-sm relative group"
            >
              <button
                onClick={() => handleDelete(card.id)}
                className="absolute top-2 right-2 text-xs opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-opacity"
                title="Excluir cartão"
              >
                🗑️
              </button>
              <button
                onClick={() => handleRecalibrate(card.id)}
                className="absolute top-2 right-8 text-xs opacity-0 group-hover:opacity-100 bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition-opacity"
                title="Recalibrar limite (Sincronizar)"
              >
                🔄
              </button>
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">{card.name}</p>
                <span className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded font-bold">
                  Fecha: {card.closingDay} | Vence: {card.dueDay}
                </span>
              </div>
              <p className="text-xl font-black text-purple-600">
                Livre: {formatCurrency(card.availableLimit)}
              </p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${usedPercentage > 90 ? 'bg-red-500' : usedPercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Limite Total: {formatCurrency(card.limit)}</p>
            </div>
          );
        })}
        {cards.length === 0 && !showForm && (
          <p className="col-span-full text-center py-4 text-gray-500 font-bold">Nenhum cartão cadastrado.</p>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-right">
        {cards.length}/5 cartões utilizados
      </p>
    </div>
  );
};
