import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/* ---------------------------------------------------------------- */
/* Trainer client store — the roster syncs to Firestore so a coach    */
/* sees the same clients on every device, with a localStorage cache   */
/* so it still works offline / instantly on load.                     */
/*                                                                    */
/* Stored as a single doc: users/{uid}/private/trainerRoster          */
/* with { clients: Client[] } — simple, atomic, and real-time.        */
/* ---------------------------------------------------------------- */

export interface Payment { date: string; amount: number }
export interface WeightPoint { date: string; weight: number }
export interface Session { date: string; time: string; note: string; done?: boolean }
export interface Client {
  id: string;
  name: string;
  phone: string;
  goal: string;
  fee: number;
  cycle: "monthly" | "session" | "quarterly";
  startDate: string;
  target: string;
  plan: string;
  status: "active" | "paused";
  payments: Payment[];
  attendance: string[];
  weightLog: WeightPoint[];
  sessions: Session[];
  notes: string;
}

function cacheKey(uid: string | null | undefined) { return `tfp_trainer_clients_${uid ?? "guest"}`; }

export function loadCachedClients(uid: string | null | undefined): Client[] {
  try {
    const raw = JSON.parse(localStorage.getItem(cacheKey(uid)) ?? "[]");
    return (raw as Client[]).map(normalize);
  } catch { return []; }
}

function normalize(c: Partial<Client>): Client {
  return {
    id: c.id ?? "c" + Math.random().toString(36).slice(2),
    name: c.name ?? "", phone: c.phone ?? "", goal: c.goal ?? "",
    fee: c.fee ?? 0, cycle: c.cycle ?? "monthly", startDate: c.startDate ?? "",
    target: c.target ?? "", plan: c.plan ?? "", status: c.status ?? "active",
    payments: c.payments ?? [], attendance: c.attendance ?? [],
    weightLog: c.weightLog ?? [], sessions: c.sessions ?? [], notes: c.notes ?? "",
  };
}

function rosterRef(uid: string) { return doc(db, "users", uid, "private", "trainerRoster"); }

/** Live-subscribe to the roster. Returns an unsubscribe fn. Seeds from cache first. */
export function subscribeClients(uid: string, cb: (clients: Client[]) => void): () => void {
  cb(loadCachedClients(uid)); // instant paint from cache
  try {
    return onSnapshot(
      rosterRef(uid),
      (snap) => {
        const data = snap.data();
        if (data && Array.isArray(data.clients)) {
          const clients = (data.clients as Partial<Client>[]).map(normalize);
          try { localStorage.setItem(cacheKey(uid), JSON.stringify(clients)); } catch { /* ignore */ }
          cb(clients);
        }
      },
      () => { /* offline / permission — keep the cache */ }
    );
  } catch {
    return () => {};
  }
}

/** Persist the whole roster (Firestore + cache). */
export async function saveClients(uid: string, clients: Client[]): Promise<void> {
  try { localStorage.setItem(cacheKey(uid), JSON.stringify(clients)); } catch { /* ignore */ }
  try { await setDoc(rosterRef(uid), { clients, updatedAt: Date.now() }, { merge: true }); } catch { /* offline — cache holds it */ }
}

/** One-time fetch (used if a listener isn't set up). */
export async function fetchClients(uid: string): Promise<Client[]> {
  try {
    const snap = await getDoc(rosterRef(uid));
    const data = snap.data();
    if (data && Array.isArray(data.clients)) {
      const clients = (data.clients as Partial<Client>[]).map(normalize);
      try { localStorage.setItem(cacheKey(uid), JSON.stringify(clients)); } catch { /* ignore */ }
      return clients;
    }
  } catch { /* ignore */ }
  return loadCachedClients(uid);
}
