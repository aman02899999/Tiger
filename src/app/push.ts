import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/* ---------------------------------------------------------------- */
/* Web Push subscription helper.                                      */
/*                                                                    */
/* Enables notifications that arrive even when the app/tab is closed  */
/* (true background push), via the service worker + Push API.         */
/*                                                                    */
/* Requires a VAPID key pair:                                         */
/*  - PUBLIC key  → frontend env  VITE_VAPID_PUBLIC_KEY               */
/*  - PRIVATE key → Cloud Functions secret (see functions/)          */
/* Generate a pair with:  npx web-push generate-vapid-keys           */
/* ---------------------------------------------------------------- */

export const VAPID_PUBLIC_KEY: string = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

export function isPushConfigured(): boolean {
  return (
    VAPID_PUBLIC_KEY.length > 0 &&
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Subscribe this device to background push and store the subscription on the
 * user's Firestore document. Returns true on success. Safe no-op if push
 * isn't configured or permission isn't granted.
 */
export async function subscribeToPush(uid: string): Promise<boolean> {
  if (!isPushConfigured()) return false;
  if (Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }
    const json = sub.toJSON();
    // Key the doc by endpoint hash so one device = one subscription.
    const id = btoa(sub.endpoint).replace(/[^a-zA-Z0-9]/g, "").slice(-40);
    await setDoc(
      doc(db, "users", uid, "pushSubscriptions", id),
      { subscription: json, updatedAt: serverTimestamp(), userAgent: navigator.userAgent },
      { merge: true }
    );
    return true;
  } catch {
    return false;
  }
}

/** Remove this device's push subscription (best-effort). */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch { /* ignore */ }
}
