import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let firebaseError: string | null = null;

try {
  // Basic check for placeholder values or missing keys.
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
    throw new Error("Firebase API Key is missing or is a placeholder. Please set NEXT_PUBLIC_FIREBASE_API_KEY and other variables in your .env.local file.");
  }
  if (!firebaseConfig.projectId) {
     throw new Error("Firebase Project ID is missing. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env.local file.");
  }
  
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

} catch (error: any) {
  console.error("FIREBASE INITIALIZATION ERROR:", error.message);
  firebaseError = error.message;
}


export { app, auth, db, storage, firebaseError };
