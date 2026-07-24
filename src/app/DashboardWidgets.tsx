import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Interactive dashboard widgets — all state persists per user+day   */
/* in localStorage. No SVG (CSS conic rings / bars only).            */
/* ---------------------------------------------------------------- */

function today() {
  return new Date().toISOString().slice(0, 10);
}
function keyFor(email: string | null | undefined, name: string) {
  return `tfp_${name}_${email ?? "guest"}_${today()}`;
}

/* ---- 1. Interactive daily checklist with live progress ring ----- */

const DEFAULT_TASKS = [
  { id: "meditate", icon: "🧘", title: "Morning Meditation", meta: "10 min" },
  { id: "workout", icon: "💪", title: "Strength Workout", meta: "45 min" },
  { id: "breakfast", icon: "🍳", title: "High-Protein Breakfast", meta: "30g protein" },
  { id: "water", icon: "💧", title: "Drink 3L Water", meta: "hydration" },
  { id: "walk", icon: "🚶", title: "Evening Walk", meta: "8k steps" },
  { id: "sleep", icon: "😴", title: "Sleep by 10:30 PM", meta: "8 hrs" },
];

export function DailyChecklist() {
  const { user } = useAuth();
  const storeKey = keyFor(user?.email, "checklist");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [rewarded, setRewarded] = useState(false);

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(storeKey) ?? "{}"));
    } catch {
      setDone({});
    }
  }, [storeKey]);

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* ignore */ }
      const completed = DEFAULT_TASKS.filter((t) => next[t.id]).length;
      if (completed === DEFAULT_TASKS.length && !rewarded) {
        addXP(user?.email, 40);
        setRewarded(true);
      }
      return next;
    });
  }

  const completed = DEFAULT_TASKS.filter((t) => done[t.id]).length;
  const pct = completed / DEFAULT_TASKS.length;

  return (
    <div className="glass-card rounded-2xl p-6 lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Today's Checklist</h2>
          <p className="text-xs text-[#2a1e16]/65">Tap each ring to check it off — finish all for +40 XP</p>
        </div>
        <div className="relative h-16 w-16 shrink-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#f97316 ${pct * 360}deg, rgba(247,240,223,0.1) ${pct * 360}deg)`,
              transition: "background 0.5s ease",
            }}
          />
          <div className="absolute inset-[5px] grid place-items-center rounded-full bg-[#fffdf9]">
            <span className="text-sm font-black">{completed}/{DEFAULT_TASKS.length}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        {DEFAULT_TASKS.map((task) => {
          const isDone = !!done[task.id];
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => toggle(task.id)}
              className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left transition ${
                isDone
                  ? "border-orange-300/30 bg-orange-300/8"
                  : "border-[#2a1e16]/10 bg-[#2a1e16]/5 hover:bg-[#2a1e16]/10"
              }`}
            >
              <span className={`text-2xl transition ${isDone ? "" : "grayscale-[0.3]"}`}>{task.icon}</span>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${isDone ? "text-[#2a1e16]/62 line-through" : "text-[#2a1e16]"}`}>{task.title}</p>
                <p className="text-xs text-[#2a1e16]/62">{task.meta}</p>
              </div>
              <span className={`grid h-7 w-7 place-items-center rounded-full border-2 transition ${isDone ? "border-orange-300 bg-orange-300 text-[#2a1e16]" : "border-[#2a1e16]/25"}`}>
                {isDone && <span className="text-xs font-black">✓</span>}
              </span>
            </button>
          );
        })}
      </div>

      {completed === DEFAULT_TASKS.length && (
        <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-center text-sm font-bold text-emerald-600">
          🎉 Perfect day complete! +40 XP earned
        </div>
      )}
    </div>
  );
}

/* ---- 2. Mood & energy check-in ---------------------------------- */

const MOODS = [
  { id: "great", emoji: "🤩", label: "Great", color: "#059669" },
  { id: "good", emoji: "🙂", label: "Good", color: "#f97316" },
  { id: "okay", emoji: "😐", label: "Okay", color: "#ea580c" },
  { id: "tired", emoji: "😮‍💨", label: "Tired", color: "#fb923c" },
  { id: "sore", emoji: "🤕", label: "Sore", color: "#fb7185" },
];

export function MoodCheckIn() {
  const { user } = useAuth();
  const storeKey = keyFor(user?.email, "mood");
  const [mood, setMood] = useState<string | null>(null);

  useEffect(() => {
    setMood(localStorage.getItem(storeKey));
  }, [storeKey]);

  function pick(id: string) {
    setMood(id);
    try { localStorage.setItem(storeKey, id); } catch { /* ignore */ }
    if (!localStorage.getItem(storeKey + "_xp")) {
      addXP(user?.email, 5);
      try { localStorage.setItem(storeKey + "_xp", "1"); } catch { /* ignore */ }
    }
  }

  const selected = MOODS.find((m) => m.id === mood);

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#2a1e16]/68">How do you feel today?</h3>
      <div className="mt-4 flex justify-between gap-1.5">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => pick(m.id)}
            aria-label={m.label}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 transition ${
              mood === m.id ? "scale-105 border-black/30 bg-black/10" : "border-transparent hover:bg-black/5"
            }`}
            style={mood === m.id ? { boxShadow: `0 0 20px ${m.color}40` } : undefined}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-[10px] font-bold" style={{ color: mood === m.id ? m.color : "rgba(247,240,223,0.62)" }}>{m.label}</span>
          </button>
        ))}
      </div>
      {selected && (
        <p className="mt-4 rounded-xl bg-black/5 p-3 text-center text-xs text-[#2a1e16]/75">
          {selected.id === "great" && "Amazing! Channel that energy into a hard session today. 🔥"}
          {selected.id === "good" && "Solid — a great day to hit your planned workout. 💪"}
          {selected.id === "okay" && "That's fine. A light workout or walk can lift your mood. 🚶"}
          {selected.id === "tired" && "Listen to your body — prioritize sleep and hydration today. 😴"}
          {selected.id === "sore" && "Recovery day. Try the Physio & Rehab or Yoga stretches. 🧘"}
        </p>
      )}
    </div>
  );
}

/* ---- 3. Weekly activity bar chart (interactive) ----------------- */

export function WeeklyActivity() {
  const { user } = useAuth();
  // Deterministic pseudo-data seeded from streak so it feels personal without RNG.
  const data = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const seed = (user?.streak ?? 3) + (user?.stats?.totalWorkouts ?? 10);
    return labels.map((label, i) => {
      const mins = ((seed * (i + 3) * 17) % 55) + 10; // 10–65 min
      return { label, mins, active: mins > 25 };
    });
  }, [user]);

  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.mins));
  const totalMin = data.reduce((s, d) => s + d.mins, 0);
  const activeDays = data.filter((d) => d.active).length;

  return (
    <div className="glass-card rounded-2xl p-6 lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">This Week's Activity</h2>
          <p className="text-xs text-[#2a1e16]/65">Tap a bar for the day's detail · {activeDays}/7 active days · {totalMin} min total</p>
        </div>
        <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-600">{Math.round(totalMin / 7)} min/day avg</span>
      </div>

      <div className="mt-6 flex h-40 items-end justify-between gap-2">
        {data.map((d, i) => (
          <button
            key={d.label}
            type="button"
            onClick={() => setSel(sel === i ? null : i)}
            className="group flex flex-1 flex-col items-center gap-2"
          >
            <div className="relative flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-t-lg transition-all duration-500 ${
                  sel === i ? "bg-gradient-to-t from-[#ea580c] to-orange-300" : "bg-gradient-to-t from-orange-500 to-amber-400 group-hover:from-orange-400 group-hover:to-amber-300"
                }`}
                style={{ height: `${(d.mins / max) * 100}%` }}
              />
            </div>
            <span className={`text-[10px] font-bold uppercase ${sel === i ? "text-[#ea580c]" : "text-[#2a1e16]/62"}`}>{d.label}</span>
          </button>
        ))}
      </div>

      {sel !== null && (
        <div className="mt-4 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-3 text-center text-sm">
          <span className="font-bold text-[#ea580c]">{data[sel].label}</span>
          <span className="text-[#2a1e16]/75"> — {data[sel].mins} active minutes · {data[sel].active ? "goal hit ✅" : "below goal"}</span>
        </div>
      )}
    </div>
  );
}

/* ---- 4. Quick actions ------------------------------------------- */

export function QuickActions({ onNavigate }: { onNavigate: (section: string) => void }) {
  const actions = [
    { id: "workouts", icon: "💪", label: "Start Workout", color: "from-orange-400 to-amber-500" },
    { id: "dailyrewards", icon: "🎡", label: "Daily Spin", color: "from-[#ea580c] to-orange-400" },
    { id: "meditation", icon: "🧘", label: "Meditate", color: "from-sky-400 to-cyan-500" },
    { id: "aicoach", icon: "🤖", label: "Ask Coach", color: "from-emerald-400 to-teal-500" },
    { id: "gympartner", icon: "🤝", label: "Find Partner", color: "from-rose-400 to-pink-500" },
    { id: "achievements", icon: "🏅", label: "My Badges", color: "from-amber-400 to-yellow-500" },
  ];
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#2a1e16]/68">Quick Actions</h3>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onNavigate(a.id)}
            className="flex flex-col items-center gap-2 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-3 transition hover:-translate-y-0.5 hover:bg-[#2a1e16]/10"
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${a.color} text-lg`}>{a.icon}</span>
            <span className="text-[10px] font-bold text-[#2a1e16]/80">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
