import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Health IQ Quiz — a multiple-choice health-literacy quiz with       */
/* explanations. Tests real understanding of fitness, nutrition &     */
/* wellness science. Scored, with XP. No SVG.                         */
/* ---------------------------------------------------------------- */

interface Q { q: string; options: string[]; answer: number; explain: string }

const QUESTIONS: Q[] = [
  { q: "Roughly how much protein per kg of bodyweight suits most people who train?", options: ["0.4–0.8 g/kg", "1.6–2.2 g/kg", "3.5–4.5 g/kg", "As much as possible"], answer: 1, explain: "1.6–2.2 g/kg per day is the evidence-based range for building and preserving muscle. More isn't better past this point." },
  { q: "What primarily determines whether you lose fat?", options: ["Eating no carbs", "An overall calorie deficit", "Doing lots of cardio", "Avoiding food after 8pm"], answer: 1, explain: "Fat loss requires burning more calories than you consume. Every effective diet works by creating this energy deficit." },
  { q: "Which is the most powerful, free recovery tool?", options: ["Ice baths", "Foam rolling", "Sleep", "Compression gear"], answer: 2, explain: "Sleep drives muscle repair, hormone balance, and mental clarity — no gadget compensates for chronic under-sleeping." },
  { q: "What is 'progressive overload'?", options: ["Eating more protein weekly", "Gradually increasing training demand over time", "Training to failure every set", "Doing more cardio each week"], answer: 1, explain: "Gradually doing more — weight, reps, or quality — is what forces the body to adapt and grow stronger." },
  { q: "How many hard sets per muscle per week suits most people for growth?", options: ["1–3 sets", "10–20 sets", "40–50 sets", "It doesn't matter"], answer: 1, explain: "Around 10–20 hard sets per muscle per week, split across 2+ sessions, works well for most trainees." },
  { q: "Which macronutrient is most satiating (filling)?", options: ["Carbohydrate", "Fat", "Protein", "They're equal"], answer: 2, explain: "Protein keeps you fuller for longer and has the highest thermic effect, making it invaluable for appetite control." },
  { q: "What does a good pre-workout warm-up include?", options: ["Long static stretches", "Light cardio + dynamic mobility", "Nothing — just start", "Maximal lifts immediately"], answer: 1, explain: "Light cardio to raise temperature plus dynamic mobility prepares the body. Long static stretches before lifting can reduce power." },
  { q: "'Zone 2' cardio refers to…", options: ["All-out sprinting", "Comfortable, conversational-pace effort", "Weightlifting zones", "Stretching intensity"], answer: 1, explain: "Zone 2 is easy, conversational cardio (~60–70% max HR) that builds your aerobic base with minimal fatigue." },
  { q: "Which is TRUE about spot reduction?", options: ["Crunches burn belly fat", "You can't target fat loss to one area", "Leg raises slim thighs", "Arm curls burn arm fat"], answer: 1, explain: "Spot reduction is a myth — fat is lost from all over based on genetics and overall deficit, not the muscle trained." },
  { q: "How much fiber per day supports gut and metabolic health?", options: ["5–10 g", "25–38 g", "80–100 g", "Fiber is unnecessary"], answer: 1, explain: "Around 25–38 g of fiber daily feeds beneficial gut bacteria and supports digestion and metabolic health." },
  { q: "What's the best approach to a weight-loss plateau?", options: ["Slash calories drastically", "Recalculate intake and add steps", "Stop eating protein", "Give up"], answer: 1, explain: "As you lose weight you burn fewer calories; recalculating and adding daily steps usually restarts progress sustainably." },
  { q: "Creatine monohydrate is best described as…", options: ["A dangerous steroid", "A well-researched, safe, effective supplement", "A fat burner", "Useless"], answer: 1, explain: "Creatine is among the most studied supplements — safe and effective for strength, power, and recovery in most people." },
];

export default function HealthIqQuizPage() {
  const { user } = useAuth();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const q = QUESTIONS[i];

  const grade = useMemo(() => {
    const pct = (score / QUESTIONS.length) * 100;
    if (pct >= 85) return { label: "Health Genius 🧠", color: "#34d399" };
    if (pct >= 65) return { label: "Well Educated 🎓", color: "#a78bfa" };
    if (pct >= 45) return { label: "Solid Basics 📘", color: "#d8b35a" };
    return { label: "Keep Learning 🌱", color: "#fb7185" };
  }, [score]);

  function pick(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.answer) setScore((s) => s + 1);
  }
  function next() {
    if (i < QUESTIONS.length - 1) { setI(i + 1); setPicked(null); }
    else { setDone(true); if (!rewarded) { setRewarded(true); addXP(user?.email, score * 2); } }
  }
  function restart() { setI(0); setPicked(null); setScore(0); setDone(false); }

  if (done) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-black tracking-[-0.04em]">Your Health IQ</h1><p className="text-sm text-[#f7f0df]/68">How well do you know the science of health &amp; fitness?</p></div>
        <div className="glass-card rounded-3xl p-8 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${grade.color}22 0%, transparent 60%)` }}>
          <p className="text-6xl font-black tabular-nums" style={{ color: grade.color }}>{score}<span className="text-2xl text-[#f7f0df]/50">/{QUESTIONS.length}</span></p>
          <p className="mt-3 text-2xl font-black" style={{ color: grade.color }}>{grade.label}</p>
        </div>
        <button type="button" onClick={restart} className="btn-gloss w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black tracking-[-0.04em]">Health IQ Quiz</h1><p className="text-sm text-[#f7f0df]/68">Test your health &amp; fitness knowledge — {QUESTIONS.length} questions</p></div>
      <div className="flex items-center justify-between text-xs font-bold text-[#f7f0df]/60"><span>Question {i + 1} of {QUESTIONS.length}</span><span className="text-[#d8b35a]">Score: {score}</span></div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f7f0df]/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-300" style={{ width: `${(i / QUESTIONS.length) * 100}%` }} /></div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-black">{q.q}</h2>
        <div className="mt-4 space-y-2.5">
          {q.options.map((o, idx) => {
            const isAns = idx === q.answer;
            const chosen = picked === idx;
            let cls = "border-[#f7f0df]/12 bg-[#f7f0df]/5 hover:border-violet-200/40";
            if (picked !== null) {
              if (isAns) cls = "border-emerald-400/50 bg-emerald-400/15";
              else if (chosen) cls = "border-rose-400/50 bg-rose-400/15";
              else cls = "border-[#f7f0df]/8 bg-[#f7f0df]/3 opacity-60";
            }
            return (
              <button key={idx} type="button" onClick={() => pick(idx)} className={`block w-full rounded-xl border p-4 text-left text-sm font-semibold transition ${cls}`}>
                {o}{picked !== null && isAns && <span className="ml-2 text-emerald-300">✓</span>}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="mt-4">
            <p className="rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4 text-sm leading-relaxed text-[#f7f0df]/80"><span className="font-bold text-violet-200">Why: </span>{q.explain}</p>
            <button type="button" onClick={next} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">{i < QUESTIONS.length - 1 ? "Next Question →" : "See My Score"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
