import { useState } from "react";

/* ---------------------------------------------------------------- */
/* Split Finder — a short quiz that recommends the training split      */
/* best suited to your schedule, experience, and goal. No SVG.        */
/* ---------------------------------------------------------------- */

interface Result { name: string; icon: string; days: string; blurb: string; structure: string[] }

const RESULTS: Record<string, Result> = {
  fullbody: { name: "Full-Body 3×", icon: "🏋️", days: "3 days/week", blurb: "The most efficient choice for beginners and busy schedules — every muscle trained 3× a week for fast skill and strength gains.", structure: ["Mon · Full Body A", "Wed · Full Body B", "Fri · Full Body C"] },
  upperlower: { name: "Upper / Lower", icon: "💪", days: "4 days/week", blurb: "An excellent strength-and-size balance for intermediates — more volume per muscle while still hitting everything twice weekly.", structure: ["Mon · Upper", "Tue · Lower", "Thu · Upper", "Fri · Lower"] },
  ppl5: { name: "PPL + Upper/Lower", icon: "🔥", days: "5 days/week", blurb: "High frequency for dedicated intermediates who can train five days and recover well.", structure: ["Mon · Push", "Tue · Pull", "Wed · Legs", "Thu · Upper", "Fri · Lower"] },
  ppl6: { name: "Push / Pull / Legs ×2", icon: "⚡", days: "6 days/week", blurb: "High-volume training hitting each muscle twice a week — for experienced lifters with great recovery.", structure: ["Mon · Push A", "Tue · Pull A", "Wed · Legs A", "Thu · Push B", "Fri · Pull B", "Sat · Legs B"] },
};

interface Opt { label: string; w: Record<string, number> }
interface QItem { q: string; options: Opt[] }

const QUESTIONS: QItem[] = [
  { q: "How many days a week can you realistically train?", options: [
    { label: "3 days", w: { fullbody: 3, upperlower: 1 } },
    { label: "4 days", w: { upperlower: 3, ppl5: 1 } },
    { label: "5 days", w: { ppl5: 3, upperlower: 1 } },
    { label: "6 days", w: { ppl6: 3, ppl5: 1 } },
  ] },
  { q: "What's your training experience?", options: [
    { label: "Beginner (under 1 year)", w: { fullbody: 3, upperlower: 1 } },
    { label: "Intermediate (1–3 years)", w: { upperlower: 2, ppl5: 2 } },
    { label: "Advanced (3+ years)", w: { ppl6: 2, ppl5: 2 } },
  ] },
  { q: "How well do you recover (sleep, low stress, good nutrition)?", options: [
    { label: "Not great right now", w: { fullbody: 3, upperlower: 1 } },
    { label: "Decent", w: { upperlower: 2, ppl5: 1 } },
    { label: "Excellent", w: { ppl6: 2, ppl5: 2 } },
  ] },
  { q: "What matters most to you?", options: [
    { label: "Efficiency — best results in least time", w: { fullbody: 3, upperlower: 2 } },
    { label: "Balanced strength and size", w: { upperlower: 3, ppl5: 1 } },
    { label: "Maximum muscle and gym time", w: { ppl6: 3, ppl5: 2 } },
  ] },
];

export default function SplitFinderPage() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ fullbody: 0, upperlower: 0, ppl5: 0, ppl6: 0 });
  const [done, setDone] = useState(false);

  function choose(w: Record<string, number>) {
    const next = { ...scores };
    Object.entries(w).forEach(([k, v]) => { next[k] = (next[k] ?? 0) + v; });
    setScores(next);
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else setDone(true);
  }
  function restart() { setStep(0); setScores({ fullbody: 0, upperlower: 0, ppl5: 0, ppl6: 0 }); setDone(false); }

  if (done) {
    const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    const r = RESULTS[winner];
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-black tracking-[-0.04em]">Your Ideal Split</h1><p className="text-sm text-[#f7f0df]/68">Matched to your schedule, experience, and goals</p></div>
        <div className="glass-card rounded-3xl p-8 text-center" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.18) 0%, transparent 60%)" }}>
          <div className="text-6xl">{r.icon}</div>
          <p className="mt-2 text-3xl font-black text-violet-200">{r.name}</p>
          <p className="text-sm font-bold text-[#d8b35a]">{r.days}</p>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#f7f0df]/78">{r.blurb}</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d8b35a]">Weekly structure</p>
          <div className="space-y-2">
            {r.structure.map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-3 text-sm font-semibold">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-500/70 text-xs font-black">{i + 1}</span>{s}
              </div>
            ))}
          </div>
        </div>
        <button type="button" onClick={restart} className="btn-gloss w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Retake</button>
        <p className="text-center text-[11px] text-[#f7f0df]/55">Open the Split Planner to see the full day-by-day plan for this split.</p>
      </div>
    );
  }

  const q = QUESTIONS[step];
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black tracking-[-0.04em]">Split Finder</h1><p className="text-sm text-[#f7f0df]/68">Find the training split that fits your life in {QUESTIONS.length} questions</p></div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f7f0df]/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all duration-300" style={{ width: `${(step / QUESTIONS.length) * 100}%` }} /></div>
      <div className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d8b35a]">Question {step + 1} of {QUESTIONS.length}</p>
        <h2 className="mt-2 text-xl font-black">{q.q}</h2>
        <div className="mt-5 space-y-3">
          {q.options.map((o, i) => (
            <button key={i} type="button" onClick={() => choose(o.w)} className="block w-full rounded-xl border border-[#f7f0df]/12 bg-[#f7f0df]/5 p-4 text-left text-sm font-semibold transition hover:border-violet-200/40 hover:bg-violet-400/10">{o.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
