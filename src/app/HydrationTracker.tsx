import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Hydration Tracker — tap to log glasses of water toward a daily     */
/* goal derived from bodyweight, with a live fill ring, a 7-day       */
/* history, and a hydration streak. Persists per user + per day.      */
/* No SVG.                                                            */
/* ---------------------------------------------------------------- */

const GLASS_ML = 250; // one glass = 250 ml
// Common quick-add containers.
const QUICK = [
  { label: "Glass", ml: 250, icon: "🥛" },
  { label: "Bottle", ml: 500, icon: "🍶" },
  { label: "Big bottle", ml: 750, icon: "🧴" },
  { label: "Mug", ml: 350, icon: "☕" },
];

function today() { return new Date().toISOString().slice(0, 10); }
function storeKey(email: string | null | undefined) { return `tfp_water_${email ?? "guest"}`; }
function loadLog(email: string | null | undefined): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(storeKey(email)) ?? "{}"); } catch { return {}; }
}

export default function HydrationTrackerPage() {
  const { user } = useAuth();
  // ~35 ml per kg bodyweight, rounded to the nearest 250 ml, clamped 1.5–4 L.
  const goalMl = useMemo(() => {
    const raw = (user?.weight ?? 70) * 35;
    const rounded = Math.round(raw / GLASS_ML) * GLASS_ML;
    return Math.min(4000, Math.max(1500, rounded));
  }, [user?.weight]);

  const [log, setLog] = useState<Record<string, number>>({});
  const [rewarded, setRewarded] = useState(false);

  useEffect(() => {
    setLog(loadLog(user?.email));
    setRewarded(false);
  }, [user?.email]);

  const todayMl = log[today()] ?? 0;
  const pct = Math.min(1, todayMl / goalMl);

  function persist(next: Record<string, number>) {
    setLog(next);
    try { localStorage.setItem(storeKey(user?.email), JSON.stringify(next)); } catch { /* ignore */ }
  }

  function add(ml: number) {
    const next = { ...log, [today()]: Math.max(0, (log[today()] ?? 0) + ml) };
    persist(next);
    if (!rewarded && next[today()] >= goalMl) { setRewarded(true); addXP(user?.email, 12); }
  }

  const last7 = useMemo(() => {
    const days: { key: string; ml: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, ml: log[key] ?? 0, label: d.toLocaleDateString("en", { weekday: "narrow" }) });
    }
    return days;
  }, [log]);

  // Hydration streak: consecutive days (up to today) that met the goal.
  const streak = useMemo(() => {
    let s = 0;
    for (let i = 0; ; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if ((log[key] ?? 0) >= goalMl) s++;
      else break;
    }
    return s;
  }, [log, goalMl]);

  const maxMl = Math.max(goalMl, ...last7.map((d) => d.ml));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Hydration Tracker</h1>
        <p className="text-sm text-[#2a1e16]/68">Tap to log water and hit your daily goal — your body runs on it</p>
      </div>

      {/* Today ring + quick add */}
      <div className="glass-card rounded-3xl p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="relative h-44 w-44 shrink-0">
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#38bdf8 ${pct * 360}deg, rgba(247,240,223,0.1) ${pct * 360}deg)`, transition: "background 0.5s ease" }} />
            <div className="absolute inset-[11px] grid place-items-center rounded-full bg-[#fffdf9] text-center">
              <div>
                <p className="text-3xl font-black tabular-nums text-sky-600">{(todayMl / 1000).toFixed(2)}<span className="text-base">L</span></p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#2a1e16]/62">of {(goalMl / 1000).toFixed(2)} L</p>
                <p className="mt-1 text-xs font-bold text-[#ea580c]">{Math.round(pct * 100)}%</p>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#2a1e16]/65">Quick add</p>
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK.map((q) => (
                <button key={q.label} type="button" onClick={() => add(q.ml)} className="flex items-center gap-2 rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-left transition hover:bg-sky-300/20">
                  <span className="text-xl">{q.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{q.label}</span>
                    <span className="block text-[10px] text-[#2a1e16]/60">+{q.ml} ml</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => add(-GLASS_ML)} className="flex-1 rounded-xl border border-[#2a1e16]/12 bg-[#2a1e16]/5 py-2.5 text-xs font-bold text-[#2a1e16]/70 transition hover:bg-[#2a1e16]/10">− Undo a glass</button>
            </div>
            {pct >= 1 && <p className="mt-3 text-center text-sm font-black text-emerald-600">🎉 Goal smashed — you're fully hydrated! (+12 XP)</p>}
          </div>
        </div>
      </div>

      {/* Stats + streak */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { v: `${Math.round(todayMl / GLASS_ML)}`, l: "glasses today" },
          { v: `${streak}🔥`, l: "day streak" },
          { v: `${Math.max(0, Math.ceil((goalMl - todayMl) / GLASS_ML))}`, l: "glasses to go" },
        ].map((s) => (
          <div key={s.l} className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-black tabular-nums text-sky-600">{s.v}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#2a1e16]/62">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Weekly chart */}
      <div className="glass-card rounded-2xl p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Last 7 Days</p>
        <div className="flex h-32 items-end justify-between gap-2">
          {last7.map((d) => {
            const h = maxMl ? (d.ml / maxMl) * 100 : 0;
            const hit = d.ml >= goalMl;
            return (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-md transition-all duration-500" style={{ height: d.ml ? `${Math.max(4, h)}%` : "3px", background: hit ? "linear-gradient(to top,#34d399,#6ee7b7)" : "linear-gradient(to top,#38bdf8,#7dd3fc)", opacity: d.ml ? 1 : 0.3 }} title={`${(d.ml / 1000).toFixed(2)} L`} />
                </div>
                <span className="text-[10px] font-bold text-[#2a1e16]/62">{d.label}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-[11px] text-[#2a1e16]/55">Goal auto-set to {(goalMl / 1000).toFixed(2)} L/day from your bodyweight (~35 ml/kg).</p>
      </div>
    </div>
  );
}
