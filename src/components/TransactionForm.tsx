'use client';

import React, { useState } from 'react';
import { BankAccount, CreditCard, TransactionType, PaymentMethod, Transaction, TransactionStatus } from '@/types/financial';
import { createTransactionAction, updateTransactionAction } from '@/lib/actions/financial';
import { DEFAULT_CATEGORIES } from '@/lib/financial-utils';

interface Props {
  accounts: BankAccount[];
  cards: CreditCard[];
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Transaction | null;
}

export const TransactionForm: React.FC<Props> = ({ accounts, cards, onSuccess, onCancel, initialData }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'EXPENSE');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialData?.paymentMethod || 'BANK_ACCOUNT');
  const [status, setStatus] = useState<TransactionStatus>(initialData?.status || 'PAID');
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [installments, setInstallments] = useState(initialData?.installments?.total || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    let result;
    if (initialData) {
      // Como não permitimos mudar conta/cartão na edição, garantimos que os campos ocultos ou select carreguem o valor
      // Mas o FormData pegará dos inputs. Se o usuário mudar algo que não pode, a action deve bloquear ou ignorar.
      // Neste caso, vamos adicionar status ao formData manualmente se não estiver lá (mas estará via input hidden ou radio)
      result = await updateTransactionAction(initialData.id, formData);
    } else {
      result = await createTransactionAction(formData);
    }

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Erro ao salvar transação');
    }
    setLoading(false);
  };

  const categories = type === 'INCOME' ? DEFAULT_CATEGORIES.INCOME : DEFAULT_CATEGORIES.EXPENSE;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-full border-4 border-black dark:border-gray-600 shadow-2xl">
      <h2 className="text-3xl font-black mb-6 dark:text-white">{initialData ? '✏️ Editar Lançamento' : '💸 Novo Lançamento'}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo: Receita ou Despesa */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl border-2 border-black">
          <button
            type="button"
            onClick={() => { setType('INCOME'); setPaymentMethod('BANK_ACCOUNT'); }}
            className={`flex-1 py-2 rounded-lg font-black transition-all ${type === 'INCOME' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500'}`}
          >
            Receita
          </button>
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`flex-1 py-2 rounded-lg font-black transition-all ${type === 'EXPENSE' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500'}`}
          >
            Despesa
          </button>
          <input type="hidden" name="type" value={type} />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
          <input
            name="description"
            required
            defaultValue={initialData?.description}
            className="w-full p-2 rounded-lg border-2 border-black dark:bg-gray-700 dark:text-white"
            placeholder="Ex: Aluguel, Salário, Mercado..."
          />
        </div>

        {/* Status (Pago ou Pendente) */}
        <div className="flex gap-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border-2 border-yellow-200">
          <span className="font-bold text-sm my-auto text-gray-700 dark:text-gray-300">Status:</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="PAID"
                checked={status === 'PAID'}
                onChange={() => setStatus('PAID')}
                className="w-5 h-5 accent-green-600"
              />
              <span className="font-bold text-green-700 dark:text-green-400">Pago</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="PENDING"
                checked={status === 'PENDING'}
                onChange={() => setStatus('PENDING')}
                className="w-5 h-5 accent-yellow-600"
              />
              <span className="font-bold text-yellow-700 dark:text-yellow-400">Pendente</span>
            </label>
          </div>
        </div>

        {/* Valor e Data */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Valor</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              defaultValue={initialData?.amount}
              className="w-full p-2 rounded-lg border-2 border-black dark:bg-gray-700 dark:text-white"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Data</label>
            <input
              name="date"
              type="date"
              defaultValue={initialData ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              required
              className="w-full p-2 rounded-lg border-2 border-black dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
          <select
            name="category"
            required
            defaultValue={initialData?.category}
            className="w-full p-2 rounded-lg border-2 border-black dark:bg-gray-700 dark:text-white"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Lançamento Fixo / Parcelado (Apenas na criação) */}
        {!initialData && (
          <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border-2 border-dashed border-gray-300">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRecurring"
                name="isRecurring"
                value="true"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  if (e.target.checked) setInstallments(1);
                }}
                className="w-5 h-5 border-2 border-black rounded"
              />
              <label htmlFor="isRecurring" className="text-sm font-bold dark:text-white">Lançamento Fixo</label>
            </div>

            {!isRecurring && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold dark:text-white">Parcelas:</label>
                <input
                  type="number"
                  name="installments"
                  min="1"
                  max="72"
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                  className="w-16 p-1 rounded border-2 border-black dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
          </div>
        )}

        {/* Método de Pagamento (Só para Despesas) */}
        {type === 'EXPENSE' ? (
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Pagar com</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_ACCOUNT')}
                className={`flex-1 py-2 rounded-lg font-bold border-2 border-black transition-all ${paymentMethod === 'BANK_ACCOUNT' ? 'bg-gray-800 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'}`}
              >
                Conta
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`flex-1 py-2 rounded-lg font-bold border-2 border-black transition-all ${paymentMethod === 'CREDIT_CARD' ? 'bg-gray-800 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-white'}`}
              >
                Cartão
              </button>
              <input type="hidden" name="paymentMethod" value={paymentMethod} />
            </div>

            {paymentMethod === 'BANK_ACCOUNT' ? (
              <select
                name="bankAccountId"
                required
                defaultValue={initialData?.bankAccountId}
                disabled={!!initialData} // Não permitir mudar conta na edição
                className="w-full p-2 rounded-lg border-2 border-black dark:bg-gray-700 dark:text-white disabled:opacity-60"
              >
                <option value="">Selecionar Conta</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
            ) : (
              <select
                name="creditCardId"
                required
                defaultValue={initialData?.creditCardId}
                disabled={!!initialData}
                className="w-full p-2 rounded-lg border-2 border-black dark:bg-gray-700 dark:text-white disabled:opacity-60"
              >
                <option value="">Selecionar Cartão</option>
                {cards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
              </select>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Receber na conta</label>
            <input type="hidden" name="paymentMethod" value="BANK_ACCOUNT" />
            <select
              name="bankAccountId"
              required
              defaultValue={initialData?.bankAccountId}
              disabled={!!initialData}
              className="w-full p-2 rounded-lg border-2 border-black dark:bg-gray-700 dark:text-white disabled:opacity-60"
            >
              <option value="">Selecionar Conta</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
        )}

        {error && <p className="text-red-600 font-bold text-center">{error}</p>}

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black border-2 border-black hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processando...' : initialData ? 'Salvar Alterações' : 'Confirmar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-black border-2 border-black hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
