import { db } from './firebase-server';
import { User, Debt } from '@/types';

// Check if Firebase is initialized
const checkFirebase = () => {
  if (!db) {
    throw new Error('Firebase não está configurado. Verifique as variáveis de ambiente.');
  }
};

// Collections
const USERS_COLLECTION = 'users';
const DEBTS_COLLECTION = 'debts';

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
