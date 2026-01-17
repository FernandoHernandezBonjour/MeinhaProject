'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import { getUser, getUserByUsername, getAllDebts, getAllEvents, getMediaItems } from '../firestore-server';
import { User, Debt, Event, MediaItem } from '@/types';

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

async function requireAdmin() {
  const user = await getAuthenticatedUser();
  
  if (user.role !== 'admin') {
    throw new Error('Apenas administradores podem realizar esta ação');
  }

  return user;
}

interface ProfileComment {
  id: string;
  authorId: string;
  authorUsername?: string;
  authorName?: string;
  content: string;
  createdAt: string; // ISO string para serialização
}

// Buscar comentários do mural do perfil
async function getProfileComments(userId: string): Promise<ProfileComment[]> {
  try {
    const { db } = await import('../firebase-server');
    
    if (!db) {
      console.error('Firebase não está configurado');
      return [];
    }
    
    // Tentar buscar com orderBy, se falhar, buscar sem orderBy
    let querySnapshot;
    try {
      querySnapshot = await db.collection('profile_comments')
        .where('targetUserId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
    } catch (orderByError) {
      // Se orderBy falhar (índice não criado), buscar sem orderBy
      querySnapshot = await db.collection('profile_comments')
        .where('targetUserId', '==', userId)
        .get();
    }

    const comments: ProfileComment[] = [];
    console.log(`Encontrados ${querySnapshot.docs.length} comentários no Firestore`);
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      console.log('Processando comentário:', { id: doc.id, data });
      let author = null;
      
      try {
        author = await getUser(data.authorId);
      } catch (err) {
        console.error(`Erro ao buscar autor ${data.authorId}:`, err);
      }
      
      let createdAtDate: Date;
      if (data.createdAt?.toDate) {
        createdAtDate = data.createdAt.toDate();
      } else if (data.createdAt instanceof Date) {
        createdAtDate = data.createdAt;
      } else if (data.createdAt) {
        createdAtDate = new Date(data.createdAt);
      } else {
        createdAtDate = new Date();
      }
      
      comments.push({
        id: doc.id,
        authorId: data.authorId,
        authorUsername: author?.username,
        authorName: author?.name,
        content: data.content || '',
        createdAt: createdAtDate.toISOString(),
      });
    }
    
    console.log('Comentários processados:', comments.length);
    
    // Ordenar manualmente se não usou orderBy
    comments.sort((a: ProfileComment, b: ProfileComment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return comments;
  } catch (error) {
    console.error('Erro ao buscar comentários do perfil:', error);
    // Retornar array vazio em caso de erro
    return [];
  }
}

export async function getUserProfileAction(username?: string, userId?: string) {
  try {
    // Não precisa estar autenticado para ver perfil público
    let targetUser: User | null = null;

    if (userId) {
      targetUser = await getUser(userId);
    } else if (username) {
      targetUser = await getUserByUsername(username);
    } else {
      return { error: 'Username ou userId é obrigatório' };
    }

    if (!targetUser) {
      return { error: 'Usuário não encontrado' };
    }

    // Buscar dívidas
    let userDebts: Debt[] = [];
    try {
      const allDebts = await getAllDebts();
      userDebts = allDebts.filter(
        (debt) => debt.debtorId === targetUser!.id || debt.creditorId === targetUser!.id
      );
    } catch (err) {
      console.error('Erro ao buscar dívidas:', err);
      // Continuar sem dívidas
    }

    // Buscar eventos
    let allEvents: Event[] = [];
    try {
      allEvents = await getAllEvents();
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
      // Continuar sem eventos
    }
    
    // Buscar comentários e reações em eventos
    const eventComments: Array<{
      id: string;
      userId: string;
      username?: string;
      content: string;
      createdAt: string; // ISO string para serialização
      eventId: string;
      eventTitle: string;
    }> = [];
    
    const eventReactions: Array<{
      id: string;
      userId: string;
      username?: string;
      reaction: string;
      createdAt: string; // ISO string para serialização
      eventId: string;
      eventTitle: string;
    }> = [];

    for (const event of allEvents) {
      if (!event || !event.id) continue;
      
      // Comentários
      for (const comment of event.comments || []) {
        if (comment && comment.userId === targetUser.id) {
          const commentDate = comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt);
          eventComments.push({
            id: comment.id || '',
            userId: comment.userId,
            username: comment.username,
            content: comment.content || '',
            createdAt: commentDate.toISOString(),
            eventId: event.id,
            eventTitle: event.title || 'Evento sem título',
          });
        }
      }
      
      // Reações
      for (const reaction of event.reactions || []) {
        if (reaction && reaction.userId === targetUser.id) {
          const reactionDate = reaction.createdAt instanceof Date ? reaction.createdAt : new Date(reaction.createdAt);
          eventReactions.push({
            id: reaction.id || '',
            userId: reaction.userId,
            username: reaction.username,
            reaction: reaction.reaction || '',
            createdAt: reactionDate.toISOString(),
            eventId: event.id,
            eventTitle: event.title || 'Evento sem título',
          });
        }
      }
    }

    // Buscar mídias
    let allMedia: MediaItem[] = [];
    try {
      allMedia = await getMediaItems();
    } catch (err) {
      console.error('Erro ao buscar mídias:', err);
      // Continuar sem mídias
    }
    
    // Buscar comentários e reações em mídias
    const mediaComments: Array<{
      id: string;
      userId: string;
      username?: string;
      content: string;
      createdAt: string; // ISO string para serialização
      mediaId: string;
      mediaUrl: string;
    }> = [];
    
    const mediaReactions: Array<{
      id: string;
      userId: string;
      username?: string;
      reaction: string;
      createdAt: string; // ISO string para serialização
      mediaId: string;
      mediaUrl: string;
    }> = [];

    for (const media of allMedia) {
      if (!media || !media.id) continue;
      
      // Comentários
      for (const comment of media.comments || []) {
        if (comment && comment.userId === targetUser.id) {
          const mediaCommentDate = comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt);
          mediaComments.push({
            id: comment.id || '',
            userId: comment.userId,
            username: comment.username,
            content: comment.content || '',
            createdAt: mediaCommentDate.toISOString(),
            mediaId: media.id,
            mediaUrl: media.url || '',
          });
        }
      }
      
      // Reações
      for (const reaction of media.reactions || []) {
        if (reaction && reaction.userId === targetUser.id) {
          const mediaReactionDate = reaction.createdAt instanceof Date ? reaction.createdAt : new Date(reaction.createdAt);
          mediaReactions.push({
            id: reaction.id || '',
            userId: reaction.userId,
            username: reaction.username,
            reaction: reaction.reaction || '',
            createdAt: mediaReactionDate.toISOString(),
            mediaId: media.id,
            mediaUrl: media.url || '',
          });
        }
      }
    }

    // Buscar comentários do mural
    let profileComments: ProfileComment[] = [];
    try {
      console.log('Buscando comentários do mural para usuário:', targetUser.id);
      profileComments = await getProfileComments(targetUser.id);
      console.log('Comentários encontrados:', profileComments.length);
    } catch (err) {
      console.error('Erro ao buscar comentários do mural:', err);
      // Continuar sem comentários do mural
    }

           // Converter datas do User para strings ISO - criar objeto novo sem spread
           const serializedUser = {
             id: targetUser.id,
             username: targetUser.username,
             email: targetUser.email,
             name: targetUser.name,
             pixKey: targetUser.pixKey,
             phone: targetUser.phone,
             steamProfile: targetUser.steamProfile,
             photoURL: targetUser.photoURL,
             role: targetUser.role,
             passwordChanged: targetUser.passwordChanged,
             hashedPassword: targetUser.hashedPassword,
             forcePasswordReset: targetUser.forcePasswordReset,
             skipCurrentPassword: targetUser.skipCurrentPassword,
             createdAt: targetUser.createdAt instanceof Date ? targetUser.createdAt.toISOString() : (targetUser.createdAt ? String(targetUser.createdAt) : new Date().toISOString()),
             updatedAt: targetUser.updatedAt instanceof Date ? targetUser.updatedAt.toISOString() : (targetUser.updatedAt ? String(targetUser.updatedAt) : new Date().toISOString()),
           };

    // Converter datas das dívidas para strings ISO - criar objetos novos sem spread
    const serializedDebts = userDebts.map(debt => ({
      id: debt.id,
      creditorId: debt.creditorId,
      debtorId: debt.debtorId,
      amount: debt.amount,
      originalAmount: debt.originalAmount,
      paidAmount: debt.paidAmount,
      remainingAmount: debt.remainingAmount,
      totalPaidInChain: debt.totalPaidInChain,
      chainId: debt.chainId,
      parentDebtId: debt.parentDebtId,
      wasPartialPayment: debt.wasPartialPayment,
      dueDate: debt.dueDate instanceof Date ? debt.dueDate.toISOString() : (debt.dueDate ? String(debt.dueDate) : new Date().toISOString()),
      status: debt.status,
      attachment: debt.attachment,
      description: debt.description,
      createdAt: debt.createdAt instanceof Date ? debt.createdAt.toISOString() : (debt.createdAt ? String(debt.createdAt) : new Date().toISOString()),
      updatedAt: debt.updatedAt instanceof Date ? debt.updatedAt.toISOString() : (debt.updatedAt ? String(debt.updatedAt) : new Date().toISOString()),
    }));

    return {
      success: true,
      data: {
        user: serializedUser,
        debts: serializedDebts,
        eventComments,
        eventReactions,
        mediaComments,
        mediaReactions,
        profileComments,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { error: `Erro interno do servidor: ${errorMessage}` };
  }
}

export async function deleteProfileCommentAction(commentId: string) {
  try {
    await requireAdmin();

    if (!commentId) {
      return { error: 'ID do comentário é obrigatório' };
    }

    const { db } = await import('../firebase-server');
    
    if (!db) {
      return { error: 'Firebase não está configurado. Verifique as variáveis de ambiente.' };
    }

    // Verificar se o comentário existe
    const commentDoc = await db.collection('profile_comments').doc(commentId).get();
    if (!commentDoc.exists) {
      return { error: 'Comentário não encontrado' };
    }

    // Deletar comentário
    await db.collection('profile_comments').doc(commentId).delete();

    return {
      success: true,
      message: 'Comentário removido com sucesso',
    };
  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    if (errorMessage.includes('administradores')) {
      return { error: errorMessage };
    }
    
    return { error: `Erro ao deletar comentário: ${errorMessage}` };
  }
}

export async function addProfileCommentAction(targetUserId: string, content: string) {
  try {
    const currentUser = await getAuthenticatedUser();

    if (!content || content.trim() === '') {
      return { error: 'Conteúdo do comentário é obrigatório' };
    }

    if (content.length > 1000) {
      return { error: 'Comentário muito longo (máximo 1000 caracteres)' };
    }

    const { db } = await import('../firebase-server');
    const { Timestamp } = await import('firebase-admin/firestore');
    
    if (!db) {
      return { error: 'Firebase não está configurado. Verifique as variáveis de ambiente.' };
    }

    // Verificar se o usuário alvo existe
    const targetUser = await getUser(targetUserId);
    if (!targetUser) {
      return { error: 'Usuário não encontrado' };
    }

    // Criar comentário com Timestamp do Firestore
    const now = Timestamp.now();
    const commentData = {
      targetUserId,
      authorId: currentUser.userId,
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    };

    console.log('Adicionando comentário ao Firestore:', commentData);
    await db.collection('profile_comments').add(commentData);
    console.log('Comentário adicionado com sucesso ao Firestore');

    return {
      success: true,
      message: 'Comentário adicionado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    if (errorMessage.includes('Token')) {
      return { error: 'Você precisa estar logado para adicionar comentários' };
    }
    
    return { error: `Erro ao adicionar comentário: ${errorMessage}` };
  }
}

