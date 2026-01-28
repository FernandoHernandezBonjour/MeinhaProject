'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Debt, User } from '@/types';
import { getDebtsAction, getPaidDebtsAction } from '@/lib/actions/debts';
import { DebtCard } from './DebtCard';
import { DebtFormServer } from './DebtFormServer';
import { DashboardCharts } from './DashboardCharts';
import { PersonalFinanceModule } from './PersonalFinanceModule';
import { MeinhaScoreDashboard } from './MeinhaScoreDashboard';

export const FinancialPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'group' | 'personal' | 'score'>('group');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [paidDebts, setPaidDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPaidDebts, setLoadingPaidDebts] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showPaidDebts, setShowPaidDebts] = useState(false);

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

  // Carregar dívidas pagas quando o modal abrir - OU para o score (precisamos do histórico completo)
  // O score precisa de todas as dívidas (abertas E pagas) para calcular corretamente.
  // Vamos carregar pagas se a tab for score também.
  useEffect(() => {
    if ((showPaidDebts || activeTab === 'score') && paidDebts.length === 0) {
      loadPaidDebts();
    }
  }, [showPaidDebts, activeTab]);

  const handleDebtCreated = async () => {
    setShowDebtForm(false);
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

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleDebtUpdate = async () => {
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
        if (response.users.length > 0) {
          setUsers(prev => {
            const existingIds = new Set(prev.map(u => u.id));
            const newUsers = response.users.filter(u => !existingIds.has(u.id));
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tabs de Alternância */}
      <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl border-4 border-black max-w-2xl mx-auto">
        <button
          onClick={() => setActiveTab('group')}
          className={`flex-1 py-3 rounded-xl font-black transition-all ${activeTab === 'group' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400'}`}
        >
          👥 Grupo
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-3 rounded-xl font-black transition-all ${activeTab === 'personal' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400'}`}
        >
          👤 Pessoal
        </button>
        <button
          onClick={() => setActiveTab('score')}
          className={`flex-1 py-3 rounded-xl font-black transition-all ${activeTab === 'score' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400'}`}
        >
          ⭐ MeinhaScore
        </button>
      </div>

      {activeTab === 'score' ? (
        <MeinhaScoreDashboard
          debts={[...debts, ...paidDebts]} // Passa TODAS as dívidas para o calculo
          users={users}
        />
      ) : activeTab === 'group' ? (

        <>
          {/* Header da seção financeira */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-800 dark:to-orange-800 rounded-2xl p-8 text-white shadow-2xl border-4 border-black dark:border-gray-700 transition-colors duration-200">
            <h2 className="text-4xl font-black mb-4">💰 Financeiro Meinha</h2>
            <p className="text-xl text-red-200 dark:text-red-100">
              Controle total das dívidas, caloteiros e humilhação pública!
            </p>
          </div>

          {/* Botões de ação rápida */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowDebtForm(true)}
              className="bg-red-600 dark:bg-red-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-colors border-2 border-black dark:border-gray-600 shadow-lg"
            >
              💸 Nova Dívida
            </button>

            <button
              onClick={() => setShowPaidDebts(true)}
              className="bg-yellow-600 dark:bg-yellow-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors border-2 border-black dark:border-gray-600 shadow-lg"
            >
              ✅ Dívidas Pagas
            </button>
          </div>

          {/* Sirene do Calote */}
          {(() => {
            const overdueDebts = debts.filter(debt =>
              debt.status === 'OPEN' && new Date(debt.dueDate) < new Date()
            );

            if (overdueDebts.length > 0) {
              return (
                <div className="bg-red-600 text-white rounded-2xl p-6 shadow-2xl border-4 border-black animate-pulse">
                  <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-3xl font-black mb-2">
                      PAGA ESSA MERDA LOGO!
                    </h3>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-yellow-500 dark:border-yellow-600 transition-colors duration-200">
            <div className="px-6 py-4 border-b-4 border-yellow-500 bg-gradient-to-r from-yellow-600/60 to-orange-600/60 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-white">
                  📊 Relatório Auditoria Meinha (CPI)
                </h3>
                <button
                  onClick={() => {
                    console.log('Gerando relatório de auditoria...');
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-sm shadow-lg border-2 border-black"
                >
                  📄 Gerar PDF
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
                    {formatCurrency(debts.reduce((sum, debt) => sum + debt.amount, 0))}
                  </div>
                  <div className="text-sm font-bold text-green-800">
                    Valor Total
                  </div>
                </div>

                <div className="text-center bg-orange-100 p-4 rounded-xl border-2 border-orange-300">
                  <div className="text-3xl font-black text-orange-600">
                    {debts.filter(debt =>
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
                <h4 className="text-xl font-black text-gray-800 dark:text-gray-200 mb-4">
                  🏆 Ranking dos Devedores
                </h4>
                <div className="space-y-2">
                  {(() => {
                    const debtorTotals = debts.reduce((acc, debt) => {
                      if (debt.status === 'OPEN') {
                        acc[debt.debtorId] = (acc[debt.debtorId] || 0) + debt.amount;
                      }
                      return acc;
                    }, {} as Record<string, number>);

                    const sortedDebtors = Object.entries(debtorTotals)
                      .map(([userId, total]) => {
                        const user = users.find(u => u.id === userId);
                        return { user, total };
                      })
                      .filter(item => item.user)
                      .sort((a: { user: User | undefined; total: number }, b: { user: User | undefined; total: number }) => b.total - a.total)
                      .slice(0, 5);

                    return sortedDebtors.map((item, index) => (
                      <div
                        key={item.user!.id}
                        className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-black text-gray-600 dark:text-gray-300">
                            #{index + 1}
                          </span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            {item.user!.name || item.user!.username}
                          </span>
                        </div>
                        <span className="text-lg font-black text-red-600 dark:text-red-400">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-purple-500 dark:border-purple-600 transition-colors duration-200">
            <div className="px-6 py-4 border-b-4 border-purple-500 bg-gradient-to-r from-purple-600/60 to-purple-800/60 rounded-t-2xl">
              <h3 className="text-2xl font-black text-white">
                👤 Minhas Dívidas - O que eu devo e o que me devem 👤
              </h3>
              <p className="text-lg text-purple-200 font-bold">
                Suas dívidas pessoais separadas por categoria
              </p>
            </div>

            <div className="p-6">
              {(() => {
                const myDebtsAsCreditor = debts.filter(debt => debt.creditorId === user?.id);
                const myDebtsAsDebtor = debts.filter(debt => debt.debtorId === user?.id);

                if (myDebtsAsCreditor.length === 0 && myDebtsAsDebtor.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">😴</div>
                      <p className="text-xl font-bold text-gray-600 dark:text-gray-300">Você não tem nenhuma dívida!</p>
                      <p className="text-lg text-gray-500 dark:text-gray-400">Nem deve nem te devem nada.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-8">
                    {/* Dívidas que me devem */}
                    {myDebtsAsCreditor.length > 0 && (
                      <div>
                        <h4 className="text-xl font-black text-green-600 mb-4 flex items-center">
                          💰 Me Devem ({myDebtsAsCreditor.length})
                          <span className="ml-2 text-sm bg-green-100 px-3 py-1 rounded-full">
                            {formatCurrency(myDebtsAsCreditor.reduce((sum, debt) => sum + debt.amount, 0))}
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {myDebtsAsCreditor.map(debt => {
                            const debtor = users.find(u => u.id === debt.debtorId);
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
                        <h4 className="text-xl font-black text-red-600 mb-4 flex items-center">
                          💸 Eu Devo ({myDebtsAsDebtor.length})
                          <span className="ml-2 text-sm bg-red-100 px-3 py-1 rounded-full">
                            {formatCurrency(myDebtsAsDebtor.reduce((sum, debt) => sum + debt.amount, 0))}
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {myDebtsAsDebtor.map(debt => {
                            const creditor = users.find(u => u.id === debt.creditorId);
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

          {/* Dívidas em Aberto */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-black dark:border-gray-700 transition-colors duration-200">
            <div className="px-6 py-4 border-b-4 border-black bg-gradient-to-r from-red-500/60 to-orange-500/60 rounded-t-2xl">
              <h3 className="text-2xl font-black text-white">
                💀 Dívidas em Aberto - Quem não paga vira caloteiro 💀
              </h3>
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
                  <h4 className="mt-4 text-3xl font-black text-green-600">
                    Ninguém está devendo!
                  </h4>
                  <p className="mt-2 text-xl text-gray-700 dark:text-gray-300 font-bold">
                    Que milagre! Todos pagaram suas contas!
                  </p>
                  <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
                    Mas se quiser criar uma nova dívida pra alguém, é só clicar aí embaixo 👇
                  </p>
                  <div className="mt-8">
                    <button
                      onClick={() => setShowDebtForm(true)}
                      className="inline-flex items-center px-8 py-4 border-2 border-black shadow-lg text-lg font-black rounded-xl text-white bg-red-600 hover:bg-red-700"
                    >
                      💸 Criar Nova Dívida
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <PersonalFinanceModule />
      )}

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

      {showPaidDebts && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto w-11/12 md:w-4/5 lg:w-3/4">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border-4 border-purple-500 dark:border-purple-600 transition-colors duration-200">
              <div className="px-6 py-4 border-b-4 border-purple-500 bg-gradient-to-r from-purple-600/60 to-purple-800/60 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-white">
                    ✅ Minhas Dívidas Pagas - Histórico de Sucesso ✅
                  </h3>
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

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {(() => {
                  const myPaidDebts = paidDebts.filter(debt =>
                    debt.creditorId === user?.id || debt.debtorId === user?.id
                  );

                  if (loadingPaidDebts) {
                    return (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-xl font-bold text-gray-600 dark:text-gray-300">Carregando dívidas pagas...</p>
                      </div>
                    );
                  }

                  if (myPaidDebts.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">😢</div>
                        <p className="text-xl font-bold text-gray-600 dark:text-gray-300">Nenhuma dívida paga ainda!</p>
                        <p className="text-lg text-gray-500 dark:text-gray-400">Crie algumas dívidas e aguarde o pagamento.</p>
                      </div>
                    );
                  }

                  const totalReceived = myPaidDebts
                    .filter(debt => debt.creditorId === user?.id)
                    .reduce((sum, debt) => sum + debt.amount, 0);
                  const totalPaid = myPaidDebts
                    .filter(debt => debt.debtorId === user?.id)
                    .reduce((sum, debt) => sum + debt.amount, 0);

                  return (
                    <div>
                      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center bg-green-100 p-4 rounded-xl border-2 border-green-300">
                          <p className="text-2xl font-black text-green-700">
                            {formatCurrency(totalReceived)}
                          </p>
                          <p className="text-sm font-bold text-green-600">
                            Recebido ({myPaidDebts.filter(d => d.creditorId === user?.id).length} dívidas)
                          </p>
                        </div>
                        <div className="text-center bg-blue-100 p-4 rounded-xl border-2 border-blue-300">
                          <p className="text-2xl font-black text-blue-700">
                            {formatCurrency(totalPaid)}
                          </p>
                          <p className="text-sm font-bold text-blue-600">
                            Pago ({myPaidDebts.filter(d => d.debtorId === user?.id).length} dívidas)
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myPaidDebts.map(debt => {
                          const debtor = users.find(u => u.id === debt.debtorId);
                          const creditor = users.find(u => u.id === debt.creditorId);
                          if (!debtor || !creditor) return null;

                          const isUserCreditor = debt.creditorId === user?.id;
                          const isUserDebtor = debt.debtorId === user?.id;

                          return (
                            <div key={debt.id} className={`backdrop-blur-sm rounded-xl shadow-lg p-4 border-2 ${isUserCreditor ? 'bg-green-50/80 border-green-300' : 'bg-blue-50/80 border-blue-300'
                              }`}>
                              <div className="flex justify-between items-start mb-3">
                                <h4 className={`text-xl font-black ${isUserCreditor ? 'text-green-700' : 'text-blue-700'
                                  }`}>
                                  {formatCurrency(debt.amount)}
                                </h4>
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
                                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">👤</span>
                                    </div>
                                  )}
                                  <span className={`text-sm font-bold text-center mt-1 ${isUserDebtor ? 'text-blue-600' : 'text-green-600'
                                    }`}>
                                    {debtor.name || debtor.username}
                                  </span>
                                </div>

                                <div className="text-center">
                                  <span className="text-sm text-gray-600 dark:text-gray-300 font-bold">
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
                                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">👤</span>
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
                                  <p className="text-sm text-gray-800 dark:text-gray-200 font-bold">📝 {debt.description}</p>
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
