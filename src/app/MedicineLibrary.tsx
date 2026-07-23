import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Medicine Library — an educational reference of common OTC          */
/* medicines and supplements: what they're used for, general notes,   */
/* and safety flags. STRICTLY educational — never a prescription or a  */
/* substitute for a doctor or pharmacist. No SVG.                     */
/* ---------------------------------------------------------------- */

interface Med {
  id: string;
  name: string;
  aka?: string;
  category: "Pain & Fever" | "Digestive" | "Cold & Allergy" | "Supplement" | "First Aid";
  icon: string;
  use: string;
  notes: string[];
  caution: string;
}

const MEDS: Med[] = [
  { id: "paracetamol", name: "Paracetamol", aka: "Acetaminophen", category: "Pain & Fever", icon: "🌡️", use: "Relieves mild-to-moderate pain and reduces fever.", notes: ["One of the most widely used fever/pain reducers.", "Gentler on the stomach than NSAIDs.", "Found in many combination cold medicines — avoid doubling up."], caution: "Exceeding the daily limit can cause serious liver damage. Never combine multiple products that both contain it." },
  { id: "ibuprofen", name: "Ibuprofen", aka: "NSAID", category: "Pain & Fever", icon: "💊", use: "Reduces pain, inflammation, and fever.", notes: ["Useful for muscle soreness, headaches, and inflammatory pain.", "Take with food to reduce stomach irritation."], caution: "Can irritate the stomach and affect kidneys; avoid if you have ulcers, kidney issues, or are dehydrated. Not for long-term use without guidance." },
  { id: "ors", name: "ORS (Oral Rehydration Salts)", category: "First Aid", icon: "🧂", use: "Restores fluids and electrolytes lost to sweating, diarrhea, or vomiting.", notes: ["Essential for rehydration during illness or heavy sweating.", "Mix exactly as directed on the sachet with clean water."], caution: "Do not make the solution stronger than instructed. Seek care for severe or prolonged dehydration." },
  { id: "antacid", name: "Antacids", aka: "e.g. calcium carbonate", category: "Digestive", icon: "🔥", use: "Neutralizes stomach acid to relieve heartburn and acidity.", notes: ["Fast, short-term relief for occasional acidity.", "Best taken after meals or at bedtime when symptoms strike."], caution: "Frequent or persistent heartburn needs a doctor's evaluation, not daily antacids. Can interfere with absorption of other medicines." },
  { id: "cetirizine", name: "Cetirizine", aka: "Antihistamine", category: "Cold & Allergy", icon: "🤧", use: "Relieves allergy symptoms — sneezing, runny nose, itching, hives.", notes: ["A 'non-drowsy' second-generation antihistamine (though some feel mild drowsiness).", "Once-daily dosing is typical."], caution: "May still impair alertness in some people. Consult a doctor for persistent allergies or before use with other sedatives." },
  { id: "loperamide", name: "Loperamide", aka: "Anti-diarrheal", category: "Digestive", icon: "🚽", use: "Slows the gut to reduce short-term diarrhea.", notes: ["For short-term symptomatic relief only.", "Pair with ORS to prevent dehydration."], caution: "Do not use if there's blood in stool or high fever. See a doctor if diarrhea lasts more than 2 days." },
  { id: "vitamin-d", name: "Vitamin D3", category: "Supplement", icon: "☀️", use: "Supports bone health, immunity, and muscle function.", notes: ["Deficiency is very common, especially with limited sun exposure.", "Fat-soluble — take with a meal containing fat."], caution: "Very high doses over time can be harmful. Test levels and dose with a doctor's guidance rather than megadosing." },
  { id: "omega3", name: "Omega-3 (Fish Oil)", category: "Supplement", icon: "🐟", use: "Supports heart, brain, and joint health; may reduce inflammation.", notes: ["EPA and DHA are the active components to look for on the label.", "Useful if dietary fatty-fish intake is low."], caution: "High doses can thin the blood — consult a doctor if you take blood thinners or before surgery." },
  { id: "creatine", name: "Creatine Monohydrate", category: "Supplement", icon: "⚡", use: "Improves strength, power, and muscle recovery in training.", notes: ["The most researched sports supplement — safe and effective for most.", "3–5 g daily; no need to 'load' unless you want faster saturation."], caution: "Stay well hydrated. Those with kidney conditions should consult a doctor first." },
  { id: "antiseptic", name: "Antiseptic Cream", aka: "e.g. povidone-iodine", category: "First Aid", icon: "🩹", use: "Cleans and protects minor cuts, scrapes, and grazes.", notes: ["Clean the wound with water first, then apply a thin layer.", "Cover with a clean dressing if needed."], caution: "For deep, large, or infected wounds, seek medical care. Watch for allergic reactions to iodine." },
  { id: "multivitamin", name: "Multivitamin", category: "Supplement", icon: "💊", use: "Provides a broad base of vitamins and minerals to cover dietary gaps.", notes: ["A convenient safety net, not a replacement for a varied diet.", "Choose one matched to your age and sex for appropriate levels."], caution: "More isn't better — avoid megadoses of fat-soluble vitamins (A, D, E, K), which can accumulate." },
  { id: "probiotic", name: "Probiotics", category: "Supplement", icon: "🦠", use: "Introduces beneficial bacteria to support gut health and digestion.", notes: ["May help after a course of antibiotics or with certain digestive issues.", "Strains and doses vary widely — effects are strain-specific."], caution: "Evidence is mixed and condition-specific. Those who are immunocompromised should consult a doctor first." },
  { id: "throat-lozenge", name: "Throat Lozenges", category: "Cold & Allergy", icon: "🍬", use: "Soothes a sore or scratchy throat and eases mild irritation.", notes: ["Provide temporary, symptomatic relief.", "Some contain a mild local anaesthetic or menthol."], caution: "A sore throat lasting more than a week, with high fever or difficulty swallowing, needs medical review." },
  { id: "cough-syrup", name: "Cough Syrup", aka: "expectorant/suppressant", category: "Cold & Allergy", icon: "🍯", use: "Eases coughing — expectorants loosen mucus; suppressants calm a dry cough.", notes: ["Match the type to your cough: productive (expectorant) vs dry (suppressant).", "Read labels to avoid doubling up on shared ingredients like paracetamol."], caution: "Not recommended for young children without medical advice. Persistent cough over 3 weeks needs evaluation." },
  { id: "hydrocortisone", name: "Hydrocortisone Cream", aka: "topical steroid", category: "First Aid", icon: "🧴", use: "Relieves itching, redness, and inflammation from bites, rashes, and eczema.", notes: ["Apply a thin layer to the affected area as directed.", "Low-strength versions are common for short-term skin irritation."], caution: "Avoid prolonged use, use on broken skin, or on the face without advice. See a doctor if a rash spreads or worsens." },
  { id: "magnesium", name: "Magnesium", category: "Supplement", icon: "🧲", use: "Supports muscle and nerve function, sleep, and may ease muscle cramps.", notes: ["Many people have suboptimal intake from diet alone.", "Glycinate and citrate forms are well absorbed; citrate can loosen stools."], caution: "High doses can cause diarrhea. Those with kidney problems should consult a doctor first." },
  { id: "zinc", name: "Zinc", category: "Supplement", icon: "⚙️", use: "Supports immune function, wound healing, and may shorten colds if taken early.", notes: ["Useful short-term at the onset of a cold.", "Take with food to avoid nausea."], caution: "Long-term high doses interfere with copper absorption. Don't exceed recommended amounts without guidance." },
  { id: "melatonin", name: "Melatonin", category: "Supplement", icon: "🌙", use: "A sleep-timing hormone used for jet lag and occasional sleep-onset trouble.", notes: ["Low doses (0.5–3 mg) taken before bed are typically sufficient.", "Best for shifting sleep timing, not a sedative."], caution: "Not intended for long-term nightly use without advice. Can cause grogginess; avoid before driving." },
  { id: "electrolytes", name: "Electrolyte Supplements", category: "First Aid", icon: "⚡", use: "Replace sodium, potassium, and other minerals lost through heavy sweating or illness.", notes: ["Useful for endurance exercise, hot climates, or during illness.", "Plain water alone can dilute electrolytes during heavy losses."], caution: "Those on sodium-restricted diets or with kidney/heart conditions should check with a doctor." },
  { id: "antihistamine-drowsy", name: "Diphenhydramine", aka: "sedating antihistamine", category: "Cold & Allergy", icon: "😴", use: "Relieves allergy symptoms and, due to drowsiness, is sometimes used for occasional sleeplessness.", notes: ["First-generation antihistamine — causes marked drowsiness.", "Effects and grogginess can linger into the next day."], caution: "Impairs alertness — don't drive. Not for regular sleep use or for older adults without advice." },
  { id: "laxative", name: "Laxatives", aka: "e.g. fiber/osmotic", category: "Digestive", icon: "🌾", use: "Relieve occasional constipation by softening stool or drawing in water.", notes: ["Fiber and osmotic types are gentler for occasional use.", "Hydration and dietary fiber should be the first approach."], caution: "Not for long-term routine use — can cause dependence. Persistent constipation needs medical review." },
  { id: "aspirin", name: "Aspirin", aka: "acetylsalicylic acid", category: "Pain & Fever", icon: "💊", use: "Relieves pain and fever; low doses are used medically to thin the blood.", notes: ["Also has anti-inflammatory effects.", "Low-dose 'baby aspirin' is prescribed for some heart-risk patients — only under medical advice."], caution: "Can irritate the stomach and increase bleeding. Not for children/teens (risk of Reye's syndrome). Don't start daily aspirin without a doctor." },
  { id: "vitamin-c", name: "Vitamin C", category: "Supplement", icon: "🍊", use: "Supports immune function, collagen formation, and iron absorption.", notes: ["Easily obtained from citrus, peppers, and many vegetables.", "May modestly shorten cold duration in some people."], caution: "Very high doses can cause stomach upset and, rarely, kidney stones. Whole-food sources are best." },
  { id: "calcium", name: "Calcium", category: "Supplement", icon: "🦴", use: "Supports bone and teeth health and muscle/nerve function.", notes: ["Dairy, leafy greens, and fortified foods are good dietary sources.", "Best absorbed alongside vitamin D."], caution: "Excess from supplements may affect the heart and cause kidney stones. Prioritize food sources; supplement only if advised." },
  { id: "iron", name: "Iron", category: "Supplement", icon: "🩸", use: "Treats and prevents iron-deficiency anaemia; supports oxygen transport.", notes: ["Menstruating women and plant-based eaters are more prone to deficiency.", "Vitamin C improves absorption; tea/coffee reduce it."], caution: "Only supplement with confirmed deficiency — excess iron is harmful. Keep away from children (overdose risk)." },
  { id: "nasal-saline", name: "Saline Nasal Spray", category: "Cold & Allergy", icon: "👃", use: "Moisturizes and clears the nasal passages during colds, allergies, or dryness.", notes: ["Drug-free and safe for frequent use.", "Helps flush allergens and thin mucus."], caution: "Use clean/sterile solution. Medicated decongestant sprays (different product) shouldn't be used more than a few days." },
  { id: "antifungal", name: "Antifungal Cream", aka: "e.g. clotrimazole", category: "First Aid", icon: "🍄", use: "Treats common fungal skin infections like athlete's foot and ringworm.", notes: ["Apply as directed and continue for the full course, even after symptoms clear.", "Keep the area clean and dry."], caution: "See a doctor if it doesn't improve in 2 weeks, spreads, or affects the nails/scalp." },
  { id: "vitamin-b12", name: "Vitamin B12", category: "Supplement", icon: "🔬", use: "Supports nerve function, red-blood-cell formation, and energy metabolism.", notes: ["Found mainly in animal foods — vegans and some older adults are at risk of deficiency.", "Deficiency can cause fatigue, tingling, and cognitive issues."], caution: "Confirm deficiency with a blood test; supplement as advised. Generally safe as it's water-soluble." },
  { id: "ors-zinc", name: "Zinc + ORS (Diarrhea Care)", category: "First Aid", icon: "🧒", use: "The WHO-recommended combination to manage acute diarrhea, especially in children.", notes: ["ORS rehydrates; zinc reduces severity and duration.", "Continue feeding during illness as tolerated."], caution: "Seek urgent care for signs of severe dehydration, blood in stool, or persistent high fever." },
  { id: "decongestant", name: "Nasal Decongestant", aka: "e.g. xylometazoline spray", category: "Cold & Allergy", icon: "👃", use: "Temporarily relieves a blocked, stuffy nose during colds or allergies.", notes: ["Works quickly to shrink swollen nasal tissue.", "Provides short-term symptomatic relief only."], caution: "Do NOT use medicated sprays more than 3–5 days — 'rebound congestion' can result. Not for young children without advice." },
  { id: "antdiarrheal-note", name: "Rehydration First Principle", category: "Digestive", icon: "💧", use: "For any vomiting or diarrhea illness, replacing fluids and electrolytes is the priority.", notes: ["Sip ORS or an electrolyte drink frequently in small amounts.", "Bland, easy foods can be reintroduced as tolerated."], caution: "Dehydration is the main danger, especially in children and older adults — seek care if you can't keep fluids down." },
  { id: "sunscreen", name: "Sunscreen", aka: "SPF 30+", category: "First Aid", icon: "🧴", use: "Protects skin from UV damage, reducing burns, ageing, and skin-cancer risk.", notes: ["Use broad-spectrum SPF 30 or higher; reapply every 2 hours outdoors.", "A daily skin-health essential, not just for the beach."], caution: "Apply generously — most people under-apply. Reapply after swimming or sweating." },
  { id: "pain-balm", name: "Topical Pain Relief (Balm/Gel)", aka: "e.g. menthol/NSAID gel", category: "Pain & Fever", icon: "🌡️", use: "Eases localized muscle and joint aches through the skin.", notes: ["Menthol balms give a soothing warm/cool sensation.", "Topical NSAID gels can relieve local joint/muscle pain with less systemic exposure."], caution: "Don't use on broken skin or with a heating pad. Wash hands after applying; avoid the eyes." },
  { id: "eye-drops", name: "Lubricating Eye Drops", aka: "artificial tears", category: "First Aid", icon: "👁️", use: "Relieve dry, tired, or irritated eyes from screens, allergies, or environment.", notes: ["Preservative-free drops are gentler for frequent use.", "Blink breaks and screen distance also help dry eyes."], caution: "Redness that persists, eye pain, or vision changes need a doctor. Medicated 'redness-relief' drops shouldn't be overused." },
  { id: "rehydration-note", name: "Fever Care Basics", category: "Pain & Fever", icon: "🤒", use: "General supportive care for fever — rest, fluids, and appropriate fever reducers.", notes: ["Rest and stay well hydrated.", "Paracetamol or ibuprofen can reduce discomfort if needed and appropriate."], caution: "Seek care for very high fever, fever with stiff neck/rash, difficulty breathing, or fever lasting several days — and promptly for infants." },
  { id: "vitamin-e", name: "Vitamin E", category: "Supplement", icon: "🌰", use: "A fat-soluble antioxidant supporting skin and cell protection.", notes: ["Found in nuts, seeds, and vegetable oils.", "Deficiency is rare with a normal diet."], caution: "High-dose supplements can increase bleeding risk, especially with blood thinners. Food sources are preferred." },
  { id: "collagen", name: "Collagen Supplements", category: "Supplement", icon: "🧬", use: "Marketed for skin, joint, and connective-tissue support.", notes: ["Some evidence for skin elasticity and joint comfort exists but is still developing.", "Adequate total protein and vitamin C matter more for collagen synthesis."], caution: "Not a substitute for a protein-adequate diet. Quality and dosing vary widely between products." },
  { id: "cough-honey", name: "Honey for Cough", category: "Cold & Allergy", icon: "🍯", use: "A simple, evidence-supported soother for cough and sore throat in adults and older children.", notes: ["A spoonful, plain or in warm water/tea, can ease a night-time cough.", "Often as effective as some OTC cough remedies for mild cases."], caution: "NEVER give honey to infants under 1 year (risk of infant botulism). Persistent cough needs review." },
];

const CATS = ["All", "Pain & Fever", "Digestive", "Cold & Allergy", "Supplement", "First Aid"] as const;

export default function MedicineLibraryPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Med | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEDS.filter((m) => (cat === "All" || m.category === cat) && (!q || m.name.toLowerCase().includes(q) || (m.aka ?? "").toLowerCase().includes(q) || m.use.toLowerCase().includes(q)));
  }, [cat, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Medicine Library</h1>
        <p className="text-sm text-[#f7f0df]/68">A plain-language reference to common medicines and supplements</p>
      </div>

      {/* Prominent disclaimer */}
      <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4">
        <p className="text-sm font-bold text-rose-200">⚕️ Educational information only</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#f7f0df]/70">This library does not diagnose, prescribe, or replace professional care. Always read the label, follow dosing instructions, and consult a doctor or pharmacist before taking any medicine — especially if pregnant, on other medications, or managing a health condition. In an emergency, seek immediate medical help.</p>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search medicines or symptoms…" className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
        <div className="mt-3 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cat === c ? "bg-violet-500 text-white" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/68 hover:text-[#f7f0df]"}`}>{c}</button>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOpen(null)}>
          <div className="glass-card w-full max-w-lg rounded-2xl bg-[#0b0714]/95 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-500/15 text-2xl">{open.icon}</span>
              <div>
                <h2 className="text-xl font-black">{open.name}</h2>
                {open.aka && <p className="text-[11px] text-[#f7f0df]/55">{open.aka}</p>}
              </div>
            </div>
            <p className="mt-4 text-sm text-[#f7f0df]/80"><span className="font-bold text-violet-200">Used for: </span>{open.use}</p>
            <ul className="mt-3 space-y-1.5">
              {open.notes.map((n, i) => <li key={i} className="flex gap-2 text-sm text-[#f7f0df]/72"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />{n}</li>)}
            </ul>
            <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-[11px] text-[#f7f0df]/75"><span className="font-bold text-rose-200">⚠️ Caution: </span>{open.caution}</p>
            <button type="button" onClick={() => setOpen(null)} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white">Close</button>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((m) => (
          <button key={m.id} type="button" onClick={() => setOpen(m)} className="glass-card flex items-center gap-4 rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-200/30">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-500/15 text-2xl">{m.icon}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black">{m.name}</h3>
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-violet-200">{m.category}</span>
              </div>
              <p className="line-clamp-2 text-sm text-[#f7f0df]/62">{m.use}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
