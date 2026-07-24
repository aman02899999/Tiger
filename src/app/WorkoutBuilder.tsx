import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Exercise Library + Custom Workout Builder.                        */
/* Search/filter a real exercise database with demo photos and form  */
/* cues, add moves to your own routine, save & reload it.            */
/* Routines persist per user in localStorage. No SVG.                */
/* ---------------------------------------------------------------- */

const IMG = (id: string) => `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

type Group = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core" | "Cardio";

interface Exercise {
  id: string;
  name: string;
  group: Group;
  equip: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  cue: string;
  photo: string;
}

const LIBRARY: Exercise[] = [
  { id: "bench", name: "Barbell Bench Press", group: "Chest", equip: "Barbell", level: "Intermediate", cue: "Retract shoulder blades, bar to mid-chest, drive feet into floor.", photo: IMG("photo-1571019613454-1cb2f99b2d8b") },
  { id: "incline-db", name: "Incline Dumbbell Press", group: "Chest", equip: "Dumbbell", level: "Intermediate", cue: "30° bench, squeeze chest at top, slow 3s negative.", photo: IMG("photo-1581009146145-b5ef050c2e1e") },
  { id: "pushup", name: "Push-Up", group: "Chest", equip: "Bodyweight", level: "Beginner", cue: "Body in a straight line, elbows ~45°, full lockout.", photo: IMG("photo-1598971639058-fab3c3109a00") },
  { id: "pullup", name: "Pull-Up", group: "Back", equip: "Bodyweight", level: "Advanced", cue: "Drive elbows down, chest to bar, control the descent.", photo: IMG("photo-1598971639058-fab3c3109a00") },
  { id: "row", name: "Barbell Bent-Over Row", group: "Back", equip: "Barbell", level: "Intermediate", cue: "Flat back, hinge at hips, pull to belly button.", photo: IMG("photo-1534368786749-b63e05c92392") },
  { id: "lat-pull", name: "Lat Pulldown", group: "Back", equip: "Cable", level: "Beginner", cue: "Depress shoulders first, pull to upper chest.", photo: IMG("photo-1541534741688-6078c6bfb5c5") },
  { id: "squat", name: "Barbell Back Squat", group: "Legs", equip: "Barbell", level: "Intermediate", cue: "Brace core, knees track toes, hit depth then drive up.", photo: IMG("photo-1517963879433-6ad2b056d712") },
  { id: "rdl", name: "Romanian Deadlift", group: "Legs", equip: "Barbell", level: "Intermediate", cue: "Soft knees, push hips back, feel the hamstring stretch.", photo: IMG("photo-1534438327276-14e5300c3a48") },
  { id: "lunge", name: "Walking Lunge", group: "Legs", equip: "Dumbbell", level: "Beginner", cue: "Long stride, back knee kisses the floor, torso tall.", photo: IMG("photo-1434682881908-b43d0467b798") },
  { id: "ohp", name: "Overhead Press", group: "Shoulders", equip: "Barbell", level: "Intermediate", cue: "Squeeze glutes, press overhead without arching back.", photo: IMG("photo-1532029837206-abbe2b7620e3") },
  { id: "lateral", name: "Lateral Raise", group: "Shoulders", equip: "Dumbbell", level: "Beginner", cue: "Lead with elbows, stop at shoulder height.", photo: IMG("photo-1581009137042-c552e485697a") },
  { id: "curl", name: "Dumbbell Biceps Curl", group: "Arms", equip: "Dumbbell", level: "Beginner", cue: "No swinging, control the negative, full stretch.", photo: IMG("photo-1581009146145-b5ef050c2e1e") },
  { id: "tricep", name: "Triceps Rope Pushdown", group: "Arms", equip: "Cable", level: "Beginner", cue: "Elbows pinned, spread the rope at the bottom.", photo: IMG("photo-1530822847156-5df684ec5ee1") },
  { id: "plank", name: "Plank", group: "Core", equip: "Bodyweight", level: "Beginner", cue: "Straight line head to heels, brace abs and glutes.", photo: IMG("photo-1544033527-b192daee1f5b") },
  { id: "leg-raise", name: "Hanging Leg Raise", group: "Core", equip: "Bodyweight", level: "Advanced", cue: "No swing, curl the pelvis, control down.", photo: IMG("photo-1596357395217-80de13130e92") },
  { id: "run", name: "Treadmill Intervals", group: "Cardio", equip: "Machine", level: "Intermediate", cue: "30s hard / 90s easy — repeat for conditioning.", photo: IMG("photo-1538805060514-97d9cc17730c") },
  { id: "burpee", name: "Burpee", group: "Cardio", equip: "Bodyweight", level: "Intermediate", cue: "Chest to floor, explode up, land soft.", photo: IMG("photo-1599058917212-d750089bc07e") },
  { id: "row-erg", name: "Rowing Machine", group: "Cardio", equip: "Machine", level: "Beginner", cue: "Legs → hips → arms on the drive, reverse on recovery.", photo: IMG("photo-1519505907962-0a6cb0167c73") },
];

const GROUPS: (Group | "All")[] = ["All", "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"];

interface RoutineItem { exId: string; sets: number; reps: string }

function ExercisePhoto({ src, alt }: { src: string; alt: string }) {
  const [fail, setFail] = useState(false);
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-orange-950 to-amber-950">
      {!fail && <img src={src} alt={alt} loading="lazy" onError={() => setFail(true)} className="h-full w-full object-cover" />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#fffdf9]/70 to-transparent" />
    </div>
  );
}

export default function WorkoutBuilderPage() {
  const { user } = useAuth();
  const storeKey = `tfp_routine_${user?.email ?? "guest"}`;
  const [group, setGroup] = useState<Group | "All">("All");
  const [query, setQuery] = useState("");
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try { setRoutine(JSON.parse(localStorage.getItem(storeKey) ?? "[]")); } catch { setRoutine([]); }
  }, [storeKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LIBRARY.filter((e) => (group === "All" || e.group === group) && (!q || e.name.toLowerCase().includes(q) || e.equip.toLowerCase().includes(q)));
  }, [group, query]);

  const byId = (id: string) => LIBRARY.find((e) => e.id === id)!;

  function addToRoutine(exId: string) {
    if (routine.some((r) => r.exId === exId)) return;
    setRoutine((r) => [...r, { exId, sets: 3, reps: "8–12" }]);
    setSaved(false);
  }
  function updateItem(exId: string, patch: Partial<RoutineItem>) {
    setRoutine((r) => r.map((it) => (it.exId === exId ? { ...it, ...patch } : it)));
    setSaved(false);
  }
  function remove(exId: string) {
    setRoutine((r) => r.filter((it) => it.exId !== exId));
    setSaved(false);
  }
  function saveRoutine() {
    try { localStorage.setItem(storeKey, JSON.stringify(routine)); } catch { /* ignore */ }
    setSaved(true);
    if (routine.length >= 3) addXP(user?.email, 15);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Workout Builder</h1>
        <p className="text-sm text-[#2a1e16]/68">Browse the exercise library and build your own routine</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Library */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl p-4">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exercises or equipment…" className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-orange-200/40" />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {GROUPS.map((g) => (
                <button key={g} type="button" onClick={() => setGroup(g)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${group === g ? "bg-orange-500 text-white" : "border border-[#2a1e16]/12 bg-[#2a1e16]/5 text-[#2a1e16]/68 hover:text-[#2a1e16]"}`}>{g}</button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((e) => {
              const added = routine.some((r) => r.exId === e.id);
              return (
                <div key={e.id} className="glass-card overflow-hidden rounded-xl">
                  <ExercisePhoto src={e.photo} alt={`${e.name} demonstration`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black leading-tight">{e.name}</h3>
                      <span className="shrink-0 rounded-full bg-orange-200/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-orange-700">{e.level}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#2a1e16]/62">{e.group} · {e.equip}</p>
                    <p className="mt-2 text-xs leading-relaxed text-[#2a1e16]/72">💡 {e.cue}</p>
                    <button type="button" onClick={() => addToRoutine(e.id)} disabled={added} className={`btn-gloss mt-3 w-full rounded-full py-2.5 text-xs font-black uppercase tracking-[0.14em] transition ${added ? "cursor-default border border-emerald-300/30 bg-emerald-300/10 text-emerald-600" : "bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 text-white"}`}>
                      {added ? "✓ In your routine" : "+ Add to routine"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Routine builder */}
        <div className="space-y-4">
          <div className="glass-card sticky top-4 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">🗒️ My Routine</p>
              <span className="text-[11px] text-[#2a1e16]/62">{routine.length} moves</span>
            </div>

            {routine.length === 0 ? (
              <p className="mt-4 rounded-xl bg-black/5 p-4 text-center text-xs text-[#2a1e16]/62">Add exercises from the library to build your custom workout.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {routine.map((it, i) => {
                  const ex = byId(it.exId);
                  return (
                    <div key={it.exId} className="rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-500/70 text-[11px] font-black text-white">{i + 1}</span>
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{ex.name}</p>
                        <button type="button" onClick={() => remove(it.exId)} aria-label="Remove" className="text-xs text-[#2a1e16]/55 hover:text-rose-600">✕</button>
                      </div>
                      <div className="mt-2 flex items-center gap-2 pl-8">
                        <label className="flex items-center gap-1 text-[11px] text-[#2a1e16]/65">
                          Sets
                          <input type="number" min={1} max={10} value={it.sets} onChange={(e) => updateItem(it.exId, { sets: Number(e.target.value) })} className="w-12 rounded-md border border-[#2a1e16]/12 bg-[#fffdf9] px-2 py-1 text-xs outline-none" />
                        </label>
                        <label className="flex items-center gap-1 text-[11px] text-[#2a1e16]/65">
                          Reps
                          <input value={it.reps} onChange={(e) => updateItem(it.exId, { reps: e.target.value })} className="w-16 rounded-md border border-[#2a1e16]/12 bg-[#fffdf9] px-2 py-1 text-xs outline-none" />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button type="button" onClick={saveRoutine} disabled={routine.length === 0} className={`btn-gloss mt-4 w-full rounded-full py-3 text-xs font-black uppercase tracking-[0.16em] transition ${saved ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-[#ea580c] to-orange-400 text-[#f4ead9]"} ${routine.length === 0 ? "opacity-50" : ""}`}>
              {saved ? "✓ Routine Saved!" : "Save Routine (+15 XP)"}
            </button>
            {routine.length > 0 && (
              <p className="mt-2 text-center text-[11px] text-[#2a1e16]/62">
                Est. {routine.reduce((s, r) => s + r.sets, 0)} sets · ~{Math.round(routine.reduce((s, r) => s + r.sets, 0) * 2.5)} min
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
