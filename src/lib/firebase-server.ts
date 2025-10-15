import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK (server-side only)
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

let app: any = null;
let db: any = null;

// Only initialize if not already initialized
if (!getApps().length && process.env.FIREBASE_PROJECT_ID) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
  }
} else if (getApps().length > 0) {
  app = getApps()[0];
  db = getFirestore(app);
}

export { db };
export default app;
