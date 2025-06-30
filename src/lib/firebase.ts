import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB6M7XNNWMjCQD9bcRkB0Aiq0U1EWRztR4",
  authDomain: "genscoutai-5phlw.firebaseapp.com",
  projectId: "genscoutai-5phlw",
  storageBucket: "genscoutai-5phlw.appspot.com",
  messagingSenderId: "73196441182",
  appId: "1:73196441182:web:9c99cd3235266d5f2f2ecf"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let firebaseError: string | null = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

} catch (error: any) {
  console.error("FIREBASE INITIALIZATION ERROR:", error.message);
  firebaseError = error.message;
}


export { app, auth, db, storage, firebaseError };
