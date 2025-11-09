import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK (server-side only)
const projectId = process.env.FIREBASE_PROJECT_ID;
const inferredBucket =
  process.env.FIREBASE_STORAGE_BUCKET ||
  (projectId ? `${projectId}.firebasestorage.app` : undefined) ||
  (projectId ? `${projectId}.appspot.com` : undefined);

const firebaseConfig = {
  projectId,
  storageBucket: inferredBucket,
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

let app: any = null;
let db: any = null;
let storage: any = null;

// Only initialize if not already initialized
if (!getApps().length && process.env.FIREBASE_PROJECT_ID) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
  }
} else if (getApps().length > 0) {
  app = getApps()[0];
  db = getFirestore(app);
  storage = getStorage(app);
}

export { db, storage };
export default app;
