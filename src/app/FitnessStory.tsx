import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { getXP, LEVELS } from "./Achievements";

/* ---------------------------------------------------------------- */
/* Fitness Story — a Spotify-Wrapped-style, auto-advancing, tappable  */
/* story recap of the user's real stats. Full-bleed animated gradient */
/* scenes with big numbers; tap left/right to move, hold to pause.    */
/* Ends on a shareable summary card (canvas → PNG). No SVG.           */
/* ---------------------------------------------------------------- */

const SLIDE_MS = 4200;

function readJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}

interface Slide {
  bg: string;         // gradient background
  emoji: string;
  big: string;        // the headline number/word
  label: string;      // supporting caption
  sub?: string;
}

export default function FitnessStoryPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const email = user?.email;
    const xp = getXP(email);
    const workouts = user?.stats?.totalWorkouts ?? 0;
    const streak = user?.streak ?? 0;
    const levelIdx = LEVELS.reduce((acc, l, i) => (xp >= l.min ? i : acc), 0);
    const level = LEVELS[levelIdx];

    const consistency = readJSON<Record<string, number>>(`tfp_consistency_${email ?? "guest"}`, {});
    const activeDays = Object.keys(consistency).length;

    const calendar = readJSON<Record<string, { planId: string; done: boolean }>>(`tfp_calendar_${email ?? "guest"}`, {});
    const planCounts: Record<string, number> = {};
    Object.values(calendar).forEach((e) => { if (e.planId && e.planId !== "rest") planCounts[e.planId] = (planCounts[e.planId] ?? 0) + 1; });
    const favPlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const PLAN_LABELS: Record<string, string> = { push: "Push Strength", pull: "Pull Power", legs: "Leg Day", core: "Core Crusher", hiit: "HIIT Cardio", yoga: "Recovery Yoga" };

    const mood = readJSON<{ date: string; moodId: string }[]>(`tfp_mood_journal_${email ?? "guest"}`, []);
    const moodDays = mood.length;

    return { xp, workouts, streak, level, activeDays, favPlan: favPlan ? PLAN_LABELS[favPlan] ?? favPlan : null, moodDays };
  }, [user]);

  const slides = useMemo<Slide[]>(() => {
    const s: Slide[] = [
      { bg: "linear-gradient(160deg,#3b0764,#1e1b4b,#faf4ec)", emoji: "⚡", big: user?.name?.split(" ")[0] ?? "Titan", label: "Here's your fitness story", sub: "Tap to continue →" },
      { bg: "linear-gradient(160deg,#7c2d12,#c2410c,#2a0e52)", emoji: "💪", big: `${stats.workouts}`, label: stats.workouts === 1 ? "workout completed" : "workouts completed", sub: "Every rep counted." },
      { bg: "linear-gradient(160deg,#7c2d12,#ea580c,#2a0e52)", emoji: "🔥", big: `${stats.streak}`, label: "day best streak", sub: stats.streak >= 7 ? "Unstoppable consistency!" : "The chain is growing." },
      { bg: "linear-gradient(160deg,#0e7490,#38bdf8,#faf4ec)", emoji: "⚡", big: stats.xp.toLocaleString(), label: "total XP earned", sub: `You're a ${stats.level.name} ${stats.level.icon}` },
      { bg: "linear-gradient(160deg,#065f46,#34d399,#faf4ec)", emoji: "🗓️", big: `${stats.activeDays}`, label: "active days logged", sub: "Showing up is the win." },
    ];
    if (stats.favPlan) s.push({ bg: "linear-gradient(160deg,#831843,#fb923c,#2a0e52)", emoji: "🏆", big: stats.favPlan, label: "your go-to workout", sub: "You've got a favorite." });
    s.push({ bg: "linear-gradient(160deg,#3b0764,#ea580c,#faf4ec)", emoji: "🐯", big: "Keep going", label: "Your best is still ahead", sub: "Share your story below" });
    return s;
  }, [stats, user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Your Fitness Story</h1>
        <p className="text-sm text-[#2a1e16]/68">A cinematic recap of everything you've achieved</p>
      </div>

      {/* Cover card */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass-card group relative w-full overflow-hidden rounded-3xl p-8 text-left transition hover:-translate-y-1"
        style={{ background: "linear-gradient(135deg,#3b0764,#c2410c,#ea580c)" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-black/10 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-black/80">Tap to play ▶</p>
          <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white">{user?.name?.split(" ")[0] ?? "Titan"}'s<br />Fitness Story</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {[
              { v: stats.workouts, l: "workouts" },
              { v: stats.xp.toLocaleString(), l: "XP" },
              { v: stats.streak, l: "day streak" },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-black/25 px-4 py-2 backdrop-blur">
                <p className="text-xl font-black tabular-nums text-white">{x.v}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-black/70">{x.l}</p>
              </div>
            ))}
          </div>
        </div>
      </button>

      <p className="text-center text-xs text-[#2a1e16]/55">Your story updates automatically as you train, log, and level up.</p>

      {open && <StoryPlayer slides={slides} stats={stats} userName={user?.name?.split(" ")[0] ?? "Titan"} onClose={() => setOpen(false)} />}
    </div>
  );
}

function StoryPlayer({ slides, stats, userName, onClose }: { slides: Slide[]; stats: { workouts: number; xp: number; streak: number; level: { name: string; icon: string } }; userName: string; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const isLast = idx === slides.length - 1;

  useEffect(() => { setProgress(0); }, [idx]);

  useEffect(() => {
    if (paused || isLast) return;
    const step = 50;
    const t = setInterval(() => {
      setProgress((p) => {
        const next = p + (step / SLIDE_MS) * 100;
        if (next >= 100) { setIdx((i) => Math.min(i + 1, slides.length - 1)); return 0; }
        return next;
      });
    }, step);
    return () => clearInterval(t);
  }, [paused, isLast, slides.length]);

  function go(dir: -1 | 1) {
    setIdx((i) => Math.max(0, Math.min(slides.length - 1, i + dir)));
  }

  const slide = slides[idx];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm">
      <div className="relative flex h-full max-h-[780px] w-full max-w-sm flex-col overflow-hidden rounded-3xl">
        {/* animated background */}
        <div key={idx} className="absolute inset-0" style={{ background: slide.bg, backgroundSize: "180% 180%", animation: "gradientShift 8s ease infinite" }} />
        <div className="pointer-events-none absolute -left-10 top-1/4 h-48 w-48 rounded-full bg-black/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-1/4 h-56 w-56 rounded-full bg-black/20 blur-3xl" />

        {/* progress bars */}
        <div className="relative z-10 flex gap-1 p-3">
          {slides.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-black/25">
              <div className="h-full rounded-full bg-white" style={{ width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%" }} />
            </div>
          ))}
        </div>

        {/* close */}
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-8 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/30 text-white">✕</button>

        {/* tap zones */}
        <button type="button" aria-label="Previous" onClick={() => go(-1)} className="absolute left-0 top-16 z-10 h-full w-1/3" />
        <button
          type="button"
          aria-label="Next"
          onClick={() => (isLast ? undefined : go(1))}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          className="absolute right-0 top-16 z-10 h-full w-2/3"
        />

        {/* content */}
        <div key={`c${idx}`} className="relative z-[5] flex flex-1 flex-col items-center justify-center px-8 text-center" style={{ animation: "fadeUp 0.5s ease both" }}>
          <div className="text-6xl drop-shadow-lg">{slide.emoji}</div>
          <p className="mt-6 text-5xl font-black leading-tight tracking-[-0.04em] text-white drop-shadow-lg">{slide.big}</p>
          <p className="mt-3 text-lg font-bold text-black/90">{slide.label}</p>
          {slide.sub && <p className="mt-2 text-sm text-black/70">{slide.sub}</p>}

          {isLast && (
            <button
              type="button"
              onClick={() => shareStory(stats, userName)}
              className="btn-gloss mt-8 rounded-full bg-white px-8 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-[#3b0764]"
            >
              ⬇ Download My Story Card
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function shareStory(stats: { workouts: number; xp: number; streak: number; level: { name: string; icon: string } }, userName: string) {
  const W = 1080, H = 1920;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  if (!ctx) return;

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#3b0764"); g.addColorStop(0.5, "#c2410c"); g.addColorStop(1, "#faf4ec");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const blob = (x: number, y: number, r: number, c: string) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, c); rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };
  blob(240, 360, 420, "rgba(251,146,60,0.4)");
  blob(880, 1500, 520, "rgba(234,88,12,0.35)");

  ctx.textAlign = "center";
  ctx.fillStyle = "#ea580c"; ctx.font = "bold 46px sans-serif";
  ctx.fillText("THE TITAN FITNESS", W / 2, 220);
  ctx.fillStyle = "#2a1e16"; ctx.font = "900 96px sans-serif";
  ctx.fillText(`${userName}'s Story`, W / 2, 360);

  const rows: [string, string, string][] = [
    ["💪", `${stats.workouts}`, "WORKOUTS"],
    ["⚡", stats.xp.toLocaleString(), "TOTAL XP"],
    ["🔥", `${stats.streak}`, "DAY STREAK"],
    [stats.level.icon, stats.level.name.toUpperCase(), "CURRENT LEVEL"],
  ];
  let y = 620;
  rows.forEach(([icon, val, label]) => {
    ctx.font = "80px sans-serif"; ctx.fillText(icon, W / 2, y);
    ctx.fillStyle = "#2a1e16"; ctx.font = "900 120px sans-serif"; ctx.fillText(val, W / 2, y + 130);
    ctx.fillStyle = "rgba(247,240,223,0.65)"; ctx.font = "bold 38px sans-serif"; ctx.fillText(label, W / 2, y + 185);
    y += 300;
  });

  ctx.fillStyle = "#2a1e16"; ctx.font = "900 56px sans-serif";
  ctx.fillText("🐯 Keep going.", W / 2, H - 120);

  const a = document.createElement("a");
  a.href = cv.toDataURL("image/png");
  a.download = "my-titan-fitness-story.png";
  a.click();
}
