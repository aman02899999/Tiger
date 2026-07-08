import { useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Data & Backup — export every Tiger Fitness Pro value stored in    */
/* this browser as a JSON file, and import it back on any device.    */
/* Also a quick app tour of the major sections. No SVG.              */
/* ---------------------------------------------------------------- */

function collectData(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("tfp_")) out[k] = localStorage.getItem(k) ?? "";
    }
  } catch { /* storage blocked */ }
  return out;
}

const TOUR = [
  { icon: "📊", title: "Dashboard", desc: "Your daily hub — checklist, mood, activity, and quick actions." },
  { icon: "💪", title: "Training", desc: "Guided workouts, a custom builder, Strength Lab and goal roadmap." },
  { icon: "🍽️", title: "Nutrition", desc: "Macro builder, recipe hub, fasting timer and auto diet." },
  { icon: "🧘", title: "Wellness", desc: "Yoga, meditation, breathing, sleep tracking and physio." },
  { icon: "📈", title: "Progress", desc: "Body metrics, photos, consistency heatmap and blood reports." },
  { icon: "🎮", title: "Rewards", desc: "XP, achievements, daily quests, spin wheel and leaderboard." },
];

export default function DataBackupPage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const data = useMemo(collectData, []);
  const keyCount = Object.keys(data).length;
  const sizeKb = useMemo(() => (new Blob([JSON.stringify(data)]).size / 1024).toFixed(1), [data]);

  function exportData() {
    const payload = {
      app: "Tiger Fitness Pro",
      version: 1,
      exportedAt: new Date().toISOString(),
      user: user?.email ?? "guest",
      data: collectData(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tiger-fitness-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus({ kind: "ok", msg: "Backup downloaded successfully." });
  }

  function importData(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const map = parsed?.data ?? parsed;
        if (!map || typeof map !== "object") throw new Error("bad format");
        let n = 0;
        Object.entries(map).forEach(([k, v]) => {
          if (typeof k === "string" && k.startsWith("tfp_") && typeof v === "string") { localStorage.setItem(k, v); n++; }
        });
        setStatus({ kind: "ok", msg: `Imported ${n} items. Reload to see your restored data.` });
      } catch {
        setStatus({ kind: "err", msg: "That file isn't a valid Tiger Fitness backup." });
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Data &amp; Backup</h1>
        <p className="text-sm text-[#f7f0df]/68">Export everything you've tracked, or restore it on another device</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Export / import */}
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">💾 Your data</p>
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4 text-center">
              <p className="text-3xl font-black tabular-nums text-[#d8b35a]">{keyCount}</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#f7f0df]/65">saved items</p>
            </div>
            <div className="flex-1 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-4 text-center">
              <p className="text-3xl font-black tabular-nums text-violet-300">{sizeKb}</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#f7f0df]/65">KB total</p>
            </div>
          </div>

          <button type="button" onClick={exportData} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">⬇ Export Backup (JSON)</button>
          <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 w-full rounded-full border border-[#f7f0df]/15 bg-[#f7f0df]/5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f7f0df]/80 hover:bg-[#f7f0df]/10">⬆ Import Backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importData(e.target.files?.[0])} />

          {status && (
            <p className={`mt-3 rounded-xl p-3 text-center text-xs font-semibold ${status.kind === "ok" ? "bg-emerald-300/10 text-emerald-200" : "bg-rose-400/10 text-rose-200"}`}>{status.msg}</p>
          )}
          <p className="mt-3 text-[11px] text-[#f7f0df]/55">🔒 Your backup is a plain file on your device — nothing is uploaded to any server.</p>
        </div>

        {/* App tour */}
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d8b35a]">🗺️ Quick tour</p>
          <h2 className="mt-1 text-lg font-black">Everything Tiger Fitness Pro offers</h2>
          <div className="mt-4 space-y-2.5">
            {TOUR.map((t) => (
              <div key={t.title} className="flex items-start gap-3 rounded-xl border border-[#f7f0df]/10 bg-[#f7f0df]/5 p-3">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="text-sm font-bold">{t.title}</p>
                  <p className="text-xs text-[#f7f0df]/68">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
