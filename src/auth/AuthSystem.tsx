import { useState, useEffect, createContext, useContext } from "react";

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
  login: (email: string, password: string) => { success: boolean; message: string };
  signup: (name: string, email: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (data: Partial<UserProfile>) => void;
};

/* ---------------------------------------------------------------- */
/* Storage                                                           */
/* ---------------------------------------------------------------- */

const USERS_KEY = "tfp_users_db";
const SESSION_KEY = "tfp_current_user";
const PASSWORDS_KEY = "tfp_passwords";

type PasswordEntry = { email: string; password: string };

function getUsers(): UserProfile[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
}
function saveUsers(users: UserProfile[]) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

function getPasswords(): PasswordEntry[] {
  try { return JSON.parse(localStorage.getItem(PASSWORDS_KEY) || "[]"); } catch { return []; }
}
function savePasswords(p: PasswordEntry[]) { localStorage.setItem(PASSWORDS_KEY, JSON.stringify(p)); }

/* ---------------------------------------------------------------- */
/* Default demo user                                                 */
/* ---------------------------------------------------------------- */

const DEMO_USER: UserProfile = {
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
  preferences: {
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    aiCoach: true,
    darkMode: true,
    units: "metric",
  },
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

function ensureDemoUser() {
  const users = getUsers();
  if (!users.find((u) => u.email === DEMO_USER.email)) {
    users.push(DEMO_USER);
    saveUsers(users);
    const passwords = getPasswords();
    passwords.push({ email: DEMO_USER.email, password: "demo123" });
    savePasswords(passwords);
  }
}
ensureDemoUser();

/* ---------------------------------------------------------------- */
/* Context                                                           */
/* ---------------------------------------------------------------- */

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return getUsers().find((u) => u.id === id) || null;
  });

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, user.id);
    else localStorage.removeItem(SESSION_KEY);
  }, [user]);

  function login(email: string, password: string) {
    const passwords = getPasswords();
    const match = passwords.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!match || match.password !== password) return { success: false, message: "Invalid email or password" };
    const u = getUsers().find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return { success: false, message: "User not found" };
    setUser(u);
    return { success: true, message: "Welcome back!" };
  }

  function signup(name: string, email: string, password: string) {
    const users = getUsers();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: "Email already registered" };
    }
    const newUser: UserProfile = {
      id: "u-" + Date.now().toString(36),
      name,
      email,
      avatar: name.split(" ").map((n) => n[0]).slice(-2).join("").toUpperCase(),
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
      stats: { totalWorkouts: 0, caloriesTracked: 0, waterLiters: 0, sleepHours: 0, weightLog: [] },
    };
    users.push(newUser);
    saveUsers(users);
    const passwords = getPasswords();
    passwords.push({ email, password });
    savePasswords(passwords);
    setUser(newUser);
    return { success: true, message: "Account created!" };
  }

  function logout() { setUser(null); }

  function updateUser(updates: Partial<UserProfile>) {
    if (!user) return;
    const users = getUsers();
    const updated = { ...user, ...updates };
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) { users[idx] = updated; saveUsers(users); }
    setUser(updated);
  }

  function completeOnboarding(data: Partial<UserProfile>) {
    if (!user) return;
    updateUser({ ...data, onboardingComplete: true });
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
