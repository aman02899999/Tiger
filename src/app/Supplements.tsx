import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Supplement & Reminder Scheduler — build a daily supplement stack  */
/* (vitamins, protein, creatine, omega-3, etc.), lay it out on a     */
/* morning/afternoon/evening timeline, and check each dose off.      */
/* Persists per user in localStorage. No SVG. No medical claims.     */
/* ---------------------------------------------------------------- */

type TimeSlot = "morning" | "afternoon" | "evening";
const SLOTS: { id: TimeSlot; label: string; icon: string; hint: string }[] = [
  { id: "morning", label: "Morning", icon: "🌅", hint: "with breakfast" },
  { id: "afternoon", label: "Afternoon", icon: "☀️", hint: "with lunch / pre-workout" },
  { id: "evening", label: "Evening", icon: "🌙", hint: "with dinner / before bed" },
];

interface Supp {
  id: string;
  name: string;
  slot: TimeSlot;
  note: string;
}

// Common, benign fitness supplements offered as quick-add suggestions.
const SUGGESTIONS: { name: string; slot: TimeSlot; note: string; icon: string }[] = [
  { name: "Multivitamin", slot: "morning", note: "1 tablet with food", icon: "💊" },
  { name: "Vitamin D3", slot: "morning", note: "with a fatty meal for absorption", icon: "☀️" },
  { name: "Whey Protein", slot: "afternoon", note: "1 scoop post-workout", icon: "🥛" },
  { name: "Creatine", slot: "afternoon", note: "5g daily, timing doesn't matter", icon: "⚡" },
  { name: "Omega-3", slot: "evening", note: "1–2g with dinner", icon: "🐟" },
  { name: "Magnesium", slot: "evening", note: "before bed for sleep & recovery", icon: "🌙" },
  { name: "Vitamin B12", slot: "morning", note: "important for veg diets", icon: "🌱" },
  { name: "Zinc", slot: "evening", note: "with food, not alongside calcium", icon: "🛡️" },
];

function today() { return new Date().toISOString().slice(0, 10); }
function stackKey(email: string | null | undefined) { return `tfp_supp_stack_${email ?? "guest"}`; }
function doneKey(email: string | null | undefined) { return `tfp_supp_done_${email ?? "guest"}_${today()}`; }

export default function SupplementsPage() {
  const { user } = useAuth();
  const [stack, setStack] = useState<Supp[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("");
  const [slot, setSlot] = useState<TimeSlot>("morning");
  const rewardedAll = useRef(false);

  useEffect(() => {
    try { setStack(JSON.parse(localStorage.getItem(stackKey(user?.email)) ?? "[]")); } catch { setStack([]); }
    try { setDone(JSON.parse(localStorage.getItem(doneKey(user?.email)) ?? "{}")); } catch { setDone({}); }
  }, [user?.email]);

  function saveStack(next: Supp[]) {
    setStack(next);
    try { localStorage.setItem(stackKey(user?.email), JSON.stringify(next)); } catch { /* ignore */ }
  }
  function saveDone(next: Record<string, boolean>) {
    setDone(next);
    try { localStorage.setItem(doneKey(user?.email), JSON.stringify(next)); } catch { /* ignore */ }
  }

  function addSupp(s: { name: string; slot: TimeSlot; note: string }) {
    if (!s.name.trim() || stack.some((x) => x.name.toLowerCase() === s.name.toLowerCase())) return;
    saveStack([...stack, { id: `${Date.now()}-${Math.round(performance.now())}`, name: s.name.trim(), slot: s.slot, note: s.note }]);
  }
  function remove(id: string) {
    saveStack(stack.filter((s) => s.id !== id));
    const nextDone = { ...done }; delete nextDone[id]; saveDone(nextDone);
  }
  function toggle(id: string) {
    const next = { ...done, [id]: !done[id] };
    saveDone(next);
    const allDone = stack.length > 0 && stack.every((s) => next[s.id]);
    if (allDone && !rewardedAll.current) { rewardedAll.current = true; addXP(user?.email, 10); }
  }

  const takenCount = stack.filter((s) => done[s.id]).length;
  const pct = stack.length ? takenCount / stack.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Supplement Scheduler</h1>
        <p className="text-sm text-[#2a1e16]/68">Build your daily stack and check each dose off — never miss one again</p>
      </div>

      {/* Progress */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 shrink-0">
            <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#34d399 ${pct * 360}deg, rgba(247,240,223,0.1) ${pct * 360}deg)`, transition: "background 0.4s ease" }} />
            <div className="absolute inset-[6px] grid place-items-center rounded-full bg-[#fffdf9]"><span className="text-sm font-black">{takenCount}/{stack.length || 0}</span></div>
          </div>
          <div>
            <p className="text-lg font-black">{stack.length === 0 ? "No supplements yet" : takenCount === stack.length ? "All done for today! 🎉" : "Today's stack"}</p>
            <p className="text-xs text-[#2a1e16]/62">{stack.length === 0 ? "Add from the suggestions below or type your own." : `${stack.length - takenCount} left to take · complete all for +10 XP`}</p>
          </div>
        </div>
      </div>

      {/* Timeline by slot */}
      {stack.length > 0 && (
        <div className="space-y-4">
          {SLOTS.map((s) => {
            const items = stack.filter((x) => x.slot === s.id);
            if (items.length === 0) return null;
            return (
              <div key={s.id} className="glass-card rounded-2xl p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-sm font-black">{s.label}</p>
                  <span className="text-[11px] text-[#2a1e16]/55">· {s.hint}</span>
                </div>
                <div className="space-y-2">
                  {items.map((it) => (
                    <div key={it.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${done[it.id] ? "border-emerald-300/25 bg-emerald-300/8" : "border-[#2a1e16]/10 bg-[#2a1e16]/5"}`}>
                      <button type="button" onClick={() => toggle(it.id)} aria-label={done[it.id] ? "Mark not taken" : "Mark taken"} className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition ${done[it.id] ? "border-emerald-300 bg-emerald-300 text-[#052e1f]" : "border-[#2a1e16]/25"}`}>
                        {done[it.id] && <span className="text-xs font-black">✓</span>}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${done[it.id] ? "text-[#2a1e16]/62 line-through" : ""}`}>{it.name}</p>
                        {it.note && <p className="text-[11px] text-[#2a1e16]/62">{it.note}</p>}
                      </div>
                      <button type="button" onClick={() => remove(it.id)} aria-label="Remove" className="text-xs text-[#2a1e16]/45 hover:text-rose-600">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add custom */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Add to your stack</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (addSupp({ name, slot, note: "" }), setName(""))} placeholder="Supplement name…" className="min-w-0 flex-1 rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
          <select value={slot} onChange={(e) => setSlot(e.target.value as TimeSlot)} className="rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-3 py-2.5 text-sm outline-none">
            {SLOTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button type="button" onClick={() => { addSupp({ name, slot, note: "" }); setName(""); }} className="btn-gloss rounded-xl bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 px-5 text-xs font-black uppercase tracking-[0.14em] text-white">Add</button>
        </div>

        <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#2a1e16]/55">Quick add popular supplements</p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.filter((sug) => !stack.some((x) => x.name.toLowerCase() === sug.name.toLowerCase())).map((sug) => (
            <button key={sug.name} type="button" onClick={() => addSupp(sug)} className="rounded-full border border-orange-200/25 bg-orange-200/8 px-3 py-1.5 text-[11px] font-bold text-orange-700 hover:bg-orange-200/16">
              {sug.icon} {sug.name}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-[#2a1e16]/55">ℹ️ General wellness scheduling only — not medical advice. Check with a doctor before starting any supplement.</p>
    </div>
  );
}
