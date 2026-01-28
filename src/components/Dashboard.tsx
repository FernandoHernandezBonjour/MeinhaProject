'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Debt, User } from '@/types';
import { getDebtsAction, getPaidDebtsAction } from '@/lib/actions/debts';
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
  const [paidDebts, setPaidDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPaidDebts, setLoadingPaidDebts] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPaidDebts, setShowPaidDebts] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bgImage] = useState(() => Math.random() < 0.1 ? '/images/negao_da_picona.jpg' : '/images/back.jpg');

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

  // Carregar dívidas pagas quando o modal abrir
  useEffect(() => {
    if (showPaidDebts && paidDebts.length === 0) {
      loadPaidDebts();
    }
  }, [showPaidDebts]);

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

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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

  const loadPaidDebts = async () => {
    try {
      setLoadingPaidDebts(true);
      const response = await getPaidDebtsAction();
      if (response.success) {
        setPaidDebts(response.debts);
        // Atualizar usuários se necessário
        if (response.users.length > 0) {
          setUsers((prev: User[]) => {
            const existingIds = new Set(prev.map((u: User) => u.id));
            const newUsers = response.users.filter((u: User) => !existingIds.has(u.id));
            return [...prev, ...newUsers];
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dívidas pagas:', error);
    } finally {
      setLoadingPaidDebts(false);
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
        backgroundImage: `url(${bgImage})`,
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

                    <button
                      onClick={() => setShowPaidDebts(true)}
                      className="w-full px-4 py-3 text-left hover:bg-purple-100 transition-colors font-bold text-gray-800 flex items-center space-x-3"
                    >
                      <span className="text-xl">✅</span>
                      <span>Minhas Dívidas Pagas</span>
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

                <button
                  onClick={() => {
                    setShowPaidDebts(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm shadow-lg border-2 border-black w-full"
                >
                  ✅ MINHAS DÍVIDAS PAGAS
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
        {/* Sirene do Calote */}
        {(() => {
          const overdueDebts = debts.filter((debt: Debt) =>
            debt.status === 'OPEN' && new Date(debt.dueDate) < new Date()
          );

          if (overdueDebts.length > 0) {
            return (
              <div className="bg-red-600 text-white rounded-2xl p-6 shadow-2xl border-4 border-black mb-8 animate-pulse">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h2 className="text-3xl font-black mb-2">
                    PAGA ESSA MERDA LOGO!
                  </h2>
                  <p className="text-xl text-red-200">
                    {overdueDebts.length} dívida(s) vencida(s) - Pare de enrolar!
                  </p>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Charts */}
        <DashboardCharts debts={debts} users={users} />

        {/* Relatório Auditoria Meinha (CPI) */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-2xl border-4 border-yellow-500 mb-8">
          <div className="px-6 py-4 border-b-4 border-yellow-500 bg-gradient-to-r from-yellow-600/60 to-orange-600/60 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-white">
                📊 RELATÓRIO AUDITORIA MEINHA (CPI)
              </h2>
              <button
                onClick={() => {
                  // Aqui seria a lógica para gerar o PDF
                  console.log('Gerando relatório de auditoria...');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-sm shadow-lg border-2 border-black"
              >
                📄 GERAR PDF
              </button>
            </div>
            <p className="text-lg text-yellow-200 font-bold">
              Relatório completo da situação financeira do grupo
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center bg-red-100 p-4 rounded-xl border-2 border-red-300">
                <div className="text-3xl font-black text-red-600">
                  {debts.length}
                </div>
                <div className="text-sm font-bold text-red-800">
                  Dívidas Ativas
                </div>
              </div>

              <div className="text-center bg-blue-100 p-4 rounded-xl border-2 border-blue-300">
                <div className="text-3xl font-black text-blue-600">
                  {users.length}
                </div>
                <div className="text-sm font-bold text-blue-800">
                  Total de Usuários
                </div>
              </div>

              <div className="text-center bg-green-100 p-4 rounded-xl border-2 border-green-300">
                <div className="text-3xl font-black text-green-600">
                  {formatCurrency(debts.reduce((sum: number, debt: Debt) => sum + debt.amount, 0))}
                </div>
                <div className="text-sm font-bold text-green-800">
                  Valor Total
                </div>
              </div>

              <div className="text-center bg-orange-100 p-4 rounded-xl border-2 border-orange-300">
                <div className="text-3xl font-black text-orange-600">
                  {debts.filter((debt: Debt) =>
                    debt.status === 'OPEN' && new Date(debt.dueDate) < new Date()
                  ).length}
                </div>
                <div className="text-sm font-bold text-orange-800">
                  Em Atraso
                </div>
              </div>
            </div>

            {/* Ranking dos Devedores */}
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-800 mb-4">
                🏆 Ranking dos Devedores
              </h3>
              <div className="space-y-2">
                {(() => {
                  const debtorTotals = debts.reduce((acc: Record<string, number>, debt: Debt) => {
                    if (debt.status === 'OPEN') {
                      acc[debt.debtorId] = (acc[debt.debtorId] || 0) + debt.amount;
                    }
                    return acc;
                  }, {} as Record<string, number>);

                  const sortedDebtors = Object.entries(debtorTotals)
                    .map(([userId, total]) => {
                      const user = users.find((u: User) => u.id === userId);
                      return { user, total };
                    })
                    .filter((item: any) => item.user)
                    .sort((a: any, b: any) => b.total - a.total)
                    .slice(0, 5);

                  return sortedDebtors.map((item: any, index: number) => (
                    <div
                      key={item.user!.id}
                      className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-2 border-gray-300"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-black text-gray-600">
                          #{index + 1}
                        </span>
                        <span className="font-bold text-gray-800">
                          {item.user!.name || item.user!.username}
                        </span>
                      </div>
                      <span className="text-lg font-black text-red-600">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Conclusão */}
            <div className="bg-yellow-100 p-4 rounded-xl border-2 border-yellow-400 text-center">
              <p className="text-lg font-black text-yellow-800">
                "Conclusão: a vergonha continua."
              </p>
            </div>
          </div>
        </div>

        {/* Minhas Dívidas */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-2xl border-4 border-purple-500 mb-8">
          <div className="px-6 py-4 border-b-4 border-purple-500 bg-gradient-to-r from-purple-600/60 to-purple-800/60 backdrop-blur-sm">
            <h2 className="text-2xl font-black text-white">
              👤 MINHAS DÍVIDAS - O QUE EU DEVO E O QUE ME DEVEM 👤
            </h2>
            <p className="text-lg text-purple-200 font-bold">
              Suas dívidas pessoais separadas por categoria
            </p>
          </div>

          <div className="p-6">
            {(() => {
              const myDebtsAsCreditor = debts.filter((debt: Debt) => debt.creditorId === user?.id);
              const myDebtsAsDebtor = debts.filter((debt: Debt) => debt.debtorId === user?.id);

              if (myDebtsAsCreditor.length === 0 && myDebtsAsDebtor.length === 0) {
                return (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">😴</div>
                    <p className="text-xl font-bold text-gray-600">Você não tem nenhuma dívida!</p>
                    <p className="text-lg text-gray-500">Nem deve nem te devem nada.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-8">
                  {/* Dívidas que me devem */}
                  {myDebtsAsCreditor.length > 0 && (
                    <div>
                      <h3 className="text-xl font-black text-green-600 mb-4 flex items-center">
                        💰 ME DEVEM ({myDebtsAsCreditor.length})
                        <span className="ml-2 text-sm bg-green-100 px-3 py-1 rounded-full">
                          {formatCurrency(myDebtsAsCreditor.reduce((sum: number, debt: Debt) => sum + debt.amount, 0))}
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myDebtsAsCreditor.map((debt: Debt) => {
                          const debtor = users.find((u: User) => u.id === debt.debtorId);
                          if (!debtor) return null;

                          return (
                            <DebtCard
                              key={debt.id}
                              debt={debt}
                              creditor={user!}
                              debtor={debtor}
                              currentUser={user!}
                              onUpdate={handleDebtUpdate}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Dívidas que devo */}
                  {myDebtsAsDebtor.length > 0 && (
                    <div>
                      <h3 className="text-xl font-black text-red-600 mb-4 flex items-center">
                        💸 EU DEVO ({myDebtsAsDebtor.length})
                        <span className="ml-2 text-sm bg-red-100 px-3 py-1 rounded-full">
                          {formatCurrency(myDebtsAsDebtor.reduce((sum: number, debt: Debt) => sum + debt.amount, 0))}
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myDebtsAsDebtor.map((debt: Debt) => {
                          const creditor = users.find((u: User) => u.id === debt.creditorId);
                          if (!creditor) return null;

                          return (
                            <DebtCard
                              key={debt.id}
                              debt={debt}
                              creditor={creditor}
                              debtor={user!}
                              currentUser={user!}
                              onUpdate={handleDebtUpdate}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

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
                {debts.map((debt: Debt) => {
                  const creditor = users.find((u: User) => u.id === debt.creditorId);
                  const debtor = users.find((u: User) => u.id === debt.debtorId);

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
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-full py-8 px-4">
            <div className="w-full max-w-6xl">
              <DebtFormServer
                onSuccess={handleDebtCreated}
                onCancel={() => setShowDebtForm(false)}
              />
            </div>
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
              forced={!!user && (user.hashedPassword == null)}
            />
          </div>
        </div>
      )}

      {showPaidDebts && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto w-11/12 md:w-4/5 lg:w-3/4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-purple-500">
              <div className="px-6 py-4 border-b-4 border-purple-500 bg-gradient-to-r from-purple-600/60 to-purple-800/60 backdrop-blur-sm rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-white">
                    ✅ MINHAS DÍVIDAS PAGAS - HISTÓRICO DE SUCESSO ✅
                  </h2>
                  <button
                    onClick={() => setShowPaidDebts(false)}
                    className="text-white hover:text-gray-200 text-3xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <p className="text-lg text-purple-200 font-bold">
                  Suas dívidas pagas (que você criou ou que criaram para você)
                </p>
              </div>

              <div className="p-6">
                {(() => {
                  const myPaidDebts = paidDebts.filter((debt: Debt) =>
                    debt.creditorId === user?.id || debt.debtorId === user?.id
                  );

                  if (loadingPaidDebts) {
                    return (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-xl font-bold text-gray-600">Carregando dívidas pagas...</p>
                      </div>
                    );
                  }

                  if (myPaidDebts.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">😢</div>
                        <p className="text-xl font-bold text-gray-600">Nenhuma dívida paga ainda!</p>
                        <p className="text-lg text-gray-500">Crie algumas dívidas e aguarde o pagamento.</p>
                      </div>
                    );
                  }

                  const totalReceived = myPaidDebts
                    .filter((debt: Debt) => debt.creditorId === user?.id)
                    .reduce((sum: number, debt: Debt) => sum + debt.amount, 0);
                  const totalPaid = myPaidDebts
                    .filter((debt: Debt) => debt.debtorId === user?.id)
                    .reduce((sum: number, debt: Debt) => sum + debt.amount, 0);

                  return (
                    <div>
                      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center bg-green-100 p-4 rounded-xl border-2 border-green-300">
                          <p className="text-2xl font-black text-green-700">
                            {formatCurrency(totalReceived)}
                          </p>
                          <p className="text-sm font-bold text-green-600">
                            Recebido ({myPaidDebts.filter((d: Debt) => d.creditorId === user?.id).length} dívidas)
                          </p>
                        </div>
                        <div className="text-center bg-blue-100 p-4 rounded-xl border-2 border-blue-300">
                          <p className="text-2xl font-black text-blue-700">
                            {formatCurrency(totalPaid)}
                          </p>
                          <p className="text-sm font-bold text-blue-600">
                            Pago ({myPaidDebts.filter((d: Debt) => d.debtorId === user?.id).length} dívidas)
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myPaidDebts.map((debt: Debt) => {
                          const debtor = users.find((u: User) => u.id === debt.debtorId);
                          const creditor = users.find((u: User) => u.id === debt.creditorId);
                          if (!debtor || !creditor) return null;

                          const isUserCreditor = debt.creditorId === user?.id;
                          const isUserDebtor = debt.debtorId === user?.id;

                          return (
                            <div key={debt.id} className={`backdrop-blur-sm rounded-xl shadow-lg p-4 border-2 ${isUserCreditor ? 'bg-green-50/80 border-green-300' : 'bg-blue-50/80 border-blue-300'
                              }`}>
                              <div className="flex justify-between items-start mb-3">
                                <h3 className={`text-xl font-black ${isUserCreditor ? 'text-green-700' : 'text-blue-700'
                                  }`}>
                                  {formatCurrency(debt.amount)}
                                </h3>
                                <div className="flex flex-col items-end space-y-1">
                                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                    ✅ PAGA
                                  </span>
                                  <span className={`text-xs font-bold px-2 py-1 rounded ${isUserCreditor
                                    ? 'bg-green-200 text-green-800'
                                    : 'bg-blue-200 text-blue-800'
                                    }`}>
                                    {isUserCreditor ? '💰 RECEBI' : '💸 PAGUEI'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-3 mb-3">
                                <div className="flex flex-col items-center">
                                  {debtor.photoURL ? (
                                    <img
                                      src={debtor.photoURL}
                                      alt={`Foto de ${debtor.name || debtor.username}`}
                                      className={`w-10 h-10 rounded-full border-2 shadow-lg object-cover ${isUserDebtor ? 'border-blue-500' : 'border-green-500'
                                        }`}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full border-2 border-gray-400 shadow-lg bg-gray-200 flex items-center justify-center">
                                      <span className="text-xs font-bold text-gray-600">👤</span>
                                    </div>
                                  )}
                                  <span className={`text-sm font-bold text-center mt-1 ${isUserDebtor ? 'text-blue-600' : 'text-green-600'
                                    }`}>
                                    {debtor.name || debtor.username}
                                  </span>
                                </div>

                                <div className="text-center">
                                  <span className="text-sm text-gray-600 font-bold">
                                    {isUserCreditor ? 'pagou para' : 'recebeu de'}
                                  </span>
                                </div>

                                <div className="flex flex-col items-center">
                                  {creditor.photoURL ? (
                                    <img
                                      src={creditor.photoURL}
                                      alt={`Foto de ${creditor.name || creditor.username}`}
                                      className={`w-10 h-10 rounded-full border-2 shadow-lg object-cover ${isUserCreditor ? 'border-blue-500' : 'border-green-500'
                                        }`}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full border-2 border-gray-400 shadow-lg bg-gray-200 flex items-center justify-center">
                                      <span className="text-xs font-bold text-gray-600">👤</span>
                                    </div>
                                  )}
                                  <span className={`text-sm font-bold text-center mt-1 ${isUserCreditor ? 'text-blue-600' : 'text-green-600'
                                    }`}>
                                    {creditor.name || creditor.username}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between bg-gray-100 p-2 rounded-lg">
                                  <span className="font-bold">📅 Vencimento:</span>
                                  <span className="font-bold">
                                    {new Intl.DateTimeFormat('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    }).format(new Date(debt.dueDate))}
                                  </span>
                                </div>

                                <div className="flex justify-between bg-gray-100 p-2 rounded-lg">
                                  <span className="font-bold">📝 Criada:</span>
                                  <span className="font-bold">
                                    {new Intl.DateTimeFormat('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    }).format(new Date(debt.createdAt))}
                                  </span>
                                </div>
                              </div>

                              {debt.description && (
                                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                                  <p className="text-sm text-gray-800 font-bold">📝 {debt.description}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
