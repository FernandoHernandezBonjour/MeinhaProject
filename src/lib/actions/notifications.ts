'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import {
  createNotification,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationById,
} from '../firestore-server';
import { AppNotification } from '@/types';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const payload = verifyToken(token);

  if (!payload) {
    throw new Error('Token inválido');
  }

  return payload;
}

export async function getNotificationsAction(): Promise<{ success: boolean; notifications?: AppNotification[]; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    const notifications = await getNotificationsByUser(user.userId);

    return {
      success: true,
      notifications,
    };
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return {
      success: false,
      error: 'Erro interno do servidor',
    };
  }
}

export async function markNotificationReadAction(notificationId: string) {
  try {
    const user = await getAuthenticatedUser();
    const notification = await getNotificationById(notificationId);

    if (!notification) {
      return { error: 'Notificação não encontrada' };
    }

    if (notification.userId !== user.userId) {
      return { error: 'Você não tem permissão para alterar esta notificação' };
    }

    await markNotificationAsRead(notificationId);

    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const user = await getAuthenticatedUser();
    await markAllNotificationsAsRead(user.userId);
    return { success: true };
  } catch (error) {
    console.error('Erro ao marcar todas notificações como lidas:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function createNotificationAction(notification: Omit<AppNotification, 'id' | 'createdAt'> & { createdAt?: Date }) {
  try {
    await createNotification({
      ...notification,
      createdAt: notification.createdAt ?? new Date(),
      read: notification.read ?? false,
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return { error: 'Erro interno do servidor' };
  }
}


