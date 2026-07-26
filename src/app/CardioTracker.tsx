import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Cardio & Steps Tracker — log daily steps and cardio minutes by    */
/* activity type, see an estimated calorie burn and a 7-day chart.   */
/* Persists per user in localStorage. No SVG.                        */
/* ---------------------------------------------------------------- */

// Rough MET values → kcal/min per kg. kcal = MET * 3.5 * kg / 200 per minute.
const ACTIVITIES = [
  { id: "walk", label: "Walking", icon: "🚶", met: 3.5 },
  { id: "run", label: "Running", icon: "🏃", met: 9.0 },
  { id: "cycle", label: "Cycling", icon: "🚴", met: 7.5 },
  { id: "swim", label: "Swimming", icon: "🏊", met: 8.0 },
  { id: "jump", label: "Jump Rope", icon: "🪢", met: 11.0 },
  { id: "hiit", label: "HIIT", icon: "⚡", met: 8.5 },
];

interface DayLog { steps: number; minutes: number; activity: string }

const STEP_GOAL = 8000;

function today() { return new Date().toISOString().slice(0, 10); }
function storeKey(email: string | null | undefined) { return `tfp_cardio_${email ?? "guest"}`; }
function loadLog(email: string | null | undefined): Record<string, DayLog> {
  try { return JSON.parse(localStorage.getItem(storeKey(email)) ?? "{}"); } catch { return {}; }
}

export default function CardioTrackerPage() {
  const { user } = useAuth();
  const bw = user?.weight ?? 70;
  const [log, setLog] = useState<Record<string, DayLog>>({});
  const [steps, setSteps] = useState("");
  const [minutes, setMinutes] = useState("");
  const [activity, setActivity] = useState("walk");
  const [rewarded, setRewarded] = useState(false);

  useEffect(() => {
    const l = loadLog(user?.email);
    setLog(l);
    const t = l[today()];
    if (t) { setSteps(String(t.steps || "")); setMinutes(String(t.minutes || "")); setActivity(t.activity || "walk"); }
  }, [user?.email]);

  function save() {
    const entry: DayLog = { steps: Number(steps) || 0, minutes: Number(minutes) || 0, activity };
    const next = { ...log, [today()]: entry };
    setLog(next);
    try { localStorage.setItem(storeKey(user?.email), JSON.stringify(next)); } catch { /* ignore */ }
    if (!rewarded && (entry.steps >= STEP_GOAL || entry.minutes >= 20)) { setRewarded(true); addXP(user?.email, 15); }
  }

  const todayEntry = log[today()];
  const met = ACTIVITIES.find((a) => a.id === (todayEntry?.activity ?? activity))?.met ?? 3.5;
  const kcal = todayEntry ? Math.round((met * 3.5 * bw / 200) * todayEntry.minutes) : 0;
  const stepPct = Math.min(1, (Number(steps) || todayEntry?.steps || 0) / STEP_GOAL);

  const last7 = useMemo(() => {
    const days: { key: string; steps: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, steps: log[key]?.steps ?? 0, label: d.toLocaleDateString("en", { weekday: "narrow" }) });
    }
    return days;
  }, [log]);
  const maxSteps = Math.max(STEP_GOAL, ...last7.map((d) => d.steps));
  const weekTotal = last7.reduce((s, d) => s + d.steps, 0);
  const activeDays = last7.filter((d) => d.steps >= STEP_GOAL).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Cardio &amp; Steps</h1>
        <p className="text-sm text-[#e9f3f5]/68">Log your daily movement and watch the calories add up</p>
      </div>

      {/* Today's log */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffb627]">Log Today</p>

        <div className="mt-4 flex items-center gap-6">
          {/* step ring */}
          <div className="relative h-24 w-24 shrink-0">
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#34e08a ${stepPct * 360}deg, rgba(233,243,245,0.1) ${stepPct * 360}deg)`, transition: "background 0.5s ease" }} />
            <div className="absolute inset-[7px] grid place-items-center rounded-full bg-[#0a141f] text-center">
              <div>
                <p className="text-sm font-black tabular-nums">{Math.round(stepPct * 100)}%</p>
                <p className="text-[8px] uppercase tracking-[0.14em] text-[#e9f3f5]/62">of goal</p>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/65">Steps today (goal {STEP_GOAL.toLocaleString()})</span>
              <input type="number" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="e.g. 6500" className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-4 py-2.5 text-sm outline-none focus:border-violet-200/40" />
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/65">Cardio activity</span>
            <select value={activity} onChange={(e) => setActivity(e.target.value)} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-3 py-2.5 text-sm outline-none">
              {ACTIVITIES.map((a) => <option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/65">Minutes</span>
            <input type="number" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="e.g. 30" className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-4 py-2.5 text-sm outline-none focus:border-violet-200/40" />
          </label>
        </div>

        <button type="button" onClick={save} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Save Today (+15 XP at goal)</button>

        {todayEntry && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { v: (todayEntry.steps || 0).toLocaleString(), l: "steps" },
              { v: `${todayEntry.minutes || 0}m`, l: "cardio" },
              { v: `${kcal}`, l: "kcal burned" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-3">
                <p className="text-lg font-black tabular-nums text-[#ffb627]">{s.v}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/62">{s.l}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly chart */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">This Week's Steps</p>
          <p className="text-xs text-[#e9f3f5]/62">{weekTotal.toLocaleString()} total · {activeDays}/7 hit goal</p>
        </div>
        <div className="mt-5 flex h-32 items-end justify-between gap-2">
          {last7.map((d) => {
            const h = maxSteps ? (d.steps / maxSteps) * 100 : 0;
            const hitGoal = d.steps >= STEP_GOAL;
            return (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-md transition-all duration-500" style={{ height: d.steps ? `${Math.max(4, h)}%` : "3px", background: hitGoal ? "linear-gradient(to top,#34e08a,#6ee7b7)" : "linear-gradient(to top,#60b6fa,#7dd3fc)", opacity: d.steps ? 1 : 0.3 }} title={`${d.steps.toLocaleString()} steps`} />
                </div>
                <span className="text-[10px] font-bold text-[#e9f3f5]/62">{d.label}</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-[11px] text-[#e9f3f5]/55">Green bars = you hit the {STEP_GOAL.toLocaleString()}-step goal that day.</p>
      </div>
    </div>
  );
}
