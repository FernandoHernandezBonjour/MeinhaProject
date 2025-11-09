'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import {
  createMediaItem,
  deleteMediaItem,
  getMediaItem,
  getMediaItems,
  getAllEvents,
  getUser,
  getEventById,
  createNotification,
  addMediaComment,
  toggleMediaReaction,
} from '../firestore-server';
import { storage } from '../firebase-server';
import { MediaItem } from '@/types';

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

export async function getMediaContextAction(): Promise<{
  success: boolean;
  media?: MediaItem[];
  events?: { id: string; title: string; date?: Date; time?: string }[];
  error?: string;
}> {
  try {
    await getAuthenticatedUser();
    const [media, events] = await Promise.all([getMediaItems(), getAllEvents()]);

    return {
      success: true,
      media,
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
      })),
    };
  } catch (error) {
    console.error('Erro ao buscar biblioteca de mídia:', error);
    return {
      success: false,
      error: 'Erro interno do servidor',
    };
  }
}

export async function uploadMediaAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const file = formData.get('media') as File;
    const eventId = (formData.get('eventId') as string) || null;
    const description = (formData.get('description') as string)?.trim() ?? '';

    if (!file) {
      return { error: 'Nenhum arquivo foi enviado' };
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return { error: 'Envie apenas fotos ou vídeos' };
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
      return { error: 'Fotos devem ter no máximo 5 MB' };
    }

    if (isVideo && file.size > 50 * 1024 * 1024) {
      return { error: 'Vídeos devem ter no máximo 50 MB' };
    }

    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET ||
      storage?.app?.options?.storageBucket ||
      (process.env.FIREBASE_PROJECT_ID
        ? `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
        : undefined);

    if (!bucketName) {
      console.error('Bucket do Firebase Storage não configurado');
      return { error: 'Serviço de armazenamento não configurado' };
    }

    const bucket = storage.bucket(bucketName);
    const bytes = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/\s+/g, '_');
    const storagePath = `media/${user.userId}/${timestamp}_${sanitizedName}`;
    const fileRef = bucket.file(storagePath);

    await fileRef.save(bytes, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: user.userId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    await fileRef.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    const uploader = await getUser(user.userId);
    const event = eventId ? await getEventById(eventId) : null;

    const mediaId = await createMediaItem({
      url,
      type: isImage ? 'photo' : 'video',
      eventId: eventId ?? undefined,
      eventTitle: event?.title,
      uploadedBy: user.userId,
      uploadedByName: uploader?.name ?? null,
      uploadedByUsername: uploader?.username ?? user.username,
      description: description || null,
      storagePath,
      comments: [],
      reactions: [],
    });

    if (event && event.createdBy !== user.userId) {
      await createNotification({
        userId: event.createdBy,
        type: 'media_uploaded',
        title: 'Nova mídia no seu rolê',
        message: `${uploader?.username ?? user.username} adicionou uma ${
          isImage ? 'foto' : 'vídeo'
        } em "${event.title}".`,
        read: false,
        createdAt: new Date(),
      });
    }

    return {
      success: true,
      mediaId,
      url,
    };
  } catch (error) {
    console.error('Erro ao enviar mídia:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function deleteMediaAction(mediaId: string) {
  try {
    const user = await getAuthenticatedUser();
    const media = await getMediaItem(mediaId);

    if (!media) {
      return { error: 'Mídia não encontrada' };
    }

    if (media.uploadedBy !== user.userId && user.role !== 'admin') {
      return { error: 'Você não tem permissão para remover esta mídia' };
    }

    if (media.storagePath) {
      try {
        const bucketName =
          process.env.FIREBASE_STORAGE_BUCKET ||
          storage?.app?.options?.storageBucket ||
          (process.env.FIREBASE_PROJECT_ID
            ? `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
            : undefined);
        if (bucketName) {
          const bucket = storage.bucket(bucketName);
          await bucket.file(media.storagePath).delete({ ignoreNotFound: true });
        }
      } catch (err) {
        console.error('Erro ao remover arquivo do storage:', err);
      }
    }

    await deleteMediaItem(mediaId);

    return { success: true };
  } catch (error) {
    console.error('Erro ao remover mídia:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function addMediaCommentAction(mediaId: string, content: string) {
  try {
    const user = await getAuthenticatedUser();
    const message = content.trim();

    if (!message) {
      return { error: 'Comentário não pode ser vazio' };
    }

    const media = await getMediaItem(mediaId);
    if (!media) {
      return { error: 'Mídia não encontrada' };
    }

    const newComment = await addMediaComment(mediaId, {
      userId: user.userId,
      username: user.username,
      content: message,
    });

    if (media.uploadedBy !== user.userId) {
      await createNotification({
        userId: media.uploadedBy,
        type: 'media_comment',
        title: 'Comentário na sua mídia',
        message: `${user.username} comentou: "${message}"`,
        read: false,
        createdAt: new Date(),
      });
    }

    return {
      success: true,
      comment: newComment,
    };
  } catch (error) {
    console.error('Erro ao comentar mídia:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function toggleMediaReactionAction(mediaId: string, emoji: string) {
  try {
    const user = await getAuthenticatedUser();

    const media = await getMediaItem(mediaId);
    if (!media) {
      return { error: 'Mídia não encontrada' };
    }

    const { added, updatedReactions } = await toggleMediaReaction(mediaId, {
      userId: user.userId,
      username: user.username,
      reaction: emoji,
    });

    if (added && media.uploadedBy !== user.userId) {
      await createNotification({
        userId: media.uploadedBy,
        type: 'media_reaction',
        title: 'Nova reação na sua mídia',
        message: `${user.username} reagiu com "${emoji}" na sua mídia`,
        read: false,
        createdAt: new Date(),
      });
    }

    return {
      success: true,
      reactions: updatedReactions,
    };
  } catch (error) {
    console.error('Erro ao reagir mídia:', error);
    return { error: 'Erro interno do servidor' };
  }
}


