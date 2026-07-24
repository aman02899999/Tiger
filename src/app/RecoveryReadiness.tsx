import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Recovery Readiness — a 5-question daily check-in that scores how   */
/* recovered you are (0-100) and recommends how hard to train today.  */
/* Pulls today's sleep hours and mood if already logged. No SVG.      */
/* ---------------------------------------------------------------- */

interface Q {
  id: string;
  question: string;
  options: { label: string; value: number; emoji: string }[];
}

const QUESTIONS: Q[] = [
  { id: "sleep", question: "How well did you sleep?", options: [
    { label: "Great, 8+ hrs", value: 100, emoji: "😴" },
    { label: "Decent", value: 70, emoji: "🙂" },
    { label: "Restless", value: 40, emoji: "😕" },
    { label: "Barely slept", value: 15, emoji: "🥱" },
  ]},
  { id: "soreness", question: "How sore are your muscles?", options: [
    { label: "Fresh, no soreness", value: 100, emoji: "💪" },
    { label: "A little tight", value: 70, emoji: "🙂" },
    { label: "Noticeably sore", value: 40, emoji: "😣" },
    { label: "Very sore / achy", value: 15, emoji: "🤕" },
  ]},
  { id: "energy", question: "What's your energy like?", options: [
    { label: "Buzzing", value: 100, emoji: "⚡" },
    { label: "Normal", value: 70, emoji: "🙂" },
    { label: "Sluggish", value: 40, emoji: "😮‍💨" },
    { label: "Drained", value: 15, emoji: "🔋" },
  ]},
  { id: "stress", question: "How stressed do you feel?", options: [
    { label: "Calm & clear", value: 100, emoji: "🌊" },
    { label: "A bit tense", value: 70, emoji: "🍃" },
    { label: "Pretty stressed", value: 40, emoji: "⛅" },
    { label: "Overwhelmed", value: 15, emoji: "🌩️" },
  ]},
  { id: "motivation", question: "Do you want to train?", options: [
    { label: "Can't wait", value: 100, emoji: "🔥" },
    { label: "Sure, why not", value: 70, emoji: "🙂" },
    { label: "Meh…", value: 40, emoji: "😐" },
    { label: "Really don't", value: 15, emoji: "🙅" },
  ]},
];

function todayKey() { return new Date().toISOString().slice(0, 10); }

export default function RecoveryReadinessPage() {
  const { user } = useAuth();
  const storeKey = `tfp_readiness_${user?.email ?? "guest"}_${todayKey()}`;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) ?? "null");
      if (saved) { setAnswers(saved.answers); setSubmitted(true); }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const answered = Object.keys(answers).length;
  const score = useMemo(() => {
    const vals = Object.values(answers);
    if (!vals.length) return 0;
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }, [answers]);

  function submit() {
    if (answered < QUESTIONS.length) return;
    setSubmitted(true);
    try { localStorage.setItem(storeKey, JSON.stringify({ answers, score })); } catch { /* ignore */ }
    addXP(user?.email, 8);
  }

  function reset() {
    setAnswers({});
    setSubmitted(false);
    try { localStorage.removeItem(storeKey); } catch { /* ignore */ }
  }

  const verdict = score >= 75
    ? { color: "#059669", title: "Fully Recovered", advice: "Green light — go for a hard, high-intensity session or a PR attempt. Your body's ready.", emoji: "🟢" }
    : score >= 50
    ? { color: "#ea580c", title: "Moderately Ready", advice: "Train, but keep it moderate. Hit your working sets, skip the all-out finisher, and listen to your body.", emoji: "🟡" }
    : score >= 30
    ? { color: "#fb923c", title: "Under-Recovered", advice: "Go light today — mobility, an easy walk, or technique work. Pushing hard now risks burnout or injury.", emoji: "🟠" }
    : { color: "#fb7185", title: "Rest Recommended", advice: "Take a full rest or active-recovery day. Prioritize sleep, food, and hydration — you'll come back stronger.", emoji: "🔴" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Recovery Readiness</h1>
        <p className="text-sm text-[#2a1e16]/68">A 30-second check-in that tells you how hard to train today</p>
      </div>

      {submitted ? (
        <>
          <div className="glass-card rounded-3xl p-8 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${verdict.color}18 0%, transparent 60%)` }}>
            <div className="relative mx-auto h-40 w-40">
              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${verdict.color} ${score * 3.6}deg, rgba(247,240,223,0.1) ${score * 3.6}deg)`, transition: "background 1s ease" }} />
              <div className="absolute inset-[10px] grid place-items-center rounded-full bg-[#fffdf9]">
                <div>
                  <p className="text-4xl font-black tabular-nums" style={{ color: verdict.color }}>{score}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#2a1e16]/62">/ 100</p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-2xl font-black" style={{ color: verdict.color }}>{verdict.emoji} {verdict.title}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#2a1e16]/78">{verdict.advice}</p>
            <button type="button" onClick={reset} className="mt-6 rounded-full border border-[#2a1e16]/15 px-6 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-[#2a1e16]/70 hover:bg-[#2a1e16]/8">Retake Check-in</button>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Your answers</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {QUESTIONS.map((q) => {
                const chosen = q.options.find((o) => o.value === answers[q.id]);
                return (
                  <div key={q.id} className="flex items-center gap-3 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-3">
                    <span className="text-xl">{chosen?.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold">{q.question}</p>
                      <p className="text-[11px] text-[#2a1e16]/62">{chosen?.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4">
            {QUESTIONS.map((q, qi) => (
              <div key={q.id} className="glass-card rounded-2xl p-5">
                <p className="mb-3 text-sm font-bold"><span className="text-[#ea580c]">{qi + 1}.</span> {q.question}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {q.options.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [q.id]: o.value })}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition ${answers[q.id] === o.value ? "border-orange-300/50 bg-orange-300/12" : "border-[#2a1e16]/10 bg-[#2a1e16]/5 hover:bg-[#2a1e16]/10"}`}
                    >
                      <span className="text-2xl">{o.emoji}</span>
                      <span className="text-[10px] font-bold text-[#2a1e16]/75">{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={answered < QUESTIONS.length}
            className="btn-gloss w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {answered < QUESTIONS.length ? `Answer all ${QUESTIONS.length} (${answered}/${QUESTIONS.length})` : "See My Readiness Score (+8 XP)"}
          </button>
        </>
      )}
    </div>
  );
}
