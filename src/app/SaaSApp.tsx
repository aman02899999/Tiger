import { useState, useEffect } from "react";
import { deleteUser } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../auth/AuthSystem";
import WorkoutPlayer from "./WorkoutPlayer";
import { addXP } from "./Achievements";
import { DailyChecklist, MoodCheckIn, WeeklyActivity, QuickActions } from "./DashboardWidgets";
import { useCheckout, PLANS, type PlanId } from "./Checkout";
import TitanIntelligence from "./TitanIntelligence";
import NutritionTracker from "./NutritionTracker";
import { collectTitanData, energyScore } from "./insights";
import { useEntitlement, usePayments } from "../data/hooks";
import { entitlementIsLive } from "../domain/validation";

/* ---------------------------------------------------------------- */
/* Legacy consumer surfaces — mounted by src/saas/Shell.tsx          */
/* ---------------------------------------------------------------- */
/* The pre-SaaS Tiger experience: personal trackers, habits, family   */
/* profiles and the consumer premium screen. Retained verbatim and    */
/* mounted inside the member workspace; these screens keep their own  */
/* local (non-authoritative) records and never gate entitlements.     */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* App Shell with Sidebar                                            */
/* ---------------------------------------------------------------- */

export function Dashboard({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { user } = useAuth();
  if (!user) return null;

  const bmi = user.height > 0 ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1) : "--";
  const bmiCategory = parseFloat(bmi) < 18.5 ? "Underweight" : parseFloat(bmi) < 25 ? "Normal" : parseFloat(bmi) < 30 ? "Overweight" : "Obese";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-100/70">Good morning,</p>
        <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-[-0.04em]">{user.name} 👋</h1>
        <p className="mt-1 text-sm text-[#e9f3f5]/68">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Real, derived scores + ranked fixes — replaces the old
          hardcoded "82% / 94 / 87%" tiles that never changed. */}
      <TitanIntelligence onNavigate={onNavigate} />

      {/* Quick action launcher */}
      <QuickActions onNavigate={onNavigate} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Interactive daily checklist */}
        <DailyChecklist />

        {/* Mood + Quick Stats */}
        <div className="space-y-4">
          <MoodCheckIn />
          <div className="rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/68">Body Composition</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#e9f3f5]/60">BMI</span>
                <span className="font-bold">{bmi} <span className="text-xs font-normal text-[#e9f3f5]/62">({bmiCategory})</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#e9f3f5]/60">Weight</span>
                <span className="font-bold">{user.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#e9f3f5]/60">Height</span>
                <span className="font-bold">{user.height} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#e9f3f5]/60">Metabolic Age</span>
                <span className="font-bold text-emerald-300">{user.age - 4} yrs</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ffb627]/20 bg-gradient-to-br from-[#ffb627]/10 to-violet-200/8 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb627]">💍 Wedding Mode</p>
            <p className="mt-2 text-xl font-black">87 days to go</p>
            <p className="mt-1 text-xs text-[#e9f3f5]/68">You're 72% to your goal</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e9f3f5]/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[#ffb627] to-orange-400" style={{ width: "72%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly activity chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        <WeeklyActivity />
        <div className="rounded-2xl border border-[#ffb627]/20 bg-gradient-to-br from-[#ffb627]/10 to-violet-200/8 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb627]">🏆 Titan Tip of the Day</p>
          <p className="mt-3 text-sm leading-relaxed text-[#e9f3f5]/80">Progressive overload is the #1 driver of results — aim to add a little weight or one more rep versus last week. Small wins compound.</p>
          <button type="button" onClick={() => onNavigate("aicoach")} className="btn-gloss mt-4 rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white">Ask the Coach →</button>
        </div>
      </div>

      {/* Toolbox Preview */}
      <div className="rounded-2xl border border-violet-200/20 bg-violet-200/6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-violet-100">🧰 Fitness Toolbox</p>
            <h2 className="mt-2 text-xl font-black">Calculate above first — these auto-fill from your stats</h2>
            <p className="mt-1 text-sm text-[#e9f3f5]/60">10+ pro-grade calculators for ideal weight, FFMI, protein needs & more.</p>
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

/* Reads the same derived Energy score the dashboard shows, so the two can
   never disagree, and adapts the training advice to it. */
export function EnergyBadge() {
  const { user } = useAuth();
  const [score, setScore] = useState<{ value: number; estimated: boolean } | null>(null);

  useEffect(() => {
    const s = energyScore(collectTitanData(user));
    setScore({ value: s.value, estimated: s.estimated });
  }, [user]);

  if (!score) return null;

  const { value, estimated } = score;
  const advice =
    value >= 75 ? "Go hard today!" :
    value >= 55 ? "Solid — train as planned." :
    value >= 35 ? "Dial it back ~20%." :
    "Recovery day recommended.";
  const tone =
    value >= 75 ? "bg-emerald-300/15 text-emerald-200" :
    value >= 55 ? "bg-teal-300/15 text-teal-100" :
    value >= 35 ? "bg-amber-300/15 text-amber-200" :
    "bg-rose-400/15 text-rose-200";

  return (
    <div className={`rounded-full px-4 py-2 text-xs font-bold ${tone}`}>
      Energy: {value}%{estimated ? " (est)" : ""} · {advice}
    </div>
  );
}

export function WorkoutsPage() {
  const { user, updateUser } = useAuth();
  const [started, setStarted] = useState<string | null>(null);

  const photo = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;
  const plans = [
    { id: "push", title: "Push Strength", duration: "45 min", level: "Intermediate", muscles: "Chest, Shoulders, Triceps", icon: "💪", exercises: 8, image: photo("photo-1571019613454-1cb2f99b2d8b") },
    { id: "pull", title: "Pull Power", duration: "40 min", level: "Intermediate", muscles: "Back, Biceps, Forearms", icon: "🏋️", exercises: 7, image: photo("photo-1541534741688-6078c6bfb5c5") },
    { id: "legs", title: "Leg Day Domination", duration: "50 min", level: "Advanced", muscles: "Quads, Hamstrings, Glutes", icon: "🦵", exercises: 9, image: photo("photo-1517963879433-6ad2b056d712") },
    { id: "core", title: "Core Crusher", duration: "25 min", level: "Beginner", muscles: "Abs, Obliques, Lower Back", icon: "🔥", exercises: 6, image: photo("photo-1544033527-b192daee1f5b") },
    { id: "hiit", title: "HIIT Cardio Blast", duration: "30 min", level: "Advanced", muscles: "Full Body", icon: "⚡", exercises: 10, image: photo("photo-1434682881908-b43d0467b798") },
    { id: "yoga", title: "Recovery Yoga", duration: "35 min", level: "All Levels", muscles: "Flexibility & Balance", icon: "🧘", exercises: 12, image: photo("photo-1518310383802-640c2de311b2") },
  ];

  function startWorkout(planId: string) {
    setStarted(planId);
  }

  function finishWorkout(xp: number) {
    if (user) {
      addXP(user.email, xp);
      updateUser({ stats: { ...user.stats, totalWorkouts: user.stats.totalWorkouts + 1 }, streak: user.streak + 1 });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">Workouts</h1>
          <p className="text-sm text-[#e9f3f5]/68">AI-personalized based on your goals and recovery</p>
        </div>
        <EnergyBadge />
      </div>

      {started ? (
        <WorkoutPlayer
          planId={started}
          planTitle={plans.find((p) => p.id === started)?.title ?? "Workout"}
          onFinish={finishWorkout}
          onExit={() => setStarted(null)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className="group overflow-hidden rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 transition-all hover:-translate-y-1 hover:border-violet-200/30">
              <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-violet-950 to-fuchsia-950">
                <img src={p.image} alt={`${p.title} demonstration`} loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a141f]/80 via-transparent to-transparent" />
                <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-100 backdrop-blur">{p.level}</span>
              </div>
              <div className="p-6 pt-4">
              <div className="flex items-start justify-between">
                <span className="text-5xl">{p.icon}</span>
              </div>
              <h3 className="mt-4 text-xl font-black">{p.title}</h3>
              <p className="mt-1 text-xs text-[#e9f3f5]/68">{p.muscles}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-[#e9f3f5]/62">
                <span>⏱ {p.duration}</span>
                <span>🎯 {p.exercises} exercises</span>
              </div>
              <button type="button" onClick={() => startWorkout(p.id)} className="mt-5 w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[0_12px_40px_rgba(45,212,191,0.25)] transition-all hover:shadow-[0_18px_60px_rgba(45,212,191,0.4)]">
                Start Workout
              </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* The old NutritionPage rendered fixed numbers (1,680 kcal / 124g / 2.4L)
   that no control could change. It is replaced by NutritionTracker, which
   logs real meals + water, persists per user per day, derives targets from
   the profile, and feeds Titan Intelligence. */
export function NutritionPage() {
  return (
    <div className="space-y-6">
      <NutritionTracker />

      <div className="rounded-2xl border border-[#ffb627]/20 bg-gradient-to-br from-[#ffb627]/10 to-teal-200/8 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ffb627]">📸 Smart Scanner</p>
            <h2 className="mt-2 text-2xl font-black">Scan any Indian meal</h2>
            <p className="mt-1 text-sm text-[#e9f3f5]/60">Get instant calories, protein, carbs &amp; fat</p>
          </div>
          <button type="button" className="rounded-full bg-gradient-to-r from-[#ffb627] to-orange-400 px-7 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#04121a]">
            📷 Open Scanner
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProgressPage() {
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
        <p className="text-sm text-[#e9f3f5]/68">Your transformation journey, visualized</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {[
          { label: "Starting Weight", value: `${log[0]?.weight || "--"} kg`, icon: "⚖️" },
          { label: "Current Weight", value: `${log[log.length - 1]?.weight || "--"} kg`, icon: "📍" },
          { label: isLoss ? "Total Lost" : "Total Gained", value: `${Math.abs(parseFloat(totalChange))} kg`, icon: isLoss ? "🎉" : "💪", color: isLoss ? "text-emerald-300" : "text-violet-300" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/65">{s.label}</p>
            <p className={`mt-3 text-3xl font-black ${s.color || "text-[#e9f3f5]"}`}>{s.value}</p>
            <span className="text-2xl">{s.icon}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-6">
        <h3 className="mb-6 text-lg font-bold">Weight Journey (6 Weeks)</h3>
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end justify-between gap-2">
            {log.map((point, i) => {
              const height = range > 0 ? ((point.weight - min) / range) * 80 + 20 : 50;
              return (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <div className="relative flex flex-1 w-full items-end">
                    <div className="w-full rounded-t-full bg-gradient-to-t from-violet-700 via-violet-300 to-[#e9f3f5] transition-all" style={{ height: `${height}%` }} />
                  </div>
                  <p className="mt-2 text-[10px] text-[#e9f3f5]/62">{point.date}</p>
                  <p className="text-xs font-bold">{point.weight}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Log new weight */}
      <div className="rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-6">
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
            className="flex-1 rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/6 px-4 py-3 text-sm text-[#e9f3f5] outline-none focus:border-violet-200/40"
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
        <div className="rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-6">
          <h3 className="font-bold">📏 Body Measurements</h3>
          <div className="mt-4 space-y-3">
            {[["Chest", "102 cm", "-2 cm"], ["Waist", "82 cm", "-4 cm"], ["Hips", "98 cm", "-1 cm"], ["Biceps", "36 cm", "+1.5 cm"]].map(([part, val, change]) => (
              <div key={part} className="flex justify-between border-t border-[#e9f3f5]/8 pt-3">
                <span className="text-sm">{part}</span>
                <span className="text-sm font-bold">{val} <span className="text-xs text-emerald-300">({change})</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200/20 bg-violet-200/8 p-6">
          <h3 className="font-bold">🏆 Achievements</h3>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: "💧", name: "Hydration King", unlocked: true },
              { icon: "🔥", name: "7-Day Streak", unlocked: true },
              { icon: "💪", name: "50 Workouts", unlocked: true },
              { icon: "🥗", name: "Macro Master", unlocked: false },
              { icon: "😴", name: "Sleep Champion", unlocked: true },
              { icon: "🎯", name: "Goal Crusher", unlocked: false },
            ].map((a) => (
              <div key={a.name} className={`rounded-xl border p-3 text-center ${a.unlocked ? "border-violet-200/30 bg-violet-200/10" : "border-[#e9f3f5]/5 bg-[#e9f3f5]/3 opacity-40"}`}>
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

export function HabitsPage() {
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
        <p className="text-sm text-[#e9f3f5]/68">Build consistency, unlock achievements · {today}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {habits.map((h: any) => (
          <button key={h.id} type="button" onClick={() => toggle(h.id)} className={`rounded-2xl border p-6 text-left transition ${h.done ? "border-violet-200/40 bg-violet-200/12" : "border-[#e9f3f5]/10 bg-[#e9f3f5]/5 hover:bg-[#e9f3f5]/10"}`}>
            <div className="flex items-start justify-between">
              <span className="text-4xl">{h.icon}</span>
              <div className={`grid h-8 w-8 place-items-center rounded-full border-2 ${h.done ? "border-violet-300 bg-violet-300 text-[#04121a]" : "border-[#e9f3f5]/20"}`}>
                {h.done && <span className="text-sm font-black">✓</span>}
              </div>
            </div>
            <p className="mt-4 font-bold">{h.name}</p>
            <p className="mt-1 text-xs text-[#e9f3f5]/68">🔥 {h.streak} day streak</p>
          </button>
        ))}
      </div>
    </div>
  );
}


export function FamilyPage() {
  const { openCheckout } = useCheckout();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Family Health</h1>
        <p className="text-sm text-[#e9f3f5]/68">Track your whole family in one place</p>
      </div>
      <div className="rounded-2xl border border-[#ffb627]/20 bg-gradient-to-br from-[#ffb627]/10 to-violet-200/8 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ffb627]">👑 Elite Feature</p>
        <h2 className="mt-2 text-xl font-black">Unlock Family Dashboard</h2>
        <p className="mt-1 text-sm text-[#e9f3f5]/60">Track parents, spouse, and kids. Upgrade to Elite plan.</p>
        <button type="button" onClick={() => openCheckout("elite")} className="btn-gloss mt-4 rounded-full bg-gradient-to-r from-[#ffb627] to-orange-400 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#04121a]">Upgrade to Elite · ₹399/mo</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { name: "You", role: "Pro Member", avatar: "YO", color: "from-violet-300 to-fuchsia-400" },
          { name: "Spouse", role: "Locked · Upgrade to Elite", avatar: "SP", color: "from-pink-300 to-rose-400", locked: true },
          { name: "Father", role: "Locked · Upgrade to Elite", avatar: "FA", color: "from-emerald-300 to-cyan-400", locked: true },
          { name: "Mother", role: "Locked · Upgrade to Elite", avatar: "MO", color: "from-[#ffb627] to-orange-400", locked: true },
        ].map((m) => (
          <div key={m.name} className={`rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-6 ${m.locked ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-4">
              <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${m.color} text-lg font-black text-[#04121a]`}>{m.avatar}</div>
              <div>
                <p className="text-lg font-bold">{m.name}</p>
                <p className="text-xs text-[#e9f3f5]/68">{m.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LaunchCountdown() {
  // Fixed 7-day window from first render this session; purely a UI urgency device.
  const [target] = useState(() => Date.now() + 1000 * 60 * 60 * 24 * 7);
  const [left, setLeft] = useState(target - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <div className="flex items-center gap-1.5 font-black tabular-nums">
      {[["d", d], ["h", h], ["m", m], ["s", s]].map(([label, v]) => (
        <span key={label as string} className="rounded-lg bg-black/30 px-2 py-1 text-sm">{String(v).padStart(2, "0")}<span className="ml-0.5 text-[9px] font-normal opacity-70">{label}</span></span>
      ))}
    </div>
  );
}

const COMPARISON_ROWS: { label: string; free: boolean | string; pro: boolean | string; elite: boolean | string }[] = [
  { label: "Guided workouts & Strength Lab", free: true, pro: true, elite: true },
  { label: "AI Coach conversations", free: "5/month", pro: "Unlimited", elite: "Unlimited" },
  { label: "Full Yoga & Meditation libraries", free: "Preview only", pro: true, elite: true },
  { label: "Macro Builder & Recipe Hub", free: true, pro: true, elite: true },
  { label: "Blood Report analyzer", free: false, pro: true, elite: true },
  { label: "Progress Photos & Body Metrics", free: true, pro: true, elite: true },
  { label: "PDF guide store discounts", free: false, pro: "10% off", elite: "25% off" },
  { label: "Family members tracked", free: "1", pro: "1", elite: "Up to 8" },
  { label: "Priority support", free: false, pro: false, elite: true },
];

function ComparisonCell({ v }: { v: boolean | string }) {
  if (v === true) return <span className="text-emerald-300">✓</span>;
  if (v === false) return <span className="text-[#e9f3f5]/30">—</span>;
  return <span className="text-xs font-semibold text-[#e9f3f5]/80">{v}</span>;
}

const FAQ_ITEMS = [
  { q: "Can I cancel anytime?", a: "Yes — cancel from Settings → Billing with one tap. You keep access until the end of your current billing period, no questions asked." },
  { q: "Is there a refund policy?", a: "Every paid plan is covered by a 7-day money-back guarantee. If Pro or Elite isn't for you, we refund in full." },
  { q: "What happens to my data if I downgrade?", a: "Nothing is deleted. Your logs, photos, and progress stay saved — Pro-only sections simply lock again until you re-upgrade." },
  { q: "Does Lifetime really mean forever?", a: "Yes. One payment unlocks Elite features for as long as The Titan Fitness exists — no recurring charges, ever." },
];

export function PremiumPage() {
  const { user } = useAuth();
  const { openCheckout } = useCheckout();
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const tiers = [
    { id: "free" as const, name: "Free", tagline: "Get started", features: ["Basic workouts", "5 AI Coach chats/month", "Community access", "Basic tracking"] },
    { id: "pro" as const, name: "Pro", tagline: "Most popular", popular: true, features: ["Everything in Free", "Unlimited AI Coach", "Full Yoga & Meditation libraries", "Blood Report analyzer", "Indian food scanner", "10% off PDF guides"] },
    { id: "elite" as const, name: "Elite Family", tagline: "Best for households", features: ["Everything in Pro", "Up to 8 family members", "Medical report analyzer", "Voice fitness coach", "Priority support", "25% off PDF guides"] },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Premium Plans</h1>
        <p className="text-sm text-[#e9f3f5]/68">Unlock the full The Titan Fitness experience</p>
      </div>

      {/* Urgency banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ffb627]/30 bg-gradient-to-r from-[#ffb627]/15 to-fuchsia-400/10 px-5 py-4 text-[#e9f3f5]">
        <p className="text-sm font-bold">🔥 Launch Offer — use code <span className="text-[#ffb627]">LAUNCH20</span> for 20% off any plan</p>
        <LaunchCountdown />
      </div>

      {/* Billing cycle toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 p-1">
          <button type="button" onClick={() => setCycle("monthly")} className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${cycle === "monthly" ? "bg-violet-500 text-white" : "text-[#e9f3f5]/62"}`}>Monthly</button>
          <button type="button" onClick={() => setCycle("annual")} className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${cycle === "annual" ? "bg-violet-500 text-white" : "text-[#e9f3f5]/62"}`}>
            Annual <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-300">Save 37%</span>
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 md:grid-cols-3">
        {tiers.map((p) => {
          const isCurrent = (p.id === "free" && user?.plan === "Free") || (p.id === "pro" && user?.plan === "Pro") || (p.id === "elite" && user?.plan === "Elite");
          const priceVal = p.id === "free" ? 0 : cycle === "annual" ? PLANS[p.id as PlanId].annual : PLANS[p.id as PlanId].monthly;
          return (
            <div key={p.name} className={`relative rounded-2xl border p-8 ${p.popular ? "border-violet-300/40 bg-violet-200/10 shadow-[0_0_60px_rgba(45,212,191,0.15)]" : "border-[#e9f3f5]/10 bg-[#e9f3f5]/5"}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-400 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">MOST POPULAR</div>}
              <h3 className="text-2xl font-black">{p.name}</h3>
              <p className="mt-2 text-sm text-[#e9f3f5]/68">{p.tagline}</p>
              <div className="mt-6 flex items-end gap-1">
                <span className="text-5xl font-black">₹{priceVal}</span>
                {p.id !== "free" && <span className="pb-2 text-sm text-[#e9f3f5]/65">/{cycle === "annual" ? "yr" : "mo"}</span>}
              </div>
              {isCurrent ? (
                <div className="mt-6 rounded-full border border-emerald-300/30 bg-emerald-300/10 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Current Plan</div>
              ) : p.id === "free" ? (
                <div className="mt-6 rounded-full border border-[#e9f3f5]/12 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#e9f3f5]/50">Always Free</div>
              ) : (
                <button type="button" onClick={() => openCheckout(p.id as PlanId, cycle)} className="btn-gloss mt-6 w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">
                  {p.id === "elite" ? "Upgrade to Elite" : "Upgrade to Pro"}
                </button>
              )}
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm text-[#e9f3f5]/68"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />{f}</li>)}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Lifetime deal */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ffb627]/30 bg-gradient-to-r from-[#ffb627]/12 via-violet-300/8 to-fuchsia-400/10 p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb627]">⚡ One-Time Offer</p>
          <h3 className="mt-1 text-xl font-black">Lifetime Elite — pay once, own it forever</h3>
          <p className="mt-1 text-sm text-[#e9f3f5]/68">No renewals, no rising prices. Everything in Elite Family, forever.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-3xl font-black text-[#ffb627]">₹{PLANS.lifetime.lifetime}</p>
            <p className="text-[11px] text-[#e9f3f5]/55">one-time</p>
          </div>
          <button type="button" onClick={() => openCheckout("lifetime")} className="btn-gloss rounded-full bg-gradient-to-r from-[#ffb627] to-orange-400 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#04121a]">Get Lifetime</button>
        </div>
      </div>

      {/* Feature comparison table */}
      <div className="overflow-x-auto rounded-2xl border border-[#e9f3f5]/10">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#e9f3f5]/10 bg-[#e9f3f5]/5">
              <th className="p-4 text-left font-bold text-[#e9f3f5]/80">Feature</th>
              <th className="p-4 text-center font-bold text-[#e9f3f5]/80">Free</th>
              <th className="p-4 text-center font-bold text-violet-200">Pro</th>
              <th className="p-4 text-center font-bold text-[#ffb627]">Elite</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((r, i) => (
              <tr key={r.label} className={i % 2 === 0 ? "bg-[#e9f3f5]/[0.02]" : ""}>
                <td className="p-4 text-[#e9f3f5]/75">{r.label}</td>
                <td className="p-4 text-center"><ComparisonCell v={r.free} /></td>
                <td className="p-4 text-center"><ComparisonCell v={r.pro} /></td>
                <td className="p-4 text-center"><ComparisonCell v={r.elite} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trust / testimonials */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { name: "Rohit V.", text: "Upgraded to Pro during a launch sale — the full Yoga library alone was worth it.", stars: 5 },
          { name: "Priya S.", text: "Elite Family means my parents finally track their health too. Worth every rupee.", stars: 5 },
          { name: "Arjun K.", text: "Went Lifetime on day one. No regrets — new features keep shipping for free.", stars: 5 },
        ].map((t) => (
          <div key={t.name} className="glass-card rounded-2xl p-5">
            <p className="text-sm text-[#ffb627]">{"★".repeat(t.stars)}</p>
            <p className="mt-2 text-sm italic text-[#e9f3f5]/75">"{t.text}"</p>
            <p className="mt-3 text-xs font-bold text-[#e9f3f5]/60">— {t.name}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="glass-card rounded-2xl p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Frequently asked questions</p>
        <div className="space-y-2">
          {FAQ_ITEMS.map((f, i) => (
            <div key={f.q} className="rounded-xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5">
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
                {f.q}
                <span className={`text-xs transition-transform ${openFaq === i ? "rotate-180" : ""}`}>▾</span>
              </button>
              {openFaq === i && <p className="px-4 pb-3 text-xs leading-relaxed text-[#e9f3f5]/68">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Billing (legacy tab) — reads the entitlement, never invents one    */
/* ---------------------------------------------------------------- */
/*
 * This tab used to print "Next billing: July 1, 2025" and a hardcoded
 * "user@paytm" UPI id — a placeholder presented as account state. It now
 * renders the entitlement document written by the verified webhook, and
 * says plainly when there is none. It cannot change a plan: upgrades go
 * through the hosted provider checkout (see src/saas/Pricing.tsx).
 */
function LegacyBillingPanel() {
  const { user } = useAuth();
  const { data: entitlement, loading } = useEntitlement();
  const live = entitlementIsLive(entitlement);
  const { data: payments } = usePayments();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-6">
        <h3 className="font-bold">Current Plan</h3>
        <div className="mt-4 rounded-xl border border-violet-200/20 bg-violet-200/10 p-5">
          {loading ? (
            <p className="text-sm text-[#e9f3f5]/68">Checking your entitlement…</p>
          ) : entitlement ? (
            <>
              <p className="text-xl font-black capitalize">{entitlement.plan.replace("_", " ")}</p>
              <p className="mt-1 text-xs text-[#e9f3f5]/68">
                {entitlement.status}
                {entitlement.expiresAt
                  ? ` · renews ${new Date(entitlement.expiresAt).toLocaleDateString("en-IN")}`
                  : " · no expiry"}
                {` · source: ${entitlement.source}`}
              </p>
              {!live && (
                <p className="mt-2 text-xs font-semibold text-amber-200">
                  This entitlement is not active right now, so premium features are locked.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-xl font-black">Free</p>
              <p className="mt-1 text-xs text-[#e9f3f5]/68">
                No entitlement on record. Paid plans are activated only after the payment provider confirms the
                order to our backend.
              </p>
            </>
          )}
        </div>
        <p className="mt-3 text-xs text-[#e9f3f5]/55">
          Signed in as {user?.email ?? "—"}. Card and UPI details are entered on the provider's own page and are
          never stored in this app.
        </p>
      </div>

      <div className="rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-6">
        <h3 className="font-bold">Payments</h3>
        {!payments || payments.length === 0 ? (
          <p className="mt-3 text-xs text-[#e9f3f5]/68">
            No payments recorded. If you have been charged and this list is empty, contact support with your
            provider reference — do not re-purchase.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {payments.slice(0, 6).map((payment) => (
              <li key={payment.id} className="flex items-center justify-between rounded-xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 px-4 py-3">
                <div>
                  <p className="text-sm font-bold">{payment.providerRef}</p>
                  <p className="text-[11px] text-[#e9f3f5]/60">
                    {payment.provider} · {payment.status} · {new Date(payment.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <p className="text-sm font-black tabular-nums">₹{(payment.amountMinor / 100).toLocaleString("en-IN")}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function SettingsPage() {
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
      if (!auth || !db) {
        logout();
        return;
      }
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
        <p className="text-sm text-[#e9f3f5]/68">Manage your account and preferences</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "profile", label: "Profile" },
          { id: "preferences", label: "Preferences" },
          { id: "billing", label: "Billing" },
          { id: "privacy", label: "Privacy" },
        ].map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id as any)} className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] transition ${tab === t.id ? "bg-violet-200/20 text-violet-50 ring-1 ring-violet-200/30" : "border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 text-[#e9f3f5]/68"}`}>{t.label}</button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-6">
          <div className="flex items-center gap-4 border-b border-[#e9f3f5]/10 pb-6">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-fuchsia-500 to-[#ffb627] text-2xl font-black text-[#04121a]">{user?.avatar}</div>
            <div>
              <p className="text-xl font-bold">{user?.name}</p>
              <p className="text-sm text-[#e9f3f5]/68">{user?.email}</p>
              <p className="mt-2 text-xs text-[#e9f3f5]/62">Member since {user?.joinDate}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Email</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Age</span><input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Height (cm)</span><input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-violet-100/70">Weight (kg)</span><input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/6 px-4 py-3 text-sm outline-none focus:border-violet-200/40" /></label>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={saveProfile} className={"rounded-full px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition " + (saved ? "bg-emerald-500" : "bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700")}>{saved ? "✓ Saved!" : "Save Changes"}</button>
            <button type="button" onClick={logout} className="rounded-full border border-rose-400/30 bg-rose-400/10 px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-rose-200 hover:bg-rose-400/20">Sign Out</button>
          </div>
        </div>
      )}

      {tab === "preferences" && (
        <div className="rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-6">
          <div className="space-y-4">
            {[
              { label: "Email Notifications", desc: "Get workout reminders and tips", key: "emailNotifications" as const },
              { label: "Push Notifications", desc: "Real-time alerts and streak reminders", key: "pushNotifications" as const },
              { label: "Weekly Reports", desc: "Every Monday progress summary", key: "weeklyReports" as const },
              { label: "AI Coach Messages", desc: "Daily personalized guidance", key: "aiCoach" as const },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between rounded-xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-4">
                <div><p className="font-bold">{p.label}</p><p className="text-xs text-[#e9f3f5]/68">{p.desc}</p></div>
                <label className="relative inline-flex cursor-pointer items-center"><input type="checkbox" defaultChecked={user?.preferences?.[p.key]} onChange={(e) => updateUser({ preferences: { ...user!.preferences, [p.key]: e.target.checked } })} className="peer sr-only" /><div className="h-7 w-[52px] rounded-full bg-[#e9f3f5]/15 peer-checked:bg-violet-300 after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-[28px]" /></label>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "billing" && <LegacyBillingPanel />}

      {tab === "privacy" && (
        <div className="rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="font-bold">Export My Data</p><p className="text-xs text-[#e9f3f5]/68">Download all your data as JSON</p></div>
            <button type="button" onClick={exportData} className="rounded-full border border-[#e9f3f5]/18 bg-[#e9f3f5]/8 px-5 py-2.5 text-xs font-bold hover:bg-violet-200/15">Export</button>
          </div>
          <div className="flex items-center justify-between border-t border-[#e9f3f5]/10 pt-4">
            <div><p className="font-bold">Delete Account</p><p className="text-xs text-[#e9f3f5]/68">Permanently delete all your data</p></div>
            <button type="button" onClick={deleteAccount} className="rounded-full border border-rose-400/30 bg-rose-400/10 px-5 py-2.5 text-xs font-bold text-rose-200 hover:bg-rose-400/20">Delete</button>
          </div>
          <p className="border-t border-[#e9f3f5]/10 pt-4 text-xs text-[#e9f3f5]/62">Version 2.1.0 · Built with ⚡ in India</p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
