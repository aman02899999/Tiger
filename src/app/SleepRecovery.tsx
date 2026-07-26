import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Sleep & Recovery — 90-min sleep-cycle bedtime calculator, nightly */
/* sleep logger with a weekly chart, and a recovery score.           */
/* Logs persist per user in localStorage. No SVG.                    */
/* ---------------------------------------------------------------- */

const CYCLE_MIN = 90;
const FALL_ASLEEP = 15; // minutes to drift off

function fmt(mins: number) {
  let m = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  m = m % 60;
  const ampm = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/* ===== 1. Bedtime / wake calculator ============================== */

function CycleCalculator() {
  const [mode, setMode] = useState<"wake" | "sleep">("wake");
  const [wake, setWake] = useState("06:30");
  const [sleepNow, setSleepNow] = useState(false);

  const results = useMemo(() => {
    if (mode === "wake") {
      const [h, m] = wake.split(":").map(Number);
      const wakeMin = h * 60 + m;
      // Best bedtimes = wake - fallAsleep - N cycles (prefer 6,5,4 cycles)
      return [6, 5, 4].map((cycles) => ({
        cycles,
        time: fmt(wakeMin - FALL_ASLEEP - cycles * CYCLE_MIN),
        hours: (cycles * CYCLE_MIN) / 60,
      }));
    } else {
      // sleeping now → best wake times
      const base = sleepNow ? nowMinutes() : 22 * 60; // fallback 10 PM
      return [6, 5, 4].map((cycles) => ({
        cycles,
        time: fmt(base + FALL_ASLEEP + cycles * CYCLE_MIN),
        hours: (cycles * CYCLE_MIN) / 60,
      }));
    }
  }, [mode, wake, sleepNow]);

  function nowMinutes() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">🌙 Sleep Cycle Calculator</p>
      <h2 className="mt-1 text-xl font-black">Wake up refreshed, not groggy</h2>
      <p className="mt-1 text-xs text-[#e9f3f5]/65">Sleep runs in ~90-min cycles — waking at the end of one feels far better than mid-cycle.</p>

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setMode("wake")} className={`flex-1 rounded-xl py-2.5 text-xs font-black uppercase tracking-[0.14em] transition ${mode === "wake" ? "bg-violet-500 text-white" : "border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 text-[#e9f3f5]/68"}`}>I want to wake at…</button>
        <button type="button" onClick={() => { setMode("sleep"); setSleepNow(true); }} className={`flex-1 rounded-xl py-2.5 text-xs font-black uppercase tracking-[0.14em] transition ${mode === "sleep" ? "bg-violet-500 text-white" : "border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 text-[#e9f3f5]/68"}`}>If I sleep now…</button>
      </div>

      {mode === "wake" && (
        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/65">Wake-up time</span>
          <input type="time" value={wake} onChange={(e) => setWake(e.target.value)} className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
        </label>
      )}

      <div className="mt-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/65">{mode === "wake" ? "Fall asleep at one of these" : "Set an alarm for one of these"}</p>
        {results.map((r, i) => (
          <div key={r.cycles} className={`flex items-center justify-between rounded-xl border p-3 ${i === 0 ? "border-[#ffb627]/40 bg-[#ffb627]/10" : "border-[#e9f3f5]/10 bg-[#e9f3f5]/5"}`}>
            <span className={`text-lg font-black tabular-nums ${i === 0 ? "text-[#ffb627]" : ""}`}>{r.time}</span>
            <span className="text-xs text-[#e9f3f5]/68">{r.cycles} cycles · {r.hours} hrs {i === 0 && "· recommended"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== 2. Sleep logger + weekly chart + recovery score =========== */

interface Night { date: string; hours: number; quality: number } // quality 1-5

function loadLog(email: string | null | undefined): Night[] {
  try { return JSON.parse(localStorage.getItem(`tfp_sleep_${email ?? "guest"}`) ?? "[]"); } catch { return []; }
}

function SleepLogger() {
  const { user } = useAuth();
  const storeKey = `tfp_sleep_${user?.email ?? "guest"}`;
  const [log, setLog] = useState<Night[]>([]);
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState(4);

  useEffect(() => { setLog(loadLog(user?.email)); }, [user?.email]);

  function save(next: Night[]) {
    setLog(next);
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function logTonight() {
    const date = new Date().toISOString().slice(0, 10);
    const without = log.filter((n) => n.date !== date);
    const isNew = without.length === log.length;
    save([{ date, hours, quality }, ...without].slice(0, 30));
    if (isNew) addXP(user?.email, 8);
  }

  const last7 = useMemo(() => {
    const days: Night[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = log.find((n) => n.date === key);
      days.push(found ?? { date: key, hours: 0, quality: 0 });
    }
    return days;
  }, [log]);

  const logged = last7.filter((d) => d.hours > 0);
  const avgHours = logged.length ? logged.reduce((s, d) => s + d.hours, 0) / logged.length : 0;
  const avgQual = logged.length ? logged.reduce((s, d) => s + d.quality, 0) / logged.length : 0;
  // Recovery score: blend of hours (target 8) and quality (target 5).
  const recovery = logged.length
    ? Math.round(Math.min(100, (Math.min(avgHours, 8) / 8) * 60 + (avgQual / 5) * 40))
    : 0;
  const recColor = recovery >= 80 ? "#34e08a" : recovery >= 60 ? "#ffb627" : recovery > 0 ? "#ff8a75" : "#64748b";
  const maxH = Math.max(8, ...last7.map((d) => d.hours));

  return (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">😴 Log last night</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 flex justify-between text-xs font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/65"><span>Hours slept</span><span className="text-[#ffb627]">{hours.toFixed(1)} h</span></span>
          <input type="range" min={3} max={12} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full accent-sky-400" />
        </label>
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/65">Quality</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((q) => (
              <button key={q} type="button" onClick={() => setQuality(q)} aria-label={`Quality ${q}`} className={`text-2xl transition ${q <= quality ? "" : "opacity-30 grayscale"}`}>⭐</button>
            ))}
          </div>
        </div>
      </div>

      <button type="button" onClick={logTonight} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Save Sleep (+8 XP)</button>

      {/* Weekly chart */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/65">Last 7 nights</p>
          <p className="text-xs text-[#e9f3f5]/62">{avgHours ? `${avgHours.toFixed(1)}h avg` : "no data"}</p>
        </div>
        <div className="mt-3 flex h-28 items-end justify-between gap-2">
          {last7.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-sky-500 to-cyan-300 transition-all duration-500"
                  style={{ height: d.hours ? `${(d.hours / maxH) * 100}%` : "3px", opacity: d.hours ? 1 : 0.25 }}
                  title={d.hours ? `${d.hours}h · ${d.quality}★` : "no data"}
                />
              </div>
              <span className="text-[10px] font-bold text-[#e9f3f5]/62">{new Date(d.date).toLocaleDateString("en", { weekday: "narrow" })}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recovery score */}
      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/5 p-4">
        <div className="relative h-20 w-20 shrink-0">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${recColor} ${recovery * 3.6}deg, rgba(233,243,245,0.1) ${recovery * 3.6}deg)` }} />
          <div className="absolute inset-[6px] grid place-items-center rounded-full bg-[#0a141f]">
            <span className="text-lg font-black tabular-nums" style={{ color: recColor }}>{recovery}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">Recovery Score</p>
          <p className="mt-0.5 text-xs text-[#e9f3f5]/68">
            {recovery === 0 && "Log a few nights to see your recovery score."}
            {recovery >= 80 && "Excellent — you're well recovered. Train hard today! 🔥"}
            {recovery >= 60 && recovery < 80 && "Decent recovery. A solid session is fine, listen to your body."}
            {recovery > 0 && recovery < 60 && "Under-recovered. Prioritize sleep; keep training light today. 😴"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SleepRecoveryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Sleep &amp; Recovery</h1>
        <p className="text-sm text-[#e9f3f5]/68">Time your sleep by cycles, log your nights, and track how recovered you are</p>
      </div>

      {/* How this works */}
      <div className="glass-card rounded-2xl p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">How this works — 3 simple steps</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { n: "1", t: "Plan your sleep", d: "Enter when you need to wake — the calculator gives bedtimes that land at the end of a 90-minute cycle so you wake refreshed." },
            { n: "2", t: "Log each morning", d: "Set how many hours you slept and rate the quality. Logging a new night earns +8 XP." },
            { n: "3", t: "Track recovery", d: "Your last 7 nights build a recovery score that tells you whether to train hard or take it easy today." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-white/8 bg-white/5 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-black text-white">{s.n}</div>
              <p className="text-sm font-bold text-[#e9f3f5]">{s.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#e9f3f5]/68">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CycleCalculator />
        <SleepLogger />
      </div>
    </div>
  );
}
