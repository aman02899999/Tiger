import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Education Library — a searchable knowledge base of fitness,        */
/* nutrition, and wellness articles organized by category. Each entry */
/* opens an in-place reader. Pure content, client-side. No SVG.       */
/* ---------------------------------------------------------------- */

interface Article {
  id: string;
  title: string;
  category: string;
  read: string; // read time
  summary: string;
  body: string[]; // paragraphs
  tag?: "Free" | "Gold" | "Platinum";
}

const ARTICLES: Article[] = [
  {
    id: "progressive-overload",
    title: "Progressive Overload: The #1 Rule of Growth",
    category: "Training",
    read: "4 min",
    tag: "Free",
    summary: "Why doing a little more over time is the engine behind every result.",
    body: [
      "Progressive overload means gradually increasing the demand on your muscles over time — more weight, more reps, more sets, better form, or less rest. Without it, your body has no reason to adapt.",
      "The simplest way to apply it: try to beat your last session by one rep or a small weight increase on your main lifts each week. Track it — memory lies, logs don't.",
      "Overload doesn't only mean adding plates. Slowing the tempo, improving range of motion, and shortening rest all increase difficulty while keeping the weight the same — useful when you can't add load safely.",
      "Progress isn't linear. Expect plateaus, deloads, and off weeks. The trend over months is what matters, not any single workout.",
    ],
  },
  {
    id: "protein-basics",
    title: "How Much Protein Do You Actually Need?",
    category: "Nutrition",
    read: "5 min",
    tag: "Free",
    summary: "Cutting through the noise on the most important macro for body composition.",
    body: [
      "For most people training regularly, 1.6–2.2 g of protein per kg of bodyweight per day is the evidence-based sweet spot for building and preserving muscle.",
      "Spread it across 3–4 meals of roughly 0.4 g/kg each to maximize the muscle-building signal throughout the day.",
      "Whole-food sources — eggs, dairy, chicken, fish, paneer, legumes, soy — should form the base. Powders are a convenience, not a requirement.",
      "In a fat-loss phase, protein becomes even more important: it preserves muscle, keeps you full, and has the highest thermic effect of any macro.",
    ],
  },
  {
    id: "sleep-performance",
    title: "Sleep: The Most Underrated Performance Enhancer",
    category: "Recovery",
    read: "4 min",
    tag: "Free",
    summary: "You build muscle and burn fat while you sleep — here's how to protect it.",
    body: [
      "Muscle repair, hormone regulation, and memory consolidation all peak during deep sleep. Chronically sleeping under 6 hours blunts recovery, raises hunger hormones, and lowers testosterone.",
      "Aim for 7–9 hours. Keep a consistent sleep and wake time — even on weekends — to stabilize your circadian rhythm.",
      "Cut caffeine 8–10 hours before bed, dim screens an hour out, and keep the room cool and dark. A 10-minute wind-down routine signals your body it's time to shut down.",
    ],
  },
  {
    id: "cardio-zones",
    title: "Zone 2 Cardio and Why Everyone Talks About It",
    category: "Cardio",
    read: "5 min",
    tag: "Gold",
    summary: "The low-intensity training that builds your aerobic engine.",
    body: [
      "Zone 2 is a comfortable, conversational pace — around 60–70% of your max heart rate. It trains your body to burn fat efficiently and builds the mitochondrial base that supports all other fitness.",
      "The magic is in the volume: 2–4 sessions of 30–60 minutes a week produces outsized improvements in endurance and metabolic health with minimal fatigue cost.",
      "Because it's low-stress, Zone 2 recovers fast — you can stack it alongside strength training without wrecking your legs for the next session.",
    ],
  },
  {
    id: "cutting-bulking",
    title: "Cutting vs Bulking: Choosing Your Phase",
    category: "Nutrition",
    read: "6 min",
    tag: "Gold",
    summary: "When to eat more, when to eat less, and how to do each without spinning your wheels.",
    body: [
      "A bulk is a controlled calorie surplus (~10–15% over maintenance) to build muscle. A cut is a deficit (~15–20% under) to lose fat while preserving muscle with high protein and training.",
      "Pick based on your starting point: if you're above ~20% body fat (men) or ~30% (women), start with a cut. Leaner than that and wanting size? Bulk.",
      "Aim for ~0.25–0.5 kg change per week in either direction. Faster than that and you're adding fat on a bulk or losing muscle on a cut.",
      "Don't ride the roller coaster. Run phases of 8–16 weeks, then a maintenance break, rather than switching every two weeks.",
    ],
  },
  {
    id: "mobility-longevity",
    title: "Mobility Training for Lifelong Movement",
    category: "Wellness",
    read: "4 min",
    tag: "Platinum",
    summary: "Why flexibility and joint control matter more as you age.",
    body: [
      "Mobility is strength through a full range of motion — not just passive flexibility. It keeps joints healthy, improves lifting depth, and protects against injury.",
      "Spend 5–10 minutes daily on the hips, thoracic spine, shoulders, and ankles — the four areas that stiffen most from sitting.",
      "Loaded stretching (like deep goblet squats or controlled dumbbell pullovers) builds mobility that actually carries over to your training and daily life.",
    ],
  },
  {
    id: "stress-cortisol",
    title: "Stress, Cortisol, and Your Results",
    category: "Wellness",
    read: "5 min",
    tag: "Platinum",
    summary: "How chronic stress quietly sabotages fat loss and recovery.",
    body: [
      "Cortisol isn't the enemy — it's a normal hormone that helps you wake up and handle challenges. Problems arise when it stays elevated from chronic stress and poor sleep.",
      "Persistent high cortisol can increase cravings, promote abdominal fat storage, and impair recovery from training.",
      "Manage it with the basics: sleep, Zone 2 cardio, breathing practice, time outdoors, and not stacking a brutal training program on top of a stressful life season.",
    ],
  },
];

const CATEGORIES = ["All", "Training", "Nutrition", "Cardio", "Recovery", "Wellness"];

const TAG_COLOR: Record<string, string> = { Free: "#34d399", Gold: "#d8b35a", Platinum: "#e879f9" };

export default function EducationLibraryPage() {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Article | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARTICLES.filter((a) => (cat === "All" || a.category === cat) && (!q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)));
  }, [cat, query]);

  if (open) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-bold text-violet-200 hover:text-violet-100">← Back to library</button>
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-violet-200">{open.category}</span>
            <span className="text-[11px] text-[#f7f0df]/55">{open.read} read</span>
            {open.tag && <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]" style={{ background: `${TAG_COLOR[open.tag]}22`, color: TAG_COLOR[open.tag] }}>{open.tag}</span>}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em]">{open.title}</h1>
          <div className="mt-5 space-y-4">
            {open.body.map((p, i) => <p key={i} className="text-sm leading-relaxed text-[#f7f0df]/80">{p}</p>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Education Library</h1>
        <p className="text-sm text-[#f7f0df]/68">Evidence-based knowledge on training, nutrition, and wellness</p>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search articles…" className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cat === c ? "bg-violet-500 text-white" : "border border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/68 hover:text-[#f7f0df]"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((a) => (
          <button key={a.id} type="button" onClick={() => setOpen(a)} className="glass-card rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-200/30">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-violet-200">{a.category}</span>
              <span className="text-[11px] text-[#f7f0df]/55">{a.read}</span>
              {a.tag && <span className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]" style={{ background: `${TAG_COLOR[a.tag]}22`, color: TAG_COLOR[a.tag] }}>{a.tag}</span>}
            </div>
            <h3 className="mt-3 text-lg font-black leading-tight">{a.title}</h3>
            <p className="mt-1.5 text-sm text-[#f7f0df]/62">{a.summary}</p>
            <p className="mt-3 text-xs font-bold text-violet-200">Read article →</p>
          </button>
        ))}
        {filtered.length === 0 && <p className="glass-card rounded-2xl p-8 text-center text-sm text-[#f7f0df]/60">No articles match your search.</p>}
      </div>
    </div>
  );
}
