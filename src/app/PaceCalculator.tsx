import { useMemo, useState } from "react";

/* ---------------------------------------------------------------- */
/* Running Pace Calculator — enter any two of distance / time / pace  */
/* and get your pace, speed, and predicted finish times for common    */
/* race distances. Pure client-side, metric. No SVG.                  */
/* ---------------------------------------------------------------- */

// Common race distances in km.
const RACES = [
  { label: "5K", km: 5 },
  { label: "10K", km: 10 },
  { label: "Half Marathon", km: 21.0975 },
  { label: "Marathon", km: 42.195 },
];

function fmtTime(totalSec: number): string {
  if (!isFinite(totalSec) || totalSec <= 0) return "—";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.round(totalSec % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function fmtPace(secPerKm: number): string {
  if (!isFinite(secPerKm) || secPerKm <= 0) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PaceCalculatorPage() {
  const [distance, setDistance] = useState("5"); // km
  const [hours, setHours] = useState("0");
  const [mins, setMins] = useState("25");
  const [secs, setSecs] = useState("0");

  const calc = useMemo(() => {
    const km = Number(distance);
    const totalSec = (Number(hours) || 0) * 3600 + (Number(mins) || 0) * 60 + (Number(secs) || 0);
    if (!km || km <= 0 || totalSec <= 0) return null;
    const secPerKm = totalSec / km;
    const kmh = km / (totalSec / 3600);
    // Riegel's formula for race-time prediction: t2 = t1 * (d2/d1)^1.06
    const predictions = RACES.map((r) => ({
      ...r,
      sec: totalSec * Math.pow(r.km / km, 1.06),
    }));
    return { secPerKm, kmh, predictions };
  }, [distance, hours, mins, secs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Running Pace Calculator</h1>
        <p className="text-sm text-[#2a1e16]/68">Find your pace and predict race times from a single run</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Distance (km)</span>
          <input type="number" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-sm outline-none focus:border-orange-200/40" />
        </label>

        <p className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/65">Time</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { v: hours, set: setHours, label: "Hours" },
            { v: mins, set: setMins, label: "Minutes" },
            { v: secs, set: setSecs, label: "Seconds" },
          ].map((f) => (
            <label key={f.label} className="block">
              <span className="mb-1 block text-[10px] font-semibold text-[#2a1e16]/55">{f.label}</span>
              <input type="number" inputMode="numeric" value={f.v} onChange={(e) => f.set(e.target.value)} className="w-full rounded-xl border border-[#2a1e16]/12 bg-[#fffdf9] px-4 py-2.5 text-center text-sm outline-none focus:border-orange-200/40" />
            </label>
          ))}
        </div>

        {/* Quick presets */}
        <div className="mt-4 flex flex-wrap gap-2">
          {RACES.map((r) => (
            <button key={r.label} type="button" onClick={() => setDistance(String(r.km))} className="rounded-full border border-[#2a1e16]/12 bg-[#2a1e16]/5 px-4 py-1.5 text-xs font-bold text-[#2a1e16]/70 transition hover:text-[#2a1e16]">{r.label}</button>
          ))}
        </div>
      </div>

      {calc ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-2xl p-6 text-center" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.16) 0%, transparent 60%)" }}>
              <p className="text-3xl font-black tabular-nums text-orange-700">{fmtPace(calc.secPerKm)}</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/62">min / km</p>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(251,146,60,0.16) 0%, transparent 60%)" }}>
              <p className="text-3xl font-black tabular-nums text-amber-600">{calc.kmh.toFixed(2)}</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2a1e16]/62">km / h</p>
            </div>
          </div>

          {/* Race predictions */}
          <div className="glass-card rounded-2xl p-6">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#ea580c]">Predicted Race Times</p>
            <p className="mb-4 text-[11px] text-[#2a1e16]/55">Estimated with Riegel's endurance model from your entered effort.</p>
            <div className="space-y-2.5">
              {calc.predictions.map((p) => (
                <div key={p.label} className="flex items-center justify-between rounded-xl border border-[#2a1e16]/10 bg-[#2a1e16]/5 p-4">
                  <div>
                    <p className="text-sm font-black">{p.label}</p>
                    <p className="text-[11px] text-[#2a1e16]/55">{p.km} km · {fmtPace(p.sec / p.km)} /km</p>
                  </div>
                  <p className="text-lg font-black tabular-nums text-orange-700">{fmtTime(p.sec)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="text-4xl">🏃</div>
          <p className="mt-3 text-sm text-[#2a1e16]/68">Enter a distance and a time to see your pace and race predictions.</p>
        </div>
      )}

      <p className="text-center text-[11px] text-[#2a1e16]/55">Predictions assume similar effort and adequate training at each distance — treat them as targets, not guarantees.</p>
    </div>
  );
}
