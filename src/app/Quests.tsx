import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { addXP, getXP } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Daily Quests + Shareable Progress Card.                           */
/* Quests rotate each day (seeded by date), award XP on completion.  */
/* The progress card is drawn on a canvas and downloaded as PNG.     */
/* No SVG.                                                           */
/* ---------------------------------------------------------------- */

const QUEST_POOL = [
  { id: "water", icon: "💧", text: "Drink 3 litres of water", xp: 15 },
  { id: "steps", icon: "🚶", text: "Hit 8,000 steps", xp: 20 },
  { id: "protein", icon: "🍗", text: "Eat your protein target", xp: 20 },
  { id: "workout", icon: "💪", text: "Complete a workout", xp: 30 },
  { id: "stretch", icon: "🧘", text: "10 minutes of stretching", xp: 15 },
  { id: "sleep", icon: "😴", text: "Sleep 7+ hours", xp: 20 },
  { id: "nosugar", icon: "🚫", text: "No added sugar today", xp: 25 },
  { id: "meditate", icon: "🙏", text: "5 minutes of breathing", xp: 15 },
  { id: "veggies", icon: "🥗", text: "Eat 3 servings of veg", xp: 15 },
  { id: "walk10k", icon: "🏃", text: "Do 20 min of cardio", xp: 25 },
  { id: "log", icon: "📝", text: "Log your weight or meal", xp: 10 },
  { id: "earlybed", icon: "🌙", text: "In bed before 11 PM", xp: 20 },
];

function todayKey() { return new Date().toISOString().slice(0, 10); }

// Deterministic daily selection (no RNG) — pick 4 quests seeded by the date.
function questsForToday() {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + (d.getMonth() + 1) * 40 + d.getDate();
  const picks: typeof QUEST_POOL = [];
  const used = new Set<number>();
  let i = 0;
  while (picks.length < 4 && used.size < QUEST_POOL.length) {
    const idx = (seed * 7 + i * 13) % QUEST_POOL.length;
    if (!used.has(idx)) { used.add(idx); picks.push(QUEST_POOL[idx]); }
    i++;
  }
  return picks;
}

function DailyQuests() {
  const { user } = useAuth();
  const storeKey = `tfp_quests_${user?.email ?? "guest"}_${todayKey()}`;
  const quests = useMemo(questsForToday, []);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const bonusGiven = useRef(false);

  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(storeKey) ?? "{}")); } catch { setDone({}); }
  }, [storeKey]);

  function toggle(q: typeof QUEST_POOL[number]) {
    setDone((prev) => {
      const nowDone = !prev[q.id];
      const next = { ...prev, [q.id]: nowDone };
      try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* ignore */ }
      if (nowDone) addXP(user?.email, q.xp);
      const all = quests.every((x) => next[x.id]);
      if (all && !bonusGiven.current) { bonusGiven.current = true; addXP(user?.email, 25); }
      return next;
    });
  }

  const completed = quests.filter((q) => done[q.id]).length;
  const pct = completed / quests.length;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">⚔️ Today's Quests</p>
          <h2 className="mt-1 text-xl font-black">Complete all 4 for a +25 XP bonus</h2>
        </div>
        <div className="relative h-16 w-16 shrink-0">
          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#ea580c ${pct * 360}deg, rgba(247,240,223,0.1) ${pct * 360}deg)`, transition: "background 0.4s ease" }} />
          <div className="absolute inset-[5px] grid place-items-center rounded-full bg-[#fffdf9]"><span className="text-sm font-black">{completed}/4</span></div>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        {quests.map((q) => {
          const isDone = !!done[q.id];
          return (
            <button key={q.id} type="button" onClick={() => toggle(q)} className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left transition ${isDone ? "border-[#ea580c]/30 bg-[#ea580c]/10" : "border-[#2a1e16]/10 bg-[#2a1e16]/5 hover:bg-[#2a1e16]/10"}`}>
              <span className={`text-2xl ${isDone ? "" : "grayscale-[0.3]"}`}>{q.icon}</span>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${isDone ? "text-[#2a1e16]/62 line-through" : ""}`}>{q.text}</p>
                <p className="text-[11px] font-bold text-[#ea580c]">+{q.xp} XP</p>
              </div>
              <span className={`grid h-7 w-7 place-items-center rounded-full border-2 ${isDone ? "border-[#ea580c] bg-[#ea580c] text-[#fffdf9]" : "border-[#2a1e16]/25"}`}>{isDone && <span className="text-xs font-black">✓</span>}</span>
            </button>
          );
        })}
      </div>
      {completed === quests.length && <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-center text-sm font-bold text-emerald-200">🎉 All quests done! +25 XP bonus claimed</div>}
    </div>
  );
}

/* ===== Shareable progress card (canvas → PNG) =================== */
function ShareCard() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const xp = getXP(user?.email);
  const workouts = user?.stats?.totalWorkouts ?? 0;
  const streak = user?.streak ?? 0;

  function draw() {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const W = 1080, H = 1080;
    cv.width = W; cv.height = H;

    // background gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#2a0e52"); g.addColorStop(0.5, "#1e1b4b"); g.addColorStop(1, "#faf4ec");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // glow blobs
    const blob = (x: number, y: number, r: number, c: string) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, c); rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    };
    blob(220, 220, 360, "rgba(249,115,22,0.4)");
    blob(880, 820, 420, "rgba(251,146,60,0.35)");

    ctx.textAlign = "center";
    ctx.fillStyle = "#ea580c";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText("THE TITAN FITNESS", W / 2, 150);

    ctx.fillStyle = "#2a1e16";
    ctx.font = "900 84px sans-serif";
    ctx.fillText(user?.name ?? "My Progress", W / 2, 300);

    ctx.font = "bold 34px sans-serif";
    ctx.fillStyle = "rgba(247,240,223,0.7)";
    ctx.fillText("My Fitness Journey", W / 2, 360);

    // stat tiles
    const stats = [
      { v: `${xp.toLocaleString()}`, l: "TOTAL XP", c: "#ea580c" },
      { v: `${workouts}`, l: "WORKOUTS", c: "#f97316" },
      { v: `${streak}`, l: "DAY STREAK", c: "#fb923c" },
    ];
    const tileW = 300, gap = 30, startX = (W - (tileW * 3 + gap * 2)) / 2, y = 460, tileH = 300;
    stats.forEach((s, i) => {
      const x = startX + i * (tileW + gap);
      ctx.fillStyle = "rgba(247,240,223,0.06)";
      roundRect(ctx, x, y, tileW, tileH, 32); ctx.fill();
      ctx.strokeStyle = "rgba(249,115,22,0.25)"; ctx.lineWidth = 2; roundRect(ctx, x, y, tileW, tileH, 32); ctx.stroke();
      ctx.fillStyle = s.c; ctx.font = "900 96px sans-serif";
      ctx.fillText(s.v, x + tileW / 2, y + 160);
      ctx.fillStyle = "rgba(247,240,223,0.65)"; ctx.font = "bold 30px sans-serif";
      ctx.fillText(s.l, x + tileW / 2, y + 220);
    });

    // footer
    ctx.fillStyle = "#2a1e16"; ctx.font = "900 60px sans-serif";
    ctx.fillText("⚡ Stronger every day", W / 2, 900);
    ctx.fillStyle = "rgba(247,240,223,0.5)"; ctx.font = "bold 30px sans-serif";
    ctx.fillText("The Titan Fitness", W / 2, 970);
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  useEffect(() => { draw(); /* eslint-disable-next-line */ }, [xp, workouts, streak, user]);

  function download() {
    const cv = canvasRef.current;
    if (!cv) return;
    const a = document.createElement("a");
    a.href = cv.toDataURL("image/png");
    a.download = "the-titan-fitness-progress.png";
    a.click();
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">📸 Shareable Progress Card</p>
      <h2 className="mt-1 text-xl font-black">Show off your journey</h2>
      <p className="mt-1 text-xs text-[#2a1e16]/65">A ready-to-post image with your live stats — download and share it anywhere.</p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#2a1e16]/10">
        <canvas ref={canvasRef} className="block w-full" style={{ aspectRatio: "1/1" }} />
      </div>

      <button type="button" onClick={download} className="btn-gloss mt-4 w-full rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">⬇ Download Card (PNG)</button>
    </div>
  );
}

export default function QuestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Quests &amp; Share</h1>
        <p className="text-sm text-[#2a1e16]/68">Knock out daily quests for XP, then share your progress card</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <DailyQuests />
        <ShareCard />
      </div>
    </div>
  );
}
