import { lazy, Suspense, useMemo, useState, type ComponentType } from "react";
import { Button, EmptyState, Input, Panel, SectionTitle, Spinner } from "../ui/kit";

/* ═══════════════════════════════════════════════════════════════════
   TOOLS
   ───────────────────────────────────────────────────────────────────
   A browsable index for the standalone calculators and quizzes, each of
   which is a self-contained page. Without an index they are unreachable
   code: 22 components with no route, which is worse than not having
   them, because the build still pays for them.

   Every entry is `lazy()`, so opening this page costs one small chunk
   and the tool's own chunk only once a user picks it. That matters here —
   the main bundle is already over 1 MB.
   ═══════════════════════════════════════════════════════════════════ */

type ToolKind = "calculator" | "planner" | "quiz" | "reference";

type Tool = {
  id: string;
  label: string;
  blurb: string;
  kind: ToolKind;
  /** Search terms beyond the label, for the things people actually type. */
  keywords?: string;
  load: () => Promise<{ default: ComponentType }>;
};

const TOOLS: Tool[] = [
  /* ── body composition ── */
  { id: "bodyfat", label: "Body Fat Estimator", blurb: "Navy-method estimate from tape measurements", kind: "calculator", keywords: "navy caliper composition", load: () => import("./BodyFatEstimator") },
  { id: "waisthip", label: "Waist-to-Hip Ratio", blurb: "Central adiposity and its risk bands", kind: "calculator", keywords: "whr belly", load: () => import("./WaistHipRatio") },
  { id: "goalproject", label: "Weight Goal Projector", blurb: "How long a target takes at a given deficit", kind: "planner", keywords: "timeline deficit surplus", load: () => import("./WeightGoalProjector") },

  /* ── cardio ── */
  { id: "hrzones", label: "Heart Rate Zones", blurb: "Five training zones from your max or resting HR", kind: "calculator", keywords: "zone 2 karvonen bpm", load: () => import("./HeartRateZones") },
  { id: "vo2max", label: "VO₂ Max Estimator", blurb: "Aerobic capacity from a field test", kind: "calculator", keywords: "cooper aerobic fitness", load: () => import("./Vo2MaxEstimator") },
  { id: "pace", label: "Pace Calculator", blurb: "Pace, time and distance — solve for any one", kind: "calculator", keywords: "running split 5k marathon", load: () => import("./PaceCalculator") },
  { id: "burn", label: "Calorie Burn Converter", blurb: "MET-based burn for an activity and duration", kind: "calculator", keywords: "met energy expenditure", load: () => import("./CalorieBurnConverter") },

  /* ── strength ── */
  { id: "rpe", label: "RPE & Load Calculator", blurb: "Convert between RPE, RIR and percentage of 1RM", kind: "calculator", keywords: "rir 1rm autoregulation", load: () => import("./RpeCalculator") },
  { id: "dots", label: "DOTS Score", blurb: "Bodyweight-adjusted strength score", kind: "calculator", keywords: "wilks powerlifting total", load: () => import("./DotsScore") },
  { id: "splitfinder", label: "Split Finder", blurb: "Match a training split to your available days", kind: "planner", keywords: "ppl upper lower bro", load: () => import("./SplitFinder") },
  { id: "wod", label: "Workout of the Day", blurb: "A complete session generated for today", kind: "planner", keywords: "random generator session", load: () => import("./WorkoutOfTheDay") },
  { id: "cooldown", label: "Cooldown Generator", blurb: "A stretch sequence for what you just trained", kind: "planner", keywords: "stretch mobility flexibility", load: () => import("./CooldownGenerator") },

  /* ── nutrition ── */
  { id: "portion", label: "Portion Guide", blurb: "Hand-sized portions for Indian staples", kind: "reference", keywords: "serving size roti rice dal", load: () => import("./PortionGuide") },
  { id: "hydration", label: "Hydration Tracker", blurb: "A daily water target and the day's intake", kind: "planner", keywords: "water litres drink", load: () => import("./HydrationTracker") },

  /* ── learn ── */
  { id: "glossary", label: "Glossary", blurb: "Training and nutrition terms, defined plainly", kind: "reference", keywords: "definitions jargon terms", load: () => import("./Glossary") },
  { id: "flashcards", label: "Flashcards", blurb: "Drill the fundamentals a card at a time", kind: "reference", keywords: "revise memorise study", load: () => import("./Flashcards") },
  { id: "mythbuster", label: "Myth Buster", blurb: "Common claims, and what the evidence says", kind: "quiz", keywords: "myths facts evidence", load: () => import("./MythBuster") },

  /* ── quizzes ── */
  { id: "healthiq", label: "Health IQ Quiz", blurb: "Test what you actually know", kind: "quiz", keywords: "test knowledge score", load: () => import("./HealthIqQuiz") },
  { id: "calorieguess", label: "Calorie Guess", blurb: "Guess the calories, learn the portions", kind: "quiz", keywords: "game estimate food", load: () => import("./CalorieGuess") },
  { id: "thisorthat", label: "This or That", blurb: "Pick the better of two options, fast", kind: "quiz", keywords: "game compare choose", load: () => import("./ThisOrThat") },
  { id: "brainteaser", label: "Brain Teaser", blurb: "Training-logic puzzles", kind: "quiz", keywords: "puzzle riddle game", load: () => import("./BrainTeaser") },
  { id: "dosha", label: "Dosha Quiz", blurb: "Ayurvedic constitution questionnaire", kind: "quiz", keywords: "ayurveda vata pitta kapha prakriti", load: () => import("./DoshaQuiz") },
];

const KIND_LABEL: Record<ToolKind, string> = {
  calculator: "Calculator",
  planner: "Planner",
  quiz: "Quiz",
  reference: "Reference",
};

const FILTERS: Array<{ id: "all" | ToolKind; label: string }> = [
  { id: "all", label: "All" },
  { id: "calculator", label: "Calculators" },
  { id: "planner", label: "Planners" },
  { id: "quiz", label: "Quizzes" },
  { id: "reference", label: "Reference" },
];

/** Cached per id so re-opening a tool does not re-trigger the dynamic import. */
const loaded = new Map<string, ComponentType>();

function componentFor(tool: Tool): ComponentType {
  const existing = loaded.get(tool.id);
  if (existing) return existing;
  const Lazy = lazy(tool.load);
  loaded.set(tool.id, Lazy);
  return Lazy;
}

export default function ToolsGrid() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | ToolKind>("all");

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      if (kind !== "all" && tool.kind !== kind) return false;
      if (!needle) return true;
      return `${tool.label} ${tool.blurb} ${tool.keywords ?? ""}`.toLowerCase().includes(needle);
    });
  }, [query, kind]);

  const open = openId ? TOOLS.find((tool) => tool.id === openId) ?? null : null;

  if (open) {
    const Tool = componentFor(open);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title={open.label} subtitle={open.blurb} />
          <Button variant="ghost" onClick={() => setOpenId(null)}>
            ← All tools
          </Button>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center gap-3 py-16 text-sm opacity-70">
              <Spinner /> Loading {open.label}…
            </div>
          }
        >
          <Tool />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools — try 'zone 2', 'roti', '1rm'"
          className="min-w-[16rem] flex-1"
          aria-label="Search tools"
        />
        {FILTERS.map((filter) => (
          <Button
            key={filter.id}
            variant={kind === filter.id ? "primary" : "ghost"}
            onClick={() => setKind(filter.id)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {matches.length === 0 ? (
        <EmptyState
          title="No tool matches that"
          body="Try a shorter term, or clear the filter to see all 22."
          action={
            <Button
              variant="ghost"
              onClick={() => {
                setQuery("");
                setKind("all");
              }}
            >
              Clear
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((tool) => (
            <Panel key={tool.id} className="flex h-full flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-55">
                {KIND_LABEL[tool.kind]}
              </span>
              <h3 className="text-sm font-bold">{tool.label}</h3>
              <p className="flex-1 text-xs leading-5 opacity-70">{tool.blurb}</p>
              <Button onClick={() => setOpenId(tool.id)}>Open</Button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

/** The tool ids this hub routes — asserted by the proof suite. */
export const TOOL_IDS = TOOLS.map((tool) => tool.id);
