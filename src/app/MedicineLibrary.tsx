import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Medicine Library — an educational reference of common OTC          */
/* medicines and supplements. Every entry details WHAT it's for, HOW  */
/* to use it, WHEN to use it, and cautions. STRICTLY educational —    */
/* never a prescription or a substitute for a doctor/pharmacist.      */
/* No SVG.                                                            */
/* ---------------------------------------------------------------- */

type Cat = "Pain & Fever" | "Digestive" | "Cold & Allergy" | "Supplement" | "First Aid";

interface Med {
  id: string;
  name: string;
  aka?: string;
  category: Cat;
  icon: string;
  use: string;   // what it's for
  how: string;   // how to use
  when: string;  // when to use
  caution: string;
}

const MEDS: Med[] = [
  /* ===================== PAIN & FEVER ===================== */
  { id: "paracetamol", name: "Paracetamol", aka: "Acetaminophen", category: "Pain & Fever", icon: "🌡️", use: "Relieves mild-to-moderate pain and reduces fever; gentle on the stomach.", how: "Take the labeled dose with water; never exceed the daily maximum.", when: "For headaches, body aches, or fever, as needed within dosing limits.", caution: "Exceeding the daily limit can cause serious liver damage. Don't combine products that both contain it." },
  { id: "ibuprofen", name: "Ibuprofen", aka: "NSAID", category: "Pain & Fever", icon: "💊", use: "Reduces pain, inflammation, and fever.", how: "Take with food or milk to protect the stomach; use the lowest effective dose.", when: "For inflammatory pain, muscle soreness, headaches, or fever.", caution: "Can irritate the stomach and affect the kidneys; avoid with ulcers, kidney issues, or dehydration." },
  { id: "aspirin", name: "Aspirin", aka: "acetylsalicylic acid", category: "Pain & Fever", icon: "💊", use: "Relieves pain and fever; low doses medically thin the blood.", how: "Take with food; low-dose 'baby aspirin' only if prescribed.", when: "For occasional pain/fever in adults, or daily only if a doctor directs.", caution: "Increases bleeding and stomach irritation. Never give to children/teens (Reye's syndrome). Don't self-start daily aspirin." },
  { id: "pain-balm", name: "Topical Pain Relief", aka: "menthol/NSAID gel", category: "Pain & Fever", icon: "🧴", use: "Eases localized muscle and joint aches through the skin.", how: "Rub a thin layer onto the sore area; wash hands after.", when: "For local muscle/joint soreness; menthol balms for a soothing effect.", caution: "Don't use on broken skin or with a heating pad; avoid the eyes." },
  { id: "fever-care", name: "Fever Care Basics", category: "Pain & Fever", icon: "🤒", use: "Supportive care for fever — rest, fluids, and appropriate fever reducers.", how: "Rest, stay hydrated, and use paracetamol/ibuprofen if needed and suitable.", when: "During a fever to stay comfortable and hydrated.", caution: "Seek care for very high fever, stiff neck/rash, breathing trouble, fever lasting days — and promptly for infants." },

  /* ===================== DIGESTIVE ===================== */
  { id: "antacid", name: "Antacids", aka: "e.g. calcium carbonate", category: "Digestive", icon: "🔥", use: "Neutralizes stomach acid to relieve heartburn and acidity.", how: "Chew or dissolve tablets, or take liquid as labeled.", when: "After meals or at bedtime when heartburn strikes; short-term relief only.", caution: "Frequent heartburn needs a doctor's review. Can reduce absorption of other medicines — space them apart." },
  { id: "loperamide", name: "Loperamide", aka: "Anti-diarrheal", category: "Digestive", icon: "🚽", use: "Slows the gut to reduce short-term diarrhea.", how: "Take as labeled after loose stools; pair with ORS to stay hydrated.", when: "For short-term, uncomplicated diarrhea only.", caution: "Don't use with blood in stool or high fever. See a doctor if diarrhea lasts over 2 days." },
  { id: "laxative", name: "Laxatives", aka: "fiber/osmotic", category: "Digestive", icon: "🌾", use: "Relieve occasional constipation by softening stool or drawing in water.", how: "Take fiber/osmotic types with plenty of water; try diet and hydration first.", when: "For occasional constipation, short-term.", caution: "Not for routine long-term use — can cause dependence. Persistent constipation needs review." },
  { id: "rehydration", name: "Rehydration First Principle", category: "Digestive", icon: "💧", use: "For vomiting/diarrhea illness, replacing fluids and electrolytes is the priority.", how: "Sip ORS or electrolyte drink frequently in small amounts; reintroduce bland foods.", when: "During any illness with fluid loss.", caution: "Dehydration is the main danger, especially in children and older adults — seek care if fluids can't be kept down." },

  /* ===================== COLD & ALLERGY ===================== */
  { id: "cetirizine", name: "Cetirizine", aka: "Antihistamine", category: "Cold & Allergy", icon: "🤧", use: "Relieves allergy symptoms — sneezing, runny nose, itching, hives.", how: "Take once daily as labeled.", when: "During allergy flare-ups or hay-fever season.", caution: "May cause mild drowsiness in some; use care with other sedatives." },
  { id: "antihistamine-drowsy", name: "Diphenhydramine", aka: "sedating antihistamine", category: "Cold & Allergy", icon: "😴", use: "Relieves allergy symptoms; sometimes used for occasional sleeplessness.", how: "Take as labeled; expect marked drowsiness.", when: "For allergies or, occasionally, short-term sleep trouble.", caution: "Impairs alertness — don't drive. Not for regular sleep use or older adults without advice." },
  { id: "decongestant", name: "Nasal Decongestant Spray", aka: "e.g. xylometazoline", category: "Cold & Allergy", icon: "👃", use: "Temporarily relieves a blocked, stuffy nose.", how: "Spray into each nostril as labeled.", when: "For short-term nasal congestion during colds/allergies.", caution: "Don't use more than 3–5 days — rebound congestion can result. Not for young children without advice." },
  { id: "nasal-saline", name: "Saline Nasal Spray", category: "Cold & Allergy", icon: "💦", use: "Moisturizes and clears nasal passages; flushes allergens.", how: "Spray into the nostrils; safe for frequent use.", when: "For dryness, colds, or allergies, as often as needed.", caution: "Use clean/sterile solution. (Different from medicated decongestant sprays.)" },
  { id: "throat-lozenge", name: "Throat Lozenges", category: "Cold & Allergy", icon: "🍬", use: "Soothes a sore, scratchy throat.", how: "Dissolve slowly in the mouth as labeled.", when: "For temporary sore-throat relief.", caution: "A sore throat over a week, with high fever or trouble swallowing, needs review." },
  { id: "cough-syrup", name: "Cough Syrup", aka: "expectorant/suppressant", category: "Cold & Allergy", icon: "🍯", use: "Eases coughing — expectorants loosen mucus; suppressants calm a dry cough.", how: "Match the type to your cough; take the labeled dose.", when: "Productive cough → expectorant; dry cough → suppressant.", caution: "Not for young children without advice. Persistent cough over 3 weeks needs review. Avoid doubling shared ingredients." },
  { id: "cough-honey", name: "Honey for Cough", category: "Cold & Allergy", icon: "🍯", use: "A simple, evidence-supported soother for cough and sore throat.", how: "Take a spoonful plain or in warm water/tea.", when: "For a mild night-time cough in adults and older children.", caution: "NEVER give honey to infants under 1 year (botulism risk). Persistent cough needs review." },

  /* ===================== SUPPLEMENTS ===================== */
  { id: "vitamin-d", name: "Vitamin D3", category: "Supplement", icon: "☀️", use: "Supports bone health, immunity, and muscle function.", how: "Take with a meal containing fat (it's fat-soluble).", when: "Daily, especially with limited sun exposure or confirmed deficiency.", caution: "Very high doses over time can be harmful — test levels and dose with guidance." },
  { id: "omega3", name: "Omega-3 (Fish Oil)", category: "Supplement", icon: "🐟", use: "Supports heart, brain, and joint health; may reduce inflammation.", how: "Take with a meal; look for EPA/DHA content on the label.", when: "Daily, especially if fatty-fish intake is low.", caution: "High doses can thin the blood — consult if on blood thinners or before surgery." },
  { id: "creatine", name: "Creatine Monohydrate", category: "Supplement", icon: "⚡", use: "Improves strength, power, and recovery; the most researched sports supplement.", how: "Take 3–5 g daily, any time; no loading needed.", when: "Daily and consistently for training benefits.", caution: "Stay well hydrated. Those with kidney conditions should consult first." },
  { id: "multivitamin", name: "Multivitamin", category: "Supplement", icon: "💊", use: "Provides a broad base of vitamins and minerals to cover dietary gaps.", how: "Take one daily with food, matched to your age/sex.", when: "As a safety net alongside a varied diet.", caution: "Not a diet replacement. Avoid megadoses of fat-soluble vitamins (A, D, E, K)." },
  { id: "probiotic", name: "Probiotics", category: "Supplement", icon: "🦠", use: "Introduces beneficial bacteria to support gut health and digestion.", how: "Take as labeled; effects are strain-specific.", when: "After antibiotics or with certain digestive issues.", caution: "Evidence is mixed and condition-specific. Immunocompromised people should consult first." },
  { id: "magnesium", name: "Magnesium", category: "Supplement", icon: "🧲", use: "Supports muscle and nerve function, sleep, and may ease cramps.", how: "Glycinate or citrate forms absorb well; take with water.", when: "Evening often helps sleep; daily if intake is low.", caution: "High doses can cause diarrhea. Kidney problems → consult a doctor first." },
  { id: "zinc", name: "Zinc", category: "Supplement", icon: "⚙️", use: "Supports immunity and wound healing; may shorten colds taken early.", how: "Take with food to avoid nausea.", when: "Short-term at the onset of a cold, or if deficient.", caution: "Long-term high doses interfere with copper absorption — don't exceed recommendations." },
  { id: "melatonin", name: "Melatonin", category: "Supplement", icon: "🌙", use: "A sleep-timing hormone for jet lag and occasional sleep-onset trouble.", how: "Take a low dose (0.5–3 mg) about an hour before bed.", when: "For jet lag or shifting sleep timing, short-term.", caution: "Not for long-term nightly use without advice. Can cause grogginess — avoid before driving." },
  { id: "electrolytes", name: "Electrolyte Supplements", category: "Supplement", icon: "⚡", use: "Replace sodium, potassium, and minerals lost to sweating or illness.", how: "Mix as directed and sip during/after heavy losses.", when: "Endurance exercise, hot climates, or during illness.", caution: "Sodium-restricted diets or kidney/heart conditions → check with a doctor." },
  { id: "vitamin-c", name: "Vitamin C", category: "Supplement", icon: "🍊", use: "Supports immunity, collagen formation, and iron absorption.", how: "Best from food (citrus, peppers); supplement with water if needed.", when: "Daily; some take more at a cold's onset.", caution: "Very high doses can upset the stomach and, rarely, cause kidney stones." },
  { id: "calcium", name: "Calcium", category: "Supplement", icon: "🦴", use: "Supports bone and teeth health and muscle/nerve function.", how: "Take with vitamin D for absorption; food sources first.", when: "If dietary intake is low, as advised.", caution: "Excess supplements may affect the heart and cause stones. Prioritize food; supplement only if advised." },
  { id: "iron", name: "Iron", category: "Supplement", icon: "🩸", use: "Treats/prevents iron-deficiency anaemia; supports oxygen transport.", how: "Take with vitamin C to boost absorption; avoid tea/coffee near it.", when: "Only with confirmed deficiency, as advised.", caution: "Excess iron is harmful; keep away from children (overdose risk)." },
  { id: "vitamin-b12", name: "Vitamin B12", category: "Supplement", icon: "🔬", use: "Supports nerve function, red-blood-cell formation, and energy.", how: "Take as advised; sublingual or oral forms are common.", when: "For vegans, older adults, or confirmed deficiency.", caution: "Confirm deficiency with a blood test; water-soluble and generally safe." },
  { id: "vitamin-e", name: "Vitamin E", category: "Supplement", icon: "🌰", use: "A fat-soluble antioxidant supporting skin and cell protection.", how: "Best from nuts, seeds, and oils; supplement only if needed.", when: "Deficiency is rare — rarely needed with a normal diet.", caution: "High-dose supplements can increase bleeding risk, especially with blood thinners." },
  { id: "collagen", name: "Collagen Supplements", category: "Supplement", icon: "🧬", use: "Marketed for skin, joint, and connective-tissue support.", how: "Take powder in a drink; ensure overall protein and vitamin C are adequate.", when: "Optional daily; evidence is still developing.", caution: "Not a substitute for a protein-adequate diet; quality varies." },

  /* ===================== FIRST AID ===================== */
  { id: "ors", name: "ORS (Oral Rehydration Salts)", category: "First Aid", icon: "🧂", use: "Restores fluids and electrolytes lost to sweating, diarrhea, or vomiting.", how: "Mix one sachet with the exact amount of clean water; sip steadily.", when: "During illness with fluid loss or heavy sweating.", caution: "Never make it stronger than instructed. Seek care for severe dehydration." },
  { id: "ors-zinc", name: "Zinc + ORS (Diarrhea Care)", category: "First Aid", icon: "🧒", use: "The WHO-recommended combination for acute diarrhea, especially in children.", how: "Give ORS to rehydrate and zinc to reduce severity/duration; keep feeding.", when: "During acute diarrhea episodes.", caution: "Seek urgent care for severe dehydration, blood in stool, or persistent high fever." },
  { id: "antiseptic", name: "Antiseptic Cream", aka: "e.g. povidone-iodine", category: "First Aid", icon: "🩹", use: "Cleans and protects minor cuts, scrapes, and grazes.", how: "Clean the wound with water first, apply a thin layer, cover if needed.", when: "Right after a minor skin injury.", caution: "For deep/large/infected wounds, seek care. Watch for iodine allergy." },
  { id: "hydrocortisone", name: "Hydrocortisone Cream", aka: "topical steroid", category: "First Aid", icon: "🧴", use: "Relieves itching, redness, and inflammation from bites, rashes, eczema.", how: "Apply a thin layer to the affected area as directed.", when: "For short-term relief of mild skin irritation.", caution: "Avoid prolonged use, broken skin, or the face without advice. See a doctor if a rash spreads." },
  { id: "antifungal", name: "Antifungal Cream", aka: "e.g. clotrimazole", category: "First Aid", icon: "🍄", use: "Treats common fungal skin infections like athlete's foot and ringworm.", how: "Apply as directed; keep the area clean and dry; finish the full course.", when: "At the first signs of a fungal skin infection.", caution: "See a doctor if it doesn't improve in 2 weeks, spreads, or affects nails/scalp." },
  { id: "eye-drops", name: "Lubricating Eye Drops", aka: "artificial tears", category: "First Aid", icon: "👁️", use: "Relieve dry, tired, or irritated eyes from screens, allergies, or dryness.", how: "Instill drops as needed; preservative-free are gentler for frequent use.", when: "During screen strain, dryness, or mild irritation.", caution: "Persistent redness, eye pain, or vision changes need a doctor. Don't overuse redness-relief drops." },
  { id: "sunscreen", name: "Sunscreen", aka: "SPF 30+", category: "First Aid", icon: "🧴", use: "Protects skin from UV damage — burns, ageing, and skin-cancer risk.", how: "Apply generously; reapply every 2 hours outdoors and after swimming/sweating.", when: "Daily, and always before sun exposure.", caution: "Most people under-apply — use enough and reapply. A daily skin-health essential." },
  { id: "burn-gel", name: "Burn Gel / Aloe", category: "First Aid", icon: "🔥", use: "Cools and soothes minor first-degree burns and sunburn.", how: "Run the burn under cool water first, then apply a soothing gel.", when: "Immediately after a minor burn.", caution: "Never use ice, butter, or toothpaste. Seek care for large, blistering, or deep burns." },
  { id: "adhesive-bandage", name: "Adhesive Bandages & Dressings", category: "First Aid", icon: "🩹", use: "Cover and protect small cuts and grazes while they heal.", how: "Clean the wound, apply a bandage, and change it if wet or dirty.", when: "For minor wounds to keep them clean.", caution: "Watch for signs of infection (spreading redness, pus, increasing pain) — then see a doctor." },
  { id: "thermometer", name: "Using a Thermometer", category: "First Aid", icon: "🌡️", use: "Measures body temperature to track a fever accurately.", how: "Use a digital thermometer per instructions; note the reading and time.", when: "When someone feels feverish or unwell.", caution: "Fever over 39–40°C, in infants, or with worrying symptoms needs prompt medical attention." },
  { id: "potassium-note", name: "Reading Medicine Labels", category: "Supplement", icon: "🏷️", use: "Understanding labels prevents accidental overdose and interactions.", how: "Check the active ingredient, dose, max daily amount, and warnings before taking anything.", when: "Every time, especially with combination or new products.", caution: "Two products can share an ingredient (e.g. paracetamol) — never double up. Ask a pharmacist if unsure." },
  { id: "antihistamine-cream", name: "Anti-Itch Cream", aka: "e.g. calamine", category: "First Aid", icon: "🧴", use: "Soothes itching from insect bites, rashes, and mild skin irritation.", how: "Dab onto the itchy area; calamine lotion is cooling and drying.", when: "For bites, heat rash, or mild allergic skin reactions.", caution: "See a doctor for widespread rash, swelling, or signs of a serious allergic reaction." },
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
        <p className="text-sm text-[#2a1e16]/68">{MEDS.length} common medicines &amp; supplements — with what, how &amp; when to use each</p>
      </div>

      {/* Prominent disclaimer */}
      <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4">
        <p className="text-sm font-bold text-rose-600">⚕️ Educational information only</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#2a1e16]/70">This library does not diagnose, prescribe, or replace professional care. Always read the label, follow dosing instructions, and consult a doctor or pharmacist before taking any medicine — especially if pregnant, on other medications, or managing a health condition. In an emergency, seek immediate medical help.</p>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search medicines or symptoms…" className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-orange-200/40" />
        <div className="mt-3 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cat === c ? "bg-orange-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68 hover:text-[#2a1e16]"}`}>{c}</button>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOpen(null)}>
          <div className="glass-card w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdf9]/95 p-6" style={{ maxHeight: "88vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-orange-500/15 text-2xl">{open.icon}</span>
              <div>
                <h2 className="text-xl font-black">{open.name}</h2>
                {open.aka && <p className="text-[11px] text-[#2a1e16]/55">{open.aka}</p>}
              </div>
              <span className="ml-auto rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">{open.category}</span>
            </div>

            <div className="mt-4 space-y-3">
              {[
                { label: "What it's for", text: open.use, icon: "🎯", c: "#34d399" },
                { label: "How to use", text: open.how, icon: "🥄", c: "#ea580c" },
                { label: "When to use", text: open.when, icon: "⏰", c: "#38bdf8" },
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: row.c }}>{row.icon} {row.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#2a1e16]/80">{row.text}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-[12px] text-[#2a1e16]/78"><span className="font-bold text-rose-600">⚠️ Caution: </span>{open.caution}</p>
            <button type="button" onClick={() => setOpen(null)} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white">Close</button>
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((m) => (
          <button key={m.id} type="button" onClick={() => setOpen(m)} className="glass-card flex items-center gap-4 rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-orange-200/30">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-orange-500/15 text-2xl">{m.icon}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black leading-tight">{m.name}</h3>
                <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">{m.category}</span>
              </div>
              <p className="line-clamp-2 text-[13px] text-[#2a1e16]/62">{m.use}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
