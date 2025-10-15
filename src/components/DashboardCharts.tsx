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
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Calcular maiores devedores (quem mais deve)
  const debtorTotals = debts.reduce((acc, debt) => {
    if (debt.status === 'OPEN') {
      const debtor = users.find(u => u.id === debt.debtorId);
      if (debtor) {
        const key = debtor.name || debtor.username;
        acc[key] = (acc[key] || 0) + debt.amount;
      }
    }
    return acc;
  }, {} as Record<string, number>);

  const topDebtors: ChartData[] = Object.entries(debtorTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Calcular totais
  const totalToReceive = Object.values(creditorTotals).reduce((sum, value) => sum + value, 0);
  const totalToPay = Object.values(debtorTotals).reduce((sum, value) => sum + value, 0);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Maiores Credores */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Maiores Credores (Para Receber)
        </h3>
        
        {topCreditors.length > 0 ? (
          <div>
            <div className="mb-4">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalToReceive)}
              </p>
              <p className="text-sm text-gray-600">Total em aberto</p>
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
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma dívida em aberto</p>
          </div>
        )}
      </div>

      {/* Maiores Devedores */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Maiores Devedores (Para Pagar)
        </h3>
        
        {topDebtors.length > 0 ? (
          <div>
            <div className="mb-4">
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalToPay)}
              </p>
              <p className="text-sm text-gray-600">Total em aberto</p>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDebtors}>
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
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma dívida em aberto</p>
          </div>
        )}
      </div>

      {/* Resumo Geral */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumo Geral
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {debts.filter(d => d.status === 'OPEN').length}
            </p>
            <p className="text-sm text-gray-600">Dívidas em Aberto</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {debts.filter(d => d.status === 'PAID').length}
            </p>
            <p className="text-sm text-gray-600">Dívidas Pagas</p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {debts.filter(d => d.status === 'OPEN' && new Date(d.dueDate) < new Date()).length}
            </p>
            <p className="text-sm text-gray-600">Dívidas Vencidas</p>
          </div>
        </div>
      </div>
    </div>
  );
};
