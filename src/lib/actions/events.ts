'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import {
  createEvent,
  getUpcomingEvents,
  getPastEvents,
  addEventReaction,
  removeEventReaction,
  getEventById,
  addEventComment,
  getAllUsers,
  getUser,
  getAllEvents,
  deleteEvent,
} from '../firestore-server';
import { uploadPhotoAction } from './upload';
import { createNotification } from '../firestore-server';
import { Event } from '@/types';

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

export async function getEventsAction(): Promise<{
  success: boolean;
  upcoming?: Event[];
  flashbacks?: Event[];
  error?: string;
}> {
  try {
    await getAuthenticatedUser();
    const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()]);

    return {
      success: true,
      upcoming,
      flashbacks: past,
    };
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return {
      success: false,
      error: 'Erro interno do servidor',
    };
  }
}

export async function createEventAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();

    const title = (formData.get('title') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    const location = (formData.get('location') as string)?.trim();
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const photoFiles = formData.getAll('photos') as File[];

    if (!title) {
      return { error: 'Título é obrigatório' };
    }
    if (!location) {
      return { error: 'Local é obrigatório' };
    }
    if (!date) {
      return { error: 'Data é obrigatória' };
    }
    if (!time) {
      return { error: 'Horário é obrigatório' };
    }

    const eventDate = new Date(`${date}T${time}`);
    if (Number.isNaN(eventDate.getTime())) {
      return { error: 'Data ou hora inválida' };
    }

    const photos: string[] = [];
    for (const photo of photoFiles) {
      if (!photo || photo.size === 0) {
        continue;
      }
      if (!photo.type.startsWith('image/')) {
        return { error: 'Apenas imagens são permitidas como foto' };
      }
      if (photo.size > 5 * 1024 * 1024) {
        return { error: 'Fotos devem ter no máximo 5MB' };
      }
      try {
        const uploadData = new FormData();
        uploadData.append('photo', photo);
        const uploadResult = await uploadPhotoAction(uploadData);
        if (uploadResult.error) {
          return { error: uploadResult.error };
        }
        if (uploadResult.photoURL) {
          photos.push(uploadResult.photoURL);
        }
      } catch (error) {
        console.error('Erro ao enviar foto do evento:', error);
        return { error: 'Erro ao enviar foto do evento' };
      }
    }

    const creator = await getUser(user.userId);

    const eventId = await createEvent({
      title,
      description: description ?? '',
      location,
      date: eventDate,
      time,
      createdBy: user.userId,
      createdByUsername: creator?.username ?? user.username,
      createdByName: creator?.name,
      photos,
      videos: [],
    });

    // Notificar todo mundo (exceto criador)
    const users = await getAllUsers();
    const recipients = users.filter((u) => u.id !== user.userId);

    await Promise.all(
      recipients.map((recipient) =>
        createNotification({
          userId: recipient.id,
          type: 'event_created',
          title: 'Novo rolê criado',
          message: `${creator?.username ?? user.username} marcou "${title}" em ${location} para ${eventDate.toLocaleDateString(
            'pt-BR',
          )} às ${time}`,
          read: false,
          createdAt: new Date(),
        }),
      ),
    );

    return {
      success: true,
      eventId,
      message: 'Rolê criado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function toggleEventReactionAction(eventId: string, reaction: string) {
  try {
    const user = await getAuthenticatedUser();

    const event = await getEventById(eventId);
    if (!event) {
      return { error: 'Evento não encontrado' };
    }

    const hasReaction = event.reactions.some(
      (item) => item.userId === user.userId && item.reaction === reaction,
    );

    if (hasReaction) {
      await removeEventReaction(eventId, user.userId, reaction);
      return { success: true, removed: true };
    }

    await addEventReaction(eventId, {
      userId: user.userId,
      reaction,
      username: user.username,
    });

    if (event.createdBy !== user.userId) {
      await createNotification({
        userId: event.createdBy,
        type: 'event_reaction',
        title: 'Reação no seu rolê',
        message: `${user.username} reagiu com "${reaction}" no evento ${event.title}`,
        read: false,
        createdAt: new Date(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao reagir ao evento:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function addEventCommentAction(eventId: string, content: string) {
  try {
    const user = await getAuthenticatedUser();
    const sanitized = content.trim();
    if (!sanitized) {
      return { error: 'Comentário não pode ser vazio' };
    }

    const event = await getEventById(eventId);
    if (!event) {
      return { error: 'Evento não encontrado' };
    }

    const newComment = await addEventComment(eventId, {
      userId: user.userId,
      content: sanitized,
      username: user.username,
    });

    if (event.createdBy !== user.userId) {
      await createNotification({
        userId: event.createdBy,
        type: 'event_comment',
        title: 'Comentário no rolê',
        message: `${user.username} comentou no evento ${event.title}`,
        read: false,
        createdAt: new Date(),
      });
    }

    return {
      success: true,
      comment: newComment,
    };
  } catch (error) {
    console.error('Erro ao comentar no evento:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function getEventsSummaryAction(): Promise<{
  success: boolean;
  events?: { id: string; title: string; date?: Date; time?: string }[];
  error?: string;
}> {
  try {
    await getAuthenticatedUser();
    const events = await getAllEvents();
    return {
      success: true,
      events: events.map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
      })),
    };
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}

export async function deleteEventAction(eventId: string) {
  try {
    const user = await getAuthenticatedUser();
    const event = await getEventById(eventId);

    if (!event) {
      return { error: 'Rolê não encontrado' };
    }

    if (event.createdBy !== user.userId && user.role !== 'admin') {
      return { error: 'Você não tem permissão para apagar este rolê' };
    }

    await deleteEvent(eventId);

    return { success: true };
  } catch (error) {
    console.error('Erro ao apagar rolê:', error);
    return { error: 'Erro interno do servidor' };
  }
}


