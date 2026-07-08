import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Macro Builder — search foods, add to your plate, watch calories   */
/* and a live protein/carb/fat ring update against your goal.        */
/* India-focused food database. No SVG.                              */
/* ---------------------------------------------------------------- */

interface Food {
  name: string;
  unit: string; // description of one serving
  kcal: number;
  p: number; // protein g
  c: number; // carbs g
  f: number; // fat g
}

// Per single serving as described in `unit`.
const FOODS: Food[] = [
  { name: "Boiled Egg", unit: "1 whole", kcal: 78, p: 6, c: 0.6, f: 5 },
  { name: "Egg Whites", unit: "3 whites", kcal: 51, p: 11, c: 0.7, f: 0.2 },
  { name: "Chicken Breast", unit: "100 g cooked", kcal: 165, p: 31, c: 0, f: 3.6 },
  { name: "Paneer", unit: "100 g", kcal: 265, p: 18, c: 1.2, f: 21 },
  { name: "Tofu", unit: "100 g", kcal: 76, p: 8, c: 1.9, f: 4.8 },
  { name: "Whey Scoop", unit: "1 scoop (30 g)", kcal: 120, p: 24, c: 3, f: 1.5 },
  { name: "Dal (cooked)", unit: "1 bowl (150 g)", kcal: 174, p: 12, c: 27, f: 1 },
  { name: "Rajma (cooked)", unit: "1 bowl (150 g)", kcal: 210, p: 13, c: 30, f: 1.5 },
  { name: "Chana / Chickpeas", unit: "1 bowl (150 g)", kcal: 240, p: 13, c: 40, f: 4 },
  { name: "Roti (whole wheat)", unit: "1 medium", kcal: 104, p: 3, c: 20, f: 1.5 },
  { name: "White Rice", unit: "1 cup cooked", kcal: 205, p: 4, c: 45, f: 0.4 },
  { name: "Brown Rice", unit: "1 cup cooked", kcal: 216, p: 5, c: 45, f: 1.8 },
  { name: "Oats", unit: "40 g dry", kcal: 150, p: 5, c: 27, f: 3 },
  { name: "Poha", unit: "1 plate", kcal: 250, p: 5, c: 45, f: 6 },
  { name: "Banana", unit: "1 medium", kcal: 105, p: 1.3, c: 27, f: 0.4 },
  { name: "Apple", unit: "1 medium", kcal: 95, p: 0.5, c: 25, f: 0.3 },
  { name: "Milk (toned)", unit: "1 glass (200 ml)", kcal: 120, p: 6, c: 10, f: 6 },
  { name: "Greek Yogurt", unit: "150 g", kcal: 130, p: 15, c: 6, f: 4 },
  { name: "Peanut Butter", unit: "1 tbsp", kcal: 94, p: 4, c: 3, f: 8 },
  { name: "Almonds", unit: "10 pieces", kcal: 70, p: 2.5, c: 2.5, f: 6 },
  { name: "Fish (Rohu)", unit: "100 g cooked", kcal: 143, p: 20, c: 0, f: 7 },
  { name: "Mutton (cooked)", unit: "100 g", kcal: 250, p: 26, c: 0, f: 16 },
  { name: "Sabzi (mixed veg)", unit: "1 bowl", kcal: 120, p: 4, c: 14, f: 6 },
  { name: "Idli", unit: "2 pieces", kcal: 116, p: 4, c: 24, f: 0.4 },
  { name: "Dosa (plain)", unit: "1 medium", kcal: 168, p: 4, c: 29, f: 4 },
  { name: "Sweet Potato", unit: "150 g", kcal: 129, p: 2.3, c: 30, f: 0.2 },
];

interface Item extends Food { id: string; qty: number }

const RING = [
  { key: "p", label: "Protein", color: "#a78bfa", kcalPerG: 4 },
  { key: "c", label: "Carbs", color: "#d8b35a", kcalPerG: 4 },
  { key: "f", label: "Fat", color: "#e879f9", kcalPerG: 9 },
] as const;

export default function MacroBuilderPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [plate, setPlate] = useState<Item[]>([]);
  const goalKcal = user?.stats ? 2200 : 2200;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? FOODS.filter((f) => f.name.toLowerCase().includes(q)) : FOODS;
  }, [query]);

  const totals = useMemo(() => {
    return plate.reduce(
      (t, it) => ({
        kcal: t.kcal + it.kcal * it.qty,
        p: t.p + it.p * it.qty,
        c: t.c + it.c * it.qty,
        f: t.f + it.f * it.qty,
      }),
      { kcal: 0, p: 0, c: 0, f: 0 }
    );
  }, [plate]);

  function add(food: Food) {
    setPlate((prev) => {
      const existing = prev.find((p) => p.name === food.name);
      if (existing) return prev.map((p) => (p.name === food.name ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { ...food, id: `${food.name}-${Date.now()}`, qty: 1 }];
    });
  }
  function changeQty(id: string, delta: number) {
    setPlate((prev) => prev.flatMap((p) => (p.id === id ? (p.qty + delta <= 0 ? [] : [{ ...p, qty: p.qty + delta }]) : [p])));
  }

  // Build a conic-gradient split by macro kcal contribution.
  const macroKcal = { p: totals.p * 4, c: totals.c * 4, f: totals.f * 9 };
  const macroTotal = macroKcal.p + macroKcal.c + macroKcal.f || 1;
  const pDeg = (macroKcal.p / macroTotal) * 360;
  const cDeg = pDeg + (macroKcal.c / macroTotal) * 360;
  const ringBg = `conic-gradient(#a78bfa 0deg ${pDeg}deg, #d8b35a ${pDeg}deg ${cDeg}deg, #e879f9 ${cDeg}deg 360deg)`;
  const goalPct = Math.min(100, Math.round((totals.kcal / goalKcal) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Macro Builder</h1>
        <p className="text-sm text-[#f7f0df]/68">Search foods, build your plate, and watch your macros add up live</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Food picker */}
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">🍛 Add foods</p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods (e.g. paneer, dal, egg)…"
            className="mt-3 w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40"
          />
          <div className="mt-4 max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {filtered.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => add(f)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-3 text-left transition hover:bg-[#f7f0df]/10"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{f.name}</p>
                  <p className="text-[11px] text-[#f7f0df]/62">{f.unit} · {f.kcal} kcal · P{f.p} C{f.c} F{f.f}</p>
                </div>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-500/80 text-sm font-black text-white">+</span>
              </button>
            ))}
          </div>
        </div>

        {/* Plate + live totals */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-6">
              <div className="relative h-32 w-32 shrink-0">
                <div className="absolute inset-0 rounded-full" style={{ background: plate.length ? ringBg : "rgba(247,240,223,0.1)", transition: "background 0.4s ease" }} />
                <div className="absolute inset-[10px] grid place-items-center rounded-full bg-[#0b0714] text-center">
                  <div>
                    <p className="text-2xl font-black tabular-nums">{Math.round(totals.kcal)}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#f7f0df]/62">kcal</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {RING.map((m) => {
                  const g = totals[m.key as "p" | "c" | "f"];
                  return (
                    <div key={m.key} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: m.color }} />
                      <span className="text-xs font-bold text-[#f7f0df]/75">{m.label}</span>
                      <span className="ml-auto text-sm font-black tabular-nums">{Math.round(g)}g</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* goal bar */}
            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs text-[#f7f0df]/65">
                <span>Daily goal</span>
                <span className={goalPct >= 100 ? "font-bold text-emerald-300" : ""}>{Math.round(totals.kcal)} / {goalKcal} kcal</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#f7f0df]/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-[#d8b35a] transition-all duration-500" style={{ width: `${goalPct}%` }} />
              </div>
            </div>
          </div>

          {/* Plate list */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">🍽️ Your plate</p>
              {plate.length > 0 && <button type="button" onClick={() => setPlate([])} className="text-xs text-[#f7f0df]/60 hover:text-rose-200">Clear all</button>}
            </div>
            {plate.length === 0 ? (
              <p className="mt-4 rounded-xl bg-white/5 p-4 text-center text-xs text-[#f7f0df]/62">Tap foods on the left to build your meal.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {plate.map((it) => (
                  <div key={it.id} className="flex items-center gap-3 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{it.name}</p>
                      <p className="text-[11px] text-[#f7f0df]/62">{it.qty} × {it.unit} · {Math.round(it.kcal * it.qty)} kcal</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => changeQty(it.id, -1)} aria-label="Decrease" className="grid h-7 w-7 place-items-center rounded-full border border-[#f7f0df]/15 text-sm hover:bg-[#f7f0df]/10">−</button>
                      <span className="w-5 text-center text-sm font-black tabular-nums">{it.qty}</span>
                      <button type="button" onClick={() => changeQty(it.id, 1)} aria-label="Increase" className="grid h-7 w-7 place-items-center rounded-full border border-[#f7f0df]/15 text-sm hover:bg-[#f7f0df]/10">+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
