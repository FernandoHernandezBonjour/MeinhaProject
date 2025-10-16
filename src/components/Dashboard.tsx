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
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url(/images/back.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="text-center bg-white/60 backdrop-blur-sm p-8 rounded-2xl border-4 border-black shadow-2xl">
          <div className="animate-spin rounded-full h-32 w-32 border-8 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-2xl font-black text-red-600">Carregando as dívidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: 'url(/images/back.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600/60 to-orange-600/60 backdrop-blur-sm shadow-lg border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-4xl font-black text-white drop-shadow-lg">
                🚨 CALOTEIROS DO GRUPO
              </h1>
              <p className="text-lg text-yellow-200 font-bold">
                E aí, {user?.name || user?.username}? Vamos ver quem tá devendo!
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowUserForm(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-lg shadow-lg border-2 border-black"
                >
                  👤 CADASTRAR VÍTIMA
                </button>
              )}
              
              <button
                onClick={() => setShowDebtForm(true)}
                className="bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-lg shadow-lg border-2 border-black"
              >
                💸 NOVA DÍVIDA
              </button>
              
              <button
                onClick={logout}
                className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 font-bold text-lg shadow-lg border-2 border-black"
              >
                🚪 VAZAR
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
        <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-2xl border-4 border-black">
          <div className="px-6 py-4 border-b-4 border-black bg-gradient-to-r from-red-500/60 to-orange-500/60 backdrop-blur-sm">
            <h2 className="text-2xl font-black text-white">
              💀 DÍVIDAS EM ABERTO - QUEM NÃO PAGA VIRA CALOTEIRO 💀
            </h2>
            <p className="text-lg text-yellow-200 font-bold">
              Ordenadas do mais caloteiro pro menos caloteiro (mais antigas primeiro)
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
                <div className="mx-auto h-24 w-24 text-green-500 text-6xl">
                  🎉
                </div>
                <h3 className="mt-4 text-3xl font-black text-green-600">
                  NINGUÉM ESTÁ DEVENDO!
                </h3>
                <p className="mt-2 text-xl text-gray-700 font-bold">
                  Que milagre! Todos pagaram suas contas! 
                </p>
                <p className="mt-1 text-lg text-gray-600">
                  Mas se quiser criar uma nova dívida pra alguém, é só clicar aí embaixo 👇
                </p>
                <div className="mt-8">
                  <button
                    onClick={() => setShowDebtForm(true)}
                    className="inline-flex items-center px-8 py-4 border-2 border-black shadow-lg text-lg font-black rounded-xl text-white bg-red-600 hover:bg-red-700"
                  >
                    💸 CRIAR NOVA DÍVIDA
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showDebtForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto w-11/12 md:w-3/4 lg:w-1/2">
            <DebtFormServer
              onSuccess={handleDebtCreated}
              onCancel={() => setShowDebtForm(false)}
            />
          </div>
        </div>
      )}

      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto w-11/12 md:w-1/2 lg:w-1/3">
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
