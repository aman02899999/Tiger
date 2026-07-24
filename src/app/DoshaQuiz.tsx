import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Dosha Quiz — an interactive Ayurvedic constitution (Prakriti)      */
/* assessment. Each answer weights Vata, Pitta, or Kapha; the tally   */
/* reveals your dominant dosha with tailored guidance. No SVG.        */
/* ---------------------------------------------------------------- */

type Dosha = "vata" | "pitta" | "kapha";

interface Q { q: string; options: { label: string; dosha: Dosha }[] }

const QUESTIONS: Q[] = [
  { q: "How would you describe your body frame?", options: [
    { label: "Thin, light, find it hard to gain weight", dosha: "vata" },
    { label: "Medium, athletic, well-proportioned", dosha: "pitta" },
    { label: "Solid, sturdy, gain weight easily", dosha: "kapha" },
  ] },
  { q: "How is your skin most of the time?", options: [
    { label: "Dry, thin, cool to touch", dosha: "vata" },
    { label: "Warm, reddish, prone to irritation", dosha: "pitta" },
    { label: "Thick, smooth, oily, cool", dosha: "kapha" },
  ] },
  { q: "How is your appetite and digestion?", options: [
    { label: "Irregular — sometimes hungry, sometimes not", dosha: "vata" },
    { label: "Strong and sharp — I get 'hangry'", dosha: "pitta" },
    { label: "Steady but slow; I can skip meals easily", dosha: "kapha" },
  ] },
  { q: "How do you typically sleep?", options: [
    { label: "Light, easily disturbed, active mind", dosha: "vata" },
    { label: "Moderate but sound; wake feeling sharp", dosha: "pitta" },
    { label: "Deep and long; hard to wake up", dosha: "kapha" },
  ] },
  { q: "Which best describes your usual temperament?", options: [
    { label: "Enthusiastic, creative, changeable", dosha: "vata" },
    { label: "Focused, driven, sometimes intense", dosha: "pitta" },
    { label: "Calm, steady, easy-going", dosha: "kapha" },
  ] },
  { q: "How do you handle stress?", options: [
    { label: "I get anxious and worried", dosha: "vata" },
    { label: "I get irritable and frustrated", dosha: "pitta" },
    { label: "I withdraw and go quiet", dosha: "kapha" },
  ] },
  { q: "What's your energy pattern like?", options: [
    { label: "Comes in bursts, then I crash", dosha: "vata" },
    { label: "Strong and purposeful", dosha: "pitta" },
    { label: "Steady and enduring; slow to start", dosha: "kapha" },
  ] },
  { q: "How do you respond to weather?", options: [
    { label: "I dislike cold and wind", dosha: "vata" },
    { label: "I dislike heat and sun", dosha: "pitta" },
    { label: "I dislike cold, damp weather", dosha: "kapha" },
  ] },
  { q: "How is your memory?", options: [
    { label: "Quick to learn, quick to forget", dosha: "vata" },
    { label: "Sharp and accurate", dosha: "pitta" },
    { label: "Slow to learn, but never forget", dosha: "kapha" },
  ] },
  { q: "How would others describe your speech?", options: [
    { label: "Fast, talkative, jumps topics", dosha: "vata" },
    { label: "Precise, persuasive, direct", dosha: "pitta" },
    { label: "Slow, calm, thoughtful", dosha: "kapha" },
  ] },
];

const RESULTS: Record<Dosha, { name: string; icon: string; color: string; summary: string; tips: string[] }> = {
  vata: { name: "Vata", icon: "🌬️", color: "#f97316", summary: "Air & ether — you're creative, energetic, and quick, but can tip into anxiety, dryness, and irregularity when out of balance.", tips: ["Favor warm, moist, grounding foods and cooked meals", "Keep a steady daily routine and regular sleep", "Practice calming activities and warm oil self-massage (Abhyanga)", "Stay warm; avoid excess cold, raw, and dry foods"] },
  pitta: { name: "Pitta", icon: "🔥", color: "#fb7185", summary: "Fire & water — you're focused, driven, and sharp, but can tip into irritability, acidity, and inflammation when out of balance.", tips: ["Favor cooling, sweet, and bitter foods; don't skip meals", "Avoid excess heat, spicy, sour, and fried foods", "Make time for leisure and avoid overworking", "Cool down with nature, swimming, and moonlight walks"] },
  kapha: { name: "Kapha", icon: "🌱", color: "#059669", summary: "Earth & water — you're calm, strong, and steady, but can tip into weight gain, congestion, and lethargy when out of balance.", tips: ["Favor light, warm, spiced foods; avoid heavy, oily, sweet foods", "Stay active with vigorous, energizing exercise", "Rise early and avoid daytime naps", "Embrace variety and new stimulation to stay motivated"] },
};

export default function DoshaQuizPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Dosha[]>([]);
  const [rewarded, setRewarded] = useState(false);

  const done = answers.length === QUESTIONS.length;

  const tally = useMemo(() => {
    const t: Record<Dosha, number> = { vata: 0, pitta: 0, kapha: 0 };
    answers.forEach((a) => { t[a]++; });
    return t;
  }, [answers]);

  const dominant = useMemo<Dosha>(() => {
    return (Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] as Dosha) ?? "vata";
  }, [tally]);

  function choose(d: Dosha) {
    const next = [...answers, d];
    setAnswers(next);
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else if (!rewarded) { setRewarded(true); addXP(user?.email, 15); }
  }

  function restart() { setStep(0); setAnswers([]); }

  if (done) {
    const r = RESULTS[dominant];
    const total = QUESTIONS.length;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">Your Dosha Result</h1>
          <p className="text-sm text-[#2a1e16]/68">Based on your answers — your Ayurvedic constitution (Prakriti)</p>
        </div>

        <div className="glass-card rounded-3xl p-8 text-center" style={{ background: `radial-gradient(ellipse at 50% 0%, ${r.color}22 0%, transparent 60%)` }}>
          <div className="text-6xl">{r.icon}</div>
          <p className="mt-2 text-3xl font-black" style={{ color: r.color }}>{r.name}-dominant</p>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#2a1e16]/78">{r.summary}</p>
        </div>

        {/* Breakdown bars */}
        <div className="glass-card rounded-2xl p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Your balance</p>
          <div className="space-y-3">
            {(Object.keys(RESULTS) as Dosha[]).map((d) => (
              <div key={d} className="flex items-center gap-3">
                <span className="w-16 text-sm font-bold" style={{ color: RESULTS[d].color }}>{RESULTS[d].icon} {RESULTS[d].name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#2a1e16]/10">
                  <div className="h-full rounded-full" style={{ width: `${(tally[d] / total) * 100}%`, background: RESULTS[d].color }} />
                </div>
                <span className="w-10 text-right text-sm font-black tabular-nums">{Math.round((tally[d] / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="glass-card rounded-2xl p-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">How to stay in balance</p>
          <ul className="space-y-2">
            {r.tips.map((t, i) => <li key={i} className="flex gap-2 text-sm text-[#2a1e16]/80"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: r.color }} />{t}</li>)}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={restart} className="btn-gloss rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">Retake Quiz</button>
        </div>
        <p className="text-center text-[11px] text-[#2a1e16]/55">Explore the Ayurveda Library for herbs, routines, and remedies suited to your dosha. Educational only — not medical advice.</p>
      </div>
    );
  }

  const q = QUESTIONS[step];
  const progress = (step / QUESTIONS.length) * 100;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Dosha Quiz</h1>
        <p className="text-sm text-[#2a1e16]/68">Discover your Ayurvedic mind-body type in {QUESTIONS.length} questions</p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-[#2a1e16]/10">
        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ea580c]">Question {step + 1} of {QUESTIONS.length}</p>
        <h2 className="mt-2 text-xl font-black">{q.q}</h2>
        <div className="mt-5 space-y-3">
          {q.options.map((o, i) => (
            <button key={i} type="button" onClick={() => choose(o.dosha)} className="block w-full rounded-xl border border-[#2a1e16]/12 bg-[#2a1e16]/5 p-4 text-left text-sm font-semibold transition hover:border-orange-200/40 hover:bg-orange-400/10">
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {step > 0 && (
        <button type="button" onClick={() => { setStep(step - 1); setAnswers(answers.slice(0, -1)); }} className="text-sm font-bold text-[#2a1e16]/60 hover:text-[#2a1e16]">← Previous question</button>
      )}
    </div>
  );
}
