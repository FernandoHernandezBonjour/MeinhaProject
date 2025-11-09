'use client';

import React, { useState, useEffect } from 'react';
import { CaloteiroRanking, WeeklyStats, ActivityFeed } from '@/types';

export const HomePage: React.FC = () => {
  const [ranking, setRanking] = useState<CaloteiroRanking[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeed[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data para demonstração
  useEffect(() => {
    const mockRanking: CaloteiroRanking[] = [
      {
        userId: '1',
        username: 'Luis',
        totalDebt: 1250.50,
        overdueDebts: 3,
        position: 1,
        isLeader: true
      },
      {
        userId: '2',
        username: 'Diego',
        totalDebt: 890.00,
        overdueDebts: 2,
        position: 2,
        isLeader: false
      },
      {
        userId: '3',
        username: 'Fernando',
        totalDebt: 650.75,
        overdueDebts: 1,
        position: 3,
        isLeader: false
      }
    ];

    const mockStats: WeeklyStats = {
      debtsCreated: 5,
      paymentsMade: 2,
      eventsCreated: 1,
      newCaloteiros: 1,
      period: 'Esta semana'
    };

    const mockActivity: ActivityFeed[] = [
      {
        id: '1',
        type: 'debt_created',
        userId: '1',
        username: 'Shaolin',
        message: 'Shaolin cobrou o imbecil do Luis.',
        createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 min atrás
      },
      {
        id: '2',
        type: 'debt_paid',
        userId: '2',
        username: 'Luis',
        message: 'Luis pagou o que devia (incrível).',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2h atrás
      },
      {
        id: '3',
        type: 'event_created',
        userId: '3',
        username: 'Fernando',
        message: 'Fernando criou uma nova dívida. Que fase.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4h atrás
      }
    ];

    setRanking(mockRanking);
    setStats(mockStats);
    setActivityFeed(mockActivity);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ranking dos Caloteiros */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-4 border-black">
            <h3 className="text-2xl font-black text-red-600 mb-6 flex items-center">
              👑 Ranking do Caloteiro Supremo
            </h3>
            
            <div className="space-y-4">
              {ranking.map((caloteiro, index) => (
                <div
                  key={caloteiro.userId}
                  className={`p-4 rounded-xl border-2 ${
                    caloteiro.isLeader
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 border-yellow-600 shadow-lg'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`text-3xl font-black ${
                        caloteiro.isLeader ? 'text-yellow-600' : 'text-gray-500'
                      }`}>
                        {caloteiro.isLeader ? '👑' : `#${caloteiro.position}`}
                      </div>
                      <div>
                        <h4 className={`text-xl font-bold ${
                          caloteiro.isLeader ? 'text-yellow-800' : 'text-gray-800'
                        }`}>
                          {caloteiro.username}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {caloteiro.isLeader ? 'Rei da Vergonha' : 'Caloteiro Pleno'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        R$ {caloteiro.totalDebt.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {caloteiro.overdueDebts} em atraso
                      </p>
                    </div>
                  </div>
                  {caloteiro.isLeader && (
                    <div className="mt-2 text-sm text-yellow-800 font-semibold">
                      "Campeão de não pagar desde 2024"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estatísticas da Semana */}
        <div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-4 border-black">
            <h3 className="text-2xl font-black text-blue-600 mb-6">
              📊 Estatísticas da Semana
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-2 border-red-200">
                <span className="font-bold text-red-800">Dívidas criadas</span>
                <span className="text-2xl font-black text-red-600">{stats?.debtsCreated}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                <span className="font-bold text-green-800">Pagamentos realizados</span>
                <span className="text-2xl font-black text-green-600">{stats?.paymentsMade}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <span className="font-bold text-blue-800">Eventos marcados</span>
                <span className="text-2xl font-black text-blue-600">{stats?.eventsCreated}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border-2 border-orange-200">
                <span className="font-bold text-orange-800">Novos caloteiros</span>
                <span className="text-2xl font-black text-orange-600">{stats?.newCaloteiros}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed de Ações Recentes */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-4 border-black">
        <h3 className="text-2xl font-black text-purple-600 mb-6">
          🔥 Feed de Ações Recentes
        </h3>
        
        <div className="space-y-4">
          {activityFeed.map((activity) => (
            <div
              key={activity.id}
              className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                  {activity.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{activity.message}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(activity.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
