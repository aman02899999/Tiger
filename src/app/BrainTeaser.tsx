import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Daily Brain Teaser — a rotating health & fitness puzzle/riddle     */
/* each day (deterministic by date), with a hint and a reveal.        */
/* No SVG.                                                            */
/* ---------------------------------------------------------------- */

interface Teaser { q: string; hint: string; a: string }

const TEASERS: Teaser[] = [
  { q: "A muscle group you can't see in the mirror but should train as much as your chest. What is it?", hint: "It's on the other side.", a: "Your back — training it balances all the pressing most people do and protects your posture and spine." },
  { q: "I'm free, I improve recovery, hormones, and mood, yet most people neglect me. What am I?", hint: "You do me every night.", a: "Sleep — the single most powerful (and free) recovery tool there is." },
  { q: "You burn me all over your body, never from just one spot, no matter how many crunches you do. What am I?", hint: "Crunches won't target me.", a: "Body fat — spot reduction is a myth; fat is lost overall based on your calorie deficit and genetics." },
  { q: "The more of me you have in reserve, the more you can lift — I'm in your hands. What am I?", hint: "It fails before your back sometimes.", a: "Grip strength — a weak grip caps your pulling lifts before the target muscles are fully worked." },
  { q: "I'm the #1 rule of getting stronger: do a little ___ over time.", hint: "Two words, starts with 'progressive'.", a: "Progressive overload — gradually increasing weight, reps, or quality forces the body to adapt." },
  { q: "Add me to turmeric and its key compound absorbs far better. What am I?", hint: "A common table spice.", a: "Black pepper — its piperine dramatically boosts absorption of curcumin." },
  { q: "I'm a comfortable, conversational pace of cardio that builds your aerobic engine. What am I?", hint: "A training 'zone'.", a: "Zone 2 cardio — easy effort (~60–70% max HR) that builds endurance with minimal fatigue." },
  { q: "The most filling macronutrient, gram for gram. Which one?", hint: "Muscle is made of it.", a: "Protein — it keeps you fuller longer and has the highest thermic effect." },
  { q: "A double inhale then a long exhale — one of the fastest ways to calm down. What's it called?", hint: "You do a version of it when relieved.", a: "The physiological sigh." },
  { q: "In Ayurveda, I'm the digestive 'fire' that governs how well you process food. What am I?", hint: "Sanskrit word.", a: "Agni — strong Agni means good digestion; weak Agni produces 'ama' (toxins)." },
  { q: "You should do me before lifting, but the dynamic kind — not long static holds. What am I?", hint: "It raises your temperature.", a: "A warm-up — light cardio plus dynamic mobility prepares the body better than static stretching." },
  { q: "I make up a big, underrated part of your daily calorie burn just from moving around. My acronym?", hint: "Four letters, non-exercise.", a: "NEAT — Non-Exercise Activity Thermogenesis, boosted mainly by daily steps." },
  { q: "You can't out-train me if I'm bad. What am I?", hint: "It's on your plate.", a: "Your diet — nutrition dominates body composition; exercise can't fully compensate for poor eating." },
  { q: "The three Ayurvedic mind-body types are Vata, Pitta, and ___?", hint: "Earth & water.", a: "Kapha — the dosha governing structure, stability, and immunity." },
];

function todayKey() { return new Date().toISOString().slice(0, 10); }
function dailyIndex(len: number) {
  const s = todayKey();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h % len;
}

export default function BrainTeaserPage() {
  const { user } = useAuth();
  const idx = useMemo(() => dailyIndex(TEASERS.length), []);
  const t = TEASERS[idx];
  const [showHint, setShowHint] = useState(false);
  const [revealed, setRevealed] = useState(false);

  function reveal() {
    if (revealed) return;
    setRevealed(true);
    addXP(user?.email, 5);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Daily Brain Teaser</h1>
        <p className="text-sm text-[#2a1e16]/68">A fresh health &amp; fitness riddle every day · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div className="glass-card rounded-3xl p-8 text-center" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(234,88,12,0.14) 0%, transparent 60%)" }}>
        <div className="text-5xl">🧩</div>
        <p className="mx-auto mt-4 max-w-lg text-xl font-black leading-snug">{t.q}</p>

        {showHint && !revealed && (
          <p className="mx-auto mt-4 max-w-md rounded-xl border border-[#ea580c]/25 bg-[#ea580c]/10 p-3 text-sm text-[#2a1e16]/80"><span className="font-bold text-[#ea580c]">Hint: </span>{t.hint}</p>
        )}

        {revealed ? (
          <div className="mx-auto mt-5 max-w-lg rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-300">Answer</p>
            <p className="mt-2 text-sm leading-relaxed text-[#2a1e16]/85">{t.a}</p>
            <p className="mt-3 text-[11px] text-[#2a1e16]/55">🎉 +5 XP · Come back tomorrow for a new teaser!</p>
          </div>
        ) : (
          <div className="mt-7 flex justify-center gap-3">
            {!showHint && <button type="button" onClick={() => setShowHint(true)} className="rounded-full border border-[#ea580c]/30 bg-[#ea580c]/10 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#ea580c]">Show Hint</button>}
            <button type="button" onClick={reveal} className="btn-gloss rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 px-8 py-3 text-xs font-black uppercase tracking-[0.14em] text-white">Reveal Answer (+5 XP)</button>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-[#2a1e16]/55">Think you know it? Reveal to check — a new teaser appears each day.</p>
    </div>
  );
}
