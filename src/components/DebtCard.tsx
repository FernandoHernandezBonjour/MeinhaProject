'use client';

import React from 'react';
import { Debt, User } from '@/types';
import { markDebtAsPaidAction } from '@/lib/actions/debts';

interface DebtCardProps {
  debt: Debt;
  creditor: User;
  debtor: User;
  currentUser: User;
  onUpdate?: () => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({ debt, creditor, debtor, currentUser, onUpdate }) => {
  const isOverdue = new Date(debt.dueDate) < new Date();
  const isOwner = currentUser.id === debt.creditorId;
  const isAdmin = currentUser.role === 'admin';
  const canEdit = isOwner || isAdmin;

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return '1 dia atrás';
    if (diffInDays < 30) return `${diffInDays} dias atrás`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) return '1 mês atrás';
    if (diffInMonths < 12) return `${diffInMonths} meses atrás`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    if (diffInYears === 1) return '1 ano atrás';
    return `${diffInYears} anos atrás`;
  };

  const getOverdueTime = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'VENCE HOJE, CALOTEIRO!';
    if (diffInDays === 1) return 'VENCIDA HÁ 1 DIA - PAGA ESSA MERDA!';
    if (diffInDays < 30) return `VENCIDA HÁ ${diffInDays} DIAS - QUE VERGONHA!`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) return 'VENCIDA HÁ 1 MÊS - TÁ DE BRINCADEIRA?';
    if (diffInMonths < 12) return `VENCIDA HÁ ${diffInMonths} MESES - SEM VERGONHA!`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    if (diffInYears === 1) return 'VENCIDA HÁ 1 ANO - PAGOU NÃO, PAGÃO!';
    return `VENCIDA HÁ ${diffInYears} ANOS - CALOTEIRO PROFISSIONAL!`;
  };

  const handleMarkAsPaid = async () => {
    if (!canEdit) return;
    
    try {
      const result = await markDebtAsPaidAction(debt.id);
      if (result.success) {
        onUpdate?.();
      } else {
        console.error('Erro ao marcar como paga:', result.error);
      }
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className={`bg-white/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 border-4 transform hover:scale-105 transition-transform ${
      isOverdue ? 'border-red-600 bg-gradient-to-br from-red-50/60 to-orange-50/60' : 'border-green-600 bg-gradient-to-br from-green-50/60 to-emerald-50/60'
    }`}>
      {isOverdue && (
        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-3 rounded-xl text-xl font-black mb-4 inline-block border-2 border-black shadow-lg">
          💀 CALOTEIRO! 💀
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-3xl font-black text-red-600 mb-2">
            {formatCurrency(debt.amount)}
          </h3>
          <p className="text-lg text-gray-800 font-bold">
            <span className="text-red-600">💸 {debtor.name || debtor.username}</span> deve para <span className="text-green-600">💰 {creditor.name || creditor.username}</span>
          </p>
        </div>
        
        {debt.status === 'PAID' && (
          <span className="bg-gradient-to-r from-green-500 to-green-700 text-white px-4 py-2 rounded-xl text-lg font-black border-2 border-black shadow-lg">
            ✅ PAGA
          </span>
        )}
      </div>

      <div className="space-y-3 text-base text-gray-700">
        <div className="flex justify-between bg-gray-100 p-2 rounded-lg">
          <span className="font-bold">📅 Data de vencimento:</span>
          <span className={`font-black ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
            {formatDate(debt.dueDate)}
          </span>
        </div>
        
        <div className="flex justify-between bg-gray-100 p-2 rounded-lg">
          <span className="font-bold">📝 Criada:</span>
          <span className="font-bold">{getTimeAgo(debt.createdAt)}</span>
        </div>

        {isOverdue && (
          <div className="flex justify-between text-red-600 font-black bg-red-100 p-3 rounded-lg border-2 border-red-300">
            <span>⚠️ Tempo de atraso:</span>
            <span className="text-lg">{getOverdueTime(debt.dueDate)}</span>
          </div>
        )}
      </div>

      {debt.description && (
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300">
          <p className="text-base text-gray-800 font-bold">📝 {debt.description}</p>
        </div>
      )}

      {canEdit && debt.status === 'OPEN' && (
        <div className="mt-6 pt-4 border-t-2 border-gray-300">
          <button
            onClick={handleMarkAsPaid}
            className="bg-gradient-to-r from-green-600 to-green-800 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-black border-2 border-black shadow-lg w-full"
          >
            ✅ PAGAR ESSA MERDA
          </button>
        </div>
      )}

      {isOverdue && (
        <div className="mt-4 p-4 bg-gradient-to-r from-red-100 to-orange-100 border-4 border-red-500 rounded-xl">
          <p className="text-lg text-red-800 font-black text-center">
            🔥 ESTA DÍVIDA TÁ VENCIDA, CALOTEIRO! 🔥<br/>
            <span className="text-base">Paga logo essa merda que tá fazendo {getOverdueTime(debt.dueDate).toLowerCase()}!</span>
          </p>
        </div>
      )}
    </div>
  );
};
