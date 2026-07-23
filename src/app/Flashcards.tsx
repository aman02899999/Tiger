import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Flashcards — study key fitness, nutrition & wellness concepts.     */
/* Tap to flip, mark known, filter by deck, and track your progress.  */
/* No SVG.                                                            */
/* ---------------------------------------------------------------- */

interface Card { front: string; back: string; deck: string }

const CARDS: Card[] = [
  { deck: "Training", front: "What is progressive overload?", back: "Gradually increasing training demand over time — more weight, reps, sets, or quality — so the body keeps adapting. It's the #1 driver of results." },
  { deck: "Training", front: "How many hard sets per muscle per week for growth?", back: "Around 10–20 hard sets per muscle per week, split across 2 or more sessions, works well for most people." },
  { deck: "Training", front: "What drives muscle growth (hypertrophy)?", back: "Mechanical tension from challenging loads taken close to failure, sufficient weekly volume, and adequate recovery." },
  { deck: "Training", front: "When does muscle actually grow?", back: "During recovery — training is the stimulus; muscle is rebuilt afterward with adequate protein and sleep." },
  { deck: "Training", front: "What is a deload?", back: "A planned lighter week (reduced weight/volume) every 4–8 weeks to let fatigue dissipate so you return stronger." },
  { deck: "Nutrition", front: "How much protein per kg of bodyweight?", back: "1.6–2.2 g/kg per day for people who train — enough to build and preserve muscle; more isn't better past this range." },
  { deck: "Nutrition", front: "What determines fat loss?", back: "An overall calorie deficit — consuming fewer calories than you burn. Every effective diet works this way." },
  { deck: "Nutrition", front: "Which macro is most satiating?", back: "Protein — it keeps you fuller than carbs or fat and has the highest thermic effect." },
  { deck: "Nutrition", front: "How much fiber per day?", back: "Around 25–38 g daily to feed beneficial gut bacteria and support digestion and metabolic health." },
  { deck: "Nutrition", front: "Is 'eating late' inherently fattening?", back: "No — total daily calories, not timing, determine fat gain. Late eating only matters if it makes you eat more overall." },
  { deck: "Cardio", front: "What is Zone 2 cardio?", back: "Comfortable, conversational-pace effort (~60–70% max HR) that builds your aerobic base with minimal fatigue." },
  { deck: "Cardio", front: "How is max heart rate roughly estimated?", back: "The Tanaka formula: 208 − (0.7 × age), more accurate than the old 220 − age." },
  { deck: "Cardio", front: "Why is daily walking valuable?", back: "Steps drive NEAT (a big part of energy balance) and improve heart health, mood, and longevity at low injury risk." },
  { deck: "Recovery", front: "Why is sleep so important?", back: "It drives muscle repair, hormone regulation, and mental clarity — the most powerful free recovery tool." },
  { deck: "Recovery", front: "What is 'active recovery'?", back: "Light movement (walking, mobility) on rest days that aids recovery without adding meaningful fatigue." },
  { deck: "Wellness", front: "What is the physiological sigh?", back: "A double inhale followed by a long exhale — one of the fastest evidence-based ways to reduce acute stress." },
  { deck: "Wellness", front: "How do slow exhales calm you?", back: "Lengthening the exhale activates the parasympathetic nervous system via the vagus nerve, slowing heart rate." },
  { deck: "Ayurveda", front: "What are the three doshas?", back: "Vata (air/ether — movement), Pitta (fire/water — transformation), and Kapha (earth/water — structure)." },
  { deck: "Ayurveda", front: "What is Agni in Ayurveda?", back: "The digestive 'fire' governing digestion and metabolism. Strong Agni means good digestion; weak Agni produces 'ama' (toxins)." },
  { deck: "Ayurveda", front: "Why pair turmeric with black pepper?", back: "Piperine in black pepper dramatically improves absorption of curcumin, turmeric's active compound." },
];

const DECKS = ["All", "Training", "Nutrition", "Cardio", "Recovery", "Wellness", "Ayurveda"];

export default function FlashcardsPage() {
  const [deck, setDeck] = useState("All");
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  const cards = useMemo(() => CARDS.map((c, idx) => ({ ...c, idx })).filter((c) => deck === "All" || c.deck === deck), [deck]);
  const card = cards[i] ?? cards[0];

  function go(delta: number) {
    setFlipped(false);
    setI((prev) => (prev + delta + cards.length) % cards.length);
  }
  function toggleKnown() {
    setKnown((prev) => { const n = new Set(prev); if (n.has(card.idx)) n.delete(card.idx); else n.add(card.idx); return n; });
  }
  function pickDeck(d: string) { setDeck(d); setI(0); setFlipped(false); }

  const knownInDeck = cards.filter((c) => known.has(c.idx)).length;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-black tracking-[-0.04em]">Flashcards</h1><p className="text-sm text-[#f7f0df]/68">Study and retain the key concepts — tap a card to flip it</p></div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          {DECKS.map((d) => (
            <button key={d} type="button" onClick={() => pickDeck(d)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${deck === d ? "bg-violet-500 text-white" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/68 hover:text-[#f7f0df]"}`}>{d}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-bold text-[#f7f0df]/60">
        <span>Card {i + 1} of {cards.length}</span>
        <span className="text-emerald-300">{knownInDeck} known ✓</span>
      </div>

      {/* Flip card */}
      <button type="button" onClick={() => setFlipped((f) => !f)} className="relative block min-h-[16rem] w-full">
        <div className={`glass-card grid min-h-[16rem] place-items-center rounded-3xl p-8 text-center transition-all duration-300 ${flipped ? "border-[#d8b35a]/30" : "border-violet-300/20"}`} style={{ background: flipped ? "radial-gradient(ellipse at 50% 0%, rgba(216,179,90,0.14) 0%, transparent 60%)" : "radial-gradient(ellipse at 50% 0%, rgba(167,139,250,0.14) 0%, transparent 60%)" }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f7f0df]/45">{flipped ? "Answer" : `${card.deck} · Question`}</p>
            <p className={`mt-4 font-black leading-snug ${flipped ? "text-lg text-[#f7f0df]/88" : "text-2xl"}`}>{flipped ? card.back : card.front}</p>
            <p className="mt-6 text-[11px] text-[#f7f0df]/45">Tap to {flipped ? "see question" : "reveal answer"}</p>
          </div>
        </div>
        {known.has(card.idx) && <span className="absolute right-4 top-4 rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">Known ✓</span>}
      </button>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => go(-1)} className="flex-1 rounded-full border border-[#f7f0df]/12 bg-[#f7f0df]/5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#f7f0df]/70 transition hover:bg-[#f7f0df]/10">← Prev</button>
        <button type="button" onClick={toggleKnown} className={`flex-1 rounded-full py-3 text-xs font-black uppercase tracking-[0.14em] transition ${known.has(card.idx) ? "bg-emerald-500/80 text-white" : "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>{known.has(card.idx) ? "✓ Known" : "Mark Known"}</button>
        <button type="button" onClick={() => go(1)} className="flex-1 rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3 text-xs font-black uppercase tracking-[0.14em] text-white">Next →</button>
      </div>
    </div>
  );
}
