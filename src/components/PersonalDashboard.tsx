'use client';

import React from 'react';
import { BankAccount, CreditCard, Transaction, Invoice } from '@/types/financial';

interface Props {
  accounts: BankAccount[];
  cards: CreditCard[];
  transactions: Transaction[];
  invoices: Invoice[];
  selectedDate: Date;
  realAccounts?: BankAccount[]; // Contas com saldo real (sem projeção)
}

export const PersonalDashboard: React.FC<Props> = ({ accounts, cards, transactions, invoices, selectedDate, realAccounts }) => {
  const projectedBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const currentRealBalance = realAccounts
    ? realAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
    : 0;

  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();

  const monthlyIncome = transactions
    .filter(t => t.type === 'INCOME') // As transações já vêm filtradas do pai
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const openInvoicesTotal = invoices
    .filter(i => i.status !== 'PAID' && i.month === currentMonth && i.year === currentYear)
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Saldo Atual (Real) */}
      {realAccounts && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-4 border-black transition-colors duration-200">
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Saldo Atual (Hoje)</p>
          <p className={`text-3xl font-black ${currentRealBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(currentRealBalance)}
          </p>
        </div>
      )}

      {/* Saldo Total (Projetado) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-4 border-black transition-colors duration-200">
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Saldo Previsto (Fim do Mês)</p>
        <p className={`text-3xl font-black ${projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(projectedBalance)}
        </p>
      </div>

      {/* Recebido no Mês */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-4 border-black transition-colors duration-200">
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Receitas (Mês)</p>
        <p className="text-3xl font-black text-blue-600">
          {formatCurrency(monthlyIncome)}
        </p>
      </div>

      {/* Gasto no Mês */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-4 border-black transition-colors duration-200">
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Despesas (Mês)</p>
        <p className="text-3xl font-black text-orange-600">
          {formatCurrency(monthlyExpenses)}
        </p>
      </div>

      {/* Faturas Abertas */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border-4 border-black transition-colors duration-200">
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Faturas Abertas</p>
        <p className="text-3xl font-black text-purple-600">
          {formatCurrency(openInvoicesTotal)}
        </p>
      </div>
    </div>
  );
};
