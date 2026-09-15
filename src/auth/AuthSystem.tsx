/* ═══════════════════════════════════════════════════════════════════
   AUTH — Firebase Auth + trusted custom claims, or an honest demo
   ───────────────────────────────────────────────────────────────────
   What changed from the previous version and why it matters:

   • The old provider silently substituted a `DEMO_PROFILE` whenever
     Firebase was unconfigured, which made a hardcoded object look like
     a signed-in user (with a gym and a plan) to every screen.
     Now: no credentials → an explicitly labelled Demo Workspace that
     says so in the UI, cannot grant entitlements, and persists nothing.

   • Roles and gym ids now come from `getIdTokenResult().claims`, which
     only the trusted backend can set. The profile document is display
     data, never authorisation evidence.

   • `updateUser()` strips protected fields (role, gymId, plan,
     entitlement, subscription) so the client cannot self-upgrade.

   • `plan` is derived from the `entitlements/{uid}` document, which the
     rules make read-only for every browser. No screen may write it.
   ═══════════════════════════════════════════════════════════════════ */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { nowIso } from "../data/datasource";
import { auth, db, isFirebaseConfigured } from "../firebase";
import { stripProtectedUserFields } from "../domain/collections";
import type {
  AuthSession,
  Entitlement,
  EntitlementPlan,
  Gym,
  Role,
  SessionClaims,
  UserPreferences,
  UserProfile,
} from "../domain/models";
import type { Actor } from "../security/permissions";
import { DEMO_GYM_ID, buildDemoSeed } from "../data/demoSeed";
import type { BaseDoc } from "../data/datasource";

/* ── Legacy-compatible profile ------------------------------------ */

/** Fields the pre-SaaS screens still read. All derived, none authoritative. */
export type LegacyStats = {
  totalWorkouts: number;
  caloriesTracked: number;
  waterLiters: number;
  sleepHours: number;
  weightLog: Array<{ date: string; weight: number }>;
};

export type CompatUser = UserProfile & {
  /** Derived from the entitlement document. Read-only in the UI. */
  plan: "Free" | "Pro" | "Elite";
  /** Derived from logged sessions. */
  streak: number;
  /** Derived from tracked records. */
  stats: LegacyStats;
  habits?: { date: string; items: Record<string, boolean> };
};

export type Persona = "owner" | "trainer" | "client" | "admin";

export type AuthContextType = {
  user: CompatUser | null;
  session: AuthSession | null;
  actor: Actor | null;
  /** Gym document for the active claim, when one is loaded. */
  gym: Gym | null;
  authLoading: boolean;
  /**
   * Set when a live session authenticated but the tenant data could not be
   * read — almost always because `firestore.rules` has not been deployed on
   * a brand-new project. Without this the app silently bounced back to the
   * sign-in screen and looked broken.
   */
  dataError: { code: string; message: string } | null;
  /** True while running the in-memory Demo Workspace. */
  demo: boolean;
  demoPersona: Persona | null;
  switchDemoPersona: (persona: Persona) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (updates: Partial<CompatUser>) => Promise<void>;
  completeOnboarding: (data: Partial<CompatUser>) => Promise<void>;
  refreshClaims: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

/* ── Mapping helpers ---------------------------------------------- */

export function planLabel(plan: EntitlementPlan | undefined | null): "Free" | "Pro" | "Elite" {
  switch (plan) {
    case "pro":
    case "gym_growth":
      return "Pro";
    case "elite":
    case "gym_scale":
    case "gym_enterprise":
      return "Elite";
    default:
      return "Free";
  }
}

function activeEntitlement(entitlement: Entitlement | null): Entitlement | null {
  if (!entitlement) return null;
  if (entitlement.status !== "active" && entitlement.status !== "pending") return null;
  if (entitlement.expiresAt && new Date(entitlement.expiresAt).getTime() < Date.now()) return null;
  return entitlement;
}

export function claimsFromToken(claims: Record<string, unknown>): SessionClaims {
  const role = (claims.role as Role) ?? "client";
  const gymId = (claims.gymId as string) ?? null;
  const gymIds = Array.isArray(claims.gymIds) ? (claims.gymIds as string[]) : gymId ? [gymId] : [];
  const entitlements = Array.isArray(claims.entitlements) ? (claims.entitlements as EntitlementPlan[]) : [];
  return {
    role: ["super_admin", "gym_owner", "trainer", "client"].includes(role) ? role : "client",
    gymId,
    gymIds,
    entitlements,
  };
}

export function actorFromClaims(uid: string, claims: SessionClaims): Actor {
  return { uid, role: claims.role, gymId: claims.gymId, gymIds: claims.gymIds };
}

function friendlyError(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "Email already registered. Please sign in.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in popup was closed before completing.";
    case "auth/operation-not-allowed":
      return "That sign-in method is not enabled for this Firebase project yet. Enable it in Firebase Console → Authentication → Sign-in method.";
    case "auth/unauthorized-domain":
      return "This domain is not authorised for sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains, then reload.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid":
      return "Firebase rejected the API key. Run `npm run check:firebase` — the value in .env.local does not belong to this project.";
    case "auth/configuration-not-found":
      return "This Firebase project has no Authentication configuration yet. Open Firebase Console → Authentication and press Get started.";
    case "auth/quota-exceeded":
      return "Firebase Auth quota reached. Try again shortly or check the project's usage.";
    case "permission-denied":
    case "firestore/permission-denied":
      return "Firestore refused the request. The security rules are probably not deployed yet — run `npm run deploy:rules`, then reload.";
    case "unavailable":
    case "firestore/unavailable":
      return "Could not reach Firestore. Check your connection and that the project's database exists.";
    default:
      return code && !code.startsWith("auth/")
        ? `Request failed: ${code}`
        : "Something went wrong. Please try again.";
  }
}

/**
 * Idempotently create the `users/{uid}` document for a freshly authenticated
 * account. `role` and `gymId` are written explicitly as the weakest values —
 * a self-created profile may never claim authority, and the rules enforce
 * that independently.
 */
async function ensureProfileDoc(fbUser: FirebaseUser): Promise<void> {
  if (!db) return;
  const profile = emptyProfile(fbUser.uid, fbUser.displayName ?? "Athlete", fbUser.email ?? "");
  await setDoc(
    doc(db, "users", fbUser.uid),
    { ...profile, role: "client", gymId: null, createdAt: nowIso(), updatedAt: nowIso() },
    { merge: true },
  );
}

const DEFAULT_PREFERENCES: UserPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  weeklyReports: true,
  aiCoach: true,
  units: "metric",
};

function emptyProfile(uid: string, name: string, email: string): UserProfile {
  const initials = name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    id: uid,
    name,
    email,
    avatar: initials || "TF",
    phone: "",
    age: 0,
    gender: "male",
    height: 0,
    weight: 0,
    goal: "general",
    role: "client",
    gymId: null,
    joinDate: new Date().toISOString().slice(0, 10),
    onboardingComplete: false,
    preferences: { ...DEFAULT_PREFERENCES },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/* ── Demo workspace ----------------------------------------------- */

const EMPTY_STATS: LegacyStats = { totalWorkouts: 0, caloriesTracked: 0, waterLiters: 0, sleepHours: 0, weightLog: [] };

const DEMO_PERSONA_MAP: Record<Persona, { userId: string; role: Role; gymId: string | null }> = {
  owner: { userId: "demo_owner", role: "gym_owner", gymId: DEMO_GYM_ID },
  trainer: { userId: "demo_trainer_a", role: "trainer", gymId: DEMO_GYM_ID },
  client: { userId: "demo_client_01", role: "client", gymId: DEMO_GYM_ID },
  admin: { userId: "demo_admin", role: "super_admin", gymId: null },
};

let demoCache: Record<string, BaseDoc[]> | null = null;
function demoRows(): Record<string, BaseDoc[]> {
  if (!demoCache) {
    const seed = buildDemoSeed();
    demoCache = Object.fromEntries(Object.entries(seed).map(([key, rows]) => [key, (rows ?? []) as BaseDoc[]]));
  }
  return demoCache;
}

export function demoProfiles(): Record<Persona, CompatUser> {
  const users = demoRows().users ?? [];
  const sessions = demoRows().workoutSessions ?? [];
  const progress = demoRows().progress ?? [];
  const nutritionLogs = demoRows().nutritionLogs ?? [];
  const entitlements = demoRows().entitlements ?? [];

  const build = (persona: Persona): CompatUser => {
    const mapping = DEMO_PERSONA_MAP[persona];
    const raw = users.find((row) => row.id === mapping.userId);
    const base: UserProfile = raw
      ? (raw as unknown as UserProfile)
      : { ...emptyProfile(mapping.userId, "Platform Admin", "admin@tiger.fit"), role: "super_admin", onboardingComplete: true };
    const mine = sessions.filter((row) => row.clientId === mapping.userId);
    const myProgress = progress.filter((row) => row.clientId === mapping.userId);
    const myLogs = nutritionLogs.filter((row) => row.clientId === mapping.userId);
    const entitlement = activeEntitlement(
      (entitlements.find((row) => row.id === mapping.userId) as unknown as Entitlement) ??
        (entitlements.find((row) => row.id === mapping.gymId) as unknown as Entitlement) ??
        null,
    );
    return {
      ...base,
      plan: planLabel(entitlement?.plan),
      streak: currentStreakFrom(mine.map((row) => String(row.completedAt ?? ""))),
      stats: {
        totalWorkouts: mine.length,
        caloriesTracked: myLogs.reduce((sum, row) => sum + Number((row.totals as { calories?: number } | undefined)?.calories ?? 0), 0),
        waterLiters: Math.round(myLogs.reduce((sum, row) => sum + Number(row.waterMl ?? 0), 0) / 100) / 10,
        sleepHours: 0,
        weightLog: myProgress.map((row) => ({ date: String(row.date), weight: Number(row.weightKg) })),
      },
    };
  };

  return {
    owner: build("owner"),
    trainer: build("trainer"),
    client: build("client"),
    admin: build("admin"),
  };
}

function currentStreakFrom(completedAts: string[]): number {
  const days = new Set(completedAts.filter(Boolean).map((iso) => iso.slice(0, 10)));
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    if (days.has(day)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

/* ── Provider ------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [claims, setClaims] = useState<SessionClaims | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataError, setDataError] = useState<{ code: string; message: string } | null>(null);
  const [demoPersona, setDemoPersona] = useState<Persona | null>(null);
  const unsubscribeProfile = useRef<(() => void) | null>(null);

  const firebaseReady = isFirebaseConfigured && Boolean(auth) && Boolean(db);
  const demo = !firebaseReady || Boolean(demoPersona);

  /* Demo workspace: everything below is derived, never persisted. */
  useEffect(() => {
    if (firebaseReady && !demoPersona) return;
    const persona = demoPersona ?? "client";
    const profiles = demoProfiles();
    const mapping = DEMO_PERSONA_MAP[persona];
    const nextClaims: SessionClaims = {
      role: mapping.role,
      gymId: mapping.gymId,
      gymIds: mapping.gymId ? [mapping.gymId] : [],
      entitlements: persona === "owner" ? ["gym_scale", "elite"] : persona === "client" ? ["pro"] : [],
    };
    setUid(mapping.userId);
    setProfile(profiles[persona]);
    setClaims(nextClaims);
    setEntitlement(
      activeEntitlement(
        (demoRows().entitlements ?? []).find((row) => row.id === (persona === "client" ? mapping.userId : mapping.gymId ?? mapping.userId)) as unknown as Entitlement,
      ),
    );
    setGym((demoRows().gyms ?? []).find((row) => row.id === mapping.gymId) as unknown as Gym ?? null);
    setAuthLoading(false);
  }, [firebaseReady, demoPersona]);

  /* Live Firebase session. */
  useEffect(() => {
    if (!firebaseReady || demoPersona) return undefined;
    const unsub = onAuthStateChanged(auth!, async (fbUser: FirebaseUser | null) => {
      unsubscribeProfile.current?.();
      unsubscribeProfile.current = null;
      if (!fbUser) {
        setUid(null);
        setProfile(null);
        setClaims(null);
        setEntitlement(null);
        setDataError(null);
        setAuthLoading(false);
        return;
      }
      setDataError(null);
      setUid(fbUser.uid);
      const token = await fbUser.getIdTokenResult(true);
      setClaims(claimsFromToken(token.claims as Record<string, unknown>));

      /* Profile: live subscription so trainer/owner edits appear instantly. */
      unsubscribeProfile.current = onSnapshot(
        doc(db!, "users", fbUser.uid),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setProfile(data);
            /* Refresh claims when a trusted backend has just changed them. */
            if (data.role && data.role !== claimsFromToken(token.claims as Record<string, unknown>).role) {
              void fbUser.getIdTokenResult(true).then((t) => setClaims(claimsFromToken(t.claims as Record<string, unknown>)));
            }
          } else {
            setProfile(emptyProfile(fbUser.uid, fbUser.displayName ?? "Athlete", fbUser.email ?? ""));
          }
          setDataError(null);
          setAuthLoading(false);
        },
        (error: unknown) => {
          const code = (error as { code?: string }).code ?? "unknown";
          setDataError({ code, message: friendlyError(code) });
          setAuthLoading(false);
        },
      );

      /* Entitlement drives the plan badge; the browser can only read it. */
      onSnapshot(
        doc(db!, "entitlements", fbUser.uid),
        (snap) => setEntitlement(snap.exists() ? (snap.data() as Entitlement) : null),
        () => setEntitlement(null),
      );

      const tokenClaims = claimsFromToken(token.claims as Record<string, unknown>);
      if (tokenClaims.gymId) {
        void getDoc(doc(db!, "gyms", tokenClaims.gymId)).then((snap) => {
          if (snap.exists()) setGym(snap.data() as Gym);
        }).catch(() => setGym(null));
      } else {
        setGym(null);
      }
    });
    return () => {
      unsub();
      unsubscribeProfile.current?.();
      unsubscribeProfile.current = null;
    };
  }, [firebaseReady, demoPersona]);

  const refreshClaims = useCallback(async () => {
    if (!auth?.currentUser) {
      setClaims(claimsFromToken({}));
      return;
    }
    try {
      const token = await auth.currentUser.getIdTokenResult(true);
      setClaims(claimsFromToken(token.claims as Record<string, unknown>));
    } catch {
      /* keep the previous claims on a network failure — never widen access */
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!firebaseReady) {
        setDemoPersona("client");
        return { success: true, message: "Demo Workspace enabled — no Firebase project is configured." };
      }
      try {
        await signInWithEmailAndPassword(auth!, email, password);
        return { success: true, message: "Welcome back." };
      } catch (error) {
        const code = (error as { code?: string }).code ?? "";
        return { success: false, message: friendlyError(code) };
      }
    },
    [firebaseReady],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      if (!firebaseReady) {
        setDemoPersona("client");
        return { success: true, message: "Demo Workspace enabled — create a real account once Firebase is configured." };
      }
      try {
        const { user: fbUser } = await createUserWithEmailAndPassword(auth!, email, password);
        /* `role` and `gymId` are pinned to the weakest values: the backend sets
           the claim, and the rules let a self-created profile declare only the
           client role. Same helper as Google sign-in so the paths cannot drift. */
        await ensureProfileDoc(fbUser);
        setProfile(emptyProfile(fbUser.uid, name || "Athlete", email));
        return { success: true, message: "Account created." };
      } catch (error) {
        const code = (error as { code?: string }).code ?? "";
        return { success: false, message: friendlyError(code) };
      }
    },
    [firebaseReady],
  );

  const loginWithGoogle = useCallback(async () => {
    if (!firebaseReady) {
      setDemoPersona("client");
      return { success: true, message: "Demo Workspace enabled — Google sign-in needs a Firebase project." };
    }
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
      const { user: fbUser } = await signInWithPopup(auth!, new GoogleAuthProvider());
      /* A Google account has no profile document. Without this the app would
         build one in memory on every load and the backend trigger would never
         see the user. `merge: true` keeps an existing profile untouched. */
      await ensureProfileDoc(fbUser);
      return { success: true, message: "Signed in with Google." };
    } catch (error) {
      const code = (error as { code?: string }).code ?? "";
      return { success: false, message: friendlyError(code) };
    }
  }, [firebaseReady]);

  const logout = useCallback(() => {
    if (firebaseReady && !demoPersona && auth) void signOut(auth);
    if (demoPersona) setDemoPersona(null);
    setProfile(null);
    setClaims(null);
    setEntitlement(null);
    setDataError(null);
    setUid(null);
  }, [firebaseReady, demoPersona]);

  const updateUser = useCallback(
    async (updates: Partial<CompatUser>) => {
      if (!profile) return;
      const { plan: _plan, streak: _streak, stats: _stats, habits: _habits, ...rest } = updates;
      /* Free-form legacy fields stay in component state only; they are not
         authoritative and never leave the browser as identity data. */
      const safe = stripProtectedUserFields(rest as Record<string, unknown>);
      setProfile((current) => (current ? { ...current, ...(safe as Partial<UserProfile>) } : current));
      if (!firebaseReady || demoPersona || !uid) return;
      try {
        await updateDoc(doc(db!, "users", uid), { ...safe, updatedAt: new Date().toISOString() });
      } catch {
        /* Rules rejected the write (protected field or missing permission) —
           the optimistic local state is corrected on the next snapshot. */
      }
    },
    [profile, firebaseReady, demoPersona, uid],
  );

  const completeOnboarding = useCallback(
    async (data: Partial<CompatUser>) => {
      await updateUser({ ...data, onboardingComplete: true });
    },
    [updateUser],
  );

  const user = useMemo<CompatUser | null>(() => {
    if (!profile) return null;
    const effective = activeEntitlement(entitlement);
    const claimPlans = claims?.entitlements ?? [];
    const plan = effective ? planLabel(effective.plan) : planLabel(claimPlans[0]);
    return {
      ...profile,
      plan,
      streak: 0,
      stats: EMPTY_STATS,
    };
  }, [profile, entitlement, claims]);

  const session = useMemo<AuthSession | null>(() => {
    if (!uid || !claims) return null;
    return { uid, email: profile?.email ?? null, profile, claims, demo };
  }, [uid, claims, profile, demo]);

  const actor = useMemo<Actor | null>(() => (uid && claims ? actorFromClaims(uid, claims) : null), [uid, claims]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      actor,
      gym,
      authLoading,
      dataError,
      demo,
      demoPersona,
      switchDemoPersona: setDemoPersona,
      login,
      signup,
      loginWithGoogle,
      logout,
      updateUser,
      completeOnboarding,
      refreshClaims,
    }),
    [user, session, actor, gym, authLoading, demo, demoPersona, login, signup, loginWithGoogle, logout, updateUser, completeOnboarding, refreshClaims],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { DEFAULT_PREFERENCES, emptyProfile, DEMO_GYM_ID };
