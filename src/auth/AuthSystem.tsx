import { useState, useEffect, createContext, useContext } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

/* ---------------------------------------------------------------- */
/* Types                                                             */
/* ---------------------------------------------------------------- */

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  age: number;
  gender: "male" | "female" | "other";
  height: number;
  weight: number;
  goal: "fat-loss" | "muscle-gain" | "maintenance" | "wedding" | "general";
  plan: "Free" | "Pro" | "Elite";
  joinDate: string;
  streak: number;
  onboardingComplete: boolean;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyReports: boolean;
    aiCoach: boolean;
    darkMode: boolean;
    units: "metric" | "imperial";
  };
  stats: {
    totalWorkouts: number;
    caloriesTracked: number;
    waterLiters: number;
    sleepHours: number;
    weightLog: Array<{ date: string; weight: number }>;
  };
};

export type AuthContextType = {
  user: UserProfile | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<void>;
};

/* ---------------------------------------------------------------- */
/* Helpers                                                           */
/* ---------------------------------------------------------------- */

const DEMO_PROFILE: UserProfile = {
  id: "demo-1",
  name: "Demo User",
  email: "demo@tigerfitpro.in",
  avatar: "DU",
  phone: "+91 98765 43210",
  age: 28,
  gender: "male",
  height: 175,
  weight: 78,
  goal: "fat-loss",
  plan: "Pro",
  joinDate: "2025-06-01",
  streak: 12,
  onboardingComplete: true,
  preferences: { emailNotifications: true, pushNotifications: true, weeklyReports: true, aiCoach: true, darkMode: true, units: "metric" },
  stats: {
    totalWorkouts: 47,
    caloriesTracked: 18500,
    waterLiters: 245,
    sleepHours: 182,
    weightLog: [
      { date: "May 1", weight: 82 },
      { date: "May 8", weight: 81 },
      { date: "May 15", weight: 80 },
      { date: "May 22", weight: 79.5 },
      { date: "May 29", weight: 78.8 },
      { date: "Jun 5", weight: 78 },
    ],
  },
};

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
    default:
      return "Something went wrong. Please try again.";
  }
}

async function loadProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- */
/* Context                                                           */
/* ---------------------------------------------------------------- */

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = await loadProfile(fbUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  async function login(email: string, password: string) {
    try {
      // Handle demo account — create it in Firebase if it doesn't exist yet
      if (email === "demo@tigerfitpro.in") {
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (e: any) {
          if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") {
            const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", fbUser.uid), { ...DEMO_PROFILE, id: fbUser.uid });
          } else throw e;
        }
        return { success: true, message: "Welcome back!" };
      }

      await signInWithEmailAndPassword(auth, email, password);
      return { success: true, message: "Welcome back!" };
    } catch (err: any) {
      return { success: false, message: friendlyError(err.code) };
    }
  }

  async function signup(name: string, email: string, password: string) {
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
      const newProfile: UserProfile = {
        id: fbUser.uid,
        name,
        email,
        avatar: (name.split(" ").map((n) => n[0]).join("").toUpperCase() + "XX").slice(0, 2),
        phone: "",
        age: 0,
        gender: "male",
        height: 0,
        weight: 0,
        goal: "general",
        plan: "Free",
        joinDate: new Date().toISOString().split("T")[0],
        streak: 0,
        onboardingComplete: false,
        preferences: { emailNotifications: true, pushNotifications: true, weeklyReports: true, aiCoach: true, darkMode: true, units: "metric" },
        stats: {
          totalWorkouts: 0,
          caloriesTracked: 0,
          waterLiters: 0,
          sleepHours: 0,
          weightLog: [{ date: new Date().toISOString().split("T")[0], weight: 70 }],
        },
      };
      await setDoc(doc(db, "users", fbUser.uid), newProfile);
      setUser(newProfile);
      return { success: true, message: "Account created!" };
    } catch (err: any) {
      return { success: false, message: friendlyError(err.code) };
    }
  }

  function logout() {
    signOut(auth);
    setUser(null);
  }

  async function updateUser(updates: Partial<UserProfile>) {
    if (!user || !auth.currentUser) return;
    const updated = { ...user, ...updates };
    setUser(updated); // optimistic
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), updates as Record<string, unknown>);
    } catch {
      setUser(user); // rollback on failure
    }
  }

  async function completeOnboarding(data: Partial<UserProfile>) {
    await updateUser({ ...data, onboardingComplete: true });
  }

  return (
    <AuthContext.Provider value={{ user, authLoading, login, signup, logout, updateUser, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
