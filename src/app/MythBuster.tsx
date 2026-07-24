import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Myth or Fact — an interactive game testing common fitness &        */
/* nutrition beliefs, each with an evidence-based explanation.        */
/* Guess, learn, and score. No SVG.                                   */
/* ---------------------------------------------------------------- */

interface Card { statement: string; isFact: boolean; explain: string; category: string }

const CARDS: Card[] = [
  { statement: "Lifting weights makes women bulky.", isFact: false, category: "Fitness", explain: "Women have far lower testosterone than men, so building large muscle is slow and deliberate. Lifting builds strength and tone, not accidental bulk." },
  { statement: "You can target fat loss from a specific body part with exercises.", isFact: false, category: "Fitness", explain: "Spot reduction is a myth. Fat is lost from all over the body based on genetics and overall calorie deficit — not from the muscle you train." },
  { statement: "Protein is the most satiating macronutrient.", isFact: true, category: "Nutrition", explain: "Protein keeps you fuller than carbs or fat and has the highest thermic effect, making it invaluable for appetite control and body composition." },
  { statement: "Eating late at night automatically makes you gain fat.", isFact: false, category: "Nutrition", explain: "Total daily calories, not timing, determine fat gain. Late eating only matters if it leads you to eat more overall." },
  { statement: "You build muscle while recovering, not during the workout.", isFact: true, category: "Fitness", explain: "Training is the stimulus; muscle is actually rebuilt during rest with adequate protein and sleep. That's why recovery matters so much." },
  { statement: "Carbs are inherently fattening and should be avoided.", isFact: false, category: "Nutrition", explain: "Carbs are your body's preferred fuel. Excess calories cause fat gain — not carbs themselves. Quality and quantity are what matter." },
  { statement: "Muscle soreness is required for a workout to be effective.", isFact: false, category: "Fitness", explain: "Soreness reflects novelty and damage, not effectiveness. You can make great progress with little soreness, especially as you adapt." },
  { statement: "Creatine is one of the most researched, effective supplements.", isFact: true, category: "Nutrition", explain: "Creatine monohydrate reliably improves strength, power, and recovery, is safe for most people, and is inexpensive." },
  { statement: "Sweating a lot means you're burning more fat.", isFact: false, category: "Fitness", explain: "Sweat is temperature regulation, not a measure of fat burned. You can burn plenty of fat with minimal sweat and vice versa." },
  { statement: "Sleep is one of the most powerful recovery tools.", isFact: true, category: "Wellness", explain: "Muscle repair, hormone regulation, and mental clarity all depend on sleep. Under-sleeping quietly undermines training and diet." },
  { statement: "You need to eat protein within 30 minutes of training or you 'waste' the workout.", isFact: false, category: "Nutrition", explain: "The 'anabolic window' is much wider than once believed. Total daily protein matters far more than precise timing." },
  { statement: "Stretching before lifting prevents injury and boosts performance.", isFact: false, category: "Fitness", explain: "Long static stretches before lifting can briefly reduce power. Dynamic warm-ups are better pre-training; save static stretching for after." },
  { statement: "Walking daily is genuinely effective for health and fat loss.", isFact: true, category: "Wellness", explain: "Daily steps drive NEAT, a big part of energy balance, and improve heart health, mood, and longevity — all at low injury risk." },
  { statement: "Detox teas and cleanses remove toxins from your body.", isFact: false, category: "Wellness", explain: "Your liver and kidneys already handle detoxification. 'Detox' products mostly cause water/weight loss and lack real evidence." },
  { statement: "Progressive overload is the main driver of strength and muscle gains.", isFact: true, category: "Fitness", explain: "Gradually increasing demand — more weight, reps, or quality over time — is what forces the body to adapt and grow." },
  { statement: "You can out-train a bad diet.", isFact: false, category: "Nutrition", explain: "Exercise burns fewer calories than most people think. Nutrition is the dominant factor in body composition — training can't fully compensate." },
];

export default function MythBusterPage() {
  const { user } = useAuth();
  const [i, setI] = useState(0);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const card = CARDS[i];
  const correct = choice !== null && choice === card.isFact;

  const grade = useMemo(() => {
    const pct = (score / CARDS.length) * 100;
    if (pct >= 85) return { label: "Myth-Busting Master 🧠", color: "#34d399" };
    if (pct >= 60) return { label: "Well Informed 👍", color: "#f97316" };
    if (pct >= 40) return { label: "Getting There 📚", color: "#ea580c" };
    return { label: "Keep Learning 🌱", color: "#fb7185" };
  }, [score]);

  function answer(guess: boolean) {
    if (choice !== null) return;
    setChoice(guess);
    if (guess === card.isFact) setScore((s) => s + 1);
  }
  function next() {
    if (i < CARDS.length - 1) { setI(i + 1); setChoice(null); }
    else { setDone(true); if (!rewarded) { setRewarded(true); addXP(user?.email, Math.round(score * 1.5)); } }
  }
  function restart() { setI(0); setChoice(null); setScore(0); setDone(false); }

  if (done) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">Your Score</h1>
          <p className="text-sm text-[#2a1e16]/68">How well do you know fitness &amp; nutrition fact from fiction?</p>
        </div>
        <div className="glass-card rounded-3xl p-8 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${grade.color}22 0%, transparent 60%)` }}>
          <p className="text-6xl font-black tabular-nums" style={{ color: grade.color }}>{score}<span className="text-2xl text-[#2a1e16]/50">/{CARDS.length}</span></p>
          <p className="mt-3 text-2xl font-black" style={{ color: grade.color }}>{grade.label}</p>
        </div>
        <button type="button" onClick={restart} className="btn-gloss w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Play Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Myth or Fact?</h1>
        <p className="text-sm text-[#2a1e16]/68">Test your knowledge — is each statement a myth or a fact?</p>
      </div>

      <div className="flex items-center justify-between text-xs font-bold text-[#2a1e16]/60">
        <span>Card {i + 1} of {CARDS.length}</span>
        <span className="text-[#ea580c]">Score: {score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#2a1e16]/10">
        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-300" style={{ width: `${(i / CARDS.length) * 100}%` }} />
      </div>

      <div className="glass-card rounded-3xl p-8 text-center">
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">{card.category}</span>
        <p className="mx-auto mt-5 max-w-lg text-xl font-black leading-snug">"{card.statement}"</p>

        {choice === null ? (
          <div className="mt-7 flex justify-center gap-3">
            <button type="button" onClick={() => answer(false)} className="btn-gloss rounded-full bg-gradient-to-r from-rose-400 to-rose-600 px-8 py-3 text-sm font-black uppercase tracking-[0.14em] text-white">🚫 Myth</button>
            <button type="button" onClick={() => answer(true)} className="btn-gloss rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 px-8 py-3 text-sm font-black uppercase tracking-[0.14em] text-white">✓ Fact</button>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-lg font-black" style={{ color: correct ? "#34d399" : "#fb7185" }}>{correct ? "✓ Correct!" : "✗ Not quite"} — it's a {card.isFact ? "Fact" : "Myth"}</p>
            <p className="mx-auto mt-3 max-w-lg rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-4 text-sm leading-relaxed text-[#2a1e16]/80">{card.explain}</p>
            <button type="button" onClick={next} className="btn-gloss mt-5 rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 px-8 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">{i < CARDS.length - 1 ? "Next →" : "See Score"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
