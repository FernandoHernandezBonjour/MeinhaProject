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
    
    if (diffInDays === 0) return 'Vence hoje!';
    if (diffInDays === 1) return 'Vencida há 1 dia';
    if (diffInDays < 30) return `Vencida há ${diffInDays} dias`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths === 1) return 'Vencida há 1 mês';
    if (diffInMonths < 12) return `Vencida há ${diffInMonths} meses`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    if (diffInYears === 1) return 'Vencida há 1 ano';
    return `Vencida há ${diffInYears} anos`;
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
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
      isOverdue ? 'border-red-500' : 'border-green-500'
    }`}>
      {isOverdue && (
        <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold mb-4 inline-block">
          VENCIDO
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {formatCurrency(debt.amount)}
          </h3>
          <p className="text-sm text-gray-600">
            <strong>{debtor.name || debtor.username}</strong> deve para <strong>{creditor.name || creditor.username}</strong>
          </p>
        </div>
        
        {debt.status === 'PAID' && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
            PAGA
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Data de vencimento:</span>
          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
            {formatDate(debt.dueDate)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Criada:</span>
          <span>{getTimeAgo(debt.createdAt)}</span>
        </div>

        {isOverdue && (
          <div className="flex justify-between text-red-600 font-semibold">
            <span>Tempo de atraso:</span>
            <span>{getOverdueTime(debt.dueDate)}</span>
          </div>
        )}
      </div>

      {debt.description && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">{debt.description}</p>
        </div>
      )}

      {canEdit && debt.status === 'OPEN' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleMarkAsPaid}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            Marcar como Paga
          </button>
        </div>
      )}

      {isOverdue && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700 font-semibold">
            ⚠️ Esta dívida está vencida! O valor deveria ter sido pago há {getOverdueTime(debt.dueDate).toLowerCase()}.
          </p>
        </div>
      )}
    </div>
  );
};
