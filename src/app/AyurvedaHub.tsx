import { useState } from "react";
import { useAuth } from "../auth/AuthSystem";

const doshaQuestions = [
  {
    question: "What is your body frame like?",
    options: [
      { label: "Thin, light, hard to gain weight", dosha: "vata" },
      { label: "Medium, muscular, athletic", dosha: "pitta" },
      { label: "Large, stocky, gains weight easily", dosha: "kapha" },
    ],
  },
  {
    question: "How would you describe your skin?",
    options: [
      { label: "Dry, rough, thin", dosha: "vata" },
      { label: "Oily, sensitive, prone to rashes", dosha: "pitta" },
      { label: "Thick, moist, smooth", dosha: "kapha" },
    ],
  },
  {
    question: "How is your energy level?",
    options: [
      { label: "Variable, bursts of energy then tired", dosha: "vata" },
      { label: "High and focused, intense", dosha: "pitta" },
      { label: "Steady, slow but sustained", dosha: "kapha" },
    ],
  },
  {
    question: "How do you handle stress?",
    options: [
      { label: "Anxious, worried, restless", dosha: "vata" },
      { label: "Irritable, angry, critical", dosha: "pitta" },
      { label: "Withdrawn, stubborn, depressed", dosha: "kapha" },
    ],
  },
  {
    question: "How is your digestion?",
    options: [
      { label: "Irregular, bloating, gas", dosha: "vata" },
      { label: "Strong, acid reflux sometimes", dosha: "pitta" },
      { label: "Slow, heavy after meals", dosha: "kapha" },
    ],
  },
  {
    question: "How do you sleep?",
    options: [
      { label: "Light, interrupted, hard to fall asleep", dosha: "vata" },
      { label: "Moderate, vivid dreams", dosha: "pitta" },
      { label: "Deep, long, hard to wake up", dosha: "kapha" },
    ],
  },
];

const doshaInfo: Record<string, { color: string; desc: string; diet: string[] }> = {
  vata: {
    color: "#a78bfa",
    desc: "Vata governs movement and communication. Vata-dominant people are creative, energetic, and quick-thinking but may experience anxiety, dry skin, and irregular digestion when imbalanced.",
    diet: [
      "Warm, cooked, oily foods",
      "Sweet, sour, salty tastes",
      "Avoid raw, cold, dry foods",
      "Sesame oil, ghee, warm soups",
      "Regular meal times essential",
    ],
  },
  pitta: {
    color: "#f97316",
    desc: "Pitta governs transformation and metabolism. Pitta-dominant people are intelligent, driven, and strong-willed but may experience anger, inflammation, and skin issues when imbalanced.",
    diet: [
      "Cool, refreshing, moderately heavy foods",
      "Sweet, bitter, astringent tastes",
      "Avoid spicy, fried, fermented foods",
      "Coconut water, cucumber, coriander",
      "Avoid skipping meals",
    ],
  },
  kapha: {
    color: "#34d399",
    desc: "Kapha governs structure and lubrication. Kapha-dominant people are calm, loving, and stable but may experience weight gain, congestion, and lethargy when imbalanced.",
    diet: [
      "Light, dry, warm foods",
      "Pungent, bitter, astringent tastes",
      "Avoid dairy, sweets, fried foods",
      "Ginger, turmeric, honey (in moderation)",
      "Eat less and avoid snacking",
    ],
  },
};

const conditions = [
  {
    name: "Diabetes",
    sanskrit: "Madhumeha",
    icon: "🩸",
    herbs: ["Karela", "Methi", "Gurmar", "Neem"],
    formulation: "Chandraprabha Vati",
    diet: "Low GI foods, no sugar or refined carbs, bitter vegetables",
    yoga: "Surya Namaskar, Pranayama, Mandukasana",
  },
  {
    name: "Obesity",
    sanskrit: "Sthoulya",
    icon: "⚖️",
    herbs: ["Triphala", "Guggul", "Vijaysar"],
    formulation: "Medohar Guggul",
    diet: "No fried food, Kapha-reducing diet, light meals before sunset",
    yoga: "Kapalabhati, Surya Namaskar, Trikonasana",
  },
  {
    name: "Thyroid",
    sanskrit: "Galaganda",
    icon: "🦋",
    herbs: ["Kanchanar", "Ashwagandha", "Brahmi"],
    formulation: "Kanchanar Guggul",
    diet: "No raw cruciferous vegetables, iodine-rich foods, avoid goitrogens",
    yoga: "Sarvangasana, Ujjayi Pranayama, Matsyasana",
  },
  {
    name: "PCOS",
    sanskrit: "Artava Kshaya",
    icon: "🌸",
    herbs: ["Shatavari", "Ashoka", "Lodhra"],
    formulation: "Rajapravartini Vati",
    diet: "Anti-inflammatory diet, no excess dairy, whole grains",
    yoga: "Baddha Konasana, Supta Virasana, Nadi Shodhana",
  },
  {
    name: "Hypertension",
    sanskrit: "Rakta Gata Vata",
    icon: "❤️",
    herbs: ["Arjuna", "Sarpagandha", "Brahmi"],
    formulation: "Arjunarishta",
    diet: "Low salt, no spicy food, DASH-style diet, avoid alcohol",
    yoga: "Shavasana, Anulom Vilom, Bhramari",
  },
  {
    name: "Anaemia",
    sanskrit: "Pandu",
    icon: "🩺",
    herbs: ["Punarnava", "Draksha", "Triphala"],
    formulation: "Drakshavaleha",
    diet: "Iron-rich foods, beetroot, pomegranate, avoid tea with meals",
    yoga: "Pranayama, Setu Bandhasana, Viparita Karani",
  },
  {
    name: "Stress / Anxiety",
    sanskrit: "Chittodvega",
    icon: "🧘",
    herbs: ["Ashwagandha", "Brahmi", "Shankhpushpi"],
    formulation: "Saraswatarishta",
    diet: "Sattvic diet, avoid caffeine, warm milk with turmeric at night",
    yoga: "Yoga Nidra, Bhramari, Shavasana",
  },
  {
    name: "Digestive Issues",
    sanskrit: "Agnimandya",
    icon: "🔥",
    herbs: ["Triphala", "Hingvastak", "Ajwain"],
    formulation: "Lavangadi Vati",
    diet: "Light meals, warm water with ginger, no cold drinks, early dinner",
    yoga: "Pawanmuktasana, Trikonasana, Vajrasana after meals",
  },
  {
    name: "Joint Pain",
    sanskrit: "Amavata",
    icon: "🦴",
    herbs: ["Shallaki", "Nirgundi", "Rasna"],
    formulation: "Mahayogaraj Guggul",
    diet: "No curd at night, anti-inflammatory foods, warm sesame oil massage",
    yoga: "Gentle stretching, Tadasana, warm-up sequences",
  },
  {
    name: "Liver Issues",
    sanskrit: "Yakrit Vikara",
    icon: "🫀",
    herbs: ["Kalmegh", "Bhumi Amla", "Guduchi"],
    formulation: "Arogyavardhini Vati",
    diet: "No alcohol, low-fat diet, bitter greens, papaya",
    yoga: "Twisting poses, Ardha Matsyendrasana, Dhanurasana",
  },
  {
    name: "Insomnia",
    sanskrit: "Anidra",
    icon: "🌙",
    herbs: ["Ashwagandha", "Jatamansi", "Brahmi"],
    formulation: "Manasmitra Vatakam",
    diet: "Warm milk with nutmeg, no screens before bed, light dinner",
    yoga: "Yoga Nidra, Legs-up-the-wall, Bhramari before sleep",
  },
  {
    name: "Low Immunity",
    sanskrit: "Ojakshaya",
    icon: "🛡️",
    herbs: ["Chyawanprash", "Guduchi", "Amalaki"],
    formulation: "Chyawanprash",
    diet: "Seasonal fruits, turmeric milk, avoid processed foods",
    yoga: "Surya Namaskar, Kapalbhati, Anulom Vilom",
  },
];

const herbs = [
  {
    name: "Ashwagandha",
    sanskrit: "Withania somnifera",
    benefits: "Stress relief, testosterone boost, endurance, thyroid support",
    dosage: "300–600mg extract or 3–6g root powder daily",
    caution: "Avoid in pregnancy; may interact with thyroid medications",
  },
  {
    name: "Triphala",
    sanskrit: "Tri-phala (three fruits)",
    benefits: "Digestion, detox, eye health, antioxidant, mild laxative",
    dosage: "500mg–1g before bed or 1 tsp powder with warm water",
    caution: "Avoid in diarrhea; reduce dose if loose stools occur",
  },
  {
    name: "Brahmi",
    sanskrit: "Bacopa monnieri",
    benefits: "Memory, concentration, anxiety relief, neuroprotection",
    dosage: "300mg standardized extract or 2–4g powder daily",
    caution: "May cause fatigue initially; avoid with sedatives",
  },
  {
    name: "Shatavari",
    sanskrit: "Asparagus racemosus",
    benefits: "Female reproductive health, hormonal balance, lactation, immunity",
    dosage: "500mg–1g twice daily or 4–8g root powder",
    caution: "Avoid if estrogen-sensitive; may cause bloating in some",
  },
  {
    name: "Turmeric",
    sanskrit: "Curcuma longa",
    benefits: "Anti-inflammatory, antioxidant, liver support, joint health",
    dosage: "500mg–1g curcumin with black pepper; or 1 tsp in warm milk",
    caution: "High doses may cause GI issues; blood thinner interaction",
  },
  {
    name: "Neem",
    sanskrit: "Azadirachta indica",
    benefits: "Blood purification, skin health, antibacterial, diabetes support",
    dosage: "250–500mg extract or 4–5 fresh leaves daily",
    caution: "Avoid in pregnancy; not for long-term use in high doses",
  },
  {
    name: "Tulsi",
    sanskrit: "Ocimum tenuiflorum",
    benefits: "Adaptogen, respiratory health, stress, immunity, antibacterial",
    dosage: "300–600mg extract or 2–3g dried leaf powder daily",
    caution: "May slow blood clotting; avoid before surgery",
  },
  {
    name: "Amla",
    sanskrit: "Phyllanthus emblica",
    benefits: "Highest natural Vit C, immunity, hair/skin, digestion, eye health",
    dosage: "500mg–1g powder or 1–2 fresh amla daily",
    caution: "May lower blood sugar; avoid with blood thinners",
  },
  {
    name: "Guduchi",
    sanskrit: "Tinospora cordifolia",
    benefits: "Immunity, fever, liver detox, anti-inflammatory, diabetes support",
    dosage: "300–500mg extract or 2–4g stem powder twice daily",
    caution: "Monitor blood sugar if diabetic; avoid in autoimmune conditions",
  },
  {
    name: "Shallaki",
    sanskrit: "Boswellia serrata",
    benefits: "Joint pain, arthritis, inflammation, gut health, asthma relief",
    dosage: "300–500mg extract (AKBA standardized) 2–3x daily",
    caution: "Avoid in pregnancy; may interact with NSAIDs",
  },
];

function DoshaQuiz() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<string | null>(null);

  function handleAnswer(qIdx: number, dosha: string) {
    setAnswers((prev) => ({ ...prev, [qIdx]: dosha }));
    setResult(null);
  }

  function handleSubmit() {
    const counts: Record<string, number> = { vata: 0, pitta: 0, kapha: 0 };
    Object.values(answers).forEach((d) => counts[d]++);
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    setResult(dominant);
  }

  const allAnswered = Object.keys(answers).length === doshaQuestions.length;
  const info = result ? doshaInfo[result] : null;

  return (
    <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-xl">
          🌿
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#f7f0df]">Prakriti (Dosha) Quiz</h2>
          <p className="text-sm text-[#f7f0df]/60">Discover your Ayurvedic constitution</p>
        </div>
      </div>

      {!result && (
        <div className="space-y-6">
          {doshaQuestions.map((q, qIdx) => (
            <div key={qIdx} className="rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
              <p className="mb-3 font-medium text-[#f7f0df]">
                {qIdx + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.dosha}
                    onClick={() => handleAnswer(qIdx, opt.dosha)}
                    className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all ${
                      answers[qIdx] === opt.dosha
                        ? "border-violet-500 bg-violet-500/20 text-[#f7f0df]"
                        : "border-[#f7f0df]/10 bg-transparent text-[#f7f0df]/70 hover:border-[#f7f0df]/30 hover:text-[#f7f0df]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 font-semibold text-white transition-opacity disabled:opacity-40"
          >
            Reveal My Dosha
          </button>
          {!allAnswered && (
            <p className="text-center text-sm text-[#f7f0df]/40">
              Answer all {doshaQuestions.length} questions to continue
            </p>
          )}
        </div>
      )}

      {result && info && (
        <div className="space-y-5">
          <div
            className="rounded-2xl border p-6 text-center"
            style={{ borderColor: `${info.color}40`, background: `${info.color}15` }}
          >
            <p className="mb-1 text-sm uppercase tracking-widest text-[#f7f0df]/60">Your Dominant Dosha</p>
            <h3 className="mb-2 text-2xl sm:text-3xl font-extrabold capitalize" style={{ color: info.color }}>
              {result}
            </h3>
            <p className="text-sm leading-relaxed text-[#f7f0df]/80">{info.desc}</p>
          </div>

          <div className="rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
            <h4 className="mb-3 font-semibold text-[#f7f0df]">Diet Recommendations</h4>
            <ul className="space-y-2">
              {info.diet.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#f7f0df]/70">
                  <span style={{ color: info.color }}>✦</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => { setResult(null); setAnswers({}); }}
            className="w-full rounded-xl border border-[#f7f0df]/20 py-2.5 text-sm text-[#f7f0df]/70 transition hover:text-[#f7f0df]"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
}

function ConditionCard({ condition, onClick }: { condition: typeof conditions[0]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-5 text-left transition-all hover:border-violet-500/40 hover:bg-violet-500/10"
    >
      <div className="mb-3 text-3xl">{condition.icon}</div>
      <h3 className="font-semibold text-[#f7f0df]">{condition.name}</h3>
      <p className="mt-0.5 text-xs text-[#d8b35a]">{condition.sanskrit}</p>
      <p className="mt-2 text-xs text-[#f7f0df]/50">{condition.herbs.slice(0, 2).join(", ")} +{condition.herbs.length - 2} herbs</p>
    </button>
  );
}

function ConditionDetail({ condition, onClose }: { condition: typeof conditions[0]; onClose: () => void }) {
  return (
    <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-6">
      <div className="mb-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{condition.icon}</span>
          <div>
            <h3 className="text-xl font-bold text-[#f7f0df]">{condition.name}</h3>
            <p className="text-sm text-[#d8b35a]">{condition.sanskrit}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-[#f7f0df]/10 px-3 py-1 text-sm text-[#f7f0df]/50 hover:text-[#f7f0df]"
        >
          ✕ Close
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-400">Herbs</h4>
          <div className="flex flex-wrap gap-2">
            {condition.herbs.map((h) => (
              <span key={h} className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-[#f7f0df]">
                {h}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#d8b35a]">Formulation</h4>
          <p className="text-sm font-medium text-[#f7f0df]">{condition.formulation}</p>
          <p className="mt-1 text-xs text-[#f7f0df]/50">Consult an Ayurvedic physician before use</p>
        </div>

        <div className="rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fuchsia-400">Diet Protocol</h4>
          <p className="text-sm leading-relaxed text-[#f7f0df]/80">{condition.diet}</p>
        </div>

        <div className="rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">Yoga & Practices</h4>
          <p className="text-sm leading-relaxed text-[#f7f0df]/80">{condition.yoga}</p>
        </div>
      </div>
    </div>
  );
}

function HerbEncyclopedia() {
  const [search, setSearch] = useState("");
  const filtered = herbs.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.sanskrit.toLowerCase().includes(search.toLowerCase()) ||
      h.benefits.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#f7f0df]">Herb Encyclopedia</h2>
          <p className="text-sm text-[#f7f0df]/60">10 key Ayurvedic herbs and their applications</p>
        </div>
        <input
          type="text"
          placeholder="Search herbs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 px-4 py-2 text-sm text-[#f7f0df] placeholder-[#f7f0df]/30 outline-none focus:border-violet-500/50 sm:w-56"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f7f0df]/10">
              <th className="pb-3 text-left font-semibold text-[#d8b35a]">Herb</th>
              <th className="pb-3 text-left font-semibold text-[#d8b35a]">Sanskrit / Botanical</th>
              <th className="pb-3 text-left font-semibold text-[#d8b35a]">Key Benefits</th>
              <th className="pb-3 text-left font-semibold text-[#d8b35a]">Dosage</th>
              <th className="pb-3 text-left font-semibold text-[#d8b35a]">Caution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7f0df]/5">
            {filtered.map((herb) => (
              <tr key={herb.name} className="transition-colors hover:bg-[#f7f0df]/5">
                <td className="py-3 pr-4 font-medium text-[#f7f0df]">{herb.name}</td>
                <td className="py-3 pr-4 text-[#f7f0df]/50 italic">{herb.sanskrit}</td>
                <td className="py-3 pr-4 text-[#f7f0df]/70 max-w-[200px]">{herb.benefits}</td>
                <td className="py-3 pr-4 text-[#f7f0df]/70 max-w-[160px]">{herb.dosage}</td>
                <td className="py-3 text-amber-400/80 max-w-[160px]">{herb.caution}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#f7f0df]/30">
                  No herbs found for "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AyurvedaContent() {
  const [selectedCondition, setSelectedCondition] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-400">
            Ancient Wisdom
          </span>
          <span className="rounded-full bg-[#d8b35a]/20 px-3 py-1 text-xs font-medium text-[#d8b35a]">
            Modern Application
          </span>
        </div>
        <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#f7f0df]">
          Ayurveda Hub
        </h1>
        <p className="mt-2 max-w-2xl text-[#f7f0df]/60">
          Discover your constitution, explore Ayurvedic approaches to common conditions, and dive into the herb
          encyclopedia — all grounded in classical texts and modern research.
        </p>
      </div>

      <DoshaQuiz />

      <div>
        <h2 className="mb-4 text-xl font-bold text-[#f7f0df]">Conditions & Protocols</h2>
        <p className="mb-5 text-sm text-[#f7f0df]/60">
          Click any condition to view herbs, formulations, diet, and yoga recommendations.
        </p>

        {selectedCondition !== null && (
          <div className="mb-6">
            <ConditionDetail
              condition={conditions[selectedCondition]}
              onClose={() => setSelectedCondition(null)}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {conditions.map((c, i) => (
            <ConditionCard
              key={c.name}
              condition={c}
              onClick={() => setSelectedCondition(selectedCondition === i ? null : i)}
            />
          ))}
        </div>
      </div>

      <HerbEncyclopedia />

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <p className="text-xs text-amber-400/80">
          <strong>Disclaimer:</strong> This content is for educational purposes only. Ayurvedic recommendations
          should be personalized by a qualified Ayurvedic physician (Vaidya). Do not replace prescribed
          medications without consulting your doctor.
        </p>
      </div>
    </div>
  );
}

export function AyurvedaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <AyurvedaContent />
    </section>
  );
}

export default function AyurvedaHubPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "#07040d" }}>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <AyurvedaContent />
      </div>
    </div>
  );
}
