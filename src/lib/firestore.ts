import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
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
  const docRef = await addDoc(collection(db, USERS_COLLECTION), {
    ...userData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getUser = async (id: string): Promise<User | null> => {
  checkFirebase();
  const docRef = doc(db, USERS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as User;
  }
  return null;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  checkFirebase();
  const q = query(collection(db, USERS_COLLECTION), where('username', '==', username.toLowerCase()));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as User;
  }
  return null;
};

export const getAllUsers = async (): Promise<User[]> => {
  checkFirebase();
  const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as User;
  });
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<void> => {
  checkFirebase();
  const docRef = doc(db, USERS_COLLECTION, id);
  await updateDoc(docRef, {
    ...userData,
    updatedAt: Timestamp.now(),
  });
};

// Debt operations
export const createDebt = async (debtData: Omit<Debt, 'id'>): Promise<string> => {
  checkFirebase();
  const docRef = await addDoc(collection(db, DEBTS_COLLECTION), {
    ...debtData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getDebt = async (id: string): Promise<Debt | null> => {
  checkFirebase();
  const docRef = doc(db, DEBTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      dueDate: data.dueDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Debt;
  }
  return null;
};

export const getAllDebts = async (): Promise<Debt[]> => {
  checkFirebase();
  const querySnapshot = await getDocs(collection(db, DEBTS_COLLECTION));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data.dueDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Debt;
  });
};

export const getOpenDebts = async (): Promise<Debt[]> => {
  checkFirebase();
  const q = query(
    collection(db, DEBTS_COLLECTION), 
    where('status', '==', 'OPEN'),
    orderBy('dueDate', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data.dueDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Debt;
  });
};

export const updateDebt = async (id: string, debtData: Partial<Debt>): Promise<void> => {
  checkFirebase();
  const docRef = doc(db, DEBTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...debtData,
    updatedAt: Timestamp.now(),
  });
};

export const deleteDebt = async (id: string): Promise<void> => {
  checkFirebase();
  const docRef = doc(db, DEBTS_COLLECTION, id);
  await deleteDoc(docRef);
};
