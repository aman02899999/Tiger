import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Daily Wellness Score — a quick check-in that blends the day's      */
/* pillars (sleep, steps, hydration, nutrition, movement, mood,       */
/* stress) into one 0–100 score with a breakdown and tips. Persists   */
/* per user + per day. No SVG.                                        */
/* ---------------------------------------------------------------- */

interface Factor {
  key: string;
  label: string;
  icon: string;
  /** score 0–100 from the raw input value */
  score: (v: number) => number;
  /** weight in the composite (sums to 1) */
  weight: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  tipLow: string;
}

const FACTORS: Factor[] = [
  { key: "sleep", label: "Sleep", icon: "😴", unit: "hrs", min: 0, max: 12, step: 0.5, weight: 0.22,
    score: (v) => v >= 7 && v <= 9 ? 100 : v >= 6 ? 80 : v >= 5 ? 55 : v > 0 ? 30 : 0,
    tipLow: "Aim for 7–9 hours — it's the strongest recovery lever you have." },
  { key: "steps", label: "Steps", icon: "🚶", unit: "k steps", min: 0, max: 20, step: 1, weight: 0.16,
    score: (v) => Math.min(100, Math.round((v / 8) * 100)),
    tipLow: "Add a post-meal walk to nudge your step count toward ~8k." },
  { key: "water", label: "Hydration", icon: "💧", unit: "glasses", min: 0, max: 15, step: 1, weight: 0.14,
    score: (v) => Math.min(100, Math.round((v / 8) * 100)),
    tipLow: "Keep a bottle in sight and sip through the day — target ~8 glasses." },
  { key: "nutrition", label: "Nutrition", icon: "🥗", unit: "/10", min: 0, max: 10, step: 1, weight: 0.18,
    score: (v) => v * 10,
    tipLow: "Anchor meals around protein and vegetables to lift this." },
  { key: "movement", label: "Training", icon: "🏋️", unit: "/10", min: 0, max: 10, step: 1, weight: 0.16,
    score: (v) => v * 10,
    tipLow: "Even a short, focused session counts — consistency beats intensity." },
  { key: "mood", label: "Mood", icon: "🙂", unit: "/10", min: 0, max: 10, step: 1, weight: 0.08,
    score: (v) => v * 10,
    tipLow: "A short walk, sunlight, or breathwork can lift mood quickly." },
  { key: "stress", label: "Calm", icon: "🧘", unit: "/10", min: 0, max: 10, step: 1, weight: 0.06,
    score: (v) => v * 10,
    tipLow: "Try the physiological sigh or a few minutes of slow breathing." },
];

function today() { return new Date().toISOString().slice(0, 10); }
function storeKey(email: string | null | undefined) { return `tfp_wellness_${email ?? "guest"}_${today()}`; }

const DEFAULTS: Record<string, number> = { sleep: 7, steps: 6, water: 5, nutrition: 6, movement: 5, mood: 7, stress: 6 };

export default function WellnessScorePage() {
  const { user } = useAuth();
  const [vals, setVals] = useState<Record<string, number>>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(storeKey(user?.email)) ?? "null");
      if (s?.vals) { setVals({ ...DEFAULTS, ...s.vals }); setSaved(true); setRewarded(true); }
    } catch { /* ignore */ }
  }, [user?.email]);

  const breakdown = useMemo(() => FACTORS.map((f) => ({ f, raw: vals[f.key], s: Math.max(0, Math.min(100, f.score(vals[f.key]))) })), [vals]);
  const total = useMemo(() => Math.round(breakdown.reduce((sum, b) => sum + b.s * b.f.weight, 0)), [breakdown]);

  const rating = total >= 85 ? { label: "Thriving", color: "#059669" } : total >= 70 ? { label: "Strong", color: "#f97316" } : total >= 50 ? { label: "Getting There", color: "#ea580c" } : { label: "Needs Care", color: "#fb7185" };
  const weakest = [...breakdown].sort((a, b) => a.s - b.s)[0];

  function save() {
    try { localStorage.setItem(storeKey(user?.email), JSON.stringify({ vals })); } catch { /* ignore */ }
    setSaved(true);
    if (!rewarded) { setRewarded(true); addXP(user?.email, 10); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Daily Wellness Score</h1>
        <p className="text-sm text-[#2a1e16]/68">One number for how your whole day is going — sleep, movement, food &amp; mind</p>
      </div>

      {/* Score ring */}
      <div className="glass-card rounded-3xl p-8 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${rating.color}1f 0%, transparent 60%)` }}>
        <div className="relative mx-auto h-44 w-44">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${rating.color} ${total * 3.6}deg, rgba(42,30,22,0.08) ${total * 3.6}deg)`, transition: "background 0.5s ease" }} />
          <div className="absolute inset-[11px] grid place-items-center rounded-full bg-[#fffdf9]">
            <div>
              <p className="text-5xl font-black tabular-nums" style={{ color: rating.color }}>{total}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#2a1e16]/55">of 100</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-2xl font-black" style={{ color: rating.color }}>{rating.label}</p>
        {saved && weakest.s < 70 && (
          <p className="mx-auto mt-2 max-w-md text-sm text-[#2a1e16]/70">Biggest opportunity: <span className="font-bold">{weakest.f.icon} {weakest.f.label}</span> — {weakest.f.tipLow}</p>
        )}
      </div>

      {/* Inputs */}
      <div className="glass-card rounded-2xl p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Today's check-in</p>
        <div className="space-y-4">
          {breakdown.map(({ f, raw, s }) => (
            <div key={f.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-bold">{f.icon} {f.label}</span>
                <span className="tabular-nums text-[#2a1e16]/70">{raw}{f.unit.startsWith("/") ? f.unit : ` ${f.unit}`}</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="range" min={f.min} max={f.max} step={f.step} value={raw} onChange={(e) => setVals((v) => ({ ...v, [f.key]: Number(e.target.value) }))} className="w-full accent-orange-500" />
                <span className="w-9 shrink-0 text-right text-xs font-black tabular-nums" style={{ color: s >= 70 ? "#059669" : s >= 45 ? "#ea580c" : "#fb7185" }}>{s}</span>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={save} className={"btn-gloss mt-5 w-full rounded-full py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition " + (saved ? "bg-emerald-600" : "bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700")}>{saved ? "✓ Saved for Today (+10 XP)" : "Save Today's Score (+10 XP)"}</button>
      </div>

      {/* Breakdown bars */}
      <div className="glass-card rounded-2xl p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Pillar breakdown</p>
        <div className="space-y-3">
          {breakdown.map(({ f, s }) => (
            <div key={f.key} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm font-bold">{f.icon} {f.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#2a1e16]/10">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s}%`, background: s >= 70 ? "#059669" : s >= 45 ? "#f97316" : "#fb7185" }} />
              </div>
              <span className="w-8 text-right text-xs font-black tabular-nums text-[#2a1e16]/70">{s}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-[#2a1e16]/55">Check in daily — small, consistent gains across the pillars compound into real change.</p>
      </div>
    </div>
  );
}
