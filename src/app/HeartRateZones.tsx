import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";

/* ---------------------------------------------------------------- */
/* Heart-Rate Zones — compute your max HR and five training zones     */
/* from age (and resting HR, if known, via the Karvonen method).      */
/* Each zone shows its bpm range and what it trains. No SVG.          */
/* ---------------------------------------------------------------- */

const ZONES = [
  { lo: 0.5, hi: 0.6, name: "Zone 1 · Recovery", purpose: "Warm-up, cool-down, active recovery", color: "#38bdf8" },
  { lo: 0.6, hi: 0.7, name: "Zone 2 · Endurance", purpose: "Fat-burning, aerobic base building", color: "#34d399" },
  { lo: 0.7, hi: 0.8, name: "Zone 3 · Tempo", purpose: "Aerobic fitness & stamina", color: "#ea580c" },
  { lo: 0.8, hi: 0.9, name: "Zone 4 · Threshold", purpose: "Speed & lactate threshold", color: "#fb7185" },
  { lo: 0.9, hi: 1.0, name: "Zone 5 · Max", purpose: "Peak power, short intervals", color: "#fb923c" },
];

export default function HeartRateZonesPage() {
  const { user } = useAuth();
  const [age, setAge] = useState(String(user?.age ?? 30));
  const [resting, setResting] = useState(""); // optional resting HR

  const data = useMemo(() => {
    const a = Number(age);
    if (!a || a <= 0 || a > 120) return null;
    // Tanaka formula — more accurate than 220−age.
    const maxHR = Math.round(208 - 0.7 * a);
    const rest = Number(resting);
    const useKarvonen = rest > 0 && rest < maxHR;
    const hrr = maxHR - rest; // heart-rate reserve
    const zones = ZONES.map((z) => {
      const bpm = (frac: number) => useKarvonen ? Math.round(rest + hrr * frac) : Math.round(maxHR * frac);
      return { ...z, low: bpm(z.lo), high: bpm(z.hi) };
    });
    return { maxHR, useKarvonen, zones };
  }, [age, resting]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Heart-Rate Zones</h1>
        <p className="text-sm text-[#2a1e16]/68">Train at the right intensity — know your five heart-rate zones</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Age</span>
            <input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Resting HR <span className="font-normal normal-case tracking-normal text-[#2a1e16]/45">· optional, more accurate</span></span>
            <input type="number" inputMode="numeric" value={resting} onChange={(e) => setResting(e.target.value)} placeholder="e.g. 60 bpm" className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
          </label>
        </div>
      </div>

      {data ? (
        <>
          <div className="glass-card rounded-3xl p-8 text-center" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(251,146,60,0.14) 0%, transparent 60%)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a1e16]/62">Estimated Max Heart Rate</p>
            <p className="mt-2 text-5xl font-black tabular-nums text-amber-600">{data.maxHR}<span className="text-xl"> bpm</span></p>
            <p className="mt-2 text-[11px] text-[#2a1e16]/55">{data.useKarvonen ? "Zones use the Karvonen (heart-rate reserve) method." : "Add your resting HR for personalized Karvonen zones."}</p>
          </div>

          <div className="space-y-2.5">
            {data.zones.map((z) => (
              <div key={z.name} className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black" style={{ color: z.color }}>{z.name}</p>
                    <p className="text-[11px] text-[#2a1e16]/62">{z.purpose}</p>
                  </div>
                  <p className="shrink-0 text-lg font-black tabular-nums">{z.low}–{z.high}<span className="text-xs font-normal text-[#2a1e16]/55"> bpm</span></p>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#2a1e16]/10">
                  <div className="h-full rounded-full" style={{ width: `${z.hi * 100}%`, background: z.color }} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">❤️</div>
          <p className="mt-3 text-sm text-[#2a1e16]/68">Enter your age to see your training zones.</p>
        </div>
      )}

      <p className="text-center text-[11px] text-[#2a1e16]/55">Most of your easy cardio should live in Zone 2 — build the aerobic base before chasing intensity.</p>
    </div>
  );
}
