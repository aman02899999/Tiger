import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* This or That — a quick nutrition comparison game. Pick which of     */
/* two options fits the prompt (more protein, fewer calories, etc.),  */
/* with a short fact after each. Scored. No SVG.                      */
/* ---------------------------------------------------------------- */

interface Round { prompt: string; a: { label: string; icon: string }; b: { label: string; icon: string }; correct: "a" | "b"; fact: string }

const ROUNDS: Round[] = [
  { prompt: "Which has MORE protein?", a: { label: "100g Chicken Breast", icon: "🍗" }, b: { label: "100g White Rice", icon: "🍚" }, correct: "a", fact: "Chicken breast has ~31g protein per 100g; white rice has ~2.7g. Animal proteins are far more protein-dense." },
  { prompt: "Which has FEWER calories?", a: { label: "1 Avocado", icon: "🥑" }, b: { label: "1 Apple", icon: "🍎" }, correct: "b", fact: "An apple is ~95 kcal; a whole avocado is ~240 kcal due to its healthy fats. Both are nutritious — portion accordingly." },
  { prompt: "Which is MORE filling per calorie?", a: { label: "Boiled Potato", icon: "🥔" }, b: { label: "Croissant", icon: "🥐" }, correct: "a", fact: "Boiled potatoes rank among the most satiating foods per calorie; refined pastries are among the least." },
  { prompt: "Which has MORE fiber?", a: { label: "Lentils (dal)", icon: "🍲" }, b: { label: "Chicken", icon: "🍗" }, correct: "a", fact: "Lentils are rich in fiber (~8g per cooked cup); meat contains essentially none. Plants are your fiber source." },
  { prompt: "Which has MORE added sugar?", a: { label: "Flavored Yogurt", icon: "🍨" }, b: { label: "Plain Greek Yogurt", icon: "🥛" }, correct: "a", fact: "Flavored yogurts often hide 15–20g of added sugar. Plain Greek yogurt has none and more protein." },
  { prompt: "Which is a 'complete' protein?", a: { label: "Eggs", icon: "🥚" }, b: { label: "Rice alone", icon: "🍚" }, correct: "a", fact: "Eggs contain all nine essential amino acids. Rice is incomplete on its own but pairs well with dal to complete the profile." },
  { prompt: "Which has MORE calories?", a: { label: "1 tbsp Olive Oil", icon: "🫒" }, b: { label: "1 tbsp Honey", icon: "🍯" }, correct: "a", fact: "Fats pack ~9 kcal/g, so a tablespoon of oil (~120 kcal) beats honey (~64 kcal). Oils are calorie-dense." },
  { prompt: "Which supports better hydration during heavy sweat?", a: { label: "Plain Water", icon: "💧" }, b: { label: "Water + Electrolytes", icon: "⚡" }, correct: "b", fact: "During heavy sweating you lose electrolytes (especially sodium); replacing them alongside water rehydrates you better." },
  { prompt: "Which is more nutrient-dense?", a: { label: "Spinach", icon: "🥬" }, b: { label: "Iceberg Lettuce", icon: "🥗" }, correct: "a", fact: "Spinach is loaded with iron, folate, and vitamins; iceberg is mostly water with little nutrition." },
  { prompt: "Which is better pre-workout fuel?", a: { label: "Banana + Oats", icon: "🍌" }, b: { label: "Fried Snacks", icon: "🍟" }, correct: "a", fact: "Easily digested carbs like banana and oats fuel performance; greasy fried food sits heavy and slows you down." },
];

export default function ThisOrThatPage() {
  const { user } = useAuth();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const r = ROUNDS[i];
  const correct = picked !== null && picked === r.correct;

  const grade = useMemo(() => {
    const pct = (score / ROUNDS.length) * 100;
    if (pct >= 85) return { label: "Nutrition Pro 🥇", color: "#34d399" };
    if (pct >= 60) return { label: "Smart Eater 🥗", color: "#f97316" };
    if (pct >= 40) return { label: "Learning Fast 📈", color: "#ea580c" };
    return { label: "Keep Going 🌱", color: "#fb7185" };
  }, [score]);

  function pick(side: "a" | "b") {
    if (picked !== null) return;
    setPicked(side);
    if (side === r.correct) setScore((s) => s + 1);
  }
  function next() {
    if (i < ROUNDS.length - 1) { setI(i + 1); setPicked(null); }
    else { setDone(true); if (!rewarded) { setRewarded(true); addXP(user?.email, score * 2); } }
  }
  function restart() { setI(0); setPicked(null); setScore(0); setDone(false); }

  if (done) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-black tracking-[-0.04em]">Your Result</h1><p className="text-sm text-[#2a1e16]/68">How sharp is your nutrition sense?</p></div>
        <div className="glass-card rounded-3xl p-8 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${grade.color}22 0%, transparent 60%)` }}>
          <p className="text-6xl font-black tabular-nums" style={{ color: grade.color }}>{score}<span className="text-2xl text-[#2a1e16]/50">/{ROUNDS.length}</span></p>
          <p className="mt-3 text-2xl font-black" style={{ color: grade.color }}>{grade.label}</p>
        </div>
        <button type="button" onClick={restart} className="btn-gloss w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Play Again</button>
      </div>
    );
  }

  const sideClass = (side: "a" | "b") => {
    if (picked === null) return "border-[#2a1e16]/12 bg-[#2a1e16]/5 hover:border-orange-200/40 hover:bg-orange-400/10";
    if (side === r.correct) return "border-emerald-400/50 bg-emerald-400/15";
    if (side === picked) return "border-rose-400/50 bg-rose-400/15";
    return "border-[#2a1e16]/8 bg-[#2a1e16]/3 opacity-60";
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black tracking-[-0.04em]">This or That</h1><p className="text-sm text-[#2a1e16]/68">Pick the option that fits the prompt — nutrition edition</p></div>
      <div className="flex items-center justify-between text-xs font-bold text-[#2a1e16]/60"><span>Round {i + 1} of {ROUNDS.length}</span><span className="text-[#ea580c]">Score: {score}</span></div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#2a1e16]/10"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-300" style={{ width: `${(i / ROUNDS.length) * 100}%` }} /></div>

      <p className="text-center text-lg font-black">{r.prompt}</p>

      <div className="grid grid-cols-2 gap-3">
        {(["a", "b"] as const).map((side) => (
          <button key={side} type="button" onClick={() => pick(side)} className={`grid place-items-center rounded-3xl border p-8 text-center transition ${sideClass(side)}`}>
            <div>
              <div className="text-5xl">{r[side].icon}</div>
              <p className="mt-3 text-sm font-black">{r[side].label}</p>
              {picked !== null && side === r.correct && <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">Correct ✓</p>}
            </div>
          </button>
        ))}
      </div>

      {picked !== null && (
        <div>
          <p className="mb-3 text-center text-lg font-black" style={{ color: correct ? "#34d399" : "#fb7185" }}>{correct ? "✓ Nice!" : "✗ Not quite"}</p>
          <p className="rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-4 text-sm leading-relaxed text-[#2a1e16]/80">{r.fact}</p>
          <button type="button" onClick={next} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">{i < ROUNDS.length - 1 ? "Next →" : "See Score"}</button>
        </div>
      )}
    </div>
  );
}
