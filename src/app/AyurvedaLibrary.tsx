import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Ayurveda Library — an educational knowledge base of doshas, herbs, */
/* daily routines (dinacharya) and common remedies. Reference only,   */
/* not medical advice. Client-side content. No SVG.                   */
/* ---------------------------------------------------------------- */

interface Entry {
  id: string;
  name: string;
  category: "Dosha" | "Herb" | "Routine" | "Remedy";
  icon: string;
  tagline: string;
  body: string[];
}

const ENTRIES: Entry[] = [
  // Doshas
  { id: "vata", name: "Vata", category: "Dosha", icon: "🌬️", tagline: "Air & ether — movement and creativity", body: [
    "Vata governs movement — breath, circulation, nerve impulses, and elimination. When balanced it brings creativity, energy, and flexibility.",
    "Signs of imbalance: dry skin, anxiety, restlessness, bloating, and irregular digestion.",
    "To pacify Vata: favor warm, moist, grounding foods; keep a regular routine; practice calming activities; and stay warm.",
  ] },
  { id: "pitta", name: "Pitta", category: "Dosha", icon: "🔥", tagline: "Fire & water — metabolism and focus", body: [
    "Pitta governs transformation — digestion, metabolism, and body temperature. Balanced Pitta brings sharp intellect, courage, and strong digestion.",
    "Signs of imbalance: irritability, acidity, inflammation, skin rashes, and overheating.",
    "To pacify Pitta: favor cooling, sweet, and bitter foods; avoid excess heat, spice, and skipping meals; and make time for leisure.",
  ] },
  { id: "kapha", name: "Kapha", category: "Dosha", icon: "🌱", tagline: "Earth & water — structure and calm", body: [
    "Kapha governs structure and lubrication — bones, joints, and immunity. Balanced Kapha brings strength, stamina, calm, and loyalty.",
    "Signs of imbalance: weight gain, lethargy, congestion, and attachment.",
    "To pacify Kapha: favor light, warm, spiced foods; stay active; embrace variety and stimulation; and rise early.",
  ] },
  // Herbs
  { id: "ashwagandha", name: "Ashwagandha", category: "Herb", icon: "🌿", tagline: "Adaptogen for stress & strength", body: [
    "One of Ayurveda's most prized adaptogens, traditionally used to build strength (bala), reduce stress, and support restful sleep.",
    "Modern research links it to reduced cortisol and improved measures of strength and recovery in some studies.",
    "Commonly taken as a root powder or standardized extract. Consult a professional before use, especially if pregnant or on medication.",
  ] },
  { id: "triphala", name: "Triphala", category: "Herb", icon: "🍂", tagline: "Three-fruit digestive tonic", body: [
    "A blend of three fruits — Amalaki, Bibhitaki, and Haritaki — used to support digestion, elimination, and gentle detoxification.",
    "Traditionally taken at night with warm water to support regularity and gut health.",
    "Rich in vitamin C and antioxidants. Start with a small dose to assess tolerance.",
  ] },
  { id: "turmeric", name: "Turmeric (Haldi)", category: "Herb", icon: "🟡", tagline: "Golden anti-inflammatory spice", body: [
    "Turmeric's active compound, curcumin, is valued for its anti-inflammatory and antioxidant properties.",
    "Absorption improves dramatically when paired with black pepper (piperine) and a source of fat.",
    "Used in golden milk (haldi doodh), curries, and as a paste for skin. A staple of daily Ayurvedic wellness.",
  ] },
  { id: "tulsi", name: "Tulsi (Holy Basil)", category: "Herb", icon: "🍃", tagline: "The 'queen of herbs'", body: [
    "Tulsi is revered as an adaptogen that supports the respiratory system, immunity, and stress resilience.",
    "Commonly taken as a tea or fresh leaves. Traditionally grown in homes across India.",
    "Gentle enough for daily use; often combined with ginger and honey for coughs and colds.",
  ] },
  { id: "brahmi", name: "Brahmi (Bacopa)", category: "Herb", icon: "🧠", tagline: "The brain and memory tonic", body: [
    "Brahmi is traditionally used to support memory, concentration, and mental clarity — a classic 'medhya rasayana' (brain rejuvenator).",
    "Modern research has explored Bacopa for cognitive support and stress, though effects build gradually over weeks.",
    "Often taken as a powder, tea, or infused oil for scalp massage. Consult a professional before use.",
  ] },
  { id: "shatavari", name: "Shatavari", category: "Herb", icon: "🌸", tagline: "Women's reproductive tonic", body: [
    "Shatavari is regarded as a premier rejuvenating herb for women, traditionally supporting hormonal balance, fertility, and lactation.",
    "Its name translates roughly to 'she who possesses a hundred husbands', reflecting its reputation as a vitality tonic.",
    "Usually taken as a root powder with warm milk. Seek professional guidance, especially during pregnancy.",
  ] },
  { id: "giloy", name: "Giloy (Guduchi)", category: "Herb", icon: "🌿", tagline: "Immunity and detox creeper", body: [
    "Giloy is traditionally called 'Amrita' (nectar of immortality) and used to support immunity, fever recovery, and detoxification.",
    "Commonly taken as a juice, powder, or decoction, particularly during seasonal illness.",
    "Valued as a general 'rasayana' (rejuvenator). Consult a practitioner, especially with autoimmune conditions.",
  ] },
  { id: "amla", name: "Amla (Indian Gooseberry)", category: "Herb", icon: "🫐", tagline: "Vitamin-C powerhouse", body: [
    "Amla is one of the richest natural sources of vitamin C and a key ingredient in many Ayurvedic tonics, including Chyawanprash.",
    "Traditionally used to support immunity, digestion, hair, and skin, and to balance all three doshas.",
    "Consumed fresh, as juice, powder, or in preserves. A gentle, everyday rejuvenator.",
  ] },
  { id: "ginger", name: "Ginger (Adrak/Sunthi)", category: "Herb", icon: "🫚", tagline: "The universal digestive", body: [
    "Ginger is prized for kindling Agni (digestive fire), easing nausea, and warming the body.",
    "Fresh ginger tea before meals is a classic remedy to stimulate appetite and digestion.",
    "Dried ginger (sunthi) is considered even more warming and is used in many formulations.",
  ] },
  { id: "methi", name: "Fenugreek (Methi)", category: "Herb", icon: "🌱", tagline: "Metabolic and digestive seed", body: [
    "Fenugreek seeds are traditionally used to support digestion, blood-sugar balance, and lactation.",
    "Soaking seeds overnight and drinking the water in the morning is a common folk practice.",
    "Also used in cooking and as a paste for hair. Consult a professional if managing blood sugar with medication.",
  ] },
  // Routines
  { id: "dinacharya", name: "Dinacharya (Daily Routine)", category: "Routine", icon: "🌅", tagline: "Align your day with nature's rhythm", body: [
    "Dinacharya is the Ayurvedic daily routine designed to sync your body with natural cycles for better health.",
    "Key practices: wake before sunrise, scrape the tongue, drink warm water, practice oil pulling, move the body, and eat the largest meal at midday when digestion (Agni) is strongest.",
    "Consistency matters more than perfection — even adopting two or three habits builds momentum.",
  ] },
  { id: "abhyanga", name: "Abhyanga (Self-Massage)", category: "Routine", icon: "🫒", tagline: "Daily warm-oil massage", body: [
    "Abhyanga is a self-massage with warm oil (often sesame for Vata, coconut for Pitta) before bathing.",
    "It's said to nourish the tissues, calm the nervous system, improve circulation, and support the skin.",
    "Spend 5–10 minutes working from the extremities toward the heart, then let the oil absorb before a warm shower.",
  ] },
  // Remedies
  { id: "golden-milk", name: "Golden Milk (Haldi Doodh)", category: "Remedy", icon: "🥛", tagline: "Soothing bedtime tonic", body: [
    "Warm milk (or a plant alternative) simmered with turmeric, a pinch of black pepper, ginger, and a touch of honey.",
    "Traditionally used to support recovery, ease joint discomfort, and promote restful sleep.",
    "A comforting daily ritual — especially in cold weather or after intense training.",
  ] },
  { id: "cumin-water", name: "Jeera (Cumin) Water", category: "Remedy", icon: "💧", tagline: "Digestive morning drink", body: [
    "Cumin seeds soaked overnight or boiled in water, taken warm in the morning.",
    "A traditional aid for digestion, bloating, and gentle metabolic support.",
    "Often combined with coriander and fennel (CCF tea) as a soothing digestive blend.",
  ] },
  { id: "neem", name: "Neem", category: "Herb", icon: "🌳", tagline: "The bitter purifier", body: [
    "Neem is traditionally used to support skin health, blood purification, and oral hygiene.",
    "Its intensely bitter taste is considered cooling and cleansing, pacifying Pitta and Kapha.",
    "Used as leaves, oil, powder, and in toothpastes. Powerful — use in moderation and with guidance.",
  ] },
  { id: "licorice", name: "Mulethi (Licorice)", category: "Herb", icon: "🪵", tagline: "Soothing throat and gut herb", body: [
    "Licorice root is traditionally used to soothe the throat, support the respiratory tract, and calm the digestive lining.",
    "Often taken as a tea or chewed root for coughs and hoarseness.",
    "Not suitable for everyone — can affect blood pressure with prolonged use. Consult a professional.",
  ] },
  { id: "cardamom", name: "Elaichi (Cardamom)", category: "Herb", icon: "🫛", tagline: "Aromatic digestive spice", body: [
    "Cardamom is prized for freshening breath, supporting digestion, and easing bloating.",
    "Added to teas (like masala chai) and sweets, it balances all three doshas in moderation.",
    "A pinch after meals is a traditional digestive aid.",
  ] },
  { id: "oil-pulling", name: "Oil Pulling (Gandusha)", category: "Routine", icon: "🥥", tagline: "Traditional oral cleanse", body: [
    "Swishing a tablespoon of oil (usually sesame or coconut) in the mouth for several minutes, then spitting it out.",
    "Traditionally used to support oral hygiene, fresh breath, and gum health.",
    "Best done in the morning before eating. Never swallow the oil.",
  ] },
  { id: "ccf-tea", name: "CCF Tea", category: "Remedy", icon: "🍵", tagline: "Cumin-coriander-fennel digestive", body: [
    "A gentle tea of equal parts cumin, coriander, and fennel seeds simmered in water.",
    "A classic Ayurvedic remedy to support digestion, reduce bloating, and gently detoxify.",
    "Soothing enough to sip throughout the day; suitable for most constitutions.",
  ] },
  { id: "moringa", name: "Moringa (Drumstick)", category: "Herb", icon: "🌿", tagline: "The nutrient-dense 'miracle tree'", body: [
    "Moringa leaves are exceptionally rich in vitamins, minerals, and antioxidants.",
    "Traditionally used to support energy, immunity, and overall nourishment.",
    "Taken as a powder in smoothies, or the leaves and pods cooked in food.",
  ] },
  { id: "guggul", name: "Guggul", category: "Herb", icon: "🪔", tagline: "Traditional metabolic resin", body: [
    "Guggul is a resin traditionally used to support healthy metabolism, joints, and lipid balance.",
    "A key ingredient in many classical Ayurvedic formulations.",
    "Potent — should be used under professional guidance, especially with thyroid or heart conditions.",
  ] },
  { id: "gotu-kola", name: "Gotu Kola (Brahmi Manduki)", category: "Herb", icon: "☘️", tagline: "Herb of mental clarity & skin", body: [
    "Gotu Kola is traditionally used to support cognition, calm, wound healing, and skin health.",
    "Sometimes confused with Brahmi (Bacopa); both are valued as 'medhya' brain tonics.",
    "Taken as a tea, powder, or fresh leaves.",
  ] },
  { id: "tongue-scraping", name: "Tongue Scraping (Jihwa Prakshalana)", category: "Routine", icon: "👅", tagline: "Morning oral cleanse", body: [
    "Gently scraping the tongue from back to front with a metal or copper scraper each morning.",
    "Traditionally used to remove 'ama' (toxins/coating), freshen breath, and stimulate digestion.",
    "A quick, simple daily habit done before eating or drinking.",
  ] },
  { id: "warm-water", name: "Warm Water Ritual (Ushapan)", category: "Routine", icon: "🚰", tagline: "First-thing-morning hydration", body: [
    "Drinking a glass of warm water (sometimes with lemon) upon waking.",
    "Traditionally used to stimulate digestion, support elimination, and gently cleanse.",
    "One of the simplest and most accessible Ayurvedic daily practices.",
  ] },
  { id: "ginger-honey", name: "Ginger-Honey-Tulsi Remedy", category: "Remedy", icon: "🍯", tagline: "Classic cold & cough soother", body: [
    "Fresh ginger juice with honey and crushed tulsi leaves, taken warm.",
    "A traditional home remedy to soothe coughs, sore throats, and seasonal congestion.",
    "Avoid giving honey to infants under one year.",
  ] },
  { id: "manjistha", name: "Manjistha", category: "Herb", icon: "🔴", tagline: "Blood and lymph purifier", body: [
    "Manjistha is traditionally regarded as one of the best herbs for purifying the blood and supporting the lymphatic system and skin.",
    "Used for a clear complexion and healthy circulation in classical formulations.",
    "Taken as a powder or in blends. Consult a practitioner for use.",
  ] },
  { id: "arjuna", name: "Arjuna", category: "Herb", icon: "🌲", tagline: "The heart tonic bark", body: [
    "The bark of the Arjuna tree is traditionally used to support heart health and healthy circulation.",
    "A prized cardiac tonic in Ayurveda, often taken as a decoction or powder.",
    "Consult a professional, especially if managing a heart condition or on medication.",
  ] },
  { id: "fennel", name: "Saunf (Fennel)", category: "Herb", icon: "🌿", tagline: "After-meal digestive seed", body: [
    "Fennel seeds are chewed after meals across India to freshen breath and aid digestion.",
    "Considered cooling, they help ease bloating and support Pitta balance.",
    "Also brewed as a gentle, soothing tea.",
  ] },
  { id: "chyawanprash", name: "Chyawanprash", category: "Remedy", icon: "🍯", tagline: "Classic rejuvenating jam", body: [
    "A traditional herbal jam built around Amla and dozens of herbs and spices.",
    "Used as a daily 'rasayana' to support immunity, energy, and overall vitality.",
    "Commonly taken a spoonful in the morning, often with warm milk.",
  ] },
  { id: "seasonal-eating", name: "Ritucharya (Seasonal Routine)", category: "Routine", icon: "🍂", tagline: "Eat and live with the seasons", body: [
    "Ritucharya is the Ayurvedic practice of adjusting diet and lifestyle to the changing seasons.",
    "Cooling foods in summer, warming and nourishing foods in winter, and light cleansing in spring.",
    "Aligning with seasonal rhythms is thought to prevent the dosha imbalances each season provokes.",
  ] },
  { id: "meditation-ayur", name: "Dhyana (Meditation in Ayurveda)", category: "Routine", icon: "🧘", tagline: "Daily mental hygiene", body: [
    "Ayurveda considers a calm mind essential to health, and daily meditation part of a balanced routine.",
    "Even a few minutes of stillness is thought to steady the doshas and support digestion and sleep.",
    "Traditionally practiced in the quiet hours of early morning or dusk.",
  ] },
];

const CATS = ["All", "Dosha", "Herb", "Routine", "Remedy"] as const;

export default function AyurvedaLibraryPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Entry | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ENTRIES.filter((e) => (cat === "All" || e.category === cat) && (!q || e.name.toLowerCase().includes(q) || e.tagline.toLowerCase().includes(q)));
  }, [cat, query]);

  if (open) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-emerald-200 hover:text-emerald-100">← Back to library</button>
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{open.icon}</span>
            <div>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-200">{open.category}</span>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">{open.name}</h1>
            </div>
          </div>
          <p className="mt-3 text-sm italic text-[#f7f0df]/65">{open.tagline}</p>
          <div className="mt-5 space-y-4">
            {open.body.map((p, i) => <p key={i} className="text-sm leading-relaxed text-[#f7f0df]/80">{p}</p>)}
          </div>
          <p className="mt-6 rounded-xl border border-[#d8b35a]/20 bg-[#d8b35a]/8 p-3 text-[11px] text-[#f7f0df]/62">⚠️ Educational content rooted in traditional Ayurveda — not a substitute for professional medical advice. Consult a qualified practitioner before starting any herb or remedy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Ayurveda Library</h1>
        <p className="text-sm text-[#f7f0df]/68">Doshas, herbs, routines and remedies from India's 5,000-year wellness tradition</p>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search herbs, doshas, remedies…" className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-emerald-200/40" />
        <div className="mt-3 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cat === c ? "bg-emerald-500 text-white" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/68 hover:text-[#f7f0df]"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((e) => (
          <button key={e.id} type="button" onClick={() => setOpen(e)} className="glass-card flex items-center gap-4 rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-200/30">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-2xl">{e.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black">{e.name}</h3>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-emerald-200">{e.category}</span>
              </div>
              <p className="text-sm text-[#f7f0df]/62">{e.tagline}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-[11px] text-[#f7f0df]/55">Educational reference only — always consult a qualified practitioner before using herbs or remedies.</p>
    </div>
  );
}
