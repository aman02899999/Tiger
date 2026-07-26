import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Workout Calendar & Planner — schedule a workout type on any day,  */
/* see today's plan at a glance, and mark days complete for XP.      */
/* Persists per user in localStorage. No SVG.                        */
/* ---------------------------------------------------------------- */

interface PlanType {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const PLAN_TYPES: PlanType[] = [
  { id: "push", label: "Push Strength", icon: "💪", color: "#2dd4bf" },
  { id: "pull", label: "Pull Power", icon: "🏋️", color: "#3b9dff" },
  { id: "legs", label: "Leg Day", icon: "🦵", color: "#ffb627" },
  { id: "core", label: "Core Crusher", icon: "🔥", color: "#ff8a75" },
  { id: "hiit", label: "HIIT Cardio", icon: "⚡", color: "#60b6fa" },
  { id: "yoga", label: "Recovery Yoga", icon: "🧘", color: "#34e08a" },
  { id: "rest", label: "Rest Day", icon: "😴", color: "#8fa8b8" },
];

interface DayEntry {
  planId: string;
  done: boolean;
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}
function storeKey(email: string | null | undefined) {
  return `tfp_calendar_${email ?? "guest"}`;
}
function loadCalendar(email: string | null | undefined): Record<string, DayEntry> {
  try { return JSON.parse(localStorage.getItem(storeKey(email)) ?? "{}"); } catch { return {}; }
}

function planFor(id: string) {
  return PLAN_TYPES.find((p) => p.id === id) ?? PLAN_TYPES[0];
}

export default function WorkoutCalendarPage({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { user } = useAuth();
  const [calendar, setCalendar] = useState<Record<string, DayEntry>>({});
  const [viewDate, setViewDate] = useState(() => new Date());
  const [pickerDay, setPickerDay] = useState<string | null>(null);

  useEffect(() => { setCalendar(loadCalendar(user?.email)); }, [user?.email]);

  function save(next: Record<string, DayEntry>) {
    setCalendar(next);
    try { localStorage.setItem(storeKey(user?.email), JSON.stringify(next)); } catch { /* ignore */ }
  }

  function assign(day: string, planId: string) {
    const next = { ...calendar };
    if (planId === "") delete next[day];
    else next[day] = { planId, done: next[day]?.done ?? false };
    save(next);
    setPickerDay(null);
  }

  function toggleDone(day: string) {
    const entry = calendar[day];
    if (!entry) return;
    const willBeDone = !entry.done;
    save({ ...calendar, [day]: { ...entry, done: willBeDone } });
    if (willBeDone && entry.planId !== "rest") addXP(user?.email, 20);
  }

  const today = ymd(new Date());
  const todayEntry = calendar[today];

  // Month grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const cells = useMemo(() => {
    const arr: { day: number | null; key: string | null }[] = [];
    for (let i = 0; i < startOffset; i++) arr.push({ day: null, key: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      arr.push({ day: d, key });
    }
    return arr;
  }, [year, month, startOffset, daysInMonth]);

  // This week strip (Sun-Sat containing today)
  const weekStrip = useMemo(() => {
    const now = new Date();
    const sun = new Date(now);
    sun.setDate(now.getDate() - now.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sun);
      d.setDate(sun.getDate() + i);
      return { key: ymd(d), label: d.toLocaleDateString("en", { weekday: "short" }), num: d.getDate(), isToday: ymd(d) === today };
    });
  }, [today]);

  const weekDone = weekStrip.filter((d) => calendar[d.key]?.done).length;
  const weekPlanned = weekStrip.filter((d) => calendar[d.key]).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Workout Calendar</h1>
        <p className="text-sm text-[#e9f3f5]/68">Plan your training week and check off each session as you go</p>
      </div>

      {/* How this works */}
      <div className="glass-card rounded-2xl p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">How this works — 3 simple steps</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { n: "1", t: "Tap a day", d: "Pick any date on the calendar and assign a workout type — or mark it a rest day." },
            { n: "2", t: "See today's plan", d: "Your scheduled session for today shows right at the top, ready to start." },
            { n: "3", t: "Check it off", d: "Mark a day complete after training to earn +20 XP and keep your plan honest." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-white/8 bg-white/5 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-black text-white">{s.n}</div>
              <p className="text-sm font-bold text-[#e9f3f5]">{s.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#e9f3f5]/68">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's plan */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffb627]">📅 Today's Plan</p>
        {todayEntry ? (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="text-4xl">{planFor(todayEntry.planId).icon}</span>
            <div className="flex-1">
              <p className="text-xl font-black">{planFor(todayEntry.planId).label}</p>
              <p className="text-xs text-[#e9f3f5]/62">{todayEntry.done ? "Completed today ✓" : "Scheduled for today"}</p>
            </div>
            <div className="flex gap-2">
              {todayEntry.planId !== "rest" && !todayEntry.done && onNavigate && (
                <button type="button" onClick={() => onNavigate("workouts")} className="btn-gloss rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white">Start →</button>
              )}
              <button
                type="button"
                onClick={() => toggleDone(today)}
                className={`rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] transition ${todayEntry.done ? "border border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border border-[#e9f3f5]/15 bg-[#e9f3f5]/5 text-[#e9f3f5]/80 hover:bg-[#e9f3f5]/10"}`}
              >
                {todayEntry.done ? "✓ Done" : "Mark Done (+20 XP)"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-sm text-[#e9f3f5]/68">Nothing scheduled for today — pick a workout below.</p>
            <button type="button" onClick={() => setPickerDay(today)} className="btn-gloss rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-5 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white">+ Add Today</button>
          </div>
        )}
      </div>

      {/* Week strip */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">This Week</p>
          <p className="text-xs text-[#e9f3f5]/62">{weekDone}/{weekPlanned || 7} done</p>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {weekStrip.map((d) => {
            const entry = calendar[d.key];
            const plan = entry ? planFor(entry.planId) : null;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setPickerDay(d.key)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition ${d.isToday ? "border-[#ffb627]/40 bg-[#ffb627]/8" : "border-[#e9f3f5]/10 bg-[#e9f3f5]/5 hover:bg-[#e9f3f5]/10"}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#e9f3f5]/55">{d.label}</span>
                <span className={`text-sm font-black ${d.isToday ? "text-[#ffb627]" : ""}`}>{d.num}</span>
                <span className={`text-xl ${entry?.done ? "" : "opacity-60"}`}>{plan ? plan.icon : "·"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Month calendar */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} aria-label="Previous month" className="rounded-full border border-[#e9f3f5]/15 px-3 py-1.5 text-sm hover:bg-[#e9f3f5]/8">←</button>
          <p className="text-sm font-black uppercase tracking-[0.12em]">{monthLabel}</p>
          <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} aria-label="Next month" className="rounded-full border border-[#e9f3f5]/15 px-3 py-1.5 text-sm hover:bg-[#e9f3f5]/8">→</button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-[#e9f3f5]/55">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {cells.map((c, i) => {
            if (c.day === null) return <div key={i} />;
            const entry = c.key ? calendar[c.key] : undefined;
            const plan = entry ? planFor(entry.planId) : null;
            const isToday = c.key === today;
            return (
              <button
                key={i}
                type="button"
                onClick={() => c.key && setPickerDay(c.key)}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-xs transition ${isToday ? "border-[#ffb627]/50 bg-[#ffb627]/10" : "border-[#e9f3f5]/8 bg-[#e9f3f5]/[0.03] hover:bg-[#e9f3f5]/8"}`}
                style={entry?.done ? { borderColor: `${plan?.color}80`, background: `${plan?.color}18` } : undefined}
              >
                <span className={isToday ? "font-black text-[#ffb627]" : "text-[#e9f3f5]/75"}>{c.day}</span>
                {plan && <span className="text-sm leading-none">{plan.icon}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day picker modal */}
      {pickerDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setPickerDay(null)}>
          <div className="glass-card w-full max-w-sm rounded-3xl bg-[#0a141f]/95 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">{new Date(pickerDay + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</h3>
              <button type="button" onClick={() => setPickerDay(null)} className="rounded-full border border-[#e9f3f5]/15 px-3 py-1.5 text-xs text-[#e9f3f5]/70 hover:bg-[#e9f3f5]/8">✕</button>
            </div>
            <p className="mt-1 text-xs text-[#e9f3f5]/62">Choose what to train this day</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {PLAN_TYPES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => assign(pickerDay, p.id)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition ${calendar[pickerDay]?.planId === p.id ? "border-white/30 bg-white/10" : "border-[#e9f3f5]/10 bg-[#e9f3f5]/5 hover:bg-[#e9f3f5]/10"}`}
                >
                  <span className="text-xl">{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
            {calendar[pickerDay] && (
              <button type="button" onClick={() => assign(pickerDay, "")} className="mt-3 w-full rounded-xl border border-rose-400/25 bg-rose-400/5 py-2.5 text-xs font-bold text-rose-200 hover:bg-rose-400/10">Clear this day</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
