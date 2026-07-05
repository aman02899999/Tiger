import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Strength Lab — interactive tools: 1RM calculator with live plate  */
/* visualizer, personal-records tracker (localStorage), rest timer.  */
/* No SVG — CSS/emoji only.                                          */
/* ---------------------------------------------------------------- */

/* ===== 1. One-Rep-Max calculator ================================= */

// Epley formula + a percentage table for training loads.
function epley1RM(weight: number, reps: number) {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

const PERCENT_TABLE = [
  { pct: 100, reps: "1" },
  { pct: 95, reps: "2" },
  { pct: 90, reps: "4" },
  { pct: 85, reps: "6" },
  { pct: 80, reps: "8" },
  { pct: 75, reps: "10" },
  { pct: 70, reps: "12" },
  { pct: 65, reps: "16" },
];

// Standard kg plates for the visualizer.
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATE_COLOR: Record<number, string> = {
  25: "#ef4444", 20: "#3b82f6", 15: "#eab308", 10: "#22c55e",
  5: "#f8fafc", 2.5: "#f97316", 1.25: "#a3a3a3",
};

function platesForSide(target: number, bar = 20) {
  let remain = (target - bar) / 2;
  const out: number[] = [];
  if (remain <= 0) return out;
  for (const p of PLATES) {
    while (remain >= p - 0.001) {
      out.push(p);
      remain = Math.round((remain - p) * 100) / 100;
    }
  }
  return out;
}

function OneRepMax() {
  const [weight, setWeight] = useState(60);
  const [reps, setReps] = useState(5);
  const oneRM = epley1RM(weight, reps);
  const sidePlates = useMemo(() => platesForSide(weight), [weight]);

  return (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">💪 One-Rep-Max Calculator</p>
      <h2 className="mt-1 text-xl font-black">Estimate your max & training loads</h2>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 flex justify-between text-xs font-bold uppercase tracking-[0.16em] text-[#f7f0df]/65">
            <span>Weight lifted</span><span className="text-[#d8b35a]">{weight} kg</span>
          </span>
          <input type="range" min={20} max={300} step={2.5} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full accent-violet-400" />
        </label>
        <label className="block">
          <span className="mb-2 flex justify-between text-xs font-bold uppercase tracking-[0.16em] text-[#f7f0df]/65">
            <span>Reps performed</span><span className="text-[#d8b35a]">{reps}</span>
          </span>
          <input type="range" min={1} max={15} step={1} value={reps} onChange={(e) => setReps(Number(e.target.value))} className="w-full accent-violet-400" />
        </label>
      </div>

      <div className="mt-5 rounded-2xl border border-[#d8b35a]/25 bg-gradient-to-br from-[#d8b35a]/12 to-violet-300/8 p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f7f0df]/65">Estimated 1-Rep Max</p>
        <p className="mt-1 text-5xl font-black tabular-nums text-[#d8b35a]">{oneRM}<span className="text-2xl"> kg</span></p>
      </div>

      {/* Live barbell plate visualizer */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f7f0df]/65">Load the bar ({weight} kg · 20 kg bar)</p>
        <div className="flex items-center justify-center gap-0.5 overflow-x-auto rounded-xl bg-black/30 p-4">
          {sidePlates.length === 0 ? (
            <span className="text-xs text-[#f7f0df]/62">Just the empty bar</span>
          ) : (
            <>
              {[...sidePlates].reverse().map((p, i) => (
                <div key={`l${i}`} className="flex flex-col items-center justify-center rounded-sm" style={{ background: PLATE_COLOR[p], width: 12 + p * 0.6, height: 40 + p * 2, color: p >= 15 ? "#fff" : "#111" }}>
                  <span className="text-[8px] font-black">{p}</span>
                </div>
              ))}
              <div className="h-3 w-16 bg-gradient-to-r from-neutral-400 to-neutral-600" title="barbell" />
              {sidePlates.map((p, i) => (
                <div key={`r${i}`} className="flex flex-col items-center justify-center rounded-sm" style={{ background: PLATE_COLOR[p], width: 12 + p * 0.6, height: 40 + p * 2, color: p >= 15 ? "#fff" : "#111" }}>
                  <span className="text-[8px] font-black">{p}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Training load table */}
      <div className="mt-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f7f0df]/65">Your training loads</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {PERCENT_TABLE.map((row) => (
            <div key={row.pct} className="rounded-lg border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-2.5 text-center">
              <p className="text-sm font-black tabular-nums">{Math.round((oneRM * row.pct) / 100 / 2.5) * 2.5}<span className="text-[10px] font-normal text-[#f7f0df]/62"> kg</span></p>
              <p className="text-[10px] text-[#f7f0df]/62">{row.pct}% · {row.reps} reps</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== 2. Personal records tracker =============================== */

interface PR { id: string; lift: string; weight: number; date: string }
const LIFTS = ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row", "Pull-Up (+kg)"];

function PersonalRecords() {
  const { user } = useAuth();
  const storeKey = `tfp_prs_${user?.email ?? "guest"}`;
  const [prs, setPRs] = useState<PR[]>([]);
  const [lift, setLift] = useState(LIFTS[0]);
  const [weight, setWeight] = useState("");

  useEffect(() => {
    try { setPRs(JSON.parse(localStorage.getItem(storeKey) ?? "[]")); } catch { setPRs([]); }
  }, [storeKey]);

  function save(next: PR[]) {
    setPRs(next);
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function add() {
    const w = parseFloat(weight);
    if (!w || w <= 0) return;
    const prev = prs.filter((p) => p.lift === lift).reduce((m, p) => Math.max(m, p.weight), 0);
    const entry: PR = { id: `${Date.now()}`, lift, weight: w, date: new Date().toISOString().slice(0, 10) };
    save([entry, ...prs].slice(0, 50));
    setWeight("");
    if (w > prev) addXP(user?.email, 15); // reward a new PR
  }

  function remove(id: string) {
    save(prs.filter((p) => p.id !== id));
  }

  const bests = useMemo(() => {
    const map: Record<string, number> = {};
    prs.forEach((p) => { map[p.lift] = Math.max(map[p.lift] ?? 0, p.weight); });
    return map;
  }, [prs]);

  return (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">🏆 Personal Records</p>
      <h2 className="mt-1 text-xl font-black">Log a lift — beat your best for +15 XP</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <select value={lift} onChange={(e) => setLift(e.target.value)} className="flex-1 rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40">
          {LIFTS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <input
          type="number" inputMode="decimal" value={weight} placeholder="kg"
          onChange={(e) => setWeight(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="w-24 rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40"
        />
        <button type="button" onClick={add} className="btn-gloss rounded-xl bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Add</button>
      </div>

      {/* Best per lift */}
      {Object.keys(bests).length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(bests).map(([l, w]) => (
            <div key={l} className="rounded-xl border border-[#d8b35a]/25 bg-[#d8b35a]/10 p-3 text-center">
              <p className="text-lg font-black tabular-nums text-[#d8b35a]">{w} kg</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#f7f0df]/68">{l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent log */}
      <div className="mt-4 space-y-2">
        {prs.length === 0 ? (
          <p className="rounded-xl bg-white/5 p-4 text-center text-xs text-[#f7f0df]/62">No lifts logged yet — add your first above to start tracking progress.</p>
        ) : (
          prs.slice(0, 6).map((p) => {
            const isBest = bests[p.lift] === p.weight;
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-3">
                <span className="text-lg">{isBest ? "🥇" : "•"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.lift} — <span className="tabular-nums">{p.weight} kg</span> {isBest && <span className="text-[10px] font-black text-[#d8b35a]">PR</span>}</p>
                  <p className="text-[11px] text-[#f7f0df]/62">{p.date}</p>
                </div>
                <button type="button" onClick={() => remove(p.id)} aria-label="Delete entry" className="rounded-lg border border-[#f7f0df]/12 px-2.5 py-1 text-xs text-[#f7f0df]/60 hover:bg-rose-400/10 hover:text-rose-200">✕</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ===== 3. Rest timer ============================================= */

const REST_PRESETS = [60, 90, 120, 180];

function RestTimer() {
  const [target, setTarget] = useState(90);
  const [left, setLeft] = useState(90);
  const [running, setRunning] = useState(false);
  const beeped = useRef(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (left === 0 && running && !beeped.current) {
      beeped.current = true;
      setRunning(false);
      // lightweight audio cue via WebAudio (no asset)
      try {
        const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
        const ctx = new AC();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        o.start(); o.stop(ctx.currentTime + 0.25);
      } catch { /* audio unavailable */ }
    }
  }, [left, running]);

  function pick(s: number) { setTarget(s); setLeft(s); setRunning(false); beeped.current = false; }
  function toggle() { if (left === 0) { setLeft(target); beeped.current = false; } setRunning((r) => !r); }
  function reset() { setLeft(target); setRunning(false); beeped.current = false; }

  const pct = target > 0 ? left / target : 0;
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">⏱️ Rest Timer</p>
      <h2 className="mt-1 text-xl font-black">Time your rest between sets</h2>

      <div className="mt-5 flex items-center gap-6">
        <div className="relative h-32 w-32 shrink-0">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${left === 0 ? "#34d399" : "#38bdf8"} ${pct * 360}deg, rgba(247,240,223,0.1) ${pct * 360}deg)`, transition: "background 0.9s linear" }} />
          <div className="absolute inset-[8px] grid place-items-center rounded-full bg-[#0b0714]">
            <span className="text-2xl font-black tabular-nums">{left === 0 ? "Done!" : `${mm}:${ss}`}</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {REST_PRESETS.map((s) => (
              <button key={s} type="button" onClick={() => pick(s)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${target === s ? "bg-sky-500 text-white" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/68 hover:text-[#f7f0df]"}`}>
                {s < 120 ? `${s}s` : `${s / 60}m`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={toggle} className="btn-gloss flex-1 rounded-full bg-gradient-to-r from-sky-400 to-sky-600 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              {running ? "⏸ Pause" : left === 0 ? "↻ Restart" : "▶ Start"}
            </button>
            <button type="button" onClick={reset} className="rounded-full border border-[#f7f0df]/15 px-5 py-3 text-xs font-bold text-[#f7f0df]/70 hover:bg-[#f7f0df]/8">Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Page ====================================================== */

export default function StrengthLabPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Strength Lab</h1>
        <p className="text-sm text-[#f7f0df]/68">Interactive tools to calculate, track and time your training</p>
      </div>

      {/* How this works */}
      <div className="glass-card rounded-2xl p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Three tools, fully interactive</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { n: "1", t: "Find your max", d: "Slide in a weight and reps — get your estimated 1RM, the exact plates to load, and all your training percentages." },
            { n: "2", t: "Log your PRs", d: "Record every lift. Beat your previous best and earn +15 XP. Your records save automatically." },
            { n: "3", t: "Time your rest", d: "Pick a rest interval and hit start — a countdown ring with an audio cue keeps your sets on schedule." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-white/8 bg-white/5 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-black text-white">{s.n}</div>
              <p className="text-sm font-bold text-[#f7f0df]">{s.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#f7f0df]/68">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <OneRepMax />
        <div className="space-y-6">
          <PersonalRecords />
          <RestTimer />
        </div>
      </div>
    </div>
  );
}
