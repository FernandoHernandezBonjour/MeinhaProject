import { db } from './firebase-server';
import {
  User,
  Debt,
  AppNotification,
  Event,
  EventReaction,
  EventComment,
  MediaItem,
  MediaComment,
  MediaReaction,
  ForumPost,
  ForumComment,
  ForumReaction,
  ChangelogItem,
} from '@/types';
import {
  BankAccount,
  CreditCard,
  Transaction,
  Invoice
} from '@/types/financial';

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
const FORUM_POSTS_COLLECTION = 'forum_posts';
const CHANGELOG_COLLECTION = 'changelog';
const BANK_ACCOUNTS_COLLECTION = 'bank_accounts';
const CREDIT_CARDS_COLLECTION = 'credit_cards';
const TRANSACTIONS_COLLECTION = 'transactions';
const INVOICES_COLLECTION = 'invoices';

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
  const dataToUpdate: any = {
    ...userData,
    updatedAt: new Date(),
  };

  Object.keys(dataToUpdate).forEach(key => {
    if (dataToUpdate[key] === undefined) {
      delete dataToUpdate[key];
    }
  });

  await db.collection(USERS_COLLECTION).doc(id).update(dataToUpdate);
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
export const createNotification = async (notificationData: Omit<AppNotification, 'id'>): Promise<string> => {
  checkFirebase();
  const docRef = await db.collection(NOTIFICATIONS_COLLECTION).add({
    ...notificationData,
    createdAt: notificationData.createdAt ?? new Date(),
    updatedAt: new Date(),
    read: notificationData.read ?? false,
  });
  return docRef.id;
};

export const getNotificationsByUser = async (userId: string): Promise<AppNotification[]> => {
  checkFirebase();
  const querySnapshot = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .where('userId', '==', userId)
    .get();

  const notifications = querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data?.updatedAt?.toDate?.(),
    } as AppNotification;
  });

  return notifications.sort((a: AppNotification, b: AppNotification) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  checkFirebase();
  await db.collection(NOTIFICATIONS_COLLECTION).doc(notificationId).update({
    read: true,
    updatedAt: new Date(),
  });
};

export const getNotificationById = async (notificationId: string): Promise<AppNotification | null> => {
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
  } as AppNotification;
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
  const dataToSave: any = {
    ...mediaData,
    createdAt: mediaData.createdAt ?? new Date(),
    updatedAt: new Date(),
    comments: mediaData.comments ?? [],
    reactions: mediaData.reactions ?? [],
  };
  // Remover campos undefined pois o Firestore não aceita valores undefined
  Object.keys(dataToSave).forEach((key) => {
    if (dataToSave[key] === undefined) {
      delete dataToSave[key];
    }
  });

  const docRef = await db.collection(MEDIA_COLLECTION).add(dataToSave);
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
    .get();

  const items = querySnapshot.docs.map(mapMediaDoc);
  return items.sort((a: MediaItem, b: MediaItem) => b.createdAt.getTime() - a.createdAt.getTime());
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

// ============================================
// FORUM OPERATIONS
// ============================================

export const createForumPost = async (postData: Omit<ForumPost, 'id' | 'comments' | 'reactions'>): Promise<string> => {
  checkFirebase();
  const dataToSave: any = {
    ...postData,
    comments: [],
    reactions: [],
    images: postData.images || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Remove undefined values
  Object.keys(dataToSave).forEach(key => {
    if (dataToSave[key] === undefined) {
      delete dataToSave[key];
    }
  });

  const docRef = await db.collection(FORUM_POSTS_COLLECTION).add(dataToSave);
  return docRef.id;
};

export const getAllForumPosts = async (): Promise<ForumPost[]> => {
  checkFirebase();
  const querySnapshot = await db.collection(FORUM_POSTS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get();

  return querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      content: data.content,
      authorId: data.authorId,
      authorUsername: data.authorUsername,
      authorName: data.authorName,
      category: data.category,
      poll: data.poll ? {
        ...data.poll,
        createdAt: data.poll.createdAt?.toDate ? data.poll.createdAt.toDate() : new Date(data.poll.createdAt),
        expiresAt: data.poll.expiresAt?.toDate ? data.poll.expiresAt.toDate() : (data.poll.expiresAt ? new Date(data.poll.expiresAt) : undefined),
      } : undefined,
      images: data.images || [],
      comments: (data.comments || []).map((comment: any) => ({
        ...comment,
        createdAt: comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt),
      })),
      reactions: (data.reactions || []).map((reaction: any) => ({
        ...reaction,
        createdAt: reaction.createdAt?.toDate ? reaction.createdAt.toDate() : new Date(reaction.createdAt),
      })),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as ForumPost;
  });
};

export const getForumPostById = async (postId: string): Promise<ForumPost | null> => {
  checkFirebase();
  const doc = await db.collection(FORUM_POSTS_COLLECTION).doc(postId).get();

  if (doc.exists) {
    const data = doc.data();
    return {
      id: doc.id,
      title: data?.title,
      content: data?.content,
      authorId: data?.authorId,
      authorUsername: data?.authorUsername,
      authorName: data?.authorName,
      category: data?.category,
      poll: data?.poll ? {
        ...data.poll,
        createdAt: data.poll.createdAt?.toDate ? data.poll.createdAt.toDate() : new Date(data.poll.createdAt),
        expiresAt: data.poll.expiresAt?.toDate ? data.poll.expiresAt.toDate() : (data.poll.expiresAt ? new Date(data.poll.expiresAt) : undefined),
      } : undefined,
      images: data?.images || [],
      comments: (data?.comments || []).map((comment: any) => ({
        ...comment,
        createdAt: comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt),
      })),
      reactions: (data?.reactions || []).map((reaction: any) => ({
        ...reaction,
        createdAt: reaction.createdAt?.toDate ? reaction.createdAt.toDate() : new Date(reaction.createdAt),
      })),
      createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as ForumPost;
  }
  return null;
};

export const addForumComment = async (
  postId: string,
  comment: Omit<ForumComment, 'id' | 'createdAt'>
): Promise<ForumComment> => {
  checkFirebase();
  const docRef = db.collection(FORUM_POSTS_COLLECTION).doc(postId);
  const post = await docRef.get();

  if (!post.exists) {
    throw new Error('Post não encontrado');
  }

  const postData = post.data();
  const comments = postData?.comments || [];

  const newComment: ForumComment = {
    id: db.collection('temp').doc().id, // Generate ID
    postId,
    authorId: comment.authorId,
    username: comment.username,
    content: comment.content,
    createdAt: new Date(),
  };

  const updatedComments = [...comments, newComment];

  await docRef.update({
    comments: updatedComments,
    updatedAt: new Date(),
  });

  return newComment;
};

export const toggleForumReaction = async (
  postId: string,
  reaction: Omit<ForumReaction, 'id' | 'createdAt'>
): Promise<{ added: boolean; updatedReactions: ForumReaction[] }> => {
  checkFirebase();
  const docRef = db.collection(FORUM_POSTS_COLLECTION).doc(postId);
  const post = await docRef.get();

  if (!post.exists) {
    throw new Error('Post não encontrado');
  }

  const postData = post.data();
  const reactions = postData?.reactions || [];

  const existingIndex = reactions.findIndex(
    (r: ForumReaction) => r.userId === reaction.userId && r.reaction === reaction.reaction
  );

  let updatedReactions: ForumReaction[];
  let added = true;

  if (existingIndex >= 0) {
    updatedReactions = reactions.filter(
      (_: ForumReaction, index: number) => index !== existingIndex,
    );
    added = false;
  } else {
    const newReaction: ForumReaction = {
      id: db.collection('temp').doc().id,
      postId,
      userId: reaction.userId,
      username: reaction.username,
      reaction: reaction.reaction,
      createdAt: new Date(),
    };
    updatedReactions = [...reactions, newReaction];
  }

  await docRef.update({
    reactions: updatedReactions,
    updatedAt: new Date(),
  });

  return { added, updatedReactions };
};

export const deleteForumPost = async (postId: string): Promise<void> => {
  checkFirebase();
  await db.collection(FORUM_POSTS_COLLECTION).doc(postId).delete();
};

// ============================================
// CHANGELOG OPERATIONS
// ============================================

export const createChangelogItem = async (itemData: Omit<ChangelogItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  checkFirebase();
  const docRef = await db.collection(CHANGELOG_COLLECTION).add({
    ...itemData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
};

export const getChangelogItems = async (limit = 50): Promise<ChangelogItem[]> => {
  checkFirebase();
  const querySnapshot = await db.collection(CHANGELOG_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as ChangelogItem;
  });
};

export const deleteChangelogItem = async (id: string): Promise<void> => {
  checkFirebase();
  await db.collection(CHANGELOG_COLLECTION).doc(id).delete();
};

// ============================================
// FINANCIAL OPERATIONS
// ============================================

// Bank Accounts
export const createBankAccount = async (accountData: Omit<BankAccount, 'id'>): Promise<string> => {
  checkFirebase();
  const docRef = await db.collection(BANK_ACCOUNTS_COLLECTION).add({
    ...accountData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
};

export const getBankAccount = async (id: string): Promise<BankAccount | null> => {
  checkFirebase();
  const doc = await db.collection(BANK_ACCOUNTS_COLLECTION).doc(id).get();
  if (doc.exists) {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as BankAccount;
  }
  return null;
};

export const getBankAccountsByUser = async (userId: string): Promise<BankAccount[]> => {
  checkFirebase();
  const querySnapshot = await db.collection(BANK_ACCOUNTS_COLLECTION)
    .where('userId', '==', userId)
    .get();

  const accounts = querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as BankAccount;
  });

  return accounts.sort((a: BankAccount, b: BankAccount) => a.createdAt.getTime() - b.createdAt.getTime());
};

export const updateBankAccount = async (id: string, accountData: Partial<BankAccount>): Promise<void> => {
  checkFirebase();
  await db.collection(BANK_ACCOUNTS_COLLECTION).doc(id).update({
    ...accountData,
    updatedAt: new Date(),
  });
};

export const deleteBankAccount = async (id: string): Promise<void> => {
  checkFirebase();
  await db.collection(BANK_ACCOUNTS_COLLECTION).doc(id).delete();
};

// Credit Cards
export const createCreditCard = async (cardData: Omit<CreditCard, 'id'>): Promise<string> => {
  checkFirebase();
  const docRef = await db.collection(CREDIT_CARDS_COLLECTION).add({
    ...cardData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return docRef.id;
};

export const getCreditCard = async (id: string): Promise<CreditCard | null> => {
  checkFirebase();
  const doc = await db.collection(CREDIT_CARDS_COLLECTION).doc(id).get();
  if (doc.exists) {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as CreditCard;
  }
  return null;
};

export const getCreditCardsByUser = async (userId: string): Promise<CreditCard[]> => {
  checkFirebase();
  const querySnapshot = await db.collection(CREDIT_CARDS_COLLECTION)
    .where('userId', '==', userId)
    .get();

  const cards = querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as CreditCard;
  });

  return cards.sort((a: CreditCard, b: CreditCard) => a.createdAt.getTime() - b.createdAt.getTime());
};

export const updateCreditCard = async (id: string, cardData: Partial<CreditCard>): Promise<void> => {
  checkFirebase();
  await db.collection(CREDIT_CARDS_COLLECTION).doc(id).update({
    ...cardData,
    updatedAt: new Date(),
  });
};

export const deleteCreditCard = async (id: string): Promise<void> => {
  checkFirebase();
  await db.collection(CREDIT_CARDS_COLLECTION).doc(id).delete();
};

// Transactions
export const createTransaction = async (transactionData: Omit<Transaction, 'id'>): Promise<string> => {
  checkFirebase();

  const dataToSave: any = {
    ...transactionData,
    date: transactionData.date instanceof Date ? transactionData.date : new Date(transactionData.date),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Remove undefined values
  Object.keys(dataToSave).forEach(key => {
    if (dataToSave[key] === undefined) {
      delete dataToSave[key];
    }
  });

  const docRef = await db.collection(TRANSACTIONS_COLLECTION).add(dataToSave);
  return docRef.id;
};

export const getTransaction = async (id: string): Promise<Transaction | null> => {
  checkFirebase();
  const doc = await db.collection(TRANSACTIONS_COLLECTION).doc(id).get();
  if (doc.exists) {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data?.date.toDate(),
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as Transaction;
  }
  return null;
};

export const getTransactionsByUser = async (userId: string, filters?: any): Promise<Transaction[]> => {
  checkFirebase();
  let query = db.collection(TRANSACTIONS_COLLECTION).where('userId', '==', userId);

  if (filters?.startDate) {
    query = query.where('date', '>=', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.where('date', '<=', filters.endDate);
  }
  if (filters?.category) {
    query = query.where('category', '==', filters.category);
  }
  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }

  const querySnapshot = await query.get();

  const transactions = querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data?.date.toDate(),
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as Transaction;
  });

  return transactions.sort((a: Transaction, b: Transaction) => b.date.getTime() - a.date.getTime());
};

// Invoices
export const createInvoice = async (invoiceData: Omit<Invoice, 'id'>): Promise<string> => {
  checkFirebase();

  const dataToSave: any = {
    ...invoiceData,
    dueDate: invoiceData.dueDate instanceof Date ? invoiceData.dueDate : new Date(invoiceData.dueDate),
    closingDate: invoiceData.closingDate instanceof Date ? invoiceData.closingDate : new Date(invoiceData.closingDate),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Remove undefined values
  Object.keys(dataToSave).forEach(key => {
    if (dataToSave[key] === undefined) {
      delete dataToSave[key];
    }
  });

  const docRef = await db.collection(INVOICES_COLLECTION).add(dataToSave);
  return docRef.id;
};

export const getInvoice = async (id: string): Promise<Invoice | null> => {
  checkFirebase();
  const doc = await db.collection(INVOICES_COLLECTION).doc(id).get();
  if (doc.exists) {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data?.dueDate.toDate(),
      closingDate: data?.closingDate.toDate(),
      paidAt: data?.paidAt?.toDate(),
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as Invoice;
  }
  return null;
};

export const getInvoicesByCard = async (creditCardId: string): Promise<Invoice[]> => {
  checkFirebase();
  const querySnapshot = await db.collection(INVOICES_COLLECTION)
    .where('creditCardId', '==', creditCardId)
    .get();

  const invoices = querySnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data?.dueDate.toDate(),
      closingDate: data?.closingDate.toDate(),
      paidAt: data?.paidAt?.toDate(),
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
    } as Invoice;
  });

  return invoices.sort((a: Invoice, b: Invoice) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
};

export const updateInvoice = async (id: string, invoiceData: Partial<Invoice>): Promise<void> => {
  checkFirebase();
  const dataToUpdate: any = {
    ...invoiceData,
    updatedAt: new Date(),
  };

  Object.keys(dataToUpdate).forEach(key => {
    if (dataToUpdate[key] === undefined) {
      delete dataToUpdate[key];
    }
  });

  await db.collection(INVOICES_COLLECTION).doc(id).update(dataToUpdate);
};

export const updateTransaction = async (id: string, transactionData: Partial<Transaction>): Promise<void> => {
  checkFirebase();
  const dataToUpdate: any = {
    ...transactionData,
    updatedAt: new Date(),
  };

  Object.keys(dataToUpdate).forEach(key => {
    if (dataToUpdate[key] === undefined) {
      delete dataToUpdate[key];
    }
  });

  await db.collection(TRANSACTIONS_COLLECTION).doc(id).update(dataToUpdate);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  checkFirebase();
  await db.collection(TRANSACTIONS_COLLECTION).doc(id).delete();
};
