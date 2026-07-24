import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Nutrition Hub — Recipe library (Indian, high-protein) + an        */
/* Intermittent-Fasting timer + a grocery list you can tick off.     */
/* Persists per user in localStorage. No SVG.                        */
/* ---------------------------------------------------------------- */

const IMG = (id: string) => `https://images.unsplash.com/${id}?w=700&q=80&auto=format&fit=crop`;

interface Recipe {
  id: string;
  name: string;
  tag: "Veg" | "Non-Veg" | "Vegan";
  kcal: number; p: number; c: number; f: number;
  time: string;
  photo: string;
  ingredients: string[];
  steps: string[];
}

const RECIPES: Recipe[] = [
  {
    id: "paneer-bhurji", name: "High-Protein Paneer Bhurji", tag: "Veg", kcal: 320, p: 24, c: 8, f: 22, time: "15 min",
    photo: IMG("photo-1631452180519-c014fe946bc7"),
    ingredients: ["200g paneer, crumbled", "1 onion, chopped", "1 tomato, chopped", "1 tsp ginger-garlic paste", "1 tsp oil", "Turmeric, chilli, salt", "Coriander to garnish"],
    steps: ["Heat oil, sauté onion until soft.", "Add ginger-garlic paste, cook 1 min.", "Add tomato + spices, cook till mushy.", "Add crumbled paneer, toss 3–4 min.", "Garnish with coriander and serve hot."],
  },
  {
    id: "chicken-tikka", name: "Grilled Chicken Tikka", tag: "Non-Veg", kcal: 280, p: 38, c: 6, f: 10, time: "30 min",
    photo: IMG("photo-1610057099431-d73a1c9d2f2f"),
    ingredients: ["250g chicken breast, cubed", "3 tbsp Greek yogurt", "1 tbsp tikka masala", "1 tsp ginger-garlic paste", "1 tsp lemon juice", "Salt to taste"],
    steps: ["Mix yogurt, masala, ginger-garlic, lemon, salt.", "Coat chicken, marinate 20+ min.", "Thread on skewers.", "Grill/air-fry 200°C for 12–15 min, turning once.", "Rest 2 min, serve with mint chutney."],
  },
  {
    id: "moong-chilla", name: "Moong Dal Chilla", tag: "Vegan", kcal: 210, p: 14, c: 30, f: 4, time: "20 min",
    photo: IMG("photo-1626074353765-517a681e40be"),
    ingredients: ["1 cup moong dal, soaked", "1 green chilli", "1 inch ginger", "Coriander, salt", "1 tsp oil for cooking"],
    steps: ["Blend soaked dal with chilli, ginger, salt into a batter.", "Stir in chopped coriander.", "Heat a non-stick pan, spread a ladle of batter thin.", "Cook 2 min each side with a little oil.", "Serve with chutney."],
  },
  {
    id: "egg-oats", name: "Savory Egg Oats", tag: "Veg", kcal: 300, p: 22, c: 30, f: 10, time: "10 min",
    photo: IMG("photo-1517673400267-0251440c45dc"),
    ingredients: ["40g oats", "2 eggs", "1 cup water/milk", "Onion, tomato, chilli", "Turmeric, salt, pepper"],
    steps: ["Cook oats in water till soft.", "In another pan, scramble eggs with veg + spices.", "Fold eggs into oats.", "Season and serve warm."],
  },
  {
    id: "rajma-bowl", name: "Rajma Protein Bowl", tag: "Vegan", kcal: 380, p: 18, c: 55, f: 6, time: "25 min",
    photo: IMG("photo-1585937421612-70a008356fbe"),
    ingredients: ["1 cup cooked rajma", "½ cup brown rice", "Onion-tomato masala", "Cumin, garam masala", "Salt, coriander"],
    steps: ["Prepare onion-tomato masala with spices.", "Add cooked rajma, simmer 10 min.", "Serve over brown rice.", "Top with fresh coriander and a squeeze of lemon."],
  },
  {
    id: "fish-curry", name: "Light Fish Curry", tag: "Non-Veg", kcal: 260, p: 30, c: 8, f: 12, time: "25 min",
    photo: IMG("photo-1626508035297-0cd27c397d67"),
    ingredients: ["250g rohu/basa", "1 cup coconut milk (light)", "Curry leaves, mustard seeds", "Turmeric, chilli", "Tamarind, salt"],
    steps: ["Temper mustard seeds + curry leaves.", "Add spices and a splash of water, cook 2 min.", "Add coconut milk + tamarind, simmer.", "Slide in fish, cook 8–10 min gently.", "Serve with rice."],
  },
];

const IF_PLANS = [
  { id: "16-8", label: "16:8", fast: 16, tagline: "Most popular — 8-hour eating window" },
  { id: "18-6", label: "18:6", fast: 18, tagline: "Advanced — tighter window, more fat-loss" },
  { id: "14-10", label: "14:10", fast: 14, tagline: "Beginner-friendly" },
];

function RecipePhoto({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [fail, setFail] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-orange-950 to-amber-950 ${className}`}>
      {!fail && <img src={src} alt={alt} loading="lazy" onError={() => setFail(true)} className="h-full w-full object-cover" />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#fffdf9]/70 to-transparent" />
    </div>
  );
}

/* ===== Intermittent-fasting timer =============================== */
function FastingTimer() {
  const { user } = useAuth();
  const storeKey = `tfp_fast_${user?.email ?? "guest"}`;
  const [plan, setPlan] = useState(IF_PLANS[0]);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => nowMs());
  const rewarded = useRef(false);

  function nowMs() { return new Date().getTime(); }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) ?? "null");
      if (saved?.startAt) { setStartAt(saved.startAt); setPlan(IF_PLANS.find((p) => p.id === saved.planId) ?? IF_PLANS[0]); }
    } catch { /* ignore */ }
  }, [storeKey]);

  useEffect(() => {
    if (!startAt) return;
    const t = setInterval(() => setNow(nowMs()), 1000);
    return () => clearInterval(t);
  }, [startAt]);

  function toggle() {
    if (startAt) {
      setStartAt(null);
      try { localStorage.removeItem(storeKey); } catch { /* ignore */ }
      rewarded.current = false;
    } else {
      const s = nowMs();
      setStartAt(s);
      try { localStorage.setItem(storeKey, JSON.stringify({ startAt: s, planId: plan.id })); } catch { /* ignore */ }
    }
  }

  const elapsedH = startAt ? (now - startAt) / 3600000 : 0;
  const pct = Math.min(1, elapsedH / plan.fast);
  const done = elapsedH >= plan.fast;
  useEffect(() => { if (done && !rewarded.current) { rewarded.current = true; addXP(user?.email, 15); } }, [done, user]);

  const remainH = Math.max(0, plan.fast - elapsedH);
  const hh = Math.floor(remainH);
  const mm = Math.floor((remainH - hh) * 60);

  return (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">⏳ Fasting Timer</p>
      <h2 className="mt-1 text-xl font-black">Track your fasting window</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {IF_PLANS.map((p) => (
          <button key={p.id} type="button" disabled={!!startAt} onClick={() => setPlan(p)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${plan.id === p.id ? "bg-sky-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68"} ${startAt ? "opacity-50" : ""}`}>{p.label}</button>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#2a1e16]/62">{plan.tagline}</p>

      <div className="mt-5 flex items-center gap-6">
        <div className="relative h-28 w-28 shrink-0">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${done ? "#34d399" : "#38bdf8"} ${pct * 360}deg, rgba(247,240,223,0.1) ${pct * 360}deg)`, transition: "background 0.9s linear" }} />
          <div className="absolute inset-[8px] grid place-items-center rounded-full bg-[#fffdf9] text-center">
            <div>
              <p className="text-lg font-black tabular-nums">{startAt ? (done ? "Done!" : `${hh}:${String(mm).padStart(2, "0")}`) : plan.label}</p>
              <p className="text-[9px] uppercase tracking-[0.14em] text-[#2a1e16]/62">{startAt ? (done ? "complete" : "left") : "ready"}</p>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-[#2a1e16]/75">{startAt ? (done ? "🎉 Fast complete! +15 XP — time to break your fast." : `Fasted ${elapsedH.toFixed(1)} of ${plan.fast} hrs`) : "Start when you finish your last meal."}</p>
          <button type="button" onClick={toggle} className={`btn-gloss mt-3 w-full rounded-full py-3 text-xs font-black uppercase tracking-[0.16em] text-white ${startAt ? "bg-gradient-to-r from-rose-400 to-pink-500" : "bg-gradient-to-r from-sky-400 to-sky-600"}`}>
            {startAt ? "⏹ End Fast" : "▶ Start Fast"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Grocery list ============================================= */
function GroceryList({ suggestions }: { suggestions: string[] }) {
  const { user } = useAuth();
  const storeKey = `tfp_grocery_${user?.email ?? "guest"}`;
  const [items, setItems] = useState<{ text: string; done: boolean }[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(storeKey) ?? "[]")); } catch { setItems([]); }
  }, [storeKey]);

  function save(next: { text: string; done: boolean }[]) {
    setItems(next);
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* ignore */ }
  }
  function add(text: string) {
    const t = text.trim();
    if (!t || items.some((i) => i.text.toLowerCase() === t.toLowerCase())) return;
    save([...items, { text: t, done: false }]);
    setInput("");
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">🛒 Grocery List</p>
      <h2 className="mt-1 text-xl font-black">Build your shopping list</h2>

      <div className="mt-4 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add(input)} placeholder="Add an item…" className="flex-1 rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
        <button type="button" onClick={() => add(input)} className="btn-gloss rounded-xl bg-gradient-to-r from-[#ea580c] to-orange-400 px-5 text-xs font-black uppercase tracking-[0.14em] text-[#f4ead9]">Add</button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#2a1e16]/55">Tap to add from your saved recipes</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 12).map((s) => (
              <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-orange-200/25 bg-orange-200/8 px-2.5 py-1 text-[11px] text-orange-700 hover:bg-orange-200/16">+ {s}</button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-1.5">
        {items.length === 0 ? (
          <p className="rounded-xl bg-black/5 p-4 text-center text-xs text-[#2a1e16]/62">Your list is empty — add items or tap a recipe suggestion.</p>
        ) : (
          items.map((it, i) => (
            <button key={i} type="button" onClick={() => save(items.map((x, xi) => xi === i ? { ...x, done: !x.done } : x))} className="flex w-full items-center gap-3 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-3 text-left transition hover:bg-[#2a1e16]/10">
              <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${it.done ? "border-emerald-300 bg-emerald-300 text-[#fffdf9]" : "border-[#2a1e16]/25"}`}>{it.done && <span className="text-xs font-black">✓</span>}</span>
              <span className={`flex-1 text-sm ${it.done ? "text-[#2a1e16]/50 line-through" : ""}`}>{it.text}</span>
              <span onClick={(e) => { e.stopPropagation(); save(items.filter((_, xi) => xi !== i)); }} className="text-xs text-[#2a1e16]/45 hover:text-rose-200">✕</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function RecipeHubPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState<Recipe | null>(null);
  const [tag, setTag] = useState<"All" | "Veg" | "Non-Veg" | "Vegan">("All");
  const savedKey = `tfp_savedrecipes_${user?.email ?? "guest"}`;
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    try { setSavedIds(JSON.parse(localStorage.getItem(savedKey) ?? "[]")); } catch { setSavedIds([]); }
  }, [savedKey]);

  function toggleSave(id: string) {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(savedKey, JSON.stringify(next)); } catch { /* ignore */ }
      if (!prev.includes(id)) addXP(user?.email, 3);
      return next;
    });
  }

  const list = useMemo(() => tag === "All" ? RECIPES : RECIPES.filter((r) => r.tag === tag), [tag]);
  const groceryFromSaved = useMemo(() => {
    const set = new Set<string>();
    RECIPES.filter((r) => savedIds.includes(r.id)).forEach((r) => r.ingredients.forEach((i) => set.add(i.replace(/,.*$/, "").replace(/^\d+\s*\w*\s*/, "").trim())));
    return [...set];
  }, [savedIds]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Recipe Hub</h1>
        <p className="text-sm text-[#2a1e16]/68">High-protein Indian recipes, a fasting timer, and a smart grocery list</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["All", "Veg", "Non-Veg", "Vegan"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTag(t)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${tag === t ? "bg-orange-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68 hover:text-[#2a1e16]"}`}>{t}</button>
        ))}
      </div>

      {/* Recipe grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((r) => (
          <div key={r.id} className="glass-card overflow-hidden rounded-2xl">
            <RecipePhoto src={r.photo} alt={`${r.name}`} className="h-40 w-full" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-black leading-tight">{r.name}</h3>
                <button type="button" onClick={() => toggleSave(r.id)} aria-label="Save recipe" className="shrink-0 text-lg">{savedIds.includes(r.id) ? "⭐" : "☆"}</button>
              </div>
              <p className="mt-1 text-[11px] text-[#2a1e16]/62">{r.tag} · {r.time} · {r.kcal} kcal</p>
              <div className="mt-2 flex gap-2 text-[11px] font-bold">
                <span className="rounded-full bg-orange-200/12 px-2 py-0.5 text-orange-700">P {r.p}g</span>
                <span className="rounded-full bg-[#ea580c]/15 px-2 py-0.5 text-[#ea580c]">C {r.c}g</span>
                <span className="rounded-full bg-amber-300/12 px-2 py-0.5 text-amber-200">F {r.f}g</span>
              </div>
              <button type="button" onClick={() => setOpen(r)} className="btn-gloss mt-3 w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white">View Recipe</button>
            </div>
          </div>
        ))}
      </div>

      {/* Timer + grocery */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FastingTimer />
        <GroceryList suggestions={groceryFromSaved} />
      </div>

      {/* Recipe modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="glass-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#fffdf9]/95" onClick={(e) => e.stopPropagation()}>
            <RecipePhoto src={open.photo} alt={open.name} className="h-48 w-full rounded-t-3xl" />
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black">{open.name}</h2>
                  <p className="mt-1 text-xs text-[#2a1e16]/68">{open.tag} · {open.time} · {open.kcal} kcal · P{open.p} C{open.c} F{open.f}</p>
                </div>
                <button type="button" onClick={() => setOpen(null)} className="rounded-full border border-[#2a1e16]/15 px-3 py-1.5 text-xs text-[#2a1e16]/70 hover:bg-[#2a1e16]/8">✕</button>
              </div>
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Ingredients</p>
                <ul className="mt-2 space-y-1 text-sm text-[#2a1e16]/80">
                  {open.ingredients.map((ing, i) => <li key={i} className="flex gap-2"><span className="text-orange-600">•</span>{ing}</li>)}
                </ul>
              </div>
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Method</p>
                <ol className="mt-2 space-y-2 text-sm text-[#2a1e16]/80">
                  {open.steps.map((s, i) => (
                    <li key={i} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-500/70 text-[11px] font-black text-white">{i + 1}</span>{s}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
