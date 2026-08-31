import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";
import { isoDay } from "./insights";
import { lookupOpenFoodFactsProduct } from "../services/api/open-food-facts";

/* ═══════════════════════════════════════════════════════════════════
   Nutrition Tracker — now actually functional.
   Previously this screen displayed fixed numbers (1,680 kcal / 124g /
   2.4L) that no button could change. It now logs real meals and water,
   persists per user per day, derives goals from the user's profile,
   and feeds the `tfp_water_*` store that Titan Intelligence reads.
   ═══════════════════════════════════════════════════════════════════ */

export interface Meal {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  slot: string;
  time: string;
}

const SLOTS = ["Breakfast", "Lunch", "Snack", "Dinner"];

/** Common Indian foods for one-tap logging (per typical serving). */
const QUICK_FOODS = [
  { name: "2 Roti + Dal", kcal: 320, protein: 12 },
  { name: "Chicken Curry (150g)", kcal: 290, protein: 27 },
  { name: "Paneer Bhurji (100g)", kcal: 265, protein: 18 },
  { name: "Rice + Rajma", kcal: 380, protein: 14 },
  { name: "3 Egg Whites + Toast", kcal: 180, protein: 15 },
  { name: "Curd (200g)", kcal: 120, protein: 11 },
  { name: "Whey Scoop", kcal: 120, protein: 24 },
  { name: "Poha (1 plate)", kcal: 250, protein: 6 },
];

const GLASS_ML = 250;

function mealsKey(email: string | null | undefined, day: string) {
  return `tfp_meals_${email ?? "guest"}_${day}`;
}
function waterKey(email: string | null | undefined, day: string) {
  return `tfp_water_${email ?? "guest"}_${day}`;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/**
 * Mifflin-St Jeor BMR -> TDEE -> goal-adjusted calorie target.
 * This is the standard clinical estimator, so the target is defensible
 * rather than a magic number.
 */
export function calorieTarget(user: {
  age?: number; height?: number; weight?: number; gender?: string; goal?: string;
} | null): { kcal: number; protein: number } {
  const age = user?.age ?? 28;
  const height = user?.height ?? 175;
  const weight = user?.weight ?? 75;
  const male = (user?.gender ?? "male") !== "female";

  const bmr = 10 * weight + 6.25 * height - 5 * age + (male ? 5 : -161);
  const tdee = bmr * 1.45; // moderately active

  const goal = user?.goal ?? "general";
  const kcal =
    goal === "fat-loss" || goal === "wedding" ? tdee - 450 :
    goal === "muscle-gain" ? tdee + 300 :
    tdee;

  // 1.8 g/kg is the well-supported range for trainees in a deficit.
  const protein = Math.round(weight * 1.8);
  return { kcal: Math.round(kcal / 10) * 10, protein };
}

function Ring({ value, goal, label, unit, accent }: {
  value: number; goal: number; label: string; unit: string; accent: string;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const over = value > goal;
  return (
    <div className="glass-3d rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/65">{label}</p>
      <p className="mt-3 text-5xl font-black tabular-nums" style={{ color: over ? "#ffb627" : "#e9f3f5" }}>
        {value.toLocaleString("en-IN")}
        <span className="ml-1 text-lg font-bold text-[#e9f3f5]/50">{unit}</span>
      </p>
      <p className="mt-1 text-xs text-[#e9f3f5]/68">
        of {goal.toLocaleString("en-IN")}{unit} goal
        {over && <span className="ml-1 font-bold text-amber-300">· over</span>}
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e9f3f5]/10">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: accent }}
        />
      </div>
    </div>
  );
}

export default function NutritionTracker() {
  const { user } = useAuth();
  const day = isoDay();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [water, setWater] = useState(0);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [barcode, setBarcode] = useState("");
  const [foodLookupError, setFoodLookupError] = useState<string | null>(null);

  useEffect(() => {
    setMeals(load<Meal[]>(mealsKey(user?.email, day), []));
    setWater(load<number>(waterKey(user?.email, day), 0));
  }, [user?.email, day]);

  const goals = useMemo(() => calorieTarget(user), [user]);

  const totals = useMemo(
    () => meals.reduce(
      (acc, m) => ({ kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein }),
      { kcal: 0, protein: 0 }
    ),
    [meals]
  );

  function persistMeals(next: Meal[]) {
    setMeals(next);
    try { localStorage.setItem(mealsKey(user?.email, day), JSON.stringify(next)); } catch { /* ignore */ }
  }
  function persistWater(ml: number) {
    const next = Math.max(0, ml);
    setWater(next);
    try { localStorage.setItem(waterKey(user?.email, day), JSON.stringify(next)); } catch { /* ignore */ }
  }

  function addMeal(m: { name: string; kcal: number; protein: number }) {
    if (!m.name.trim() || m.kcal <= 0) return;
    const entry: Meal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: m.name.trim(),
      kcal: Math.round(m.kcal),
      protein: Math.round(m.protein),
      slot,
      time: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
    };
    persistMeals([entry, ...meals]);
    if (meals.length === 0) addXP(user?.email, 10);
    setName(""); setKcal(""); setProtein("");
  }

  async function lookupFoodByBarcode() {
    const trimmed = barcode.trim();
    if (!trimmed) {
      setFoodLookupError("Enter a barcode or product code first.");
      return;
    }

    try {
      const product = await lookupOpenFoodFactsProduct(trimmed);
      if (!product) {
        setFoodLookupError("Product not found — add manually.");
        return;
      }
      addMeal({ name: product.name, kcal: product.calories, protein: product.protein });
      setBarcode("");
      setFoodLookupError(null);
    } catch (error) {
      setFoodLookupError(error instanceof Error ? error.message : "Food lookup failed.");
    }
  }

  const remaining = goals.kcal - totals.kcal;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Nutrition Tracker</h1>
        <p className="text-sm text-[#e9f3f5]/68">
          Targets derived from your profile via Mifflin-St Jeor — {goals.kcal.toLocaleString("en-IN")} kcal · {goals.protein}g protein
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Ring value={totals.kcal} goal={goals.kcal} label="Today's Calories" unit="" accent="linear-gradient(90deg,#5eead4,#3b9dff)" />
        <Ring value={totals.protein} goal={goals.protein} label="Protein" unit="g" accent="linear-gradient(90deg,#34e08a,#16c172)" />
        <div className="glass-3d rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/65">Water</p>
          <p className="mt-3 text-5xl font-black tabular-nums text-[#e9f3f5]">
            {(water / 1000).toFixed(1)}<span className="ml-1 text-lg font-bold text-[#e9f3f5]/50">L</span>
          </p>
          <p className="mt-1 text-xs text-[#e9f3f5]/68">of 3.0L goal</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e9f3f5]/10">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${Math.min(100, (water / 3000) * 100)}%`, background: "linear-gradient(90deg,#ffd166,#ffb627)" }}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => persistWater(water + GLASS_ML)}
              className="btn-gloss flex-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#04121a]"
            >
              + Glass (250ml)
            </button>
            <button
              type="button"
              onClick={() => persistWater(water - GLASS_ML)}
              disabled={water <= 0}
              className="rounded-full border border-[#e9f3f5]/15 px-4 text-sm font-black text-[#e9f3f5]/70 disabled:opacity-40"
              aria-label="Remove a glass"
            >
              −
            </button>
          </div>
        </div>
      </div>

      {/* Remaining-calorie coach line */}
      <div className={`rounded-2xl border p-5 ${remaining < 0 ? "border-amber-400/30 bg-amber-400/8" : "border-teal-300/25 bg-teal-300/8"}`}>
        <p className="text-sm font-bold text-[#e9f3f5]">
          {remaining >= 0
            ? `${remaining.toLocaleString("en-IN")} kcal left today`
            : `${Math.abs(remaining).toLocaleString("en-IN")} kcal over — no guilt, just adjust tomorrow`}
        </p>
        <p className="mt-1 text-xs leading-5 text-[#e9f3f5]/62">
          {totals.protein < goals.protein
            ? `You still need ${goals.protein - totals.protein}g protein — that's roughly ${Math.ceil((goals.protein - totals.protein) / 24)} whey scoop(s) or 200g of curd plus an egg.`
            : "Protein target hit. That's the hardest part of the day done."}
        </p>
      </div>

      {/* Quick add */}
      <div className="glass-3d rounded-2xl p-6">
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#e9f3f5]/70">Food scanner</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan barcode or product code"
            className="flex-1 rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-4 py-3 text-sm outline-none placeholder:text-[#e9f3f5]/35 focus:border-teal-300/45"
          />
          <button
            type="button"
            onClick={lookupFoodByBarcode}
            className="rounded-full bg-gradient-to-r from-teal-300 to-sky-400 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#04121a]"
          >
            Lookup
          </button>
        </div>
        {foodLookupError && <p className="mt-2 text-xs text-amber-300">{foodLookupError}</p>}
        <h3 className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-[#e9f3f5]/70">Quick add</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {SLOTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition ${
                slot === s
                  ? "bg-gradient-to-r from-teal-300 to-sky-400 text-[#04121a]"
                  : "border border-[#e9f3f5]/12 text-[#e9f3f5]/60 hover:text-[#e9f3f5]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_FOODS.map((f) => (
            <button
              key={f.name}
              type="button"
              onClick={() => addMeal(f)}
              className="rounded-xl border border-[#e9f3f5]/10 bg-[#e9f3f5]/4 p-3 text-left transition hover:border-teal-300/35 hover:bg-teal-300/8"
            >
              <p className="text-sm font-bold text-[#e9f3f5]">{f.name}</p>
              <p className="mt-0.5 text-[11px] text-[#e9f3f5]/55">{f.kcal} kcal · {f.protein}g protein</p>
            </button>
          ))}
        </div>

        <form
          className="mt-5 grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]"
          onSubmit={(e) => { e.preventDefault(); addMeal({ name, kcal: Number(kcal), protein: Number(protein) || 0 }); }}
        >
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Custom food…"
            className="rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 px-4 py-3 text-sm outline-none placeholder:text-[#e9f3f5]/35 focus:border-teal-300/45"
          />
          <input
            value={kcal} onChange={(e) => setKcal(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric" placeholder="kcal"
            className="rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 px-4 py-3 text-sm tabular-nums outline-none placeholder:text-[#e9f3f5]/35 focus:border-teal-300/45"
          />
          <input
            value={protein} onChange={(e) => setProtein(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric" placeholder="protein g"
            className="rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 px-4 py-3 text-sm tabular-nums outline-none placeholder:text-[#e9f3f5]/35 focus:border-teal-300/45"
          />
          <button
            type="submit"
            className="btn-gloss rounded-xl bg-gradient-to-r from-teal-300 to-sky-400 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#04121a]"
          >
            Add
          </button>
        </form>
      </div>

      {/* Today's log */}
      <div className="glass-3d rounded-2xl p-6">
        <h3 className="mb-4 text-lg font-bold">Today's Meals</h3>
        {meals.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#e9f3f5]/50">
            Nothing logged yet. Tap a quick-add above — it takes one second and powers your dashboard scores.
          </p>
        ) : (
          <div className="space-y-2">
            {meals.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-[#e9f3f5]/8 bg-[#e9f3f5]/4 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#e9f3f5]">{m.name}</p>
                  <p className="text-[11px] text-[#e9f3f5]/55">{m.slot} · {m.time}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black tabular-nums text-[#e9f3f5]">{m.kcal} kcal</p>
                  <p className="text-[11px] tabular-nums text-emerald-300/80">{m.protein}g protein</p>
                </div>
                <button
                  type="button"
                  onClick={() => persistMeals(meals.filter((x) => x.id !== m.id))}
                  aria-label={`Remove ${m.name}`}
                  className="shrink-0 rounded-lg px-2 py-1 text-lg text-[#e9f3f5]/35 transition hover:bg-rose-400/10 hover:text-rose-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
