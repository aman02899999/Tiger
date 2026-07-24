import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP, getXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Daily Rewards — spin-the-wheel XP (once per day) + water tracker. */
/* ---------------------------------------------------------------- */

const SEGMENTS = [
  { label: "20 XP", xp: 20, color: "#c2410c" },
  { label: "50 XP", xp: 50, color: "#f97316" },
  { label: "10 XP", xp: 10, color: "#fb923c" },
  { label: "100 XP", xp: 100, color: "#ea580c" },
  { label: "30 XP", xp: 30, color: "#f97316" },
  { label: "75 XP", xp: 75, color: "#c084fc" },
  { label: "15 XP", xp: 15, color: "#f0abfc" },
  { label: "200 XP", xp: 200, color: "#f59e0b" },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function SpinWheel({ email }: { email: string }) {
  const spinKey = `tfp_spin_${email}`;
  const [spunToday, setSpunToday] = useState(() => localStorage.getItem(spinKey) === todayKey());
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<number | null>(null);

  const wheelGradient = useMemo(() => {
    const step = 360 / SEGMENTS.length;
    return `conic-gradient(${SEGMENTS.map((s, i) => `${s.color} ${i * step}deg ${(i + 1) * step}deg`).join(", ")})`;
  }, []);

  function spin() {
    if (spinning || spunToday) return;
    setSpinning(true);
    setWon(null);
    const winner = Math.floor(Math.random() * SEGMENTS.length);
    const step = 360 / SEGMENTS.length;
    // pointer sits at top (0deg); rotate so winner segment center lands under it
    const target = 360 * 6 + (360 - (winner * step + step / 2));
    setRotation((r) => r + target - (r % 360));
    setTimeout(() => {
      const prize = SEGMENTS[winner].xp;
      addXP(email, prize);
      localStorage.setItem(spinKey, todayKey());
      setWon(prize);
      setSpunToday(true);
      setSpinning(false);
    }, 4200);
  }

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ea580c]">🎡 Daily Spin</p>
      <h2 className="mt-2 text-2xl font-black">Spin for Bonus XP</h2>
      <p className="mt-1 text-sm text-[#2a1e16]/68">One free spin every day — up to 200 XP</p>

      <div className="relative mx-auto mt-8 h-72 w-72">
        {/* pointer */}
        <div className="absolute left-1/2 top-[-10px] z-10 -translate-x-1/2 text-3xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">🔻</div>
        {/* wheel */}
        <div
          className="h-full w-full rounded-full border-4 border-[#ea580c]/50 shadow-[0_0_60px_rgba(234,88,12,0.25),inset_0_0_40px_rgba(0,0,0,0.4)]"
          style={{
            background: wheelGradient,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4.2s cubic-bezier(0.12, 0.8, 0.16, 1)" : "none",
          }}
        >
          {SEGMENTS.map((s, i) => {
            const angle = (i + 0.5) * (360 / SEGMENTS.length);
            return (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 text-[11px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                style={{ transform: `rotate(${angle}deg) translateY(-108px) translateX(-50%)` }}
              >
                {s.label}
              </span>
            );
          })}
        </div>
        {/* hub */}
        <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#ea580c]/60 bg-[#fffdf9] text-2xl shadow-[0_0_24px_rgba(234,88,12,0.4)]">
          ⚡
        </div>
      </div>

      {won !== null && (
        <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-[#ea580c]/40 bg-[#ea580c]/12 px-6 py-3">
          <span className="text-xl">🎉</span>
          <span className="font-black text-[#ea580c]">You won +{won} XP!</span>
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={spin}
          disabled={spinning || spunToday}
          className={`btn-gloss rounded-full px-12 py-4 text-xs font-black uppercase tracking-[0.2em] transition ${
            spunToday
              ? "cursor-not-allowed border border-[#2a1e16]/15 bg-[#2a1e16]/6 text-[#2a1e16]/60"
              : "bg-gradient-to-r from-[#ea580c] to-orange-400 text-[#f4ead9] shadow-[0_12px_40px_rgba(234,88,12,0.3)]"
          }`}
        >
          {spinning ? "Spinning…" : spunToday ? "✓ Come back tomorrow" : "Spin Now — Free"}
        </button>
      </div>
    </div>
  );
}

const GLASS_ML = 250;
const GOAL_ML = 3000;

function WaterTracker({ email }: { email: string }) {
  const key = `tfp_water_${email}_${todayKey()}`;
  const [ml, setMl] = useState(() => parseInt(localStorage.getItem(key) ?? "0", 10) || 0);
  const [justDrank, setJustDrank] = useState(false);

  useEffect(() => {
    localStorage.setItem(key, String(ml));
  }, [key, ml]);

  function drink(amount: number) {
    const next = Math.max(0, Math.min(ml + amount, GOAL_ML + 1000));
    if (amount > 0 && ml < GOAL_ML && next >= GOAL_ML) addXP(email, 25);
    setMl(next);
    if (amount > 0) {
      setJustDrank(true);
      setTimeout(() => setJustDrank(false), 600);
    }
  }

  const pct = Math.min(ml / GOAL_ML, 1);

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-sky-300">💧 Hydration</p>
      <h2 className="mt-2 text-2xl font-black">Water Tracker</h2>
      <p className="mt-1 text-sm text-[#2a1e16]/68">Hit {GOAL_ML / 1000}L today and earn +25 XP</p>

      <div className="mt-8 flex items-center gap-8">
        {/* animated bottle */}
        <div className="relative h-56 w-28 shrink-0 overflow-hidden rounded-b-3xl rounded-t-xl border-2 border-sky-300/30 bg-sky-300/5">
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
            style={{
              height: `${pct * 100}%`,
              background: "linear-gradient(180deg, rgba(125,211,252,0.85) 0%, rgba(56,189,248,0.9) 60%, rgba(14,165,233,0.95) 100%)",
              boxShadow: "0 -4px 20px rgba(56,189,248,0.4)",
            }}
          />
          <div className={`absolute inset-0 grid place-items-center text-3xl transition-transform ${justDrank ? "scale-125" : ""}`}>
            {pct >= 1 ? "🏆" : "💧"}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-4xl font-black tabular-nums">
            {(ml / 1000).toFixed(2)}<span className="text-lg text-[#2a1e16]/65"> / {GOAL_ML / 1000} L</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2a1e16]/10">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-300 to-sky-500 transition-all duration-700" style={{ width: `${pct * 100}%` }} />
          </div>
          {pct >= 1 && <p className="mt-3 text-sm font-bold text-emerald-300">Goal smashed! +25 XP awarded 🎉</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => drink(GLASS_ML)} className="btn-gloss rounded-full bg-gradient-to-r from-sky-400 to-sky-600 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
              + Glass ({GLASS_ML}ml)
            </button>
            <button type="button" onClick={() => drink(500)} className="rounded-full border border-sky-300/30 bg-sky-300/10 px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-200 hover:bg-sky-300/20">
              + Bottle (500ml)
            </button>
            <button type="button" onClick={() => drink(-GLASS_ML)} className="rounded-full border border-[#2a1e16]/15 px-4 py-3 text-xs font-bold text-[#2a1e16]/65 hover:bg-[#2a1e16]/8">
              Undo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DailyRewardsPage() {
  const { user } = useAuth();
  const email = user?.email ?? "guest";
  const xp = getXP(email);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">Daily Rewards</h1>
          <p className="text-sm text-[#2a1e16]/68">Free XP every day — spin, hydrate, stay consistent</p>
        </div>
        <div className="rounded-full border border-[#ea580c]/30 bg-[#ea580c]/10 px-5 py-2.5 text-sm font-black text-[#ea580c]">⚡ {xp.toLocaleString()} XP</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SpinWheel email={email} />
        <WaterTracker email={email} />
      </div>
    </div>
  );
}
