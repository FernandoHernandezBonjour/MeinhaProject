 'use client';

import React, { useEffect, useState } from 'react';
import { ActivityFeed, CaloteiroRanking, WeeklyStats } from '@/types';
import { getHomeDataAction } from '@/lib/actions/home';
import { UserLink } from './UserLink';

export const HomePage: React.FC = () => {
  const [ranking, setRanking] = useState<CaloteiroRanking[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getHomeDataAction();
        if (!response.success) {
          setError(response.error ?? 'Não foi possível carregar os dados.');
          setRanking([]);
          setStats(null);
          setActivityFeed([]);
          return;
        }

        setRanking(response.ranking ?? []);
        setStats(response.stats ?? null);
        setActivityFeed(
          (response.activity ?? []).map((item) => ({
            ...item,
            createdAt:
              item.createdAt instanceof Date
                ? item.createdAt
                : new Date(item.createdAt),
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro inesperado ao carregar os dados.');
        setRanking([]);
        setStats(null);
        setActivityFeed([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 font-bold px-4 py-3 rounded-lg transition-colors duration-200">
          ❌ {error}
        </div>
      )}

      <div className="bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-800 dark:to-orange-800 rounded-2xl p-8 text-white shadow-2xl border-4 border-black dark:border-gray-700 transition-colors duration-200">
        <h2 className="text-4xl font-black mb-4">🐷 Bem-vindo ao Hub Meinha Games!</h2>
        <p className="text-xl text-red-100 dark:text-red-200 font-semibold">
          Monitoramento em tempo real da humilhação coletiva: dívidas, rolês e fofocas da semana.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-black dark:border-gray-700 transition-colors duration-200">
            <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mb-6 flex items-center">
              👑 Ranking do Caloteiro Supremo
            </h3>

            {ranking.length === 0 ? (
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Nenhuma dívida aberta no momento. Milagre ou golpe? Fique de olho.
              </p>
            ) : (
              <div className="space-y-4">
                {ranking.map((caloteiro) => (
                  <div
                    key={caloteiro.userId}
                    className={`p-4 rounded-xl border-2 transition-colors duration-200 ${
                      caloteiro.isLeader
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 dark:from-yellow-600 dark:to-orange-600 border-yellow-600 dark:border-yellow-500 shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`text-3xl font-black ${
                            caloteiro.isLeader ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {caloteiro.isLeader ? '👑' : `#${caloteiro.position}`}
                        </div>
                        <div>
                          <h4
                            className={`text-xl font-bold ${
                              caloteiro.isLeader ? 'text-yellow-800 dark:text-yellow-100' : 'text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            <UserLink username={caloteiro.username} userId={caloteiro.userId} />
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {caloteiro.isLeader ? 'Rei da Vergonha' : 'Caloteiro Pleno'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          R$ {caloteiro.totalDebt.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {caloteiro.overdueDebts} em atraso
                        </p>
                      </div>
                    </div>
                    {caloteiro.isLeader && (
                      <div className="mt-2 text-sm text-yellow-800 dark:text-yellow-100 font-semibold">
                        "Campeão de não pagar desde 2024"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-black dark:border-gray-700 transition-colors duration-200">
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mb-6">
              📊 Estatísticas dos Últimos 7 dias
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border-2 border-red-200 dark:border-red-800 transition-colors duration-200">
                <span className="font-bold text-red-800 dark:text-red-300">Dívidas criadas</span>
                <span className="text-2xl font-black text-red-600 dark:text-red-400">{stats?.debtsCreated ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border-2 border-green-200 dark:border-green-800 transition-colors duration-200">
                <span className="font-bold text-green-800 dark:text-green-300">Pagamentos realizados</span>
                <span className="text-2xl font-black text-green-600 dark:text-green-400">{stats?.paymentsMade ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-2 border-blue-200 dark:border-blue-800 transition-colors duration-200">
                <span className="font-bold text-blue-800 dark:text-blue-300">Rolês marcados</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats?.eventsCreated ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border-2 border-orange-200 dark:border-orange-800 transition-colors duration-200">
                <span className="font-bold text-orange-800 dark:text-orange-300">Novos caloteiros</span>
                <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats?.newCaloteiros ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-4 border-black dark:border-gray-700 transition-colors duration-200">
        <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mb-6">
          🔥 Feed de Ações Recentes
        </h3>

        {activityFeed.length === 0 ? (
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Nada de novo nos últimos dias. Ou todo mundo pagou, ou tá escondendo o jogo.
          </p>
        ) : (
          <div className="space-y-4">
            {activityFeed.map((activity) => (
              <div
                key={activity.id}
                className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border-2 border-gray-300 dark:border-gray-600 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('profile:open', { 
                      detail: { username: activity.username, userId: activity.userId } 
                    }))}
                    className="w-10 h-10 bg-red-600 dark:bg-red-700 rounded-full flex items-center justify-center text-white font-bold hover:bg-red-700 dark:hover:bg-red-800 transition-colors cursor-pointer"
                    title={`Ver perfil de ${activity.username}`}
                  >
                    {activity.username.charAt(0).toUpperCase()}
                  </button>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 dark:text-gray-200">
                      <UserLink username={activity.username} userId={activity.userId} /> {activity.message.replace(activity.username, '').trim()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(activity.createdAt instanceof Date
                        ? activity.createdAt
                        : new Date(activity.createdAt)
                      ).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
