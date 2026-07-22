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
