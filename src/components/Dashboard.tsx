'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Debt, User } from '@/types';
import { getDebtsAction } from '@/lib/actions/debts';
import { DebtCard } from './DebtCard';
import { DebtFormServer } from './DebtFormServer';
import { UserRegistration } from './UserRegistration';
import { DashboardCharts } from './DashboardCharts';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDebtsAction();
        
        if (response.success) {
          setDebts(response.debts);
          setUsers(response.users);
        } else {
          console.error('Erro ao carregar dados:', response.error);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDebtCreated = async () => {
    setShowDebtForm(false);
    // Recarregar dados
    try {
      const response = await getDebtsAction();
      if (response.success) {
        setDebts(response.debts);
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    }
  };

  const handleUserCreated = async () => {
    setShowUserForm(false);
    // Recarregar dados
    try {
      const response = await getDebtsAction();
      if (response.success) {
        setDebts(response.debts);
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    }
  };

  const handleDebtUpdate = async () => {
    // Recarregar dívidas
    try {
      const response = await getDebtsAction();
      if (response.success) {
        setDebts(response.debts);
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Erro ao recarregar dados:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sistema de Dívidas
              </h1>
              <p className="text-sm text-gray-600">
                Bem-vindo, {user?.name || user?.username}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowUserForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cadastrar Usuário
                </button>
              )}
              
              <button
                onClick={() => setShowDebtForm(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Nova Dívida
              </button>
              
              <button
                onClick={logout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Charts */}
        <DashboardCharts debts={debts} users={users} />

        {/* Debts List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Dívidas em Aberto
            </h2>
            <p className="text-sm text-gray-600">
              Ordenadas por data de vencimento (mais antigas primeiro)
            </p>
          </div>
          
          <div className="p-6">
            {debts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {debts.map(debt => {
                  const creditor = users.find(u => u.id === debt.creditorId);
                  const debtor = users.find(u => u.id === debt.debtorId);
                  
                  if (!creditor || !debtor) return null;
                  
                  return (
                    <DebtCard
                      key={debt.id}
                      debt={debt}
                      creditor={creditor}
                      debtor={debtor}
                      currentUser={user!}
                      onUpdate={handleDebtUpdate}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nenhuma dívida em aberto
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Cadastre uma nova dívida para começar.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowDebtForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Nova Dívida
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showDebtForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <DebtFormServer
              onSuccess={handleDebtCreated}
              onCancel={() => setShowDebtForm(false)}
            />
          </div>
        </div>
      )}

      {showUserForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <UserRegistration
              onSuccess={handleUserCreated}
              onCancel={() => setShowUserForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
