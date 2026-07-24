import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Mood & Stress Journal — the deep-dive companion to the Dashboard's */
/* single-tap mood check-in. Logs mood + stress level + a note each  */
/* day, and visualizes both as 14-day trend bars plus a scrollable    */
/* entry history. Persists per user in localStorage. No SVG.          */
/* ---------------------------------------------------------------- */

const MOODS = [
  { id: "great", emoji: "🤩", label: "Great", score: 5, color: "#34d399" },
  { id: "good", emoji: "🙂", label: "Good", score: 4, color: "#f97316" },
  { id: "okay", emoji: "😐", label: "Okay", score: 3, color: "#ea580c" },
  { id: "tired", emoji: "😮‍💨", label: "Tired", score: 2, color: "#fb923c" },
  { id: "low", emoji: "😔", label: "Low", score: 1, color: "#fb7185" },
];

const STRESS_LEVELS = [
  { id: 1, label: "Calm", emoji: "🌊" },
  { id: 2, label: "Mild", emoji: "🍃" },
  { id: 3, label: "Moderate", emoji: "⛅" },
  { id: 4, label: "High", emoji: "⚡" },
  { id: 5, label: "Overwhelmed", emoji: "🌩️" },
];

interface Entry {
  date: string;
  moodId: string;
  stress: number;
  note: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function storeKey(email: string | null | undefined) {
  return `tfp_mood_journal_${email ?? "guest"}`;
}
function loadEntries(email: string | null | undefined): Entry[] {
  try { return JSON.parse(localStorage.getItem(storeKey(email)) ?? "[]"); } catch { return []; }
}
function moodFor(id: string) {
  return MOODS.find((m) => m.id === id) ?? MOODS[2];
}

export default function MoodJournalPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [moodId, setMoodId] = useState<string | null>(null);
  const [stress, setStress] = useState(3);
  const [note, setNote] = useState("");

  useEffect(() => {
    const loaded = loadEntries(user?.email);
    setEntries(loaded);
    const todays = loaded.find((e) => e.date === today());
    if (todays) { setMoodId(todays.moodId); setStress(todays.stress); setNote(todays.note); }
  }, [user?.email]);

  function save() {
    if (!moodId) return;
    const date = today();
    const isNew = !entries.some((e) => e.date === date);
    const next = [{ date, moodId, stress, note }, ...entries.filter((e) => e.date !== date)].slice(0, 90);
    setEntries(next);
    try { localStorage.setItem(storeKey(user?.email), JSON.stringify(next)); } catch { /* ignore */ }
    if (isNew) addXP(user?.email, 8);
  }

  const last14 = useMemo(() => {
    const days: (Entry | null)[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push(entries.find((e) => e.date === key) ?? null);
    }
    return days;
  }, [entries]);

  const loggedDays = last14.filter(Boolean) as Entry[];
  const avgMood = loggedDays.length ? loggedDays.reduce((s, e) => s + moodFor(e.moodId).score, 0) / loggedDays.length : 0;
  const avgStress = loggedDays.length ? loggedDays.reduce((s, e) => s + e.stress, 0) / loggedDays.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Mood &amp; Stress Journal</h1>
        <p className="text-sm text-[#2a1e16]/68">Track how you feel day to day and spot patterns over time</p>
      </div>

      {/* How this works */}
      <div className="glass-card rounded-2xl p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">How this works — 3 simple steps</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { n: "1", t: "Log your mood", d: "Pick how you feel and rate your stress level — takes 5 seconds." },
            { n: "2", t: "Add a quick note", d: "Optional — jot down what's driving it. Your own words, for your own reference." },
            { n: "3", t: "Watch the trend", d: "See your last 14 days as bars. Patterns are easier to spot than memories." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-black/8 bg-black/5 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-600 to-amber-600 text-sm font-black text-white">{s.n}</div>
              <p className="text-sm font-bold text-[#2a1e16]">{s.t}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#2a1e16]/68">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's entry */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Today's Entry</p>

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2a1e16]/62">Mood</p>
          <div className="flex justify-between gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMoodId(m.id)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-3 transition ${moodId === m.id ? "scale-105 border-black/30 bg-black/10" : "border-transparent hover:bg-black/5"}`}
                style={moodId === m.id ? { boxShadow: `0 0 20px ${m.color}40` } : undefined}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] font-bold" style={{ color: moodId === m.id ? m.color : "rgba(247,240,223,0.62)" }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2a1e16]/62">Stress level</p>
          <div className="flex justify-between gap-1.5">
            {STRESS_LEVELS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStress(s.id)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2.5 transition ${stress === s.id ? "border-[#ea580c]/50 bg-[#ea580c]/10" : "border-[#2a1e16]/10 bg-[#2a1e16]/5 hover:bg-[#2a1e16]/10"}`}
              >
                <span className="text-lg">{s.emoji}</span>
                <span className="text-[9px] font-bold text-[#2a1e16]/68">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2a1e16]/62">Note (optional)</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's on your mind today?"
            rows={3}
            className="w-full resize-none rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-orange-200/40"
          />
        </div>

        <button
          type="button"
          onClick={save}
          disabled={!moodId}
          className="btn-gloss mt-5 w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save Today's Entry (+8 XP)
        </button>
      </div>

      {/* 14-day trend */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">14-Day Trend</p>
          <p className="text-xs text-[#2a1e16]/62">
            {loggedDays.length ? `Avg mood ${avgMood.toFixed(1)}/5 · avg stress ${avgStress.toFixed(1)}/5` : "No entries yet"}
          </p>
        </div>
        <div className="mt-5 flex h-32 items-end justify-between gap-1.5">
          {last14.map((e, i) => {
            const mood = e ? moodFor(e.moodId) : null;
            const h = e ? (mood!.score / 5) * 100 : 4;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{ height: `${h}%`, background: e ? mood!.color : "rgba(247,240,223,0.08)", opacity: e ? 0.85 : 1 }}
                    title={e ? `${e.date}: ${mood!.label}, stress ${e.stress}/5` : "no entry"}
                  />
                </div>
                {e && <span className="text-[10px]">{mood!.emoji}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Past Entries</p>
        {entries.length === 0 ? (
          <p className="mt-4 rounded-xl bg-black/5 p-4 text-center text-xs text-[#2a1e16]/62">No entries yet — log your first mood above.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {entries.slice(0, 10).map((e) => {
              const m = moodFor(e.moodId);
              const s = STRESS_LEVELS.find((x) => x.id === e.stress) ?? STRESS_LEVELS[2];
              return (
                <div key={e.date} className="flex items-start gap-3 rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-3">
                  <span className="text-xl">{m.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#2a1e16]">{new Date(e.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })} — {m.label} · {s.emoji} {s.label} stress</p>
                    {e.note && <p className="mt-1 text-xs text-[#2a1e16]/68">{e.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
