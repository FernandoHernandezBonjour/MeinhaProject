'use client';

import React, { useEffect, useState } from 'react';
import { Debt, ForumPost, MediaItem, ChangelogItem, Event } from '@/types';
import { getHomeDataAction } from '@/lib/actions/home';
import { UserLink } from './UserLink';

export const HomePage: React.FC = () => {
  const [latestDebts, setLatestDebts] = useState<(Debt & { debtorUsername: string; creditorUsername: string })[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [randomPhoto, setRandomPhoto] = useState<MediaItem | undefined>(undefined);
  const [changelog, setChangelog] = useState<ChangelogItem | undefined>(undefined);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
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
          return;
        }

        setLatestDebts((response.latestDebts as any) ?? []);
        setForumPosts(response.forumPosts ?? []);
        setRandomPhoto(response.randomPhoto);
        setChangelog(response.changelog);
        setUpcomingEvents(
          (response.upcomingEvents ?? []).map((e) => ({
            ...e,
            date: e.date instanceof Date ? e.date : new Date(e.date),
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro inesperado ao carregar os dados.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const navigateTo = (tab: string, params?: any) => {
    const event = new CustomEvent('hub-set-tab', { detail: { tab, ...params } });
    window.dispatchEvent(event);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 font-bold px-4 py-3 rounded-lg">
        ❌ {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          👋 Bem-vindo ao Hub
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Tudo o que está rolando na comunidade em um só lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Debts & Events */}
        <div className="space-y-8">
          {/* Latest Debts */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                💸 Últimas Dívidas
              </h3>
              <button
                onClick={() => navigateTo('financial')}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline focus:outline-none"
              >
                Ver todas
              </button>
            </div>

            {latestDebts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Ninguém deve nada... por enquanto.
              </p>
            ) : (
              <div className="space-y-4">
                {latestDebts.map((debt) => (
                  <div key={debt.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-red-600 dark:text-red-400">
                        R$ {debt.amount.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(debt.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-gray-900 dark:text-white">{debt.debtorUsername}</span> deve para <span className="font-semibold text-gray-900 dark:text-white">{debt.creditorUsername}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                📅 Próximos 7 Dias
              </h3>
              <button
                onClick={() => navigateTo('community')}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline focus:outline-none"
              >
                Ver agenda
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Sem rolês marcados para esta semana. Tédio total.
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex flex-col items-center justify-center text-blue-700 dark:text-blue-300">
                      <span className="text-xs font-bold uppercase">{event.date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                      <span className="text-lg font-black">{event.date.getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{event.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{event.location}</p>
                      <p className="text-xs text-gray-400 mt-1">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center/Right Column: Photo, Forum, Changelog */}
        <div className="lg:col-span-2 space-y-8">

          {/* Photo of the Day */}
          {randomPhoto && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="relative h-64 sm:h-80 w-full group">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${randomPhoto.url})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 bg-blue-600 text-xs font-bold rounded-full uppercase tracking-wider">
                      Foto do Dia
                    </span>
                    <span className="text-xs opacity-75">
                      {new Date(randomPhoto.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {randomPhoto.eventTitle && (
                    <p className="text-sm font-medium opacity-90 mb-1">
                      Do rolê: {randomPhoto.eventTitle}
                    </p>
                  )}
                  {randomPhoto.description && (
                    <p className="text-lg font-bold line-clamp-2">
                      {randomPhoto.description}
                    </p>
                  )}
                  <p className="text-xs mt-2 opacity-75">
                    Enviado por {randomPhoto.uploadedByUsername ?? 'Alguém'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Latest Forum Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  💬 Fórum
                </h3>
                <button
                  onClick={() => navigateTo('community')}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline focus:outline-none"
                >
                  Ver todos
                </button>
              </div>

              {forumPosts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  O fórum está um deserto. Comece uma treta!
                </p>
              ) : (
                <div className="space-y-4">
                  {forumPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => navigateTo('community', { postId: post.id })}
                      className="block w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{post.title}</h4>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{post.category.toUpperCase()}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Changelog Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  🚀 Atualizações
                </h3>
                <button
                  onClick={() => navigateTo('changelog')}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline focus:outline-none"
                >
                  Ver histórico
                </button>
              </div>

              {changelog ? (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded">
                        {changelog.version ?? 'Novo'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(changelog.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">{changelog.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4">
                      {changelog.content}
                    </p>
                  </div>
                  <div className="mt-auto text-center">
                    <p className="text-xs text-gray-400">
                      Dev: {changelog.authorUsername ?? 'System'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Nenhuma atualização recente. O dev tá dormindo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
