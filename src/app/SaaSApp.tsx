import { useState } from "react";
import { deleteUser } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../auth/AuthSystem";
import OnboardingWizard from "../auth/OnboardingWizard";
import LoginPage, { SignupPage } from "../auth/Login";
import FitnessToolbox from "./Toolbox";
import DietCalculator from "./DietCalculator";
import { GoalRoadmap, Transformations, Referrals, Leaderboard } from "./Features";
import BloodReportPage from "./BloodReport";
import ChallengesPage from "./Challenges";
import CoursesPage from "./Courses";

/* ---------------------------------------------------------------- */
/* App Shell with Sidebar                                            */
/* ---------------------------------------------------------------- */

function AppShell({ children, onLogout, currentSection, setCurrentSection }: any) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "workouts", icon: "💪", label: "Workouts" },
    { id: "nutrition", icon: "🍛", label: "Nutrition" },
    { id: "diet", icon: "🥗", label: "Auto Diet" },
    { id: "toolbox", icon: "🧰", label: "Toolbox" },
    { id: "roadmap", icon: "🗺️", label: "Roadmap" },
    { id: "transform", icon: "📸", label: "Transform" },
    { id: "referrals", icon: "💰", label: "Referrals" },
    { id: "leaderboard", icon: "🏆", label: "Leaderboard" },
    { id: "progress", icon: "📈", label: "Progress" },
    { id: "habits", icon: "🎯", label: "Habits" },
    { id: "blood", icon: "🩸", label: "Blood Report" },
    { id: "challenges", icon: "🏆", label: "Challenges" },
    { id: "courses", icon: "📚", label: "Courses" },
    { id: "family", icon: "👨‍👩‍", label: "Family" },
    { id: "premium", icon: "👑", label: "Premium" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen bg-[#07040d] text-[#f7f0df]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-[#f7f0df]/10 bg-[#0b0714]/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col p-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-sm font-black text-[#090511]">TF</div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#f7f0df]">Tiger Fit Pro</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#f7f0df]/40">{user?.plan} Plan</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5">
            {navItems.map((item) => (
              <button key={item.id} type="button" onClick={() => { setCurrentSection(item.id); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${currentSection === item.id ? "bg-violet-200/15 text-violet-100" : "text-[#f7f0df]/54 hover:bg-[#f7f0df]/5 hover:text-[#f7f0df]"}`}>
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="rounded-2xl border border-violet-200/20 bg-violet-200/8 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-xs font-black text-[#090511]">{user?.avatar}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{user?.name}</p>
                <p className="truncate text-[10px] text-[#f7f0df]/40">{user?.email}</p>
              </div>
            </div>
            <button type="button" onClick={onLogout} className="mt-3 w-full rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 py-2 text-xs font-bold text-[#f7f0df]/60 hover:bg-rose-400/10 hover:text-rose-200">Sign Out</button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-[#f7f0df]/10 bg-[#0b0714]/60 px-6 py-4 backdrop-blur-xl lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded-xl border border-white/10 px-3 py-2 text-sm">☰ Menu</button>
          <span className="text-sm font-bold">Tiger Fitness Pro</span>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-xs font-black text-[#090511]">{user?.avatar}</div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Dashboard                                                         */
/* ---------------------------------------------------------------- */

function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const bmi = user.height > 0 ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1) : "--";
  const bmiCategory = parseFloat(bmi) < 18.5 ? "Underweight" : parseFloat(bmi) < 25 ? "Normal" : parseFloat(bmi) < 30 ? "Overweight" : "Obese";

  const stats = [
    { label: "Today's Energy", value: "82%", icon: "⚡", color: "from-violet-300 to-fuchsia-400" },
    { label: "Tiger Score", value: "94", icon: "🐅", color: "from-[#d8b35a] to-orange-400" },
    { label: "Streak", value: `${user.streak} days`, icon: "🔥", color: "from-rose-300 to-pink-400" },
    { label: "Goal Chance", value: "87%", icon: "🎯", color: "from-emerald-300 to-cyan-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-100/70">Good morning,</p>
        <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">{user.name} 👋</h1>
        <p className="mt-1 text-sm text-[#f7f0df]/50">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f7f0df]/44">{s.label}</p>
                <p className={`mt-2 bg-gradient-to-r ${s.color} bg-clip-text text-3xl font-black text-transparent`}>{s.value}</p>
              </div>
              <span className="text-3xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's Plan */}
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Today's Plan</h2>
            <span className="rounded-full bg-violet-200/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-violet-100">AI Generated</span>
          </div>
          <div className="mt-5 space-y-3">
            {[
              { time: "6:30 AM", title: "Morning Meditation", duration: "10 min", icon: "🧘", done: true },
              { time: "7:00 AM", title: "Push Strength Workout", duration: "45 min", icon: "💪", done: true },
              { time: "9:00 AM", title: "High-Protein Breakfast", duration: "30 min", icon: "🍳", done: true },
              { time: "1:00 PM", title: "Lunch: Dal + Rice + Paneer", duration: "30 min", icon: "🍛", done: false },
              { time: "6:00 PM", title: "Evening Walk", duration: "30 min", icon: "🚶", done: false },
              { time: "9:30 PM", title: "Sleep Routine", duration: "8 hrs", icon: "😴", done: false },
            ].map((task, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-3 transition hover:bg-[#f7f0df]/10">
                <span className="text-2xl">{task.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${task.done ? "text-[#f7f0df]/40 line-through" : "text-[#f7f0df]"}`}>{task.title}</p>
                  <p className="text-xs text-[#f7f0df]/40">{task.time} · {task.duration}</p>
                </div>
                <div className={`grid h-7 w-7 place-items-center rounded-full border-2 ${task.done ? "border-violet-300 bg-violet-300 text-[#14050a]" : "border-[#f7f0df]/20"}`}>
                  {task.done && <span className="text-xs font-black">✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#f7f0df]/50">Body Composition</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#f7f0df]/60">BMI</span>
                <span className="font-bold">{bmi} <span className="text-xs font-normal text-[#f7f0df]/40">({bmiCategory})</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#f7f0df]/60">Weight</span>
                <span className="font-bold">{user.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#f7f0df]/60">Height</span>
                <span className="font-bold">{user.height} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#f7f0df]/60">Metabolic Age</span>
                <span className="font-bold text-emerald-300">{user.age - 4} yrs</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8b35a]/20 bg-gradient-to-br from-[#d8b35a]/10 to-violet-200/8 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d8b35a]">💍 Wedding Mode</p>
            <p className="mt-2 text-xl font-black">87 days to go</p>
            <p className="mt-1 text-xs text-[#f7f0df]/54">You're 72% to your goal</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f7f0df]/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#d8b35a] to-orange-400" style={{ width: "72%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbox Preview */}
      <div className="rounded-2xl border border-violet-200/20 bg-violet-200/6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-violet-100">🧰 Fitness Toolbox</p>
            <h2 className="mt-2 text-xl font-black">Calculate above first — these auto-fill from your stats</h2>
            <p className="mt-1 text-sm text-[#f7f0df]/60">10+ pro-grade calculators for ideal weight, FFMI, protein needs & more.</p>
          </div>
          <button type="button" onClick={() => window.location.hash = "#app"} className="rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">Open Toolbox →</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Feature Pages                                                     */
/* ---------------------------------------------------------------- */

function WorkoutsPage() {
  const { user, updateUser } = useAuth();
  const [started, setStarted] = useState<string | null>(null);

  const plans = [
    { id: "push", title: "Push Strength", duration: "45 min", level: "Intermediate", muscles: "Chest, Shoulders, Triceps", icon: "💪", exercises: 8 },
    { id: "pull", title: "Pull Power", duration: "40 min", level: "Intermediate", muscles: "Back, Biceps, Forearms", icon: "🏋️", exercises: 7 },
    { id: "legs", title: "Leg Day Domination", duration: "50 min", level: "Advanced", muscles: "Quads, Hamstrings, Glutes", icon: "🦵", exercises: 9 },
    { id: "core", title: "Core Crusher", duration: "25 min", level: "Beginner", muscles: "Abs, Obliques, Lower Back", icon: "🔥", exercises: 6 },
    { id: "hiit", title: "HIIT Cardio Blast", duration: "30 min", level: "Advanced", muscles: "Full Body", icon: "⚡", exercises: 10 },
    { id: "yoga", title: "Recovery Yoga", duration: "35 min", level: "All Levels", muscles: "Flexibility & Balance", icon: "🧘", exercises: 12 },
  ];

  function startWorkout(planId: string) {
    setStarted(planId);
    setTimeout(() => {
      setStarted(null);
      if (user) updateUser({ stats: { ...user.stats, totalWorkouts: user.stats.totalWorkouts + 1 }, streak: user.streak + 1 });
    }, 3000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">Workouts</h1>
          <p className="text-sm text-[#f7f0df]/50">AI-personalized based on your goals and recovery</p>
        </div>
        <div className="rounded-full bg-emerald-300/15 px-4 py-2 text-xs font-bold text-emerald-200">Energy: 82% · Go hard today!</div>
      </div>

      {started ? (
        <div className="rounded-3xl border border-violet-200/30 bg-gradient-to-br from-violet-200/15 to-fuchsia-400/8 p-10 text-center">
          <div className="text-6xl animate-pulse">💪</div>
          <h2 className="mt-6 text-3xl font-black">Workout in Progress</h2>
          <p className="mt-2 text-sm text-[#f7f0df]/60">Keep going! You're doing amazing.</p>
          <div className="mt-6 mx-auto max-w-sm">
            <div className="h-2 overflow-hidden rounded-full bg-[#f7f0df]/10">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-400 animate-pulse" style={{ width: "33%" }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className="group rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6 transition-all hover:-translate-y-1 hover:border-violet-200/30">
              <div className="flex items-start justify-between">
                <span className="text-5xl">{p.icon}</span>
                <span className="rounded-full bg-violet-200/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-100">{p.level}</span>
              </div>
              <h3 className="mt-4 text-xl font-black">{p.title}</h3>
              <p className="mt-1 text-xs text-[#f7f0df]/50">{p.muscles}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-[#f7f0df]/40">
                <span>⏱ {p.duration}</span>
                <span>🎯 {p.exercises} exercises</span>
              </div>
              <button type="button" onClick={() => startWorkout(p.id)} className="mt-5 w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_12px_40px_rgba(167,139,250,0.25)] transition-all hover:shadow-[0_18px_60px_rgba(167,139,250,0.4)]">
                Start Workout
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NutritionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Nutrition Tracker</h1>
        <p className="text-sm text-[#f7f0df]/50">Track meals, scan food, hit your macros</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/44">Today's Calories</p>
          <p className="mt-3 bg-gradient-to-r from-violet-200 to-fuchsia-400 bg-clip-text text-5xl font-black text-transparent">1,680</p>
          <p className="mt-1 text-xs text-[#f7f0df]/50">of 2,200 kcal goal</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f7f0df]/10">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-400" style={{ width: "76%" }} />
          </div>
        </div>
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/44">Protein</p>
          <p className="mt-3 bg-gradient-to-r from-emerald-300 to-cyan-400 bg-clip-text text-5xl font-black text-transparent">124g</p>
          <p className="mt-1 text-xs text-[#f7f0df]/50">of 150g goal</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f7f0df]/10">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-400" style={{ width: "83%" }} />
          </div>
        </div>
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/44">Water</p>
          <p className="mt-3 bg-gradient-to-r from-[#d8b35a] to-orange-400 bg-clip-text text-5xl font-black text-transparent">2.4L</p>
          <p className="mt-1 text-xs text-[#f7f0df]/50">of 3L goal</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f7f0df]/10">
            <div className="h-full rounded-full bg-gradient-to-r from-[#d8b35a] to-orange-400" style={{ width: "80%" }} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#d8b35a]/20 bg-gradient-to-br from-[#d8b35a]/10 to-violet-200/8 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d8b35a]">📸 Smart Scanner</p>
            <h2 className="mt-2 text-2xl font-black">Scan any Indian meal</h2>
            <p className="mt-1 text-sm text-[#f7f0df]/60">Get instant calories, protein, carbs & fat</p>
          </div>
          <button type="button" className="rounded-full bg-gradient-to-r from-[#d8b35a] to-orange-400 px-7 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#090511]">
            📷 Open Scanner
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
        <h3 className="mb-4 text-lg font-bold">Today's Meals</h3>
        <div className="space-y-3">
          {[
            { meal: "Breakfast", items: "3 Egg whites, 1 toast, black coffee", kcal: 320, time: "8:00 AM" },
            { meal: "Mid-Morning", items: "1 Apple + 10 Almonds", kcal: 180, time: "11:00 AM" },
            { meal: "Lunch", items: "2 Roti, Dal, Paneer Sabzi, Salad", kcal: 580, time: "1:30 PM" },
            { meal: "Evening", items: "Protein Shake + Banana", kcal: 240, time: "5:00 PM" },
          ].map((m) => (
            <div key={m.meal} className="flex items-center justify-between rounded-xl border border-[#f7f0df]/8 bg-[#f7f0df]/5 p-4">
              <div>
                <p className="font-bold">{m.meal} <span className="text-xs text-[#f7f0df]/40">· {m.time}</span></p>
                <p className="text-sm text-[#f7f0df]/50">{m.items}</p>
              </div>
              <span className="text-sm font-bold text-violet-100">{m.kcal} kcal</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressPage() {
  const { user, updateUser } = useAuth();
  const log = user?.stats.weightLog || [];
  const max = log.length ? Math.max(...log.map((l) => l.weight)) : 0;
  const min = log.length ? Math.min(...log.map((l) => l.weight)) : 0;
  const range = max - min;
  const [newWeight, setNewWeight] = useState("");
  const [saving, setSaving] = useState(false);

  async function addEntry() {
    const w = parseFloat(newWeight);
    if (!w || w < 20 || w > 300) return;
    setSaving(true);
    const entry = { date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }), weight: w };
    await updateUser({ stats: { ...user!.stats, weightLog: [...log, entry] } });
    setNewWeight("");
    setSaving(false);
  }

  const totalChange = log.length >= 2 ? (log[log.length - 1].weight - log[0].weight).toFixed(1) : "0.0";
  const isLoss = parseFloat(totalChange) < 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Progress</h1>
        <p className="text-sm text-[#f7f0df]/50">Your transformation journey, visualized</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Starting Weight", value: `${log[0]?.weight || "--"} kg`, icon: "⚖️" },
          { label: "Current Weight", value: `${log[log.length - 1]?.weight || "--"} kg`, icon: "📍" },
          { label: isLoss ? "Total Lost" : "Total Gained", value: `${Math.abs(parseFloat(totalChange))} kg`, icon: isLoss ? "🎉" : "💪", color: isLoss ? "text-emerald-300" : "text-violet-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/44">{s.label}</p>
            <p className={`mt-3 text-3xl font-black ${s.color || "text-[#f7f0df]"}`}>{s.value}</p>
            <span className="text-2xl">{s.icon}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
        <h3 className="mb-6 text-lg font-bold">Weight Journey (6 Weeks)</h3>
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between gap-2">
            {log.map((point, i) => {
              const height = range > 0 ? ((point.weight - min) / range) * 80 + 20 : 50;
              return (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <div className="relative flex flex-1 w-full items-end">
                    <div className="w-full rounded-t-full bg-gradient-to-t from-violet-700 via-violet-300 to-[#f7f0df] transition-all" style={{ height: `${height}%` }} />
                  </div>
                  <p className="mt-2 text-[10px] text-[#f7f0df]/40">{point.date}</p>
                  <p className="text-xs font-bold">{point.weight}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Log new weight */}
      <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
        <h3 className="mb-4 font-bold">⚖️ Log Today's Weight</h3>
        <div className="flex gap-3">
          <input
            type="number"
            step="0.1"
            min="20"
            max="300"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="e.g. 75.5"
            className="flex-1 rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm text-[#f7f0df] outline-none focus:border-violet-200/40"
          />
          <button
            type="button"
            onClick={addEntry}
            disabled={saving || !newWeight}
            className="rounded-xl bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add Entry"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
          <h3 className="font-bold">📏 Body Measurements</h3>
          <div className="mt-4 space-y-3">
            {[["Chest", "102 cm", "-2 cm"], ["Waist", "82 cm", "-4 cm"], ["Hips", "98 cm", "-1 cm"], ["Biceps", "36 cm", "+1.5 cm"]].map(([part, val, change]) => (
              <div key={part} className="flex justify-between border-t border-[#f7f0df]/8 pt-3">
                <span className="text-sm">{part}</span>
                <span className="text-sm font-bold">{val} <span className="text-xs text-emerald-300">({change})</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200/20 bg-violet-200/8 p-6">
          <h3 className="font-bold">🏆 Achievements</h3>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { icon: "💧", name: "Hydration King", unlocked: true },
              { icon: "🔥", name: "7-Day Streak", unlocked: true },
              { icon: "💪", name: "50 Workouts", unlocked: true },
              { icon: "🥗", name: "Macro Master", unlocked: false },
              { icon: "😴", name: "Sleep Champion", unlocked: true },
              { icon: "🎯", name: "Goal Crusher", unlocked: false },
            ].map((a) => (
              <div key={a.name} className={`rounded-xl border p-3 text-center ${a.unlocked ? "border-violet-200/30 bg-violet-200/10" : "border-[#f7f0df]/5 bg-[#f7f0df]/3 opacity-40"}`}>
                <div className="text-3xl">{a.icon}</div>
                <p className="mt-1 text-[10px] font-bold">{a.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_HABITS = [
  { id: 1, name: "Drink 3L water", streak: 0, icon: "💧", done: false },
  { id: 2, name: "8 hours sleep", streak: 0, icon: "😴", done: false },
  { id: 3, name: "10 min meditation", streak: 0, icon: "🧘", done: false },
  { id: 4, name: "No sugar", streak: 0, icon: "🚫", done: false },
  { id: 5, name: "10K steps", streak: 0, icon: "🚶", done: false },
  { id: 6, name: "Protein goal", streak: 0, icon: "🍗", done: false },
];

function HabitsPage() {
  const { user, updateUser } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const stored = (user as any)?.habits;
  const [habits, setHabits] = useState(() => {
    if (stored?.date === today) return stored.items;
    // New day — reset done flags but keep streaks
    const base = stored?.items || DEFAULT_HABITS;
    return base.map((h: any) => ({ ...h, done: false }));
  });

  async function toggle(id: number) {
    const updated = habits.map((h: any) =>
      h.id === id ? { ...h, done: !h.done, streak: !h.done ? h.streak + 1 : Math.max(0, h.streak - 1) } : h
    );
    setHabits(updated);
    await updateUser({ habits: { date: today, items: updated } } as any);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Daily Habits</h1>
        <p className="text-sm text-[#f7f0df]/50">Build consistency, unlock achievements · {today}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {habits.map((h: any) => (
          <button key={h.id} type="button" onClick={() => toggle(h.id)} className={`rounded-2xl border p-6 text-left transition ${h.done ? "border-violet-200/40 bg-violet-200/12" : "border-[#f7f0df]/10 bg-[#f7f0df]/5 hover:bg-[#f7f0df]/10"}`}>
            <div className="flex items-start justify-between">
              <span className="text-4xl">{h.icon}</span>
              <div className={`grid h-8 w-8 place-items-center rounded-full border-2 ${h.done ? "border-violet-300 bg-violet-300 text-[#14050a]" : "border-[#f7f0df]/20"}`}>
                {h.done && <span className="text-sm font-black">✓</span>}
              </div>
            </div>
            <p className="mt-4 font-bold">{h.name}</p>
            <p className="mt-1 text-xs text-[#f7f0df]/50">🔥 {h.streak} day streak</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function FamilyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Family Health</h1>
        <p className="text-sm text-[#f7f0df]/50">Track your whole family in one place</p>
      </div>
      <div className="rounded-2xl border border-[#d8b35a]/20 bg-gradient-to-br from-[#d8b35a]/10 to-violet-200/8 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d8b35a]">👑 Elite Feature</p>
        <h2 className="mt-2 text-xl font-black">Unlock Family Dashboard</h2>
        <p className="mt-1 text-sm text-[#f7f0df]/60">Track parents, spouse, and kids. Upgrade to Elite plan.</p>
        <button type="button" className="mt-4 rounded-full bg-gradient-to-r from-[#d8b35a] to-orange-400 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#090511]">Upgrade to Elite · ₹399/mo</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { name: "You", role: "Pro Member", avatar: "YO", color: "from-violet-300 to-fuchsia-400" },
          { name: "Spouse", role: "Locked · Upgrade to Elite", avatar: "SP", color: "from-pink-300 to-rose-400", locked: true },
          { name: "Father", role: "Locked · Upgrade to Elite", avatar: "FA", color: "from-emerald-300 to-cyan-400", locked: true },
          { name: "Mother", role: "Locked · Upgrade to Elite", avatar: "MO", color: "from-[#d8b35a] to-orange-400", locked: true },
        ].map((m) => (
          <div key={m.name} className={`rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6 ${m.locked ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-4">
              <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${m.color} text-lg font-black text-[#090511]`}>{m.avatar}</div>
              <div>
                <p className="text-lg font-bold">{m.name}</p>
                <p className="text-xs text-[#f7f0df]/50">{m.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PremiumPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Premium Plans</h1>
        <p className="text-sm text-[#f7f0df]/50">Unlock the full Tiger Fitness Pro experience</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { name: "Free", price: "₹0", period: "forever", features: ["Basic workouts", "5 AI sessions/month", "Community access", "Basic tracking"], current: true },
          { name: "Pro", price: "₹199", period: "/month", features: ["Everything in Free", "Unlimited AI coaching", "Indian food scanner", "Wedding mode", "Progress recognition", "Accountability AI"], popular: true },
          { name: "Elite Family", price: "₹399", period: "/month", features: ["Everything in Pro", "Up to 8 family members", "Medical report analyzer", "Voice fitness coach", "Travel mode", "Priority support"], },
        ].map((p) => (
          <div key={p.name} className={`relative rounded-2xl border p-8 ${p.popular ? "border-violet-300/40 bg-violet-200/10 shadow-[0_0_60px_rgba(167,139,250,0.15)]" : "border-[#f7f0df]/10 bg-[#f7f0df]/5"}`}>
            {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-400 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">MOST POPULAR</div>}
            <h3 className="text-2xl font-black">{p.name}</h3>
            <p className="mt-2 text-sm text-[#f7f0df]/50">{(p as any).description || ""}</p>
            <div className="mt-6 flex items-end gap-1"><span className="text-5xl font-black">{p.price}</span><span className="pb-2 text-sm text-[#f7f0df]/48">{p.period}</span></div>
            {(p as any).current ? (
              <div className="mt-6 rounded-full border border-emerald-300/30 bg-emerald-300/10 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Current Plan</div>
            ) : (
              <button type="button" className="mt-6 w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">
                {p.name === "Elite Family" ? "Upgrade to Elite" : "Start Pro Trial"}
              </button>
            )}
            <ul className="mt-6 space-y-2.5">
              {p.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm text-[#f7f0df]/68"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />{f}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [tab, setTab] = useState<"profile" | "preferences" | "billing" | "privacy">("profile");
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", age: String(user?.age || ""), height: String(user?.height || ""), weight: String(user?.weight || "") });
  const [saved, setSaved] = useState(false);

  async function saveProfile() {
    await updateUser({ name: form.name, phone: form.phone, age: +form.age, height: +form.height, weight: +form.weight, avatar: (form.name.split(" ").map((n: string) => n[0]).join("").toUpperCase() + "XX").slice(0, 2) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(user, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tigerfitpro-data-${user?.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAccount() {
    if (!confirm("Permanently delete your account and all data? This cannot be undone.")) return;
    try {
      if (auth.currentUser) {
        await deleteDoc(doc(db, "users", auth.currentUser.uid));
        await deleteUser(auth.currentUser);
      }
      logout();
    } catch {
      alert("Please sign out and sign back in before deleting your account, then try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Settings</h1>
        <p className="text-sm text-[#f7f0df]/50">Manage your account and preferences</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "profile", label: "Profile" },
          { id: "preferences", label: "Preferences" },
          { id: "billing", label: "Billing" },
          { id: "privacy", label: "Privacy" },
        ].map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id as any)} className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition ${tab === t.id ? "bg-violet-200/20 text-violet-50 ring-1 ring-violet-200/30" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/54"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
          <div className="flex items-center gap-4 border-b border-[#f7f0df]/10 pb-6">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#d8b35a] text-2xl font-black text-[#090511]">{user?.avatar}</div>
            <div>
              <p className="text-xl font-bold">{user?.name}</p>
              <p className="text-sm text-[#f7f0df]/50">{user?.email}</p>
              <p className="mt-2 text-xs text-[#f7f0df]/40">Member since {user?.joinDate}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Email</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Age</span><input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Height (cm)</span><input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Weight (kg)</span><input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={saveProfile} className={"rounded-full px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition " + (saved ? "bg-emerald-500" : "bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700")}>{saved ? "✓ Saved!" : "Save Changes"}</button>
            <button type="button" onClick={logout} className="rounded-full border border-rose-400/30 bg-rose-400/10 px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-rose-200 hover:bg-rose-400/20">Sign Out</button>
          </div>
        </div>
      )}

      {tab === "preferences" && (
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
          <div className="space-y-4">
            {[
              { label: "Email Notifications", desc: "Get workout reminders and tips", key: "emailNotifications" as const },
              { label: "Push Notifications", desc: "Real-time alerts and streak reminders", key: "pushNotifications" as const },
              { label: "Weekly Reports", desc: "Every Monday progress summary", key: "weeklyReports" as const },
              { label: "AI Coach Messages", desc: "Daily personalized guidance", key: "aiCoach" as const },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
                <div><p className="font-bold">{p.label}</p><p className="text-xs text-[#f7f0df]/50">{p.desc}</p></div>
                <label className="relative inline-flex cursor-pointer items-center"><input type="checkbox" defaultChecked={user?.preferences?.[p.key]} onChange={(e) => updateUser({ preferences: { ...user!.preferences, [p.key]: e.target.checked } })} className="peer sr-only" /><div className="h-7 w-[52px] rounded-full bg-[#f7f0df]/15 peer-checked:bg-violet-300 after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-[28px]" /></label>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "billing" && (
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6">
          <h3 className="font-bold">Current Plan</h3>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-violet-200/20 bg-violet-200/10 p-5">
            <div>
              <p className="text-xl font-black">{user?.plan} Plan</p>
              <p className="text-xs text-[#f7f0df]/50">Next billing: July 1, 2025</p>
            </div>
            <button type="button" className="rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white">Upgrade</button>
          </div>
          <h3 className="mt-6 font-bold">Payment Method</h3>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-[#d8b35a] to-orange-400 text-xs font-black text-[#090511]">UPI</div>
              <div><p className="font-bold">UPI ID</p><p className="text-xs text-[#f7f0df]/50">user@paytm</p></div>
            </div>
            <button type="button" className="text-xs font-bold text-violet-100">Change</button>
          </div>
        </div>
      )}

      {tab === "privacy" && (
        <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="font-bold">Export My Data</p><p className="text-xs text-[#f7f0df]/50">Download all your data as JSON</p></div>
            <button type="button" onClick={exportData} className="rounded-full border border-[#f7f0df]/18 bg-[#f7f0df]/8 px-5 py-2.5 text-xs font-bold hover:bg-violet-200/15">Export</button>
          </div>
          <div className="flex items-center justify-between border-t border-[#f7f0df]/10 pt-4">
            <div><p className="font-bold">Delete Account</p><p className="text-xs text-[#f7f0df]/50">Permanently delete all your data</p></div>
            <button type="button" onClick={deleteAccount} className="rounded-full border border-rose-400/30 bg-rose-400/10 px-5 py-2.5 text-xs font-bold text-rose-200 hover:bg-rose-400/20">Delete</button>
          </div>
          <p className="border-t border-[#f7f0df]/10 pt-4 text-xs text-[#f7f0df]/40">Version 2.1.0 · Built with 🐅 in India</p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Main App Router                                                   */
/* ---------------------------------------------------------------- */

export default function SaaSApp() {
  const { user, authLoading, logout } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [section, setSection] = useState("dashboard");

  // Firebase checking session
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07040d]">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-violet-300/20 border-t-violet-300" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#f7f0df]/40">Loading…</p>
        </div>
      </div>
    );
  }

  // Not logged in → show login
  if (!user) {
    if (authMode === "login") return <LoginPage onSwitch={() => setAuthMode("signup")} onSuccess={() => {}} />;
    return <SignupPage onSwitch={() => setAuthMode("login")} onSuccess={() => {}} />;
  }

  // Logged in but onboarding incomplete → show wizard
  if (!user.onboardingComplete) {
    return <OnboardingWizard onComplete={() => setSection("dashboard")} />;
  }

  // Logged in + onboarded → show app shell
  return (
    <AppShell currentSection={section} setCurrentSection={setSection} onLogout={logout}>
      {section === "dashboard" && <Dashboard />}
      {section === "workouts" && <WorkoutsPage />}
      {section === "nutrition" && <NutritionPage />}
      {section === "toolbox" && <FitnessToolbox />}
      {section === "diet" && <DietCalculator />}
      {section === "roadmap" && <GoalRoadmap />}
      {section === "transform" && <Transformations />}
      {section === "referrals" && <Referrals />}
      {section === "leaderboard" && <Leaderboard />}
      {section === "progress" && <ProgressPage />}
      {section === "habits" && <HabitsPage />}
      {section === "blood" && <BloodReportPage />}
      {section === "challenges" && <ChallengesPage />}
      {section === "courses" && <CoursesPage />}
      {section === "family" && <FamilyPage />}
      {section === "premium" && <PremiumPage />}
      {section === "settings" && <SettingsPage />}
    </AppShell>
  );
}
