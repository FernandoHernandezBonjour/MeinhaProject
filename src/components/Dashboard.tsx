'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Debt, User } from '@/types';
import { getDebtsAction } from '@/lib/actions/debts';
import { DebtCard } from './DebtCard';
import { DebtFormServer } from './DebtFormServer';
import { UserRegistration } from './UserRegistration';
import { DashboardCharts } from './DashboardCharts';
import { ProfileEditForm } from './ProfileEditForm';
import { PasswordChangeForm } from './PasswordChangeForm';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Forçar troca de senha se o usuário ainda estiver com senha padrão (sem hashedPassword)
  useEffect(() => {
    if (user && (user.hashedPassword === null || user.hashedPassword === undefined)) {
      setShowPasswordForm(true);
    }
  }, [user]);

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

  const handleProfileUpdated = () => {
    setShowProfileForm(false);
    // O contexto já foi atualizado automaticamente
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
      <header className="bg-gradient-to-r from-red-600/60 to-orange-600/60 backdrop-blur-sm shadow-lg border-b-4 border-black relative z-[20000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo/Título */}
            <div className="flex-shrink-0 flex items-center space-x-4">
              {/* Foto do usuário com dropdown */}
              <div className="relative group z-[10000]">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Foto do usuário" 
                    className="w-12 h-12 rounded-full border-2 border-white shadow-lg object-cover cursor-pointer hover:border-yellow-300 transition-colors"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-white shadow-lg bg-gray-300 flex items-center justify-center cursor-pointer hover:border-yellow-300 transition-colors">
                    <span className="text-2xl">👤</span>
                  </div>
                )}
                
                {/* Dropdown do perfil */}
                <div className="absolute right-0 top-14 bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl border-2 border-black opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[30000] min-w-48">
                  <div className="py-2">
                    <button
                      onClick={() => setShowProfileForm(true)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-100 transition-colors font-bold text-gray-800 flex items-center space-x-3"
                    >
                      <span className="text-xl">👤</span>
                      <span>Editar Perfil</span>
                    </button>
                    
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="w-full px-4 py-3 text-left hover:bg-green-100 transition-colors font-bold text-gray-800 flex items-center space-x-3"
                    >
                      <span className="text-xl">🔒</span>
                      <span>Alterar Senha</span>
                    </button>
                    
                    <div className="border-t border-gray-300 my-1"></div>
                    
                    <button
                      onClick={logout}
                      className="w-full px-4 py-3 text-left hover:bg-red-100 transition-colors font-bold text-gray-800 flex items-center space-x-3"
                    >
                      <span className="text-xl">🚪</span>
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-lg">
                  🚨 CALOTEIROS DO GRUPO
                </h1>
                <p className="text-sm md:text-lg text-yellow-200 font-bold">
                  E aí, {user?.name || user?.username}? Vamos ver quem tá devendo!
                </p>
              </div>
            </div>
            
            {/* Menu Mobile Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-white/20 text-white p-2 rounded-lg hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white border-2 border-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            {/* Menu Desktop */}
            <nav className="hidden md:flex items-center space-x-2">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowUserForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm shadow-lg border-2 border-black"
                >
                  👤 CADASTRAR VÍTIMA
                </button>
              )}
              
              <button
                onClick={() => setShowDebtForm(true)}
                className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-sm shadow-lg border-2 border-black"
              >
                💸 NOVA DÍVIDA
              </button>
            </nav>
          </div>
          
          {/* Menu Mobile */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4">
              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setShowProfileForm(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm shadow-lg border-2 border-black w-full"
                >
                  👤 MEU PERFIL
                </button>
                
                <button
                  onClick={() => {
                    setShowPasswordForm(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm shadow-lg border-2 border-black w-full"
                >
                  🔒 ALTERAR SENHA
                </button>
                
                {user?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setShowUserForm(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm shadow-lg border-2 border-black w-full"
                  >
                    👤 CADASTRAR VÍTIMA
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setShowDebtForm(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-red-700 text-white px-4 py-3 rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-sm shadow-lg border-2 border-black w-full"
                >
                  💸 NOVA DÍVIDA
                </button>
                
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 font-bold text-sm shadow-lg border-2 border-black w-full"
                >
                  🚪 VAZAR
                </button>
              </nav>
            </div>
          )}
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

      {showProfileForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto w-11/12 md:w-1/2 lg:w-1/3">
            <ProfileEditForm
              onSuccess={handleProfileUpdated}
              onCancel={() => setShowProfileForm(false)}
            />
          </div>
        </div>
      )}

      {showPasswordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto w-11/12 md:w-1/2 lg:w-1/3">
            <PasswordChangeForm
              onSuccess={() => setShowPasswordForm(false)}
              onCancel={() => setShowPasswordForm(false)}
              forced={user && (user.hashedPassword === null || user.hashedPassword === undefined)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
