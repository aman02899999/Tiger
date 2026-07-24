import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Consistency Hub — a GitHub-style activity heatmap. Tap any day to */
/* mark it active; the last ~26 weeks build your streak & totals.    */
/* Persists per user in localStorage. No SVG.                        */
/* ---------------------------------------------------------------- */

const WEEKS = 26;
const DAY_MS = 86400000;

function isoDay(d: Date) { return d.toISOString().slice(0, 10); }

function loadDays(email: string | null | undefined): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(`tfp_consistency_${email ?? "guest"}`) ?? "{}"); } catch { return {}; }
}

const LEVEL_BG = [
  "rgba(247,240,223,0.06)", // 0 — none
  "rgba(249,115,22,0.35)", // 1
  "rgba(249,115,22,0.60)", // 2
  "rgba(251,146,60,0.75)", // 3
  "linear-gradient(135deg,#fb923c,#ea580c)", // 4 — max
];

export default function ConsistencyHub() {
  const { user } = useAuth();
  const storeKey = `tfp_consistency_${user?.email ?? "guest"}`;
  const [days, setDays] = useState<Record<string, number>>({});

  useEffect(() => { setDays(loadDays(user?.email)); }, [user?.email]);

  function save(next: Record<string, number>) {
    setDays(next);
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* ignore */ }
  }

  // Build the grid: columns = weeks, rows = 7 days (Sun..Sat), aligned to today.
  const grid = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // find the Saturday that ends this week
    const end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const start = new Date(end.getTime() - (WEEKS * 7 - 1) * DAY_MS);
    const cols: { key: string; future: boolean }[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const col: { key: string; future: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start.getTime() + (w * 7 + d) * DAY_MS);
        col.push({ key: isoDay(date), future: date.getTime() > today.getTime() });
      }
      cols.push(col);
    }
    return cols;
  }, []);

  function cycle(key: string, future: boolean) {
    if (future) return;
    const cur = days[key] ?? 0;
    const next = { ...days };
    const nv = (cur + 1) % 5;
    if (nv === 0) delete next[key]; else next[key] = nv;
    // reward the first time a day goes from 0 -> active
    if (cur === 0) addXP(user?.email, 3);
    save(next);
  }

  // Stats
  const activeKeys = Object.keys(days);
  const totalActive = activeKeys.length;
  const totalPoints = activeKeys.reduce((s, k) => s + days[k], 0);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // allow today to be unmarked without breaking streak
    if (!days[isoDay(d)]) d.setDate(d.getDate() - 1);
    while (days[isoDay(d)]) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  }, [days]);

  const bestStreak = useMemo(() => {
    const sorted = activeKeys.sort();
    let best = 0, run = 0, prev: number | null = null;
    for (const k of sorted) {
      const t = new Date(k).getTime();
      if (prev !== null && t - prev === DAY_MS) run++; else run = 1;
      best = Math.max(best, run);
      prev = t;
    }
    return best;
  }, [activeKeys]);

  const stats = [
    { label: "Current Streak", value: `${currentStreak}`, unit: "days", color: "#ea580c" },
    { label: "Best Streak", value: `${bestStreak}`, unit: "days", color: "#fb923c" },
    { label: "Active Days", value: `${totalActive}`, unit: "logged", color: "#f97316" },
    { label: "Effort Points", value: `${totalPoints}`, unit: "total", color: "#059669" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Consistency</h1>
        <p className="text-sm text-[#2a1e16]/68">Don't break the chain — tap each day you train to build your streak</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4">
            <p className="text-3xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2a1e16]/65">{s.unit} · {s.label}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="glass-card rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Last {WEEKS} weeks</p>
          <p className="text-[11px] text-[#2a1e16]/62">Tap a day to cycle intensity · +3 XP first log</p>
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-1" style={{ minWidth: WEEKS * 18 }}>
            {grid.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-1">
                {col.map((cell) => {
                  const lvl = days[cell.key] ?? 0;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={cell.future}
                      onClick={() => cycle(cell.key, cell.future)}
                      title={cell.future ? "" : `${cell.key}${lvl ? ` · level ${lvl}` : ""}`}
                      className={`h-3.5 w-3.5 rounded-sm transition ${cell.future ? "opacity-0" : "hover:ring-2 hover:ring-orange-300/50"}`}
                      style={{ background: LEVEL_BG[lvl] }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {/* legend */}
        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-[#2a1e16]/62">
          <span>Less</span>
          {LEVEL_BG.map((bg, i) => <span key={i} className="h-3 w-3 rounded-sm" style={{ background: bg }} />)}
          <span>More</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">💡 The chain method</p>
        <p className="mt-2 text-sm leading-relaxed text-[#2a1e16]/75">
          Jerry Seinfeld's productivity trick: mark an X for every day you show up. Soon you'll have a chain of X's —
          and your only job becomes "don't break the chain." One tap a day is all it takes.
        </p>
      </div>
    </div>
  );
}
