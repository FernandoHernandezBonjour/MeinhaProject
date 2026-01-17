'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppNotification } from '@/types';
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/lib/actions/notifications';

export const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNotificationsAction();
      if (!response.success || !response.notifications) {
        setError(response.error ?? 'Erro ao carregar notificações');
        return;
      }

      const parsed = response.notifications.map((n: AppNotification) => ({
        ...n,
        createdAt:
          n.createdAt instanceof Date
            ? n.createdAt
            : new Date(n.createdAt),
        updatedAt:
          n.updatedAt instanceof Date || n.updatedAt === undefined
            ? n.updatedAt
            : new Date(n.updatedAt),
      }));

      setNotifications(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener('notifications:refresh', handler);
    return () => window.removeEventListener('notifications:refresh', handler);
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'debt_paid': return '💰';
      case 'debt_created': return '💸';
      case 'debt_updated': return '✏️';
      case 'debt_deleted': return '🗑️';
      case 'event_created': return '🎉';
      case 'event_reaction': return '😂';
      case 'event_comment': return '💬';
      case 'media_uploaded': return '📸';
      case 'media_comment': return '💬';
      case 'media_reaction': return '😂';
      case 'forum_post': return '💬';
      case 'debt_overdue': return '⚠️';
      default: return '🔔';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationReadAction(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar notificação');
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar notificações');
    }
  };

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-3 bg-white rounded-xl border-2 border-black shadow-lg hover:shadow-xl transition-all"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {showNotifications && (
        <div className="absolute right-0 top-16 w-80 bg-white rounded-2xl shadow-2xl border-4 border-black z-50">
          <div className="p-4 border-b-2 border-gray-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Notificações</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-bold"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500 font-bold">Carregando...</div>
            ) : error ? (
              <div className="p-6 text-center text-red-600 font-bold">❌ {error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">😴</div>
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      n.read 
                        ? 'bg-gray-50 hover:bg-gray-100' 
                        : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">
                        {getNotificationIcon(n.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${
                          n.read ? 'text-gray-600' : 'text-gray-800'
                        }`}>
                          {n.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {n.createdAt.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

