import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";
import { getAnalytics, isSupported } from "firebase/analytics";
import { resolveFirebaseConfig, missingFirebaseFieldsOf } from "./firebaseConfig";

/* ═══════════════════════════════════════════════════════════════════
   FIREBASE INITIALISATION
   ───────────────────────────────────────────────────────────────────
   The web config is public by design — it ships inside every browser
   bundle. Security comes from `firestore.rules`, `storage.rules` and
   custom claims; never from hiding the project id. Real secrets live in
   Cloud Functions Secret Manager.

   What the config *means* (which fields are required, how the storage
   bucket name is derived, which cross-field mismatches are fatal) lives
   in `./firebaseConfig` so the doctor script and the test suite assert
   exactly the same rules this file runs on.
   ═══════════════════════════════════════════════════════════════════ */

const resolved = resolveFirebaseConfig(import.meta.env as unknown as Record<string, string | undefined>);

export const isFirebaseConfigured = resolved.configured;

/** Field names blocking live mode — surfaced on the sign-in screen. */
export const missingFirebaseFields: string[] = missingFirebaseFieldsOf(resolved);

let app: FirebaseApp | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(resolved.config);
}

export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;

/* Callable Cloud Functions are how the browser reaches the trusted backend.
   Region must match the deployed functions (firebase-functions v2 defaults to
   us-central1) or every call 404s with an opaque "internal" error. */
export const FUNCTIONS_REGION = "us-central1";
export const functions: Functions | null = app ? getFunctions(app, FUNCTIONS_REGION) : null;

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

export function requireFunctions(): Functions {
  if (!functions) {
    throw new Error("Firebase Functions is not configured. Set the VITE_FIREBASE_* values in your environment.");
  }
  return functions;
}

export function requireStorage(): FirebaseStorage {
  if (!storage) {
    throw new Error("Firebase Storage is not configured. Set the VITE_FIREBASE_* values in your environment.");
  }
  return storage;
}

if (app && resolved.analytics) {
  isSupported().then((yes) => {
    if (yes) getAnalytics(app!);
  });
}

export default app;
