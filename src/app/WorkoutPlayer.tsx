import { useEffect, useMemo, useRef, useState } from "react";

/* ---------------------------------------------------------------- */
/* Live Workout Player — guided session with work/rest timers,       */
/* progress ring, pause/skip, and a confetti completion screen.      */
/* ---------------------------------------------------------------- */

export interface WorkoutExercise {
  name: string;
  seconds: number;
  rest: number;
  tip: string;
  emoji: string;
}

export const WORKOUT_ROUTINES: Record<string, WorkoutExercise[]> = {
  push: [
    { name: "Push-Ups", seconds: 40, rest: 20, tip: "Keep your core tight, elbows at 45°", emoji: "🙌" },
    { name: "Incline DB Press", seconds: 45, rest: 25, tip: "Squeeze chest at the top, slow negative", emoji: "🏋️" },
    { name: "Overhead Press", seconds: 40, rest: 25, tip: "Brace glutes, don't arch the lower back", emoji: "💪" },
    { name: "Lateral Raises", seconds: 35, rest: 20, tip: "Lead with elbows, stop at shoulder height", emoji: "🦅" },
    { name: "Dips", seconds: 40, rest: 25, tip: "Lean slightly forward to hit the chest", emoji: "⬇️" },
    { name: "Diamond Push-Ups", seconds: 30, rest: 20, tip: "Hands under chest, elbows tucked", emoji: "💎" },
    { name: "DB Flyes", seconds: 40, rest: 20, tip: "Slight elbow bend, feel the stretch", emoji: "🦋" },
    { name: "Tricep Extensions", seconds: 35, rest: 0, tip: "Lock elbows in place, full stretch", emoji: "🔨" },
  ],
  pull: [
    { name: "Pull-Ups / Rows", seconds: 40, rest: 25, tip: "Drive elbows down, chest to bar", emoji: "🧗" },
    { name: "Bent-Over Rows", seconds: 45, rest: 25, tip: "Flat back, pull to belly button", emoji: "🏋️" },
    { name: "Lat Pulldown", seconds: 40, rest: 20, tip: "Depress shoulders before pulling", emoji: "⬇️" },
    { name: "Face Pulls", seconds: 35, rest: 20, tip: "Pull to forehead, external rotation", emoji: "😤" },
    { name: "Bicep Curls", seconds: 40, rest: 20, tip: "No swinging — control the negative", emoji: "💪" },
    { name: "Hammer Curls", seconds: 35, rest: 20, tip: "Neutral grip, squeeze at the top", emoji: "🔨" },
    { name: "Shrugs", seconds: 30, rest: 0, tip: "Hold the top for 2 seconds", emoji: "🤷" },
  ],
  legs: [
    { name: "Squats", seconds: 45, rest: 30, tip: "Knees track over toes, hit depth", emoji: "🏋️" },
    { name: "Romanian Deadlifts", seconds: 45, rest: 30, tip: "Hinge at hips, feel the hamstrings", emoji: "🍑" },
    { name: "Walking Lunges", seconds: 40, rest: 25, tip: "Long stride, knee kisses the floor", emoji: "🚶" },
    { name: "Leg Press", seconds: 40, rest: 25, tip: "Don't lock knees at the top", emoji: "🦵" },
    { name: "Leg Curls", seconds: 35, rest: 20, tip: "Squeeze hamstrings, slow tempo", emoji: "🌀" },
    { name: "Calf Raises", seconds: 40, rest: 20, tip: "Full stretch at bottom, pause at top", emoji: "🐐" },
    { name: "Bulgarian Split Squats", seconds: 40, rest: 25, tip: "Torso upright, front foot flat", emoji: "🇧🇬" },
    { name: "Glute Bridges", seconds: 35, rest: 20, tip: "Squeeze glutes hard at lockout", emoji: "🌉" },
    { name: "Wall Sit Finisher", seconds: 45, rest: 0, tip: "Thighs parallel — embrace the burn", emoji: "🧱" },
  ],
  core: [
    { name: "Plank", seconds: 45, rest: 15, tip: "Straight line head to heels", emoji: "🪵" },
    { name: "Crunches", seconds: 40, rest: 15, tip: "Curl up with abs, not your neck", emoji: "🔥" },
    { name: "Russian Twists", seconds: 35, rest: 15, tip: "Rotate from the torso, feet up", emoji: "🌪️" },
    { name: "Leg Raises", seconds: 35, rest: 20, tip: "Press lower back into the floor", emoji: "🦵" },
    { name: "Side Plank (L+R)", seconds: 40, rest: 15, tip: "Stack hips, don't let them sag", emoji: "📐" },
    { name: "Mountain Climbers", seconds: 30, rest: 0, tip: "Fast knees, stable shoulders", emoji: "⛰️" },
  ],
  hiit: [
    { name: "Jumping Jacks", seconds: 30, rest: 15, tip: "Light on your feet, full range", emoji: "🤸" },
    { name: "Burpees", seconds: 30, rest: 20, tip: "Chest to floor, explode up", emoji: "💥" },
    { name: "High Knees", seconds: 30, rest: 15, tip: "Knees to hip height, pump arms", emoji: "🏃" },
    { name: "Squat Jumps", seconds: 30, rest: 20, tip: "Land soft, sink into the squat", emoji: "🦘" },
    { name: "Mountain Climbers", seconds: 30, rest: 15, tip: "Core braced, drive those knees", emoji: "⛰️" },
    { name: "Skater Hops", seconds: 30, rest: 15, tip: "Push off the outside leg", emoji: "⛸️" },
    { name: "Plank Jacks", seconds: 30, rest: 15, tip: "Hips level, hop feet wide", emoji: "🪵" },
    { name: "Sprint in Place", seconds: 25, rest: 20, tip: "Max effort — empty the tank", emoji: "💨" },
    { name: "Burpees Round 2", seconds: 25, rest: 15, tip: "Finish strong, keep form clean", emoji: "💥" },
    { name: "Star Jumps Finisher", seconds: 25, rest: 0, tip: "Explode wide, last push!", emoji: "⭐" },
  ],
  yoga: [
    { name: "Child's Pose", seconds: 45, rest: 5, tip: "Deep breaths, melt into the floor", emoji: "🧘" },
    { name: "Cat-Cow Flow", seconds: 40, rest: 5, tip: "Move with the breath", emoji: "🐱" },
    { name: "Downward Dog", seconds: 45, rest: 5, tip: "Pedal the feet, long spine", emoji: "🐕" },
    { name: "Low Lunge (L)", seconds: 40, rest: 5, tip: "Sink hips forward, open chest", emoji: "🌙" },
    { name: "Low Lunge (R)", seconds: 40, rest: 5, tip: "Even hips, breathe into the stretch", emoji: "🌙" },
    { name: "Pigeon Pose (L)", seconds: 45, rest: 5, tip: "Square the hips, fold forward", emoji: "🕊️" },
    { name: "Pigeon Pose (R)", seconds: 45, rest: 5, tip: "Release tension with each exhale", emoji: "🕊️" },
    { name: "Seated Forward Fold", seconds: 45, rest: 5, tip: "Hinge from hips, soft knees ok", emoji: "🙇" },
    { name: "Supine Twist (L)", seconds: 40, rest: 5, tip: "Both shoulders on the floor", emoji: "🌀" },
    { name: "Supine Twist (R)", seconds: 40, rest: 5, tip: "Let gravity do the work", emoji: "🌀" },
    { name: "Legs Up the Wall", seconds: 50, rest: 5, tip: "Total surrender, slow breathing", emoji: "🦵" },
    { name: "Savasana", seconds: 60, rest: 0, tip: "Complete stillness — you earned it", emoji: "🧘" },
  ],
};

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: (i * 137.5) % 100,
        delay: (i % 12) * 0.12,
        duration: 2.2 + ((i * 7) % 10) / 8,
        color: ["#ea580c", "#f97316", "#fb923c", "#2a1e16", "#34d399"][i % 5],
        size: 6 + ((i * 3) % 8),
        rotate: (i * 47) % 360,
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-[-20px] block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

function ProgressRing({ progress, label, sub }: { progress: number; label: string; sub: string }) {
  return (
    <div className="relative mx-auto h-56 w-56">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(#fdba74 0deg, #fb923c ${progress * 180}deg, #ea580c ${progress * 360}deg, rgba(247,240,223,0.08) ${progress * 360}deg)`,
          transition: "background 0.95s linear",
        }}
      />
      <div className="absolute inset-[10px] rounded-full bg-[#fffdf9]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black tabular-nums">{label}</span>
        <span className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#2a1e16]/65">{sub}</span>
      </div>
    </div>
  );
}

/* Real human demonstration photos (Unsplash CDN, free source) */
const EXERCISE_PHOTOS: [RegExp, string][] = [
  [/push-?up|dip|press|flye|extension/i, "photo-1571019613454-1cb2f99b2d8b"],
  [/pull|row|lat|curl|shrug|face pull/i, "photo-1541534741688-6078c6bfb5c5"],
  [/squat|lunge|leg|calf|glute|wall sit|deadlift/i, "photo-1517963879433-6ad2b056d712"],
  [/plank|crunch|twist|raise|climber|core/i, "photo-1544033527-b192daee1f5b"],
  [/jack|burpee|knee|hop|sprint|jump|star/i, "photo-1434682881908-b43d0467b798"],
  [/pose|dog|fold|pigeon|savasana|child|cat|twist|wall/i, "photo-1518310383802-640c2de311b2"],
];

function exercisePhoto(name: string): string {
  const hit = EXERCISE_PHOTOS.find(([re]) => re.test(name));
  const id = hit ? hit[1] : "photo-1517836357463-d25dfeac3438";
  return `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`;
}

function ExercisePhoto({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="relative mx-auto mt-6 h-44 w-full max-w-xl overflow-hidden rounded-2xl border border-[#2a1e16]/10">
      <img
        src={exercisePhoto(name)}
        alt={`Demonstration: ${name}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#fffdf9]/70 via-transparent to-transparent" />
    </div>
  );
}

export default function WorkoutPlayer({
  planId,
  planTitle,
  onFinish,
  onExit,
}: {
  planId: string;
  planTitle: string;
  onFinish: (xp: number) => void;
  onExit: () => void;
}) {
  const routine = WORKOUT_ROUTINES[planId] ?? WORKOUT_ROUTINES.core;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"work" | "rest" | "done">("work");
  const [remaining, setRemaining] = useState(routine[0].seconds);
  const [paused, setPaused] = useState(false);
  const finishedRef = useRef(false);

  const exercise = routine[idx];
  const totalSeconds = routine.reduce((s, e) => s + e.seconds + e.rest, 0);
  const xpEarned = 50 + routine.length * 10;

  useEffect(() => {
    if (paused || phase === "done") return;
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [paused, phase]);

  useEffect(() => {
    if (remaining > 0 || phase === "done") return;
    if (phase === "work" && exercise.rest > 0) {
      setPhase("rest");
      setRemaining(exercise.rest);
    } else if (idx < routine.length - 1) {
      setIdx(idx + 1);
      setPhase("work");
      setRemaining(routine[idx + 1].seconds);
    } else {
      setPhase("done");
    }
  }, [remaining, phase, idx, exercise.rest, routine]);

  useEffect(() => {
    if (phase === "done" && !finishedRef.current) {
      finishedRef.current = true;
      onFinish(xpEarned);
    }
  }, [phase, onFinish, xpEarned]);

  function skip() {
    if (phase === "work" && exercise.rest > 0) {
      setPhase("rest");
      setRemaining(exercise.rest);
    } else if (idx < routine.length - 1) {
      setIdx(idx + 1);
      setPhase("work");
      setRemaining(routine[idx + 1].seconds);
    } else {
      setPhase("done");
    }
  }

  const phaseSeconds = phase === "work" ? exercise.seconds : exercise.rest;
  const progress = phaseSeconds > 0 ? remaining / phaseSeconds : 0;

  if (phase === "done") {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-[#ea580c]/30 bg-gradient-to-br from-orange-950/60 via-[#fffdf9] to-[#faf4ec] p-8 sm:p-14 text-center">
        <ConfettiBurst />
        <div className="text-7xl">🏆</div>
        <h2 className="mt-6 text-4xl font-black tracking-[-0.03em]">Workout Complete!</h2>
        <p className="mt-3 text-sm text-[#2a1e16]/70">{planTitle} · {routine.length} exercises · ~{Math.round(totalSeconds / 60)} min</p>
        <div className="mx-auto mt-8 inline-flex items-center gap-3 rounded-full border border-[#ea580c]/40 bg-[#ea580c]/10 px-8 py-4">
          <span className="text-2xl">⚡</span>
          <span className="text-xl font-black text-[#ea580c]">+{xpEarned} XP earned</span>
        </div>
        <div className="mt-10">
          <button type="button" onClick={onExit} className="btn-gloss rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-white">
            Back to Workouts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-orange-200/20 bg-gradient-to-br from-orange-950/40 via-[#fffdf9] to-[#faf4ec] p-6 sm:p-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700/70">{planTitle}</p>
          <p className="mt-1 text-sm text-[#2a1e16]/65">Exercise {idx + 1} of {routine.length}</p>
        </div>
        <button type="button" onClick={onExit} className="rounded-full border border-[#2a1e16]/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2a1e16]/70 hover:bg-[#2a1e16]/8">
          ✕ End
        </button>
      </div>

      {/* overall progress bar */}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#2a1e16]/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-300 via-amber-400 to-[#ea580c] transition-all duration-700"
          style={{ width: `${((idx + (phase === "rest" ? 0.7 : progress > 0 ? 1 - progress : 0)) / routine.length) * 100}%` }}
        />
      </div>

      <div className="mt-8 text-center">
        <div className={`text-6xl ${paused ? "" : "animate-bounce"}`} style={{ animationDuration: "2s" }}>{exercise.emoji}</div>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.02em]">
          {phase === "work" ? exercise.name : "Rest & Breathe"}
        </h2>
        <p className="mt-2 text-sm text-[#2a1e16]/68">
          {phase === "work" ? `💡 ${exercise.tip}` : `Up next: ${routine[Math.min(idx + (exercise.rest > 0 && phase === "rest" ? 1 : 0), routine.length - 1)].name}`}
        </p>
        {phase === "work" && <ExercisePhoto name={exercise.name} />}
      </div>

      <div className="mt-8">
        <ProgressRing
          progress={progress}
          label={`${remaining}`}
          sub={phase === "work" ? "seconds — go!" : "rest"}
        />
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setPaused(!paused)}
          className="btn-gloss rounded-full bg-gradient-to-r from-orange-300 via-amber-500 to-orange-700 px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-white"
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <button
          type="button"
          onClick={skip}
          className="rounded-full border border-[#2a1e16]/20 bg-[#2a1e16]/6 px-8 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#2a1e16]/80 hover:bg-[#2a1e16]/12"
        >
          Skip →
        </button>
      </div>
    </div>
  );
}
