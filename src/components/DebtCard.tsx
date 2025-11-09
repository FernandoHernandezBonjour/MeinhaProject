'use client';

import React from 'react';
import { Debt, User } from '@/types';
import { markDebtAsPaidAction, deleteDebtAction } from '@/lib/actions/debts';

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
  const canDelete = isAdmin || (isOwner && debt.status === 'OPEN');

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
        window.dispatchEvent(new Event('notifications:refresh'));
      } else {
        console.error('Erro ao marcar como paga:', result.error);
      }
    } catch (error) {
      console.error('Erro ao marcar como paga:', error);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    
    if (!confirm('Tem certeza que quer excluir essa dívida? Essa ação não pode ser desfeita!')) {
      return;
    }

    try {
      const result = await deleteDebtAction(debt.id);
      if (result.success) {
        onUpdate?.();
        window.dispatchEvent(new Event('notifications:refresh'));
      } else {
        console.error('Erro ao excluir dívida:', result.error);
        alert('Erro ao excluir dívida: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao excluir dívida:', error);
      alert('Erro ao excluir dívida');
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
          <div className="flex items-center space-x-6">
            {/* Devedor */}
            <div className="flex flex-col items-center space-y-1">
              {debtor.photoURL ? (
                <img 
                  src={debtor.photoURL} 
                  alt={`Foto de ${debtor.name || debtor.username}`}
                  className="w-12 h-12 rounded-full border-2 border-red-500 shadow-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-gray-400 shadow-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600 text-center leading-tight">corno<br/>sem foto</span>
                </div>
              )}
              <span className="text-sm text-red-600 font-bold text-center">
                💸 {debtor.name || debtor.username}
              </span>
            </div>
            
            <span className="text-lg text-gray-600 font-bold">deve para</span>
            
            {/* Credor */}
            <div className="flex flex-col items-center space-y-1">
              {creditor.photoURL ? (
                <img 
                  src={creditor.photoURL} 
                  alt={`Foto de ${creditor.name || creditor.username}`}
                  className="w-12 h-12 rounded-full border-2 border-green-500 shadow-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-gray-400 shadow-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600 text-center leading-tight">corno<br/>sem foto</span>
                </div>
              )}
              <span className="text-sm text-green-600 font-bold text-center">
                💰 {creditor.name || creditor.username}
              </span>
            </div>
          </div>
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

        {creditor.pixKey && (
          <div className="flex justify-between bg-green-100 p-3 rounded-lg border-2 border-green-300">
            <span className="font-bold text-green-800">💳 Chave PIX do credor:</span>
            <span className="font-black text-green-900 break-all">{creditor.pixKey}</span>
          </div>
        )}
      </div>

      {debt.description && (
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300">
          <p className="text-base text-gray-800 font-bold">📝 {debt.description}</p>
        </div>
      )}

      {debt.attachment && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300">
          <p className="text-base text-blue-800 font-bold mb-3">📎 Anexo:</p>
          <img 
            src={debt.attachment} 
            alt="Anexo da dívida" 
            className="max-w-full h-auto rounded-lg shadow-lg border-2 border-blue-400 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => window.open(debt.attachment, '_blank')}
          />
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

      {canDelete && (
        <div className="mt-4 pt-4 border-t-2 border-gray-300">
          <button
            onClick={handleDelete}
            className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-lg font-black border-2 border-black shadow-lg w-full"
          >
            🗑️ EXCLUIR ESSA MERDA
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
