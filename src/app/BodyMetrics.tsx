import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP, getXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Body Metrics — weight & measurement tracker with trend charts,    */
/* goal milestones with progress rings, and a weekly report card.    */
/* Persists per user in localStorage. No SVG.                        */
/* ---------------------------------------------------------------- */

const METRICS = [
  { key: "weight", label: "Weight", unit: "kg", color: "#2dd4bf" },
  { key: "waist", label: "Waist", unit: "cm", color: "#3b9dff" },
  { key: "chest", label: "Chest", unit: "cm", color: "#60b6fa" },
  { key: "arms", label: "Arms", unit: "cm", color: "#ffb627" },
  { key: "thighs", label: "Thighs", unit: "cm", color: "#34e08a" },
  { key: "bodyfat", label: "Body Fat", unit: "%", color: "#ff8a75" },
] as const;

type MetricKey = typeof METRICS[number]["key"];
interface Entry { date: string; values: Partial<Record<MetricKey, number>> }

function loadEntries(email: string | null | undefined): Entry[] {
  try { return JSON.parse(localStorage.getItem(`tfp_metrics_${email ?? "guest"}`) ?? "[]"); } catch { return []; }
}

/* ---- Mini trend chart (CSS bars) -------------------------------- */
function TrendChart({ entries, metric }: { entries: Entry[]; metric: typeof METRICS[number] }) {
  const points = entries
    .filter((e) => e.values[metric.key] != null)
    .slice(-10);
  if (points.length < 2) return <p className="py-6 text-center text-xs text-[#e9f3f5]/55">Log at least 2 entries to see your {metric.label.toLowerCase()} trend.</p>;
  const vals = points.map((p) => p.values[metric.key]!);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const first = vals[0], last = vals[vals.length - 1];
  const change = last - first;
  return (
    <div>
      <div className="flex items-end justify-between gap-1.5" style={{ height: 100 }}>
        {points.map((p, i) => {
          const v = p.values[metric.key]!;
          const h = 20 + ((v - min) / range) * 80;
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
              <span className="mb-1 text-[9px] font-bold tabular-nums text-[#e9f3f5]/62 opacity-0 transition group-hover:opacity-100">{v}</span>
              <div className="w-full rounded-t-md transition-all" style={{ height: `${h}%`, background: metric.color, opacity: 0.55 + (i / points.length) * 0.45 }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-[#e9f3f5]/62">
        <span>Start {first}{metric.unit}</span>
        <span className={change < 0 ? "font-bold text-emerald-300" : change > 0 ? "font-bold text-[#ffb627]" : ""}>
          {change > 0 ? "+" : ""}{change.toFixed(1)}{metric.unit}
        </span>
        <span>Now {last}{metric.unit}</span>
      </div>
    </div>
  );
}

/* ---- Goal ring -------------------------------------------------- */
function GoalRing({ pct, color, children }: { pct: number; color: string; children: React.ReactNode }) {
  return (
    <div className="relative h-20 w-20 shrink-0">
      <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${color} ${Math.min(100, pct) * 3.6}deg, rgba(233,243,245,0.1) ${Math.min(100, pct) * 3.6}deg)` }} />
      <div className="absolute inset-[6px] grid place-items-center rounded-full bg-[#0a141f] text-center">{children}</div>
    </div>
  );
}

export default function BodyMetricsPage() {
  const { user } = useAuth();
  const storeKey = `tfp_metrics_${user?.email ?? "guest"}`;
  const goalKey = `tfp_metricgoal_${user?.email ?? "guest"}`;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [active, setActive] = useState<MetricKey>("weight");
  const [draft, setDraft] = useState<Partial<Record<MetricKey, string>>>({});
  const [goal, setGoal] = useState<{ metric: MetricKey; target: string; start: string }>({ metric: "weight", target: "", start: "" });

  useEffect(() => { setEntries(loadEntries(user?.email)); }, [user?.email]);
  useEffect(() => {
    try { const g = JSON.parse(localStorage.getItem(goalKey) ?? "null"); if (g) setGoal(g); } catch { /* ignore */ }
  }, [goalKey]);

  function saveEntry() {
    const vals: Partial<Record<MetricKey, number>> = {};
    (Object.keys(draft) as MetricKey[]).forEach((k) => { const n = parseFloat(draft[k] ?? ""); if (!Number.isNaN(n)) vals[k] = n; });
    if (Object.keys(vals).length === 0) return;
    const date = new Date().toISOString().slice(0, 10);
    const next = [...entries.filter((e) => e.date !== date), { date, values: vals }].sort((a, b) => a.date.localeCompare(b.date));
    setEntries(next);
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* ignore */ }
    setDraft({});
    addXP(user?.email, 8);
  }

  function saveGoal() {
    try { localStorage.setItem(goalKey, JSON.stringify(goal)); } catch { /* ignore */ }
  }

  const activeMetric = METRICS.find((m) => m.key === active)!;

  // Weekly report metrics
  const report = useMemo(() => {
    const now = Date.now();
    const wk = (d: string) => (now - new Date(d).getTime()) / 86400000 <= 7;
    const thisWeek = entries.filter((e) => wk(e.date));
    const latestWeight = [...entries].reverse().find((e) => e.values.weight != null)?.values.weight;
    const prevWeight = [...entries].reverse().filter((e) => e.values.weight != null)[1]?.values.weight;
    return {
      logs: thisWeek.length,
      weightDelta: latestWeight != null && prevWeight != null ? +(latestWeight - prevWeight).toFixed(1) : null,
      xp: getXP(user?.email),
      workouts: user?.stats?.totalWorkouts ?? 0,
      streak: user?.streak ?? 0,
    };
  }, [entries, user]);

  // Goal progress
  const goalProgress = useMemo(() => {
    if (!goal.target || !goal.start) return null;
    const target = parseFloat(goal.target), start = parseFloat(goal.start);
    const latest = [...entries].reverse().find((e) => e.values[goal.metric] != null)?.values[goal.metric];
    if (latest == null || Number.isNaN(target) || Number.isNaN(start)) return null;
    const total = Math.abs(target - start) || 1;
    const done = Math.abs(latest - start);
    const pct = Math.max(0, Math.min(100, (done / total) * 100));
    return { pct, latest, target, m: METRICS.find((m) => m.key === goal.metric)! };
  }, [goal, entries]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Body Metrics</h1>
        <p className="text-sm text-[#e9f3f5]/68">Log your measurements, track trends, and hit your goals</p>
      </div>

      {/* Weekly report card */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffb627]">📋 Weekly Report Card</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Logs this week", value: report.logs, color: "#2dd4bf" },
            { label: "Weight change", value: report.weightDelta == null ? "—" : `${report.weightDelta > 0 ? "+" : ""}${report.weightDelta}kg`, color: report.weightDelta != null && report.weightDelta < 0 ? "#34e08a" : "#ffb627" },
            { label: "Workouts", value: report.workouts, color: "#3b9dff" },
            { label: "Day streak", value: report.streak, color: "#ff8a75" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-3 text-center">
              <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/65">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Logger */}
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">✍️ Log today's measurements</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {METRICS.map((m) => (
              <label key={m.key} className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/65">{m.label} ({m.unit})</span>
                <input type="number" inputMode="decimal" value={draft[m.key] ?? ""} onChange={(e) => setDraft({ ...draft, [m.key]: e.target.value })} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-3 py-2.5 text-sm outline-none focus:border-violet-200/40" />
              </label>
            ))}
          </div>
          <button type="button" onClick={saveEntry} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Save Entry (+8 XP)</button>
        </div>

        {/* Trend chart */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">📉 Trend</p>
            <select value={active} onChange={(e) => setActive(e.target.value as MetricKey)} className="rounded-lg border border-[#e9f3f5]/12 bg-[#0a141f] px-3 py-1.5 text-xs outline-none">
              {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
          <div className="mt-4">
            <TrendChart entries={entries} metric={activeMetric} />
          </div>
        </div>
      </div>

      {/* Goal setter */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffb627]">🎯 Goal Milestone</p>
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <div className="flex flex-wrap gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/65">Metric</span>
              <select value={goal.metric} onChange={(e) => setGoal({ ...goal, metric: e.target.value as MetricKey })} className="rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-3 py-2.5 text-sm outline-none">
                {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/65">Start</span>
              <input type="number" value={goal.start} onChange={(e) => setGoal({ ...goal, start: e.target.value })} className="w-24 rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-3 py-2.5 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/65">Target</span>
              <input type="number" value={goal.target} onChange={(e) => setGoal({ ...goal, target: e.target.value })} className="w-24 rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-3 py-2.5 text-sm outline-none" />
            </label>
            <button type="button" onClick={saveGoal} className="btn-gloss self-end rounded-full bg-gradient-to-r from-[#ffb627] to-orange-400 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#04121a]">Set Goal</button>
          </div>

          {goalProgress && (
            <div className="flex items-center gap-4">
              <GoalRing pct={goalProgress.pct} color={goalProgress.m.color}>
                <span className="text-lg font-black tabular-nums" style={{ color: goalProgress.m.color }}>{Math.round(goalProgress.pct)}%</span>
              </GoalRing>
              <div>
                <p className="text-sm font-bold">{goalProgress.m.label} goal</p>
                <p className="text-xs text-[#e9f3f5]/68">Now {goalProgress.latest}{goalProgress.m.unit} → target {goalProgress.target}{goalProgress.m.unit}</p>
                {goalProgress.pct >= 100 && <p className="mt-1 text-xs font-bold text-emerald-300">🎉 Goal reached!</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
