import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Interval Timer — Tabata / EMOM / AMRAP / Custom HIIT timer with    */
/* a big phase display, color-coded work/rest, and WebAudio beeps on  */
/* every transition (last-3-second countdown + a distinct end tone).  */
/* Pure client-side, no assets. No SVG (CSS conic ring).              */
/* ---------------------------------------------------------------- */

interface Preset {
  id: string;
  name: string;
  tagline: string;
  prep: number;
  work: number;
  rest: number;
  rounds: number;
  sets: number;      // groups of rounds
  restBetweenSets: number;
}

const PRESETS: Preset[] = [
  { id: "tabata", name: "Tabata", tagline: "20s work / 10s rest × 8", prep: 10, work: 20, rest: 10, rounds: 8, sets: 1, restBetweenSets: 0 },
  { id: "emom", name: "EMOM", tagline: "Every minute on the minute × 10", prep: 10, work: 60, rest: 0, rounds: 10, sets: 1, restBetweenSets: 0 },
  { id: "hiit", name: "Classic HIIT", tagline: "40s work / 20s rest × 10", prep: 10, work: 40, rest: 20, rounds: 10, sets: 1, restBetweenSets: 0 },
  { id: "fighter", name: "Fighter Rounds", tagline: "3 min work / 1 min rest × 5", prep: 15, work: 180, rest: 60, rounds: 5, sets: 1, restBetweenSets: 0 },
  { id: "pyramid", name: "Circuit", tagline: "45/15 × 6, 2 sets", prep: 10, work: 45, rest: 15, rounds: 6, sets: 2, restBetweenSets: 60 },
];

type Phase = "idle" | "prep" | "work" | "rest" | "setrest" | "done";

// One shared AudioContext, lazily created on first user gesture.
let audioCtx: AudioContext | null = null;
function beep(freq: number, durationMs: number, volume = 0.2) {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AC();
    }
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch { /* audio unavailable */ }
}

const PHASE_META: Record<Phase, { label: string; color: string }> = {
  idle: { label: "Ready", color: "#2dd4bf" },
  prep: { label: "Get Ready", color: "#ffb627" },
  work: { label: "WORK", color: "#34e08a" },
  rest: { label: "Rest", color: "#60b6fa" },
  setrest: { label: "Set Break", color: "#3b9dff" },
  done: { label: "Done!", color: "#34e08a" },
};

export default function IntervalTimerPage() {
  const { user } = useAuth();
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [custom, setCustom] = useState({ work: 30, rest: 15, rounds: 8 });
  const [useCustom, setUseCustom] = useState(false);

  const active = useMemo<Preset>(
    () => (useCustom ? { id: "custom", name: "Custom", tagline: "Your settings", prep: 10, work: custom.work, rest: custom.rest, rounds: custom.rounds, sets: 1, restBetweenSets: 0 } : preset),
    [useCustom, custom, preset]
  );

  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [round, setRound] = useState(1);
  const [setNum, setSetNum] = useState(1);
  const rewarded = useRef(false);

  // Reset when the selected workout changes.
  useEffect(() => {
    setPhase("idle");
    setRunning(false);
    setRemaining(active.prep);
    setRound(1);
    setSetNum(1);
    rewarded.current = false;
  }, [active]);

  function start() {
    if (phase === "idle" || phase === "done") {
      setPhase("prep");
      setRemaining(active.prep);
      setRound(1);
      setSetNum(1);
      rewarded.current = false;
    }
    setRunning(true);
    beep(880, 120);
  }

  function advance() {
    // Called when the current phase hits 0. Decide the next phase.
    if (phase === "prep") {
      setPhase("work"); setRemaining(active.work); beep(1200, 200); return;
    }
    if (phase === "work") {
      if (round < active.rounds) {
        if (active.rest > 0) { setPhase("rest"); setRemaining(active.rest); beep(500, 200); }
        else { setRound((r) => r + 1); setPhase("work"); setRemaining(active.work); beep(1200, 200); }
      } else if (setNum < active.sets) {
        setPhase("setrest"); setRemaining(active.restBetweenSets); beep(500, 300);
      } else {
        finish();
      }
      return;
    }
    if (phase === "rest") {
      setRound((r) => r + 1); setPhase("work"); setRemaining(active.work); beep(1200, 200); return;
    }
    if (phase === "setrest") {
      setSetNum((s) => s + 1); setRound(1); setPhase("work"); setRemaining(active.work); beep(1200, 200); return;
    }
  }

  function finish() {
    setPhase("done");
    setRunning(false);
    beep(1400, 500);
    if (!rewarded.current) { rewarded.current = true; addXP(user?.email, 25); }
  }

  // Tick loop.
  useEffect(() => {
    if (!running || phase === "idle" || phase === "done") return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) return 0;
        if (r <= 4) beep(700, 90, 0.15); // last-3 countdown ticks
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, phase]);

  // When remaining hits 0 during a run, move to the next phase.
  useEffect(() => {
    if (running && remaining === 0 && phase !== "idle" && phase !== "done") {
      advance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  function reset() {
    setRunning(false);
    setPhase("idle");
    setRemaining(active.prep);
    setRound(1);
    setSetNum(1);
    rewarded.current = false;
  }

  const meta = PHASE_META[phase];
  const phaseTotal = phase === "prep" ? active.prep : phase === "work" ? active.work : phase === "rest" ? active.rest : phase === "setrest" ? active.restBetweenSets : 1;
  const progress = phaseTotal > 0 ? 1 - remaining / phaseTotal : 0;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");
  const totalWork = active.work * active.rounds * active.sets;
  const estMin = Math.round((active.prep + (active.work + active.rest) * active.rounds * active.sets + active.restBetweenSets * (active.sets - 1)) / 60);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Interval Timer</h1>
        <p className="text-sm text-[#e9f3f5]/68">Tabata, EMOM, HIIT & custom rounds with audio cues</p>
      </div>

      {/* Preset picker */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => { setUseCustom(false); setPreset(p); }}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${!useCustom && preset.id === p.id ? "bg-violet-500 text-white" : "border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 text-[#e9f3f5]/68 hover:text-[#e9f3f5]"}`}
          >
            {p.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setUseCustom(true)}
          className={`rounded-full px-4 py-2 text-xs font-bold transition ${useCustom ? "bg-violet-500 text-white" : "border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 text-[#e9f3f5]/68 hover:text-[#e9f3f5]"}`}
        >
          ⚙️ Custom
        </button>
      </div>

      {useCustom && (
        <div className="glass-card grid grid-cols-3 gap-3 rounded-2xl p-5">
          {([["work", "Work (s)"], ["rest", "Rest (s)"], ["rounds", "Rounds"]] as const).map(([k, label]) => (
            <label key={k} className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/65">{label}</span>
              <input
                type="number" min={1} value={custom[k]}
                onChange={(e) => setCustom({ ...custom, [k]: Math.max(1, Number(e.target.value)) })}
                className="w-full rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-3 py-2.5 text-sm outline-none focus:border-violet-200/40"
              />
            </label>
          ))}
        </div>
      )}

      {/* Timer stage */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${meta.color}14 0%, transparent 60%)` }}>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#e9f3f5]/62">{active.name} · {active.tagline}</p>

        <div className="relative mx-auto mt-6 h-64 w-64">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${meta.color} ${progress * 360}deg, rgba(233,243,245,0.08) ${progress * 360}deg)`, transition: "background 0.9s linear" }} />
          <div className="absolute inset-[12px] grid place-items-center rounded-full bg-[#0a141f]">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.16em]" style={{ color: meta.color }}>{meta.label}</p>
              <p className="text-6xl font-black tabular-nums leading-none">{phase === "idle" ? `${Math.floor(active.prep / 60)}:${String(active.prep % 60).padStart(2, "0")}` : phase === "done" ? "🏆" : `${mm}:${ss}`}</p>
              {phase !== "idle" && phase !== "done" && (
                <p className="mt-1 text-xs font-bold text-[#e9f3f5]/62">Round {round}/{active.rounds}{active.sets > 1 ? ` · Set ${setNum}/${active.sets}` : ""}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => (running ? setRunning(false) : start())}
            className="btn-gloss rounded-full px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-white"
            style={{ background: `linear-gradient(90deg, ${meta.color}, #0e7490)` }}
          >
            {running ? "⏸ Pause" : phase === "done" ? "↻ Again" : phase === "idle" ? "▶ Start" : "▶ Resume"}
          </button>
          <button type="button" onClick={reset} className="rounded-full border border-[#e9f3f5]/15 px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#e9f3f5]/70 hover:bg-[#e9f3f5]/8">Reset</button>
        </div>

        {phase === "done" && <p className="mt-4 text-sm font-bold text-emerald-300">Session complete! +25 XP earned 🎉</p>}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total work", value: `${Math.floor(totalWork / 60)}:${String(totalWork % 60).padStart(2, "0")}` },
          { label: "Rounds", value: `${active.rounds}${active.sets > 1 ? ` × ${active.sets}` : ""}` },
          { label: "Est. duration", value: `~${estMin} min` },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
            <p className="text-xl font-black tabular-nums text-[#ffb627]">{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#e9f3f5]/62">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-[#e9f3f5]/55">🔊 Turn your volume up — the timer beeps a 3-second countdown and a distinct tone on every work/rest change.</p>
    </div>
  );
}
