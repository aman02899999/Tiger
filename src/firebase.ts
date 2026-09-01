import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "",
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
}

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;

export function requireAuth(): Auth {
  if (!auth) {
    throw new Error("Firebase Auth is not configured. Set the VITE_FIREBASE_* values in your environment.");
  }
  return auth;
}

export function requireDb(): Firestore {
  if (!db) {
    throw new Error("Firebase Firestore is not configured. Set the VITE_FIREBASE_* values in your environment.");
  }
  return db;
}

export function requireStorage(): FirebaseStorage {
  if (!storage) {
    throw new Error("Firebase Storage is not configured. Set the VITE_FIREBASE_* values in your environment.");
  }
  return storage;
}

if (app) {
  isSupported().then((yes) => { if (yes) getAnalytics(app!); });
}

export default app;
