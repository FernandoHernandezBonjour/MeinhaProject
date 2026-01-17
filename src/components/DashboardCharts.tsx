'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Debt, User } from '@/types';

interface DashboardChartsProps {
  debts: Debt[];
  users: User[];
}

interface ChartData {
  name: string;
  value: number;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ debts, users }) => {
  // Calcular maiores credores (quem mais tem para receber)
  const creditorTotals = debts.reduce((acc, debt) => {
    if (debt.status === 'OPEN') {
      const creditor = users.find(u => u.id === debt.creditorId);
      if (creditor) {
        const key = creditor.name || creditor.username;
        acc[key] = (acc[key] || 0) + debt.amount;
      }
    }
    return acc;
  }, {} as Record<string, number>);

  const topCreditors: ChartData[] = Object.entries(creditorTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a: ChartData, b: ChartData) => b.value - a.value)
    .slice(0, 5);

  // Calcular maiores caloteiros (quem tem dívidas VENCIDAS)
  const overdueDebtorTotals = debts.reduce((acc, debt) => {
    if (debt.status === 'OPEN' && new Date(debt.dueDate) < new Date()) {
      const debtor = users.find(u => u.id === debt.debtorId);
      if (debtor) {
        const key = debtor.name || debtor.username;
        acc[key] = (acc[key] || 0) + debt.amount;
      }
    }
    return acc;
  }, {} as Record<string, number>);

  const topOverdueDebtors: ChartData[] = Object.entries(overdueDebtorTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a: ChartData, b: ChartData) => b.value - a.value)
    .slice(0, 5);

  // Calcular futuros possíveis caloteiros (quem tem dívidas em aberto mas não vencidas)
  const futureDebtorTotals = debts.reduce((acc, debt) => {
    if (debt.status === 'OPEN' && new Date(debt.dueDate) >= new Date()) {
      const debtor = users.find(u => u.id === debt.debtorId);
      if (debtor) {
        const key = debtor.name || debtor.username;
        acc[key] = (acc[key] || 0) + debt.amount;
      }
    }
    return acc;
  }, {} as Record<string, number>);

  const topFutureDebtors: ChartData[] = Object.entries(futureDebtorTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a: ChartData, b: ChartData) => b.value - a.value)
    .slice(0, 5);

  // Calcular totais
  const totalToReceive = Object.values(creditorTotals).reduce((sum, value) => sum + value, 0);
  const totalOverdue = Object.values(overdueDebtorTotals).reduce((sum, value) => sum + value, 0);
  const totalFuture = Object.values(futureDebtorTotals).reduce((sum, value) => sum + value, 0);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 relative z-0">
      {/* Maiores Credores */}
      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-2xl border-4 border-green-500 relative z-0">
        <h3 className="text-2xl font-black text-green-600 mb-6 text-center">
          💰 MAIORES CREDORES - QUEM TEM DINHEIRO 💰
        </h3>
        
        {topCreditors.length > 0 ? (
          <div>
            <div className="mb-6 text-center bg-green-100 p-4 rounded-xl border-2 border-green-300">
              <p className="text-3xl font-black text-green-700">
                {formatCurrency(totalToReceive)}
              </p>
              <p className="text-lg font-bold text-green-600">Total pra receber</p>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCreditors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                />
                <Bar dataKey="value" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">😢</div>
            <p className="text-xl font-bold text-gray-600">Ninguém tá devendo pra ninguém!</p>
          </div>
        )}
      </div>

      {/* Maiores Caloteiros (Dívidas Vencidas) */}
      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-2xl border-4 border-red-500 relative z-0">
        <h3 className="text-2xl font-black text-red-600 mb-6 text-center">
          💀 MAIORES CALOTEIROS - QUEM NÃO PAGA 💀
        </h3>
        
        {topOverdueDebtors.length > 0 ? (
          <div>
            <div className="mb-6 text-center bg-red-100 p-4 rounded-xl border-2 border-red-300">
              <p className="text-3xl font-black text-red-700">
                {formatCurrency(totalOverdue)}
              </p>
              <p className="text-lg font-bold text-red-600">Total em atraso</p>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topOverdueDebtors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                />
                <Bar dataKey="value" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-xl font-bold text-green-600">Que milagre! Ninguém tá atrasado!</p>
          </div>
        )}
      </div>

      {/* Futuros Possíveis Caloteiros */}
      <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-2xl border-4 border-orange-500 relative z-0">
        <h3 className="text-2xl font-black text-orange-600 mb-6 text-center">
          ⚠️ FUTUROS POSSÍVEIS CALOTEIROS ⚠️
        </h3>
        
        {topFutureDebtors.length > 0 ? (
          <div>
            <div className="mb-6 text-center bg-orange-100 p-4 rounded-xl border-2 border-orange-300">
              <p className="text-3xl font-black text-orange-700">
                {formatCurrency(totalFuture)}
              </p>
              <p className="text-lg font-bold text-orange-600">Total em aberto</p>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topFutureDebtors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                />
                <Bar dataKey="value" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">😢</div>
            <p className="text-xl font-bold text-gray-600">Ninguém tem dívida em aberto!</p>
          </div>
        )}
      </div>

      {/* Resumo Geral */}
      <div className="lg:col-span-3 bg-white/60 backdrop-blur-sm p-6 rounded-xl shadow-2xl border-4 border-purple-500 relative z-0">
        <h3 className="text-2xl font-black text-purple-600 mb-6 text-center">
          📊 RESUMO GERAL - A SITUAÇÃO TÁ ASSIM 📊
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-green-100 to-green-200 rounded-xl border-2 border-green-400">
            <div className="text-4xl mb-2">💸</div>
            <p className="text-3xl font-black text-green-700">
              {debts.filter(d => d.status === 'OPEN').length}
            </p>
            <p className="text-lg font-bold text-green-600">Dívidas em Aberto</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border-2 border-blue-400">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-3xl font-black text-blue-700">
              {debts.filter(d => d.status === 'PAID').length}
            </p>
            <p className="text-lg font-bold text-blue-600">Dívidas Pagas</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-red-100 to-red-200 rounded-xl border-2 border-red-400">
            <div className="text-4xl mb-2">💀</div>
            <p className="text-3xl font-black text-red-700">
              {debts.filter(d => d.status === 'OPEN' && new Date(d.dueDate) < new Date()).length}
            </p>
            <p className="text-lg font-bold text-red-600">Dívidas Vencidas</p>
          </div>
        </div>
      </div>
    </div>
  );
};
