import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Fitness Trivia — a daily 5-question quiz on training & nutrition   */
/* facts. Deterministic daily pick so everyone gets the same set;    */
/* instant right/wrong feedback with an explanation; XP by score.    */
/* One attempt per day, persisted per user. No SVG.                   */
/* ---------------------------------------------------------------- */

interface TQ {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

const BANK: TQ[] = [
  { q: "How much protein per kg of bodyweight is ideal for building muscle?", options: ["0.5–0.8g", "1.6–2.2g", "3–4g", "As much as possible"], answer: 1, why: "Research converges on ~1.6–2.2g/kg/day; more than that gives little extra benefit." },
  { q: "What's the main driver of muscle growth over time?", options: ["Muscle confusion", "Progressive overload", "Sweating a lot", "Long rest periods"], answer: 1, why: "Gradually increasing weight or reps (progressive overload) is the #1 hypertrophy driver." },
  { q: "Creatine works best when taken…", options: ["Only before workouts", "Only on training days", "Any time, daily", "Loaded then stopped"], answer: 2, why: "Creatine saturates your muscles over time — daily timing doesn't matter, consistency does." },
  { q: "Which burns more calories at rest per kg?", options: ["Fat tissue", "Muscle tissue", "They're equal", "Neither burns calories"], answer: 1, why: "Muscle is more metabolically active, so more muscle raises your resting metabolic rate." },
  { q: "You can lose fat from a specific body part by training it. True?", options: ["True", "False"], answer: 1, why: "Spot reduction is a myth — fat loss happens body-wide via a calorie deficit." },
  { q: "How many litres of water should an active adult roughly aim for daily?", options: ["1L", "2L", "3–4L", "6L+"], answer: 2, why: "~3–4L for active people (from all sources); pale-yellow urine is a good check." },
  { q: "DOMS (muscle soreness) usually peaks…", options: ["During the workout", "Right after", "24–48 hours later", "A week later"], answer: 2, why: "Delayed-onset soreness typically peaks 24–48h post-exercise, then fades." },
  { q: "Best predictor of long-term fitness results?", options: ["The perfect program", "Consistency", "Expensive supplements", "Training to failure daily"], answer: 1, why: "A good-enough plan you stick to beats a perfect plan you quit. Consistency wins." },
  { q: "How much sleep supports optimal recovery and muscle growth?", options: ["4–5 hrs", "7–9 hrs", "10–12 hrs", "Sleep doesn't matter"], answer: 1, why: "7–9 hours lets growth hormone and recovery processes do their work." },
  { q: "A calorie deficit means…", options: ["Eating zero carbs", "Burning more than you eat", "Skipping breakfast", "Only eating 'clean'"], answer: 1, why: "Fat loss requires burning more energy than you consume — that's the deficit." },
  { q: "Which is a compound exercise?", options: ["Bicep curl", "Leg extension", "Deadlift", "Calf raise"], answer: 2, why: "Deadlifts work multiple joints and muscle groups — that's what 'compound' means." },
  { q: "Stretching cold muscles before lifting heavy is…", options: ["Essential", "Better done as a dynamic warm-up", "Useless entirely", "Only for gymnasts"], answer: 1, why: "Dynamic warm-ups prep you better than static stretching a cold muscle before heavy lifts." },
];

function todayKey() { return new Date().toISOString().slice(0, 10); }
function attemptKey(email: string | null | undefined) { return `tfp_trivia_${email ?? "guest"}_${todayKey()}`; }

// Deterministic daily 5 from the bank.
function dailyQuestions(): TQ[] {
  const d = new Date();
  const seed = d.getFullYear() * 366 + (d.getMonth() + 1) * 31 + d.getDate();
  const picked: TQ[] = [];
  const used = new Set<number>();
  let i = 0;
  while (picked.length < 5 && used.size < BANK.length) {
    const idx = (seed * 7 + i * 11) % BANK.length;
    if (!used.has(idx)) { used.add(idx); picked.push(BANK[idx]); }
    i++;
  }
  return picked;
}

export default function FitnessTriviaPage() {
  const { user } = useAuth();
  const questions = useMemo(dailyQuestions, []);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState<{ score: number } | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(attemptKey(user?.email)) ?? "null");
      if (saved) setFinished(saved);
    } catch { /* ignore */ }
  }, [user?.email]);

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
  }
  function next() {
    const nextAnswers = [...answers, picked!];
    setAnswers(nextAnswers);
    setPicked(null);
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      const score = nextAnswers.reduce((s, a, idx) => s + (a === questions[idx].answer ? 1 : 0), 0);
      const result = { score };
      setFinished(result);
      try { localStorage.setItem(attemptKey(user?.email), JSON.stringify(result)); } catch { /* ignore */ }
      addXP(user?.email, score * 6);
    }
  }

  if (finished) {
    const pct = Math.round((finished.score / questions.length) * 100);
    const grade = pct === 100 ? "Perfect! 🏆" : pct >= 60 ? "Nicely done 💪" : "Keep learning 📚";
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">Fitness Trivia</h1>
          <p className="text-sm text-[#2a1e16]/68">Today's quiz</p>
        </div>
        <div className="glass-card rounded-3xl p-8 text-center">
          <div className="text-5xl">🧠</div>
          <p className="mt-4 text-lg font-bold text-[#2a1e16]/80">{grade}</p>
          <p className="mt-2 text-5xl font-black tabular-nums text-[#ea580c]">{finished.score}/{questions.length}</p>
          <p className="mt-2 text-sm text-[#2a1e16]/62">You earned +{finished.score * 6} XP</p>
          <p className="mt-4 text-xs text-[#2a1e16]/55">Come back tomorrow for 5 fresh questions.</p>
        </div>
        {/* Review answers */}
        <div className="space-y-2">
          {questions.map((q) => (
            <div key={q.q} className="glass-card rounded-2xl p-4">
              <p className="text-sm font-semibold">{q.q}</p>
              <p className="mt-1 text-xs text-emerald-300">✓ {q.options[q.answer]}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#2a1e16]/62">{q.why}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Fitness Trivia</h1>
        <p className="text-sm text-[#2a1e16]/68">5 questions a day · +6 XP per correct answer</p>
      </div>

      {/* progress */}
      <div className="flex gap-1.5">
        {questions.map((_, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < current ? "#f97316" : i === current ? "#ea580c" : "rgba(247,240,223,0.1)" }} />
        ))}
      </div>

      <div className="glass-card rounded-3xl p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ea580c]">Question {current + 1} of {questions.length}</p>
        <h2 className="mt-2 text-xl font-black leading-snug">{q.q}</h2>

        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer;
            const isPicked = picked === i;
            let cls = "border-[#2a1e16]/10 bg-[#2a1e16]/5 hover:bg-[#2a1e16]/10";
            if (picked !== null) {
              if (isAnswer) cls = "border-emerald-300/50 bg-emerald-300/12";
              else if (isPicked) cls = "border-rose-400/50 bg-rose-400/12";
              else cls = "border-[#2a1e16]/8 bg-[#2a1e16]/[0.03] opacity-70";
            }
            return (
              <button key={opt} type="button" onClick={() => choose(i)} disabled={picked !== null} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition ${cls}`}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#2a1e16]/20 text-xs">{String.fromCharCode(65 + i)}</span>
                <span className="flex-1">{opt}</span>
                {picked !== null && isAnswer && <span className="text-emerald-300">✓</span>}
                {picked !== null && isPicked && !isAnswer && <span className="text-rose-300">✕</span>}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-4 rounded-xl border border-orange-300/20 bg-orange-300/8 p-4">
            <p className="text-xs leading-relaxed text-[#2a1e16]/78">💡 {q.why}</p>
          </div>
        )}

        <button
          type="button"
          onClick={next}
          disabled={picked === null}
          className="btn-gloss mt-5 w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {current < questions.length - 1 ? "Next Question →" : "See My Score"}
        </button>
      </div>
    </div>
  );
}
