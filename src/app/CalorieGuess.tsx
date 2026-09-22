import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Calorie Guess — build calorie intuition by guessing the calories   */
/* of common foods, then seeing how close you were. Scored by         */
/* accuracy across rounds. No SVG.                                    */
/* ---------------------------------------------------------------- */

interface Food { name: string; icon: string; kcal: number; portion: string }

const FOODS: Food[] = [
  { name: "Boiled Egg", icon: "🥚", kcal: 78, portion: "1 large egg" },
  { name: "Banana", icon: "🍌", kcal: 105, portion: "1 medium" },
  { name: "Apple", icon: "🍎", kcal: 95, portion: "1 medium" },
  { name: "Plain Roti", icon: "🫓", kcal: 120, portion: "1 chapati" },
  { name: "Cooked Rice", icon: "🍚", kcal: 205, portion: "1 cup" },
  { name: "Grilled Chicken Breast", icon: "🍗", kcal: 165, portion: "100 g" },
  { name: "Paneer", icon: "🧀", kcal: 265, portion: "100 g" },
  { name: "Almonds", icon: "🌰", kcal: 165, portion: "23 nuts (28 g)" },
  { name: "Samosa", icon: "🥟", kcal: 260, portion: "1 piece" },
  { name: "Slice of Pizza", icon: "🍕", kcal: 285, portion: "1 slice" },
  { name: "Gulab Jamun", icon: "🍮", kcal: 150, portion: "1 piece" },
  { name: "Cola", icon: "🥤", kcal: 140, portion: "1 can (330 ml)" },
  { name: "Avocado", icon: "🥑", kcal: 240, portion: "1 whole" },
  { name: "Greek Yogurt", icon: "🥛", kcal: 100, portion: "170 g, plain" },
  { name: "Dal (cooked)", icon: "🍲", kcal: 180, portion: "1 cup" },
];

const ROUNDS = 6;

// Deterministic pick of ROUNDS foods (no Math.random) — offset varies by session start length.
function pickFoods(): Food[] {
  const start = new Date().getSeconds() % FOODS.length; // varies per mount without Math.random
  const out: Food[] = [];
  for (let i = 0; i < ROUNDS; i++) out.push(FOODS[(start + i * 3) % FOODS.length]);
  return out;
}

export default function CalorieGuessPage() {
  const { user } = useAuth();
  const foods = useMemo(() => pickFoods(), []);
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState(200);
  const [locked, setLocked] = useState(false);
  const [points, setPoints] = useState(0);
  const [done, setDone] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const food = foods[round];
  const err = locked ? Math.abs(guess - food.kcal) : 0;
  const pct = locked ? Math.round((err / food.kcal) * 100) : 0;
  const roundPts = locked ? Math.max(0, 100 - pct * 2) : 0; // within 5% ≈ 90+, off by 50% ≈ 0

  function lock() {
    if (locked) return;
    setLocked(true);
    setPoints((p) => p + Math.max(0, 100 - Math.round((Math.abs(guess - food.kcal) / food.kcal) * 100) * 2));
  }
  function next() {
    if (round < ROUNDS - 1) { setRound(round + 1); setGuess(200); setLocked(false); }
    else { setDone(true); if (!rewarded) { setRewarded(true); addXP(user?.email, Math.round(points / 20)); } }
  }
  function restart() { setRound(0); setGuess(200); setLocked(false); setPoints(0); setDone(false); }

  const grade = useMemo(() => {
    const avg = points / ROUNDS;
    if (avg >= 80) return { label: "Calorie Whisperer 🎯", color: "#059669" };
    if (avg >= 55) return { label: "Sharp Eye 👀", color: "#f97316" };
    if (avg >= 30) return { label: "Getting Calibrated 📊", color: "#ea580c" };
    return { label: "Keep Practicing 🌱", color: "#fb7185" };
  }, [points]);

  if (done) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-black tracking-[-0.04em]">Your Calorie Intuition</h1><p className="text-sm text-[#2a1e16]/68">How close were your guesses?</p></div>
        <div className="glass-card rounded-3xl p-8 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${grade.color}22 0%, transparent 60%)` }}>
          <p className="text-6xl font-black tabular-nums" style={{ color: grade.color }}>{points}</p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#2a1e16]/55">points of {ROUNDS * 100}</p>
          <p className="mt-3 text-2xl font-black" style={{ color: grade.color }}>{grade.label}</p>
        </div>
        <button type="button" onClick={restart} className="btn-gloss w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Play Again</button>
        <p className="text-center text-[11px] text-[#2a1e16]/55">Building calorie awareness helps you eyeball portions without obsessive tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black tracking-[-0.04em]">Calorie Guess Game</h1><p className="text-sm text-[#2a1e16]/68">Guess the calories to sharpen your food intuition</p></div>
      <div className="flex items-center justify-between text-xs font-bold text-[#2a1e16]/60"><span>Round {round + 1} of {ROUNDS}</span><span className="text-[#ea580c]">{points} pts</span></div>

      <div className="glass-card rounded-3xl p-8 text-center">
        <div className="text-6xl">{food.icon}</div>
        <p className="mt-3 text-2xl font-black">{food.name}</p>
        <p className="text-xs text-[#2a1e16]/55">{food.portion}</p>

        <div className="mx-auto mt-6 max-w-md">
          <p className="mb-2 text-4xl font-black tabular-nums text-orange-700">{guess}<span className="text-lg text-[#2a1e16]/50"> kcal</span></p>
          <input type="range" min={20} max={500} step={5} value={guess} onChange={(e) => setGuess(Number(e.target.value))} disabled={locked} className="w-full accent-orange-400 disabled:opacity-50" />
          <div className="flex justify-between text-[10px] text-[#2a1e16]/45"><span>20</span><span>500</span></div>
        </div>

        {locked ? (
          <div className="mx-auto mt-5 max-w-md">
            <div className="rounded-2xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-5">
              <p className="text-sm text-[#2a1e16]/68">Actual: <span className="text-2xl font-black text-[#ea580c]">{food.kcal} kcal</span></p>
              <p className="mt-1 text-sm font-bold" style={{ color: pct <= 10 ? "#059669" : pct <= 30 ? "#ea580c" : "#fb7185" }}>{pct <= 10 ? "🎯 Spot on!" : pct <= 30 ? "👍 Close!" : "📊 Off by a bit"} — {err} kcal away (+{roundPts} pts)</p>
            </div>
            <button type="button" onClick={next} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">{round < ROUNDS - 1 ? "Next Food →" : "See Score"}</button>
          </div>
        ) : (
          <button type="button" onClick={lock} className="btn-gloss mt-6 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-10 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#052e1f]">Lock In Guess</button>
        )}
      </div>
    </div>
  );
}
