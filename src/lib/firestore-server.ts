import { db } from './firebase-server';
import {
  User,
  Debt,
  Notification,
  Event,
  EventReaction,
  EventComment,
  MediaItem,
  MediaComment,
  MediaReaction,
} from '@/types';

// Check if Firebase is initialized
const checkFirebase = () => {
  if (!db) {
    throw new Error('Firebase não está configurado. Verifique as variáveis de ambiente.');
  }
};

// Collections
const USERS_COLLECTION = 'users';
const DEBTS_COLLECTION = 'debts';
const NOTIFICATIONS_COLLECTION = 'notifications';
const EVENTS_COLLECTION = 'events';
const MEDIA_COLLECTION = 'media';

// User operations
export const createUser = async (userData: Omit<User, 'id'>): Promise<string> => {
  checkFirebase();
  const docRef = await db.collection(USERS_COLLECTION).add({
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
};

export const getUser = async (id: string): Promise<User | null> => {
  checkFirebase();
  const doc = await db.collection(USERS_COLLECTION).doc(id).get();
  
  if (doc.exists) {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      forcePasswordReset: data?.forcePasswordReset ?? false,
      skipCurrentPassword: data?.skipCurrentPassword ?? false,
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as User;
  }
  return null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  checkFirebase();
  const doc = await db.collection(USERS_COLLECTION).doc(id).get();
  
  if (doc.exists) {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      forcePasswordReset: data?.forcePasswordReset ?? false,
      skipCurrentPassword: data?.skipCurrentPassword ?? false,
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as User;
  }
  return null;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  checkFirebase();
  const querySnapshot = await db.collection(USERS_COLLECTION)
    .where('username', '==', username.toLowerCase())
    .get();
  
  if (!querySnapshot.empty) {
    const doc: any = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as User;
  }
  return null;
};

export const getAllUsers = async (): Promise<User[]> => {
  checkFirebase();
  const querySnapshot = await db.collection(USERS_COLLECTION).get();
  return querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      forcePasswordReset: data?.forcePasswordReset ?? false,
      skipCurrentPassword: data?.skipCurrentPassword ?? false,
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as User;
  });
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<void> => {
  checkFirebase();
  await db.collection(USERS_COLLECTION).doc(id).update({
    ...userData,
    updatedAt: new Date(),
  });
};

// Debt operations
export const createDebt = async (debtData: Omit<Debt, 'id'>): Promise<string> => {
  checkFirebase();
  const docRef = await db.collection(DEBTS_COLLECTION).add({
    ...debtData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
};

export const getDebt = async (id: string): Promise<Debt | null> => {
  checkFirebase();
  const doc = await db.collection(DEBTS_COLLECTION).doc(id).get();
  
  if (doc.exists) {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data?.dueDate.toDate(),
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as Debt;
  }
  return null;
};

export const getAllDebts = async (): Promise<Debt[]> => {
  checkFirebase();
  const querySnapshot = await db.collection(DEBTS_COLLECTION).get();
  return querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data?.dueDate.toDate(),
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as Debt;
  });
};

export const getOpenDebts = async (): Promise<Debt[]> => {
  checkFirebase();
  const querySnapshot = await db.collection(DEBTS_COLLECTION)
    .where('status', '==', 'OPEN')
    .orderBy('dueDate', 'asc')
    .get();
  
  return querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data?.dueDate.toDate(),
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as Debt;
  });
};

export const getPaidDebts = async (): Promise<Debt[]> => {
  checkFirebase();
  const querySnapshot = await db.collection(DEBTS_COLLECTION)
    .where('status', '==', 'PAID')
    .orderBy('updatedAt', 'desc')
    .get();

  
  return querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data?.dueDate.toDate(),
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as Debt;
  });
};

export const updateDebt = async (id: string, debtData: Partial<Debt>): Promise<void> => {
  checkFirebase();
  await db.collection(DEBTS_COLLECTION).doc(id).update({
    ...debtData,
    updatedAt: new Date(),
  });
};

export const deleteDebt = async (id: string): Promise<void> => {
  checkFirebase();
  await db.collection(DEBTS_COLLECTION).doc(id).delete();
};

// Notification operations
export const createNotification = async (notificationData: Omit<Notification, 'id'>): Promise<string> => {
  checkFirebase();
  const docRef = await db.collection(NOTIFICATIONS_COLLECTION).add({
    ...notificationData,
    createdAt: notificationData.createdAt ?? new Date(),
    updatedAt: new Date(),
    read: notificationData.read ?? false,
  });
  return docRef.id;
};

export const getNotificationsByUser = async (userId: string): Promise<Notification[]> => {
  checkFirebase();
  const querySnapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data?.updatedAt?.toDate?.(),
    } as Notification;
  });
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  checkFirebase();
  await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).update({
    read: true,
    updatedAt: new Date(),
  });
};

export const getNotificationById = async (notificationId: string): Promise<Notification | null> => {
  checkFirebase();
  const doc = await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data?.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data?.updatedAt?.toDate?.(),
  } as Notification;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  checkFirebase();
  const snapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc: any) => {
    batch.update(doc.ref, {
      read: true,
      updatedAt: new Date(),
    });
  });

  await batch.commit();
};

// Event operations
const mapEventDoc = (doc: any): Event => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    description: data.description ?? '',
    location: data.location ?? '',
    date: data.date?.toDate?.() ?? new Date(),
    time: data.time ?? '',
    createdBy: data.createdBy,
    createdByUsername: data.createdByUsername,
    createdByName: data.createdByName,
    photos: data.photos ?? [],
    videos: data.videos ?? [],
    comments: (data.comments ?? []).map((comment: any) => ({
      ...comment,
      createdAt: comment?.createdAt?.toDate?.() ?? new Date(),
    })) as EventComment[],
    reactions: (data.reactions ?? []).map((reaction: any) => ({
      ...reaction,
      createdAt: reaction?.createdAt?.toDate?.() ?? new Date(),
    })) as EventReaction[],
    createdAt: data?.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data?.updatedAt?.toDate?.() ?? new Date(),
  };
};

export const createEvent = async (
  eventData: Omit<Event, 'id' | 'comments' | 'reactions' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  checkFirebase();
  const docRef = await db.collection(EVENTS_COLLECTION).add({
    ...eventData,
    comments: [],
    reactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
};

export const getEventById = async (eventId: string): Promise<Event | null> => {
  checkFirebase();
  const doc = await db.collection(EVENTS_COLLECTION).doc(eventId).get();
  if (!doc.exists) {
    return null;
  }
  return mapEventDoc(doc);
};

export const getUpcomingEvents = async (): Promise<Event[]> => {
  checkFirebase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const querySnapshot = await db
    .collection(EVENTS_COLLECTION)
    .where('date', '>=', today)
    .orderBy('date', 'asc')
    .limit(20)
    .get();

  return querySnapshot.docs.map(mapEventDoc);
};

export const getPastEvents = async (limit = 20): Promise<Event[]> => {
  checkFirebase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const querySnapshot = await db
    .collection(EVENTS_COLLECTION)
    .where('date', '<', today)
    .orderBy('date', 'desc')
    .limit(limit)
    .get();

  return querySnapshot.docs.map(mapEventDoc);
};

export const getAllEvents = async (): Promise<Event[]> => {
  checkFirebase();
  const querySnapshot = await db.collection(EVENTS_COLLECTION).orderBy('date', 'desc').get();
  return querySnapshot.docs.map(mapEventDoc);
};

export const addEventReaction = async (
  eventId: string,
  reaction: Omit<EventReaction, 'id' | 'createdAt'>,
): Promise<void> => {
  checkFirebase();
  const docRef = db.collection(EVENTS_COLLECTION).doc(eventId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('Evento não encontrado');
  }

  const eventData = mapEventDoc(snapshot);
  const existing = eventData.reactions.find(
    (item) => item.userId === reaction.userId && item.reaction === reaction.reaction,
  );

  if (existing) {
    return;
  }

  const newReaction: EventReaction = {
    id: docRef.collection('reactions').doc().id,
    userId: reaction.userId,
    reaction: reaction.reaction,
    username: reaction.username,
    createdAt: new Date(),
  };

  await docRef.update({
    reactions: [...eventData.reactions, newReaction],
    updatedAt: new Date(),
  });
};

export const removeEventReaction = async (
  eventId: string,
  userId: string,
  reaction: string,
): Promise<void> => {
  checkFirebase();
  const docRef = db.collection(EVENTS_COLLECTION).doc(eventId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('Evento não encontrado');
  }

  const eventData = mapEventDoc(snapshot);
  const updated = eventData.reactions.filter(
    (item) => !(item.userId === userId && item.reaction === reaction),
  );

  await docRef.update({
    reactions: updated,
    updatedAt: new Date(),
  });
};

export const addEventComment = async (
  eventId: string,
  comment: Omit<EventComment, 'id' | 'createdAt'>,
): Promise<EventComment> => {
  checkFirebase();
  const docRef = db.collection(EVENTS_COLLECTION).doc(eventId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('Evento não encontrado');
  }

  const eventData = mapEventDoc(snapshot);
  const newComment: EventComment = {
    id: docRef.collection('comments').doc().id,
    userId: comment.userId,
    content: comment.content,
    username: comment.username,
    createdAt: new Date(),
  };

  await docRef.update({
    comments: [...eventData.comments, newComment],
    updatedAt: new Date(),
  });

  return newComment;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  checkFirebase();
  await db.collection(EVENTS_COLLECTION).doc(eventId).delete();
};

const mapMediaDoc = (doc: any): MediaItem => {
  const data = doc.data();
  return {
    id: doc.id,
    url: data.url,
    type: data.type,
    eventId: data.eventId ?? undefined,
    eventTitle: data.eventTitle ?? undefined,
    uploadedBy: data.uploadedBy,
    uploadedByName: data.uploadedByName,
    uploadedByUsername: data.uploadedByUsername,
    description: data.description,
    storagePath: data.storagePath,
    createdAt: data?.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data?.updatedAt?.toDate?.(),
    comments: (data.comments ?? []).map((comment: any) => ({
      ...comment,
      createdAt: comment?.createdAt?.toDate?.() ?? new Date(),
    })),
    reactions: (data.reactions ?? []).map((reaction: any) => ({
      ...reaction,
      createdAt: reaction?.createdAt?.toDate?.() ?? new Date(),
    })),
  } as MediaItem;
};

export const createMediaItem = async (
  mediaData: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'> & {
    createdAt?: Date;
    comments?: MediaComment[];
    reactions?: MediaReaction[];
  },
): Promise<string> => {
  checkFirebase();
  const docRef = await db.collection(MEDIA_COLLECTION).add({
    ...mediaData,
    createdAt: mediaData.createdAt ?? new Date(),
    updatedAt: new Date(),
    comments: mediaData.comments ?? [],
    reactions: mediaData.reactions ?? [],
  });
  return docRef.id;
};

export const getMediaItem = async (mediaId: string): Promise<MediaItem | null> => {
  checkFirebase();
  const doc = await db.collection(MEDIA_COLLECTION).doc(mediaId).get();
  if (!doc.exists) {
    return null;
  }
  return mapMediaDoc(doc);
};

export const getMediaItems = async (): Promise<MediaItem[]> => {
  checkFirebase();
  const querySnapshot = await db
    .collection(MEDIA_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();

  return querySnapshot.docs.map(mapMediaDoc);
};

export const getMediaItemsByEvent = async (eventId: string): Promise<MediaItem[]> => {
  checkFirebase();
  const querySnapshot = await db
    .collection(MEDIA_COLLECTION)
    .where('eventId', '==', eventId)
    .orderBy('createdAt', 'desc')
    .get();

  return querySnapshot.docs.map(mapMediaDoc);
};

export const deleteMediaItem = async (mediaId: string): Promise<void> => {
  checkFirebase();
  await db.collection(MEDIA_COLLECTION).doc(mediaId).delete();
};

export const addMediaComment = async (
  mediaId: string,
  comment: Omit<MediaComment, 'id' | 'createdAt'>,
): Promise<MediaComment> => {
  checkFirebase();
  const docRef = db.collection(MEDIA_COLLECTION).doc(mediaId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('Mídia não encontrada');
  }

  const media = mapMediaDoc(snapshot);
  const newComment: MediaComment = {
    id: docRef.collection('comments').doc().id,
    userId: comment.userId,
    username: comment.username,
    content: comment.content,
    createdAt: new Date(),
  };

  await docRef.update({
    comments: [...media.comments, newComment],
    updatedAt: new Date(),
  });

  return newComment;
};

export const toggleMediaReaction = async (
  mediaId: string,
  reaction: { userId: string; username?: string; reaction: string },
): Promise<{ added: boolean; updatedReactions: MediaReaction[] }> => {
  checkFirebase();
  const docRef = db.collection(MEDIA_COLLECTION).doc(mediaId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('Mídia não encontrada');
  }

  const media = mapMediaDoc(snapshot);
  const existingIndex = media.reactions.findIndex(
    (item) =>
      item.userId === reaction.userId &&
      item.reaction === reaction.reaction,
  );

  let updatedReactions: MediaReaction[];
  let added = true;

  if (existingIndex >= 0) {
    updatedReactions = media.reactions.filter(
      (_, index) => index !== existingIndex,
    );
    added = false;
  } else {
    const newReaction: MediaReaction = {
      id: docRef.collection('reactions').doc().id,
      userId: reaction.userId,
      username: reaction.username,
      reaction: reaction.reaction,
      createdAt: new Date(),
    };
    updatedReactions = [...media.reactions, newReaction];
  }

  await docRef.update({
    reactions: updatedReactions,
    updatedAt: new Date(),
  });

  return { added, updatedReactions };
};
