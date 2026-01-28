'use client';

import React, { useState, useEffect } from 'react';
import {
  BankAccount,
  CreditCard,
  Transaction,
  Invoice,
  TransactionType,
  TransactionStatus
} from '@/types/financial';
import {
  getBankAccountsAction,
  getCreditCardsAction,
  getTransactionsAction,
  getInvoicesAction,
  deleteTransactionAction
} from '@/lib/actions/financial';
import { BankAccountManager } from './BankAccountManager';
import { CreditCardManager } from './CreditCardManager';
import { PersonalDashboard } from './PersonalDashboard';
import { TransactionForm } from './TransactionForm';
import { InvoiceManager } from './InvoiceManager';

export const PersonalFinanceModule: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Filtros de Data (Mês Atual)
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Filtros de Tabela
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtro de Resumo (Mês vs Total)
  const [summaryMode, setSummaryMode] = useState<'month' | 'total'>('month');

  // Controle de Deleção de Grupo
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsRes, cardsRes, transactionsRes, invoicesRes] = await Promise.all([
        getBankAccountsAction(),
        getCreditCardsAction(),
        getTransactionsAction(),
        getInvoicesAction()
      ]);

      if (accountsRes.success) setAccounts(accountsRes.accounts || []);
      if (cardsRes.success) setCards(cardsRes.cards || []);
      if (transactionsRes.success) setTransactions(transactionsRes.transactions || []);
      if (invoicesRes.success) setInvoices(invoicesRes.invoices || []);
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculo de Saldo Projetado (Dinâmico conforme o mês selecionado)
  const projectedAccounts = accounts.map((acc: BankAccount) => {
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

    // Filtramos todas as transações daquela conta até o fim do mês selecionado
    const accountTransactions = transactions.filter((t: Transaction) =>
      t.bankAccountId === acc.id &&
      new Date(t.date) <= endOfMonth
    );

    const income = accountTransactions
      .filter((t: Transaction) => t.type === 'INCOME')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    const expense = accountTransactions
      .filter((t: Transaction) => t.type === 'EXPENSE')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    return {
      ...acc,
      currentBalance: acc.initialBalance + income - expense
    };
  });

  const handleDeleteTransaction = async (id: string) => {
    const transaction = transactions.find((t: Transaction) => t.id === id);
    if (!transaction) return;

    if (transaction.groupId) {
      setTransactionToDelete(transaction);
    } else {
      if (confirm('Tem certeza que deseja excluir este lançamento? O valor será estornado do saldo/limite.')) {
        const res = await deleteTransactionAction(id);
        if (res.success) {
          fetchData();
        } else {
          alert(res.error);
        }
      }
    }
  };

  const confirmDelete = async (deleteAll: boolean) => {
    if (!transactionToDelete) return;

    const res = await deleteTransactionAction(transactionToDelete.id, deleteAll);
    if (res.success) {
      setTransactionToDelete(null);
      fetchData();
    } else {
      alert(res.error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header e Navegação de Mês */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border-4 border-black shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(selectedDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full border-2 border-black dark:bg-gray-700"
          >
            ⬅️
          </button>
          <div className="text-center min-w-[150px]">
            <h2 className="text-2xl font-black dark:text-white uppercase">
              {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(selectedDate)}
            </h2>
          </div>
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(selectedDate.getMonth() + 1);
              setSelectedDate(newDate);
            }}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full border-2 border-black dark:bg-gray-700"
          >
            ➡️
          </button>
        </div>

        <button
          onClick={() => setShowTransactionForm(true)}
          className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-xl border-4 border-black hover:bg-green-700 transition-all shadow-xl hover:scale-105"
        >
          💰 Novo Lançamento
        </button>
      </div>

      {/* Dashboard Summary */}
      <PersonalDashboard
        accounts={projectedAccounts}
        cards={cards}
        selectedDate={selectedDate}
        transactions={transactions.filter((t: Transaction) => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
        })}
        invoices={invoices}
      />

      {/* Resumo por Categoria */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-black transition-colors duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black dark:text-white">📊 Resumo por Categoria</h3>
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border-2 border-black">
            <button
              onClick={() => setSummaryMode('month')}
              className={`px-4 py-1 rounded-md font-bold text-sm transition-all ${summaryMode === 'month' ? 'bg-black text-white' : 'text-gray-500'}`}
            >
              Mês Atual
            </button>
            <button
              onClick={() => setSummaryMode('total')}
              className={`px-4 py-1 rounded-md font-bold text-sm transition-all ${summaryMode === 'total' ? 'bg-black text-white' : 'text-gray-500'}`}
            >
              Histórico Total
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Receitas (Esquerda) */}
          <div className="space-y-4">
            <h4 className="text-lg font-black text-green-600 border-b-2 border-green-100 pb-2 flex justify-between">
              <span>📈 Receitas</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                transactions
                  .filter((t: Transaction) => t.type === 'INCOME' && (summaryMode === 'total' || (new Date(t.date).getMonth() === selectedDate.getMonth() && new Date(t.date).getFullYear() === selectedDate.getFullYear())))
                  .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
              )}</span>
            </h4>
            <div className="space-y-2">
              {Object.entries(
                transactions
                  .filter((t: Transaction) => t.type === 'INCOME' && (summaryMode === 'total' || (new Date(t.date).getMonth() === selectedDate.getMonth() && new Date(t.date).getFullYear() === selectedDate.getFullYear())))
                  .reduce((acc: Record<string, number>, t: Transaction) => {
                    acc[t.category] = (acc[t.category] || 0) + t.amount;
                    return acc;
                  }, {} as Record<string, number>)
              )
                .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="font-bold text-gray-700 dark:text-gray-300">{category}</span>
                    <span className="font-black text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}</span>
                  </div>
                ))}
              {transactions.filter((t: Transaction) => t.type === 'INCOME' && (summaryMode === 'total' || (new Date(t.date).getMonth() === selectedDate.getMonth() && new Date(t.date).getFullYear() === selectedDate.getFullYear()))).length === 0 && (
                <p className="text-sm text-gray-400 italic">Nenhuma receita no período.</p>
              )}
            </div>
          </div>

          {/* Gastos (Direita) */}
          <div className="space-y-4">
            <h4 className="text-lg font-black text-red-600 border-b-2 border-red-100 pb-2 flex justify-between">
              <span>📉 Gastos</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                transactions
                  .filter((t: Transaction) => t.type === 'EXPENSE' && (summaryMode === 'total' || (new Date(t.date).getMonth() === selectedDate.getMonth() && new Date(t.date).getFullYear() === selectedDate.getFullYear())))
                  .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
              )}</span>
            </h4>
            <div className="space-y-2">
              {Object.entries(
                transactions
                  .filter((t: Transaction) => t.type === 'EXPENSE' && (summaryMode === 'total' || (new Date(t.date).getMonth() === selectedDate.getMonth() && new Date(t.date).getFullYear() === selectedDate.getFullYear())))
                  .reduce((acc: Record<string, number>, t: Transaction) => {
                    acc[t.category] = (acc[t.category] || 0) + t.amount;
                    return acc;
                  }, {} as Record<string, number>)
              )
                .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="font-bold text-gray-700 dark:text-gray-300">{category}</span>
                    <span className="font-black text-red-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}</span>
                  </div>
                ))}
              {transactions.filter((t: Transaction) => t.type === 'EXPENSE' && (summaryMode === 'total' || (new Date(t.date).getMonth() === selectedDate.getMonth() && new Date(t.date).getFullYear() === selectedDate.getFullYear()))).length === 0 && (
                <p className="text-sm text-gray-400 italic">Nenhum gasto no período.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contas e Cartões */}
        <div className="space-y-8">
          <BankAccountManager accounts={projectedAccounts} onUpdate={fetchData} />
          <CreditCardManager cards={cards} onUpdate={fetchData} />
        </div>

        {/* Faturas */}
        <div>
          <InvoiceManager
            cards={cards}
            invoices={invoices}
            accounts={accounts}
            onUpdate={fetchData}
          />
        </div>
      </div>

      {/* Lista de Transações com Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-black transition-colors duration-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <h3 className="text-2xl font-black dark:text-white">📑 Últimos Lançamentos</h3>

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Buscar descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 rounded-lg border-2 border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="p-2 rounded-lg border-2 border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="ALL">Todos Tipos</option>
              <option value="INCOME">Receitas</option>
              <option value="EXPENSE">Despesas</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="p-2 rounded-lg border-2 border-gray-300 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="ALL">Todos Status</option>
              <option value="PAID">Pago</option>
              <option value="PENDING">Pendente</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                <th className="py-3 px-2 font-black dark:text-white">Data</th>
                <th className="py-3 px-2 font-black dark:text-white">Descrição</th>
                <th className="py-3 px-2 font-black dark:text-white">Categoria</th>
                <th className="py-3 px-2 font-black dark:text-white">Valor</th>
                <th className="py-3 px-2 font-black dark:text-white text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions
                .filter((t: Transaction) => {
                  const tDate = new Date(t.date);
                  if (tDate.getMonth() !== selectedDate.getMonth() || tDate.getFullYear() !== selectedDate.getFullYear()) return false;
                  if (filterType !== 'ALL' && t.type !== filterType) return false;
                  if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
                  if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  return true;
                })
                .map((t: Transaction) => (
                  <tr key={t.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                    <td className="py-3 px-2 text-sm dark:text-gray-300">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-2 font-bold dark:text-white">{t.description}</td>
                    <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">{t.category}</td>
                    <td className={`py-3 px-2 font-black ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${t.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {t.status === 'PAID' ? 'Pago' : 'Pendente'}
                        </span>
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                          title="Excluir lançamento"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <p className="text-center py-8 text-gray-500 font-bold">Nenhum lançamento encontrado.</p>
          )}
        </div>
      </div>

      {/* Modal de Transação */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] px-4 overflow-y-auto">
          <TransactionForm
            accounts={accounts}
            cards={cards}
            onSuccess={() => { setShowTransactionForm(false); fetchData(); }}
            onCancel={() => setShowTransactionForm(false)}
          />
        </div>
      )}

      {/* Modal de Confirmação de Deleção de Grupo */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] px-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border-4 border-black max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black mb-4 dark:text-white text-center">🗑️ Excluir Lançamento</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 font-bold text-center">
              Este lançamento faz parte de um grupo (parcelado ou fixo). O que deseja fazer?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => confirmDelete(false)}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-black border-2 border-black hover:bg-orange-600 transition-all"
              >
                Excluir APENAS este
              </button>
              <button
                onClick={() => confirmDelete(true)}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-black border-2 border-black hover:bg-red-700 transition-all shadow-lg"
              >
                Excluir TODOS (Anteriores e Posteriores)
              </button>
              <button
                onClick={() => setTransactionToDelete(null)}
                className="w-full bg-gray-500 text-white py-3 rounded-xl font-black border-2 border-black hover:bg-gray-600 transition-all"
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
