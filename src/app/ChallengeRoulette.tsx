import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Challenge Roulette — tap to draw a surprise micro-challenge for    */
/* today. Deterministic per-day seed so everyone gets the same daily  */
/* draw, with a slot-machine-style reveal animation. Complete it for  */
/* XP. Persists per user + day. No SVG.                               */
/* ---------------------------------------------------------------- */

interface Challenge {
  id: string;
  icon: string;
  text: string;
  xp: number;
  tag: string;
}

const CHALLENGES: Challenge[] = [
  { id: "plank2", icon: "🪵", text: "Hold a 2-minute plank (break it up if needed)", xp: 20, tag: "Core" },
  { id: "pushups50", icon: "💪", text: "50 push-ups today — any set scheme", xp: 25, tag: "Strength" },
  { id: "squats100", icon: "🦵", text: "100 bodyweight squats across the day", xp: 25, tag: "Legs" },
  { id: "walk10k", icon: "🚶", text: "Hit 10,000 steps", xp: 20, tag: "Cardio" },
  { id: "stretch10", icon: "🧘", text: "10 minutes of full-body stretching", xp: 15, tag: "Mobility" },
  { id: "nosugar", icon: "🚫", text: "Zero added sugar for the whole day", xp: 25, tag: "Nutrition" },
  { id: "water4", icon: "💧", text: "Drink 4 litres of water", xp: 15, tag: "Hydration" },
  { id: "cold", icon: "🧊", text: "End your shower with 60s of cold water", xp: 20, tag: "Recovery" },
  { id: "breathe", icon: "🫁", text: "5 minutes of box breathing", xp: 15, tag: "Wellness" },
  { id: "burpees30", icon: "🔥", text: "30 burpees — as fast as good form allows", xp: 25, tag: "Conditioning" },
  { id: "sleep8", icon: "😴", text: "Be in bed for a full 8 hours tonight", xp: 20, tag: "Sleep" },
  { id: "protein", icon: "🍗", text: "Hit your full protein target today", xp: 20, tag: "Nutrition" },
  { id: "wall", icon: "🧱", text: "3 × 45-second wall sits", xp: 20, tag: "Legs" },
  { id: "gratitude", icon: "🙏", text: "Write down 3 things you're grateful for", xp: 10, tag: "Mindset" },
  { id: "posture", icon: "🧍", text: "Every hour, do 10 shoulder rolls (desk reset)", xp: 15, tag: "Posture" },
];

function todayKey() { return new Date().toISOString().slice(0, 10); }
function drawKey(email: string | null | undefined) { return `tfp_roulette_${email ?? "guest"}_${todayKey()}`; }

// Deterministic daily index from the date so the "roll" is fixed once revealed.
function dailyIndex() {
  const d = new Date();
  const seed = d.getFullYear() * 366 + (d.getMonth() + 1) * 31 + d.getDate();
  return (seed * 13) % CHALLENGES.length;
}

export default function ChallengeRoulettePage() {
  const { user } = useAuth();
  const todaysChallenge = useMemo(() => CHALLENGES[dailyIndex()], []);
  const [state, setState] = useState<{ drawn: boolean; done: boolean }>({ drawn: false, done: false });
  const [spinning, setSpinning] = useState(false);
  const [reelIdx, setReelIdx] = useState(0);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(drawKey(user?.email)) ?? "null");
      if (s) setState(s);
    } catch { /* ignore */ }
  }, [user?.email]);

  function persist(next: { drawn: boolean; done: boolean }) {
    setState(next);
    try { localStorage.setItem(drawKey(user?.email), JSON.stringify(next)); } catch { /* ignore */ }
  }

  function draw() {
    if (spinning || state.drawn) return;
    setSpinning(true);
    let ticks = 0;
    const total = 24 + (dailyIndex() % CHALLENGES.length);
    const iv = setInterval(() => {
      ticks++;
      setReelIdx((i) => (i + 1) % CHALLENGES.length);
      if (ticks >= total) {
        clearInterval(iv);
        setReelIdx(dailyIndex());
        setSpinning(false);
        persist({ drawn: true, done: false });
      }
    }, 70 + Math.min(ticks * 4, 160));
  }

  function complete() {
    if (state.done) return;
    persist({ drawn: true, done: true });
    addXP(user?.email, todaysChallenge.xp);
  }

  const shown = state.drawn ? todaysChallenge : CHALLENGES[reelIdx];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Challenge Roulette</h1>
        <p className="text-sm text-[#e9f3f5]/68">Draw a surprise micro-challenge for today — one spin, one mission</p>
      </div>

      <div className="glass-card relative overflow-hidden rounded-3xl p-8 text-center" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,182,39,0.14) 0%, transparent 60%)" }}>
        {/* reel window */}
        <div className="relative mx-auto flex h-44 w-full max-w-md items-center justify-center overflow-hidden rounded-2xl border border-[#ffb627]/25 bg-black/30">
          <div className={`text-center transition ${spinning ? "blur-[1px]" : ""}`}>
            <div className={`text-6xl ${spinning ? "animate-bounce" : ""}`} style={{ animationDuration: "0.4s" }}>{shown.icon}</div>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffb627]">{shown.tag}</p>
          </div>
        </div>

        {state.drawn ? (
          <div className="mt-6">
            <p className="text-xl font-black leading-snug">{todaysChallenge.text}</p>
            <p className="mt-2 text-sm font-bold text-[#ffb627]">Reward: +{todaysChallenge.xp} XP</p>
            {state.done ? (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-6 py-3">
                <span className="text-lg">🎉</span>
                <span className="font-black text-emerald-200">Challenge complete! +{todaysChallenge.xp} XP claimed</span>
              </div>
            ) : (
              <button type="button" onClick={complete} className="btn-gloss mt-5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#05231f]">
                ✓ I Did It — Claim XP
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-[#e9f3f5]/68">Your daily challenge is waiting behind the spin.</p>
            <button type="button" onClick={draw} disabled={spinning} className="btn-gloss mt-5 rounded-full bg-gradient-to-r from-[#ffb627] to-orange-400 px-12 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#04121a] disabled:opacity-60">
              {spinning ? "Rolling…" : "🎰 Spin the Roulette"}
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-[#e9f3f5]/55">A fresh challenge unlocks every day at midnight. Come back tomorrow for a new one.</p>
    </div>
  );
}
