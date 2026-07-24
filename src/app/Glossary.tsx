import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Glossary — a searchable A–Z dictionary of fitness, nutrition,      */
/* training, and Ayurveda terms with plain-language definitions.      */
/* No SVG.                                                            */
/* ---------------------------------------------------------------- */

interface Term { term: string; def: string; category: string }

const TERMS: Term[] = [
  { term: "1RM (One-Rep Max)", category: "Training", def: "The maximum weight you can lift for a single repetition of an exercise. Used to set training percentages." },
  { term: "Adaptogen", category: "Ayurveda", def: "A herb (like ashwagandha) traditionally used to help the body resist and adapt to stress." },
  { term: "Aerobic", category: "Cardio", def: "Exercise fueled with oxygen, typically lower-intensity and sustainable, that builds cardiovascular endurance." },
  { term: "Agni", category: "Ayurveda", def: "In Ayurveda, the digestive 'fire' governing digestion and metabolism. Strong Agni means good digestion." },
  { term: "Anaerobic", category: "Cardio", def: "High-intensity exercise fueled without oxygen, like sprinting or heavy lifting, sustainable only briefly." },
  { term: "BMR (Basal Metabolic Rate)", category: "Nutrition", def: "The calories your body burns at complete rest to keep basic functions running." },
  { term: "Calorie Deficit", category: "Nutrition", def: "Consuming fewer calories than you burn — the fundamental requirement for fat loss." },
  { term: "Calorie Surplus", category: "Nutrition", def: "Consuming more calories than you burn — required to build muscle and gain weight." },
  { term: "Compound Exercise", category: "Training", def: "A movement using multiple joints and muscle groups, like squats, deadlifts, and presses." },
  { term: "Concentric", category: "Training", def: "The lifting (shortening) phase of a muscle contraction — e.g. standing up from a squat." },
  { term: "Deload", category: "Training", def: "A planned lighter week of training to let accumulated fatigue dissipate so you return stronger." },
  { term: "Dosha", category: "Ayurveda", def: "One of the three Ayurvedic mind-body energies: Vata, Pitta, and Kapha." },
  { term: "DOMS", category: "Training", def: "Delayed-Onset Muscle Soreness — the ache felt 1–2 days after unfamiliar or intense exercise." },
  { term: "Eccentric", category: "Training", def: "The lowering (lengthening) phase of a muscle contraction — e.g. descending into a squat." },
  { term: "EPOC", category: "Cardio", def: "Excess Post-exercise Oxygen Consumption — the 'afterburn' of extra calories burned during recovery." },
  { term: "Failure (Training to)", category: "Training", def: "Performing reps until you can't complete another with good form. Effective but fatiguing in large doses." },
  { term: "FFMI", category: "Nutrition", def: "Fat-Free Mass Index — a measure of muscularity relative to height, adjusting for lean mass." },
  { term: "Glycogen", category: "Nutrition", def: "The stored form of carbohydrate in muscles and liver that fuels high-intensity exercise." },
  { term: "Hypertrophy", category: "Training", def: "The growth of muscle size through training, driven mainly by mechanical tension and volume." },
  { term: "Isometric", category: "Training", def: "A muscle contraction with no movement, like holding a plank or a wall sit." },
  { term: "Karvonen Method", category: "Cardio", def: "A formula using heart-rate reserve (max HR minus resting HR) to set personalized training zones." },
  { term: "Macronutrients", category: "Nutrition", def: "The three energy-providing nutrients: protein, carbohydrate, and fat." },
  { term: "MET", category: "Cardio", def: "Metabolic Equivalent — a unit expressing the energy cost of an activity relative to rest." },
  { term: "Micronutrients", category: "Nutrition", def: "Vitamins and minerals needed in small amounts for countless bodily functions." },
  { term: "NEAT", category: "Nutrition", def: "Non-Exercise Activity Thermogenesis — calories burned from daily movement like walking and fidgeting." },
  { term: "Panchakarma", category: "Ayurveda", def: "A supervised Ayurvedic set of five cleansing procedures to remove deep toxins and rebalance the doshas." },
  { term: "Periodization", category: "Training", def: "Structuring training over time with planned variation in intensity and volume to keep progressing." },
  { term: "Progressive Overload", category: "Training", def: "Gradually increasing training demand over time — the primary driver of strength and muscle gains." },
  { term: "Pranayama", category: "Ayurveda", def: "Yogic breath-control practices used to balance the nervous system and support vitality (prana)." },
  { term: "RPE", category: "Training", def: "Rate of Perceived Exertion — a 1–10 scale of how hard a set feels, used to autoregulate training." },
  { term: "Superset", category: "Training", def: "Performing two exercises back-to-back with little rest, saving time and increasing intensity." },
  { term: "TDEE", category: "Nutrition", def: "Total Daily Energy Expenditure — all the calories you burn in a day from all sources." },
  { term: "Thermic Effect of Food", category: "Nutrition", def: "The calories used to digest and process food; highest for protein." },
  { term: "VO2 Max", category: "Cardio", def: "The maximum rate your body can use oxygen during intense exercise — a key measure of cardio fitness." },
  { term: "Volume (Training)", category: "Training", def: "The total amount of work done, often measured as hard sets per muscle per week." },
  { term: "Zone 2", category: "Cardio", def: "Comfortable, conversational-pace cardio (~60–70% max HR) that builds the aerobic base efficiently." },
];

const CATS = ["All", "Training", "Nutrition", "Cardio", "Ayurveda"];
const CAT_COLOR: Record<string, string> = { Training: "#f97316", Nutrition: "#059669", Cardio: "#0284c7", Ayurveda: "#16a34a" };

export default function GlossaryPage() {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TERMS.filter((t) => (cat === "All" || t.category === cat) && (!q || t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q)))
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [cat, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Fitness Glossary</h1>
        <p className="text-sm text-[#2a1e16]/68">Plain-language definitions of {TERMS.length} fitness, nutrition &amp; Ayurveda terms</p>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search terms…" className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-orange-200/40" />
        <div className="mt-3 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cat === c ? "bg-orange-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68 hover:text-[#2a1e16]"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {filtered.map((t) => {
          const color = CAT_COLOR[t.category] ?? "#f97316";
          return (
            <div key={t.term} className="glass-card rounded-2xl p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black">{t.term}</h3>
                <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: `${color}22`, color }}>{t.category}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[#2a1e16]/72">{t.def}</p>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="glass-card rounded-2xl p-8 text-center text-sm text-[#2a1e16]/60">No terms match your search.</p>}
      </div>
    </div>
  );
}
