'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import { 
  createChangelogItem, 
  getChangelogItems, 
  deleteChangelogItem,
  getUser,
  createNotification,
  getAllUsers
} from '../firestore-server';
import { ChangelogItem } from '@/types';
import { revalidatePath } from 'next/cache';

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

export async function getChangelogAction() {
  try {
    const items = await getChangelogItems();
    return { success: true, items };
  } catch (error) {
    console.error('Erro ao buscar changelog:', error);
    return { success: false, error: 'Erro ao buscar atualizações' };
  }
}

export async function createChangelogAction(formData: FormData) {
  try {
    const userPayload = await getAuthenticatedUser();
    const user = await getUser(userPayload.userId);

    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Apenas admins podem lançar atualizações.' };
    }

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const version = formData.get('version') as string;
    const type = formData.get('type') as any;

    if (!title || !content || !type) {
      return { success: false, error: 'Título, conteúdo e tipo são obrigatórios.' };
    }

    const itemData = {
      title,
      content,
      version: version || undefined,
      type,
      authorId: user.id,
      authorUsername: user.username,
    };

    const id = await createChangelogItem(itemData);

    // Notificar todos os usuários
    const allUsers = await getAllUsers();
    await Promise.all(
      allUsers.map(u => createNotification({
        userId: u.id,
        type: 'changelog_added',
        title: '🚀 Nova atualização no site!',
        message: `${title}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        read: false,
        createdAt: new Date(),
      }))
    );

    revalidatePath('/');
    return { success: true, id };
  } catch (error) {
    console.error('Erro ao criar changelog:', error);
    return { success: false, error: 'Erro ao lançar atualização' };
  }
}

export async function deleteChangelogAction(id: string) {
  try {
    const userPayload = await getAuthenticatedUser();
    const user = await getUser(userPayload.userId);

    if (!user || user.role !== 'admin') {
      return { success: false, error: 'Apenas admins podem deletar atualizações.' };
    }

    await deleteChangelogItem(id);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar changelog:', error);
    return { success: false, error: 'Erro ao deletar atualização' };
  }
}
