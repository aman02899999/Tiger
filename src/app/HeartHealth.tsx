import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Heart Health & Coherence Breathing — an interactive breathing     */
/* trainer with an animated orb, ripple rings, a beating heart, and  */
/* a live "coherence" score that climbs while you breathe in rhythm. */
/* Pure CSS/Canvas visuals, no SVG, no assets.                       */
/* ---------------------------------------------------------------- */

type Phase = "inhale" | "hold" | "exhale" | "holdOut";

interface Technique {
  id: string;
  name: string;
  tagline: string;
  benefit: string;
  // durations in seconds per phase (0 = skipped)
  inhale: number; hold: number; exhale: number; holdOut: number;
  accent: string;
}

const TECHNIQUES: Technique[] = [
  { id: "resonance", name: "Heart Coherence", tagline: "5.5 breaths / min", benefit: "The clinically-studied pace for heart-rate variability and calm focus.", inhale: 5.5, hold: 0, exhale: 5.5, holdOut: 0, accent: "#fb923c" },
  { id: "box", name: "Box Breathing", tagline: "4 · 4 · 4 · 4", benefit: "Navy-SEAL technique to steady nerves and lower stress fast.", inhale: 4, hold: 4, exhale: 4, holdOut: 4, accent: "#f97316" },
  { id: "478", name: "4-7-8 Relax", tagline: "Sleep & anxiety", benefit: "A longer exhale flips on the parasympathetic 'rest & digest' system.", inhale: 4, hold: 7, exhale: 8, holdOut: 0, accent: "#38bdf8" },
  { id: "calm", name: "Calm Down", tagline: "4 · 6 extended exhale", benefit: "Quick reset — longer out-breath drops your heart rate within a minute.", inhale: 4, hold: 0, exhale: 6, holdOut: 0, accent: "#34d399" },
];

const PHASE_ORDER: Phase[] = ["inhale", "hold", "exhale", "holdOut"];
const PHASE_LABEL: Record<Phase, string> = { inhale: "Breathe In", hold: "Hold", exhale: "Breathe Out", holdOut: "Hold" };

export default function HeartHealthPage() {
  const { user } = useAuth();
  const [tech, setTech] = useState<Technique>(TECHNIQUES[0]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [phaseLeft, setPhaseLeft] = useState(tech.inhale);
  const [cycles, setCycles] = useState(0);
  const [coherence, setCoherence] = useState(20);
  const [elapsed, setElapsed] = useState(0);
  const rewarded = useRef(false);

  const phaseDur = (p: Phase) => tech[p];

  // reset when technique changes
  useEffect(() => {
    setRunning(false);
    setPhase("inhale");
    setPhaseLeft(tech.inhale);
    setCycles(0);
    setCoherence(20);
    setElapsed(0);
    rewarded.current = false;
  }, [tech]);

  // main tick — 100ms resolution for smooth countdown
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setPhaseLeft((prev) => {
        const next = +(prev - 0.1).toFixed(1);
        if (next > 0) return next;
        // advance to next non-zero phase
        setPhase((cur) => {
          let idx = PHASE_ORDER.indexOf(cur);
          for (let i = 0; i < 4; i++) {
            idx = (idx + 1) % 4;
            const p = PHASE_ORDER[idx];
            if (phaseDur(p) > 0) {
              if (p === "inhale") setCycles((c) => c + 1);
              setPhaseLeft(phaseDur(p));
              return p;
            }
          }
          return cur;
        });
        return 0;
      });
      setElapsed((e) => +(e + 0.1).toFixed(1));
      // coherence climbs steadily while breathing, decays when idle
      setCoherence((c) => Math.min(100, c + 0.25));
    }, 100);
    return () => clearInterval(t);
  }, [running, tech]);

  // reward at 2 minutes of practice
  useEffect(() => {
    if (elapsed >= 120 && !rewarded.current) {
      rewarded.current = true;
      addXP(user?.email, 20);
    }
  }, [elapsed, user]);

  // orb scale target by phase
  const dur = phaseDur(phase) || 1;
  const progress = 1 - phaseLeft / dur;
  const orbScale = useMemo(() => {
    if (phase === "inhale") return 0.6 + progress * 0.5; // grow
    if (phase === "exhale") return 1.1 - progress * 0.5; // shrink
    if (phase === "hold") return 1.1;
    return 0.6;
  }, [phase, progress]);

  // simulated BPM drops as coherence rises (72 → ~58)
  const bpm = Math.round(72 - (coherence / 100) * 14);
  const beatDur = 60 / bpm;
  const cohColor = coherence >= 75 ? "#34d399" : coherence >= 45 ? "#ea580c" : "#fb923c";
  const mm = Math.floor(elapsed / 60);
  const ss = String(Math.floor(elapsed % 60)).padStart(2, "0");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Heart Health &amp; Breathing</h1>
        <p className="text-sm text-[#2a1e16]/68">Guided coherence breathing to calm your nervous system and strengthen your heart</p>
      </div>

      {/* Technique picker */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TECHNIQUES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTech(t)}
            className={`rounded-2xl border p-4 text-left transition ${tech.id === t.id ? "border-black/25 bg-black/10" : "border-[#2a1e16]/10 bg-[#2a1e16]/5 hover:bg-[#2a1e16]/10"}`}
            style={tech.id === t.id ? { boxShadow: `0 0 24px ${t.accent}30` } : undefined}
          >
            <p className="text-sm font-black" style={{ color: tech.id === t.id ? t.accent : undefined }}>{t.name}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#2a1e16]/62">{t.tagline}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#2a1e16]/68">{t.benefit}</p>
          </button>
        ))}
      </div>

      {/* Breathing stage */}
      <div className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 45%, ${tech.accent}22 0%, transparent 60%)` }} />

        <div className="relative flex flex-col items-center">
          {/* Orb + ripples */}
          <div className="relative grid h-72 w-72 place-items-center">
            {running && [0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute h-40 w-40 rounded-full"
                style={{ border: `2px solid ${tech.accent}`, animation: `breathRipple 3s ${i * 1}s ease-out infinite` }}
              />
            ))}
            <div
              className="grid h-40 w-40 place-items-center rounded-full"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${tech.accent}, #7c2d12 70%)`,
                transform: `scale(${orbScale})`,
                transition: "transform 0.1s linear",
                boxShadow: `0 0 60px ${tech.accent}66, inset 0 0 40px rgba(255,255,255,0.15)`,
              }}
            >
              <div className="text-center">
                <p className="text-lg font-black text-white drop-shadow">{running ? PHASE_LABEL[phase] : "Ready"}</p>
                <p className="text-3xl font-black tabular-nums text-white drop-shadow">{running ? Math.ceil(phaseLeft) : "—"}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="btn-gloss rounded-full px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-white"
              style={{ background: `linear-gradient(90deg, ${tech.accent}, #c2410c)` }}
            >
              {running ? "⏸ Pause" : "▶ Begin Breathing"}
            </button>
            <button
              type="button"
              onClick={() => { setRunning(false); setPhase("inhale"); setPhaseLeft(tech.inhale); setCycles(0); setCoherence(20); setElapsed(0); rewarded.current = false; }}
              className="rounded-full border border-[#2a1e16]/15 px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#2a1e16]/70 hover:bg-[#2a1e16]/8"
            >
              Reset
            </button>
          </div>
          <p className="mt-3 text-xs text-[#2a1e16]/62">Follow the orb — breathe in as it grows, out as it shrinks. {tech.name} · {tech.tagline}</p>
        </div>
      </div>

      {/* Live metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Beating heart */}
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">Heart Rate</p>
          <div className="mt-3 text-5xl" style={{ animation: running ? `heartBeat ${beatDur}s ease-in-out infinite` : "none" }}>❤️</div>
          <p className="mt-3 text-3xl font-black tabular-nums">{bpm}<span className="text-sm font-normal text-[#2a1e16]/62"> bpm</span></p>
          <p className="text-[11px] text-[#2a1e16]/62">{running ? "settling as you breathe…" : "start to see it drop"}</p>
        </div>

        {/* Coherence score */}
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: cohColor }}>Coherence</p>
          <div className="relative mx-auto mt-3 h-24 w-24">
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${cohColor} ${coherence * 3.6}deg, rgba(247,240,223,0.1) ${coherence * 3.6}deg)`, transition: "background 0.3s linear" }} />
            <div className="absolute inset-[7px] grid place-items-center rounded-full bg-[#fffdf9]">
              <span className="text-2xl font-black tabular-nums" style={{ color: cohColor }}>{Math.round(coherence)}</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-[#2a1e16]/62">{coherence >= 75 ? "In the coherence zone! 🌊" : "keep the rhythm steady"}</p>
        </div>

        {/* Session */}
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Session</p>
          <p className="mt-3 text-4xl font-black tabular-nums">{mm}:{ss}</p>
          <p className="text-[11px] text-[#2a1e16]/62">{cycles} full breaths</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2a1e16]/10">
            <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-500" style={{ width: `${Math.min(100, (elapsed / 120) * 100)}%` }} />
          </div>
          <p className="mt-1.5 text-[10px] text-[#2a1e16]/55">{elapsed >= 120 ? "Goal reached · +20 XP 🎉" : "Breathe 2 min for +20 XP"}</p>
        </div>
      </div>

      {/* Why it works */}
      <div className="glass-card rounded-2xl p-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Why slow breathing helps your heart</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: "🫀", t: "Raises HRV", d: "Breathing at ~6 breaths/min syncs your heartbeat with your breath, boosting heart-rate variability — a key marker of a healthy, resilient heart." },
            { icon: "🧠", t: "Calms the mind", d: "Long exhales activate the vagus nerve and parasympathetic system, lowering stress hormones and blood pressure." },
            { icon: "😴", t: "Improves sleep", d: "A few minutes before bed slows your heart rate and quiets a racing mind, helping you fall asleep faster." },
          ].map((s) => (
            <div key={s.t} className="rounded-xl border border-black/8 bg-black/5 p-4">
              <div className="text-2xl">{s.icon}</div>
              <p className="mt-2 text-sm font-bold text-[#2a1e16]">{s.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#2a1e16]/68">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-[#2a1e16]/55">Heart rate and coherence shown here are illustrative guides to keep you in rhythm, not medical measurements.</p>
      </div>
    </div>
  );
}
