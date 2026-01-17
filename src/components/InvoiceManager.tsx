'use client';

import React, { useState } from 'react';
import { CreditCard, Invoice, BankAccount } from '@/types/financial';
import { payInvoiceAction } from '@/lib/actions/financial';

interface Props {
  cards: CreditCard[];
  invoices: Invoice[];
  accounts: BankAccount[];
  onUpdate: () => void;
}

export const InvoiceManager: React.FC<Props> = ({ cards, invoices, accounts, onUpdate }) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!selectedInvoiceId || !selectedAccountId) return;
    
    setLoading(true);
    setError(null);
    const result = await payInvoiceAction(selectedInvoiceId, selectedAccountId);

    if (result.success) {
      setSelectedInvoiceId(null);
      onUpdate();
    } else {
      setError(result.error || 'Erro ao pagar fatura');
    }
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const openInvoices = invoices.filter(i => i.status !== 'PAID').sort((a: Invoice, b: Invoice) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-orange-500 transition-colors duration-200">
      <h3 className="text-2xl font-black text-gray-800 dark:text-gray-200 mb-6">🗓️ Faturas em Aberto</h3>

      <div className="space-y-4">
        {openInvoices.map((invoice) => {
          const card = cards.find(c => c.id === invoice.creditCardId);
          if (!card) return null;

          return (
            <div 
              key={invoice.id}
              className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row justify-between items-center gap-4"
            >
              <div>
                <p className="font-black text-lg dark:text-white">
                  {card.name} - {getMonthName(invoice.month)}/{invoice.year}
                </p>
                <p className="text-sm text-gray-500 font-bold">Vencimento: {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <div className="flex flex-col items-end">
                <p className="text-2xl font-black text-red-600">{formatCurrency(invoice.totalAmount)}</p>
                <button
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                  className="mt-2 bg-orange-600 text-white px-4 py-2 rounded-lg font-bold border-2 border-black text-sm hover:bg-orange-700 transition-colors"
                >
                  Pagar Fatura
                </button>
              </div>
            </div>
          );
        })}

        {openInvoices.length === 0 && (
          <p className="text-center py-8 text-gray-500 font-bold text-lg">
            Nenhuma fatura em aberto! 🎉
          </p>
        )}
      </div>

      {/* Modal de Pagamento */}
      {selectedInvoiceId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] px-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border-4 border-black max-w-md w-full">
            <h4 className="text-2xl font-black mb-4 dark:text-white">Confirmar Pagamento</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6 font-bold">
              Selecione a conta de onde sairá o dinheiro para pagar esta fatura.
            </p>

            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-black mb-6 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione uma conta</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Saldo: {formatCurrency(acc.currentBalance)})
                </option>
              ))}
            </select>

            {error && <p className="text-red-600 font-bold mb-4">{error}</p>}

            <div className="flex gap-4">
              <button
                onClick={handlePay}
                disabled={loading || !selectedAccountId}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-black border-2 border-black hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => { setSelectedInvoiceId(null); setError(null); }}
                className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-black border-2 border-black hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
