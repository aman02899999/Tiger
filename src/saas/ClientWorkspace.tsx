/* ═══════════════════════════════════════════════════════════════════
   MEMBER WORKSPACE
   ───────────────────────────────────────────────────────────────────
   What a member can do here, and what they deliberately cannot:

     CAN  read the program a trainer published, log performance against
          it, record weight/measurements, log nutrition and hydration,
          request appointments, read shared coach notes, see honest
          analytics of their own records.
     CANNOT create or edit the prescription, edit another member's
          records, change their role/gym, or touch anything commercial.

   Every number on this screen comes from Firestore (or the demo
   tenant). When a record does not exist the UI says "No data yet".
   ═══════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { useAsyncData, useTenant } from "../data/DataProvider";
import {
  adherenceRate,
  currentStreak,
  goalProgress,
  nutritionAdherence,
  personalRecords,
  relativeTime,
  weeklyVolumeSeries,
  weightTrendPerWeek,
  isoDay,
} from "../data/analytics";
import type { SetLog, WorkoutDay } from "../domain/models";
import { PermissionError } from "../security/permissions";
import {
  Avatar,
  Button,
  Chip,
  DataTable,
  Divider,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  MetricGrid,
  NoData,
  Panel,
  ProgressBar,
  Ring,
  Segmented,
  Select,
  Stat,
  Tabs,
  Textarea,
  useToast,
} from "../ui/kit";
import { BarSeries, HeatStrip, Sparkline, TrendChart } from "../ui/charts";
import { WorkspaceFrame, type NavGroup } from "./Shell";
import ClientBilling from "./ClientBilling";
import Pricing from "./Pricing";
import { Dashboard as LegacyDashboard, SettingsPage } from "../app/SaaSApp";
import NutritionTracker from "../app/NutritionTracker";
import WorkoutCalendarPage from "../app/WorkoutCalendar";
import MacroBuilderPage from "../app/MacroBuilder";
import RecipeHubPage from "../app/RecipeHub";
import SleepRecoveryPage from "../app/SleepRecovery";
import MoodJournalPage from "../app/MoodJournal";
import ProgressPhotosPage from "../app/ProgressPhotos";
import BodyMetricsPage from "../app/BodyMetrics";
import ChallengesPage from "../app/Challenges";
import AchievementsPage from "../app/Achievements";
import CoursesPage from "../app/Courses";
import PDFStorePage from "../app/PDFStore";
import ToolsGrid from "../app/ToolsGrid";
import YogaPage from "../app/Yoga";
import MeditationPage from "../app/Meditation";
import PhysioRehabPage from "../app/PhysioRehab";
import BloodReportPage from "../app/BloodReport";
import AICoachPage from "../app/AICoach";
import StrengthLabPage from "../app/StrengthLab";
import FitnessToolbox from "../app/Toolbox";
import WorkoutPlayer from "../app/WorkoutPlayer";

type Section =
  | "today"
  | "plan"
  | "coach"
  | "schedule"
  | "progress"
  | "goals"
  | "nutrition"
  | "billing"
  | "plans"
  | "switchboard"
  | "nutritionLogger"
  | "calendar"
  | "macros"
  | "recipes"
  | "recovery"
  | "mood"
  | "photos"
  | "metrics"
  | "challenges"
  | "achievements"
  | "courses"
  | "guides"
  | "yoga"
  | "meditation"
  | "physio"
  | "blood"
  | "aicoach"
  | "strengthlab"
  | "toolbox"
  | "tools"
  | "player"
  | "settings";

const LIBRARY_GROUPS: NavGroup[] = [
  {
    group: "Library",
    items: [
      { id: "switchboard", label: "Tracker Home" },
      { id: "nutritionLogger", label: "Food Log" },
      { id: "recovery", label: "Sleep & Recovery" },
      { id: "metrics", label: "Body Metrics" },
      { id: "photos", label: "Progress Photos" },
      { id: "calendar", label: "Training Calendar" },
      { id: "strengthlab", label: "Strength Lab" },
      { id: "aicoach", label: "AI Coach" },
      { id: "tools", label: "Tools" },
    ],
  },
  {
    group: "Wellness",
    items: [
      { id: "yoga", label: "Yoga Studio" },
      { id: "meditation", label: "Meditation" },
      { id: "mood", label: "Mood Journal" },
      { id: "physio", label: "Physio & Rehab" },
      { id: "blood", label: "Lab Report Reader" },
    ],
  },
  {
    group: "Nutrition library",
    items: [
      { id: "macros", label: "Macro Builder" },
      { id: "recipes", label: "Recipe Hub" },
      { id: "nutrition", label: "Auto Diet" },
    ],
  },
  {
    group: "Programs & rewards",
    items: [
      { id: "courses", label: "Courses" },
      { id: "guides", label: "Guide Library" },
      { id: "challenges", label: "Challenges" },
      { id: "achievements", label: "Achievements" },
    ],
  },
];

export default function ClientWorkspace() {
  const { user, gym, demo } = useAuth();
  const tenant = useTenant();
  const toast = useToast();
  const [section, setSection] = useState<Section>("today");

  const home = useAsyncData(() => tenant.loadClientHome(), [tenant, user?.id, demo]);
  const state = home.data;

  const nav: NavGroup[] = useMemo(
    () => [
      {
        group: "Today",
        items: [
          { id: "today", label: "Today's Session" },
          { id: "coach", label: "My Coach" },
          { id: "schedule", label: "Appointments" },
        ],
      },
      {
        group: "Programme",
        items: [
          { id: "plan", label: "My Program" },
          { id: "progress", label: "Progress" },
          { id: "goals", label: "Goals" },
          { id: "nutrition", label: "Nutrition Targets" },
        ],
      },
      ...LIBRARY_GROUPS,
      {
        group: "Account",
        items: [
          { id: "plans", label: "Upgrade" },
          { id: "billing", label: "Plan & Billing" },
          { id: "settings", label: "Settings" },
        ],
      },
    ],
    [],
  );

  const titles: Record<string, { title: string; subtitle: string }> = {
    today: { title: "Today's session", subtitle: "Assigned by your coach — log it as you train" },
    coach: { title: "My coach", subtitle: "Your trainer, shared notes and targets" },
    schedule: { title: "Appointments", subtitle: "Booked and requested sessions" },
    plan: { title: "My program", subtitle: "The prescription your trainer published" },
    progress: { title: "Progress", subtitle: "Derived from records you and your coach logged" },
    goals: { title: "Goals", subtitle: "Targets you and your coach agreed" },
    nutrition: { title: "Nutrition", subtitle: "Targets, adherence and hydration" },
    billing: { title: "Plan & billing", subtitle: "Entitlement is issued by the payment backend" },
    switchboard: { title: "Tracker home", subtitle: "Personal tracking tools" },
    nutritionLogger: { title: "Food log", subtitle: "Track what you ate" },
    calendar: { title: "Training calendar", subtitle: "Plan your week" },
    macros: { title: "Macro builder", subtitle: "Design your own split" },
    recipes: { title: "Recipe hub", subtitle: "Indian-first meal ideas" },
    recovery: { title: "Sleep & recovery", subtitle: "Sleep debt and recovery signals" },
    mood: { title: "Mood journal", subtitle: "Stress and mood over time" },
    photos: { title: "Progress photos", subtitle: "Visual timeline (device-local)" },
    metrics: { title: "Body metrics", subtitle: "Measurements and composition" },
    challenges: { title: "Challenges", subtitle: "Community challenges" },
    achievements: { title: "Achievements", subtitle: "Milestones you have earned" },
    courses: { title: "Courses", subtitle: "Structured learning" },
    guides: { title: "Guide library", subtitle: "Downloadable programmes" },
    yoga: { title: "Yoga studio", subtitle: "Guided sequences" },
    meditation: { title: "Meditation", subtitle: "Breath and focus practice" },
    physio: { title: "Physio & rehab", subtitle: "Rehabilitation protocols" },
    blood: { title: "Lab report reader", subtitle: "Educational reference ranges — not a diagnosis" },
    aicoach: { title: "AI coach", subtitle: "Rule-based guidance from your own records" },
    strengthlab: { title: "Strength lab", subtitle: "Load, 1RM estimates and standards" },
    toolbox: { title: "Toolbox", subtitle: "Calculators and utilities" },
    tools: { title: "Tools", subtitle: "22 calculators, planners and quizzes — each opens on demand" },
    player: { title: "Workout player", subtitle: "Guided session player" },
    settings: { title: "Settings", subtitle: "Profile, preferences and data" },
  };

  function renderSection() {
    switch (section) {
      case "today":
        return <TodayPanel />;
      case "coach":
        return <CoachPanel />;
      case "schedule":
        return <SchedulePanel />;
      case "plan":
        return <PlanPanel />;
      case "progress":
        return <ProgressPanel />;
      case "goals":
        return <GoalsPanel />;
      case "nutrition":
        return <NutritionPanel />;
      case "billing":
        return <ClientBilling />;
      case "plans":
        return <Pricing audience="member" />;
      case "switchboard":
        return <LegacyDashboard onNavigate={(next) => setSection((next as Section) ?? "today")} />;
      case "nutritionLogger":
        return <NutritionTracker />;
      case "calendar":
        return <WorkoutCalendarPage onNavigate={(next) => setSection((next as Section) ?? "today")} />;
      case "macros":
        return <MacroBuilderPage />;
      case "recipes":
        return <RecipeHubPage />;
      case "recovery":
        return <SleepRecoveryPage />;
      case "mood":
        return <MoodJournalPage />;
      case "photos":
        return <ProgressPhotosPage />;
      case "metrics":
        return <BodyMetricsPage />;
      case "challenges":
        return <ChallengesPage />;
      case "achievements":
        return <AchievementsPage />;
      case "courses":
        return <CoursesPage />;
      case "guides":
        return <PDFStorePage />;
      case "yoga":
        return <YogaPage />;
      case "meditation":
        return <MeditationPage />;
      case "physio":
        return <PhysioRehabPage />;
      case "blood":
        return <BloodReportPage />;
      case "aicoach":
        return <AICoachPage />;
      case "strengthlab":
        return <StrengthLabPage />;
      case "toolbox":
        return <FitnessToolbox />;
      case "tools":
        return <ToolsGrid />;
      case "player":
        return (
          <WorkoutPlayer
            planId={state?.plan?.id ?? "unassigned"}
            planTitle={state?.plan?.name ?? "No programme"}
            onFinish={() => {
              home.reload();
              toast.push("Session closed. Nice work.", "success");
            }}
            onExit={() => setSection("today")}
          />
        );
      case "settings":
        return <SettingsPage />;
      default:
        return null;
    }
  }

  /* Data-dependent panels read from a single load so switching tabs is instant. */
  function TodayPanel() {
    if (home.loading) return <LoadingRows rows={4} />;
    if (!state) return <EmptyState title="We could not load your programme" body="Check your connection and try again." />;
    return <TodayView state={state} onLogged={() => { home.reload(); toast.push("Session saved.", "success"); }} />;
  }

  function CoachPanel() {
    if (home.loading) return <LoadingRows rows={3} />;
    if (!state) return <EmptyState title="Coach details unavailable" body="No trainer is linked to your account yet." />;
    return <CoachView state={state} />;
  }

  function SchedulePanel() {
    if (home.loading) return <LoadingRows rows={3} />;
    if (!state) return null;
    return <ScheduleView state={state} onChanged={home.reload} />;
  }

  function PlanPanel() {
    if (home.loading) return <LoadingRows rows={3} />;
    if (!state) return null;
    return <PlanView state={state} />;
  }

  function ProgressPanel() {
    if (home.loading) return <LoadingRows rows={3} />;
    if (!state) return null;
    return <ProgressView state={state} onChanged={home.reload} />;
  }

  function GoalsPanel() {
    if (home.loading) return <LoadingRows rows={3} />;
    if (!state) return null;
    return <GoalsView state={state} />;
  }

  function NutritionPanel() {
    if (home.loading) return <LoadingRows rows={3} />;
    if (!state) return null;
    return <NutritionView state={state} onChanged={home.reload} />;
  }

  const header = titles[section] ?? { title: "Workspace", subtitle: "" };

  return (
    <WorkspaceFrame
      nav={nav}
      active={section}
      onSelect={(id) => setSection(id as Section)}
      title={header.title}
      subtitle={header.subtitle}
      actions={
        <>
          {state?.plan && <Chip tone="azure">Week {weekOfPlan(state.plan.startDate)}</Chip>}
          <Button variant="outline" size="sm" onClick={() => setSection("player")}>
            Start player
          </Button>
        </>
      }
    >
      {renderSection()}
      {gym && (
        <p className="mt-10 text-center text-[11px] uppercase tracking-[0.2em] text-[#e9f3f5]/25">
          {gym.name} · {gym.city ?? "—"}
        </p>
      )}
    </WorkspaceFrame>
  );
}

function weekOfPlan(startDate: string): number {
  const days = Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

/* ── Types for loaded state ─────────────────────────────────────── */

type ClientState = Awaited<ReturnType<ReturnType<typeof useTenant>["loadClientHome"]>>;

/* ── Today ──────────────────────────────────────────────────────── */

function TodayView({ state, onLogged }: { state: ClientState; onLogged: () => void }) {
  const tenant = useTenant();
  const { demo } = useAuth();
  const toast = useToast();
  const day: WorkoutDay | null = state.nextSessionDay;
  const [sets, setSets] = useState<SetLog[]>(() => buildSets(day));
  const [rpe, setRpe] = useState(7);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const streak = currentStreak(state.sessions);
  const adherence = adherenceRate(state.sessions, state.plan ? [state.plan] : []);
  const volume = sets.filter((set) => set.completed).reduce((sum, set) => sum + set.reps * set.loadKg, 0);

  async function submit() {
    if (!day) return;
    setSaving(true);
    try {
      await tenant.logSession({
        planId: state.plan?.id ?? null,
        assignmentId: state.assignment?.id ?? null,
        dayIndex: day.dayIndex,
        dayLabel: day.label,
        sets: sets.filter((set) => set.completed),
        sessionRpe: rpe,
        notes,
      });
      setSets(buildSets(day));
      setNotes("");
      onLogged();
    } catch (error) {
      toast.push(
        error instanceof PermissionError
          ? "You do not have permission to log this session."
          : "Could not save the session. Check your connection and try again.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!state.plan || !day) {
    return (
      <EmptyState
        icon="◎"
        title="No programme assigned yet"
        body="Your trainer has not published a training block for you. Once they do, today's session appears here with every set and load."
        action={<Button variant="outline" size="sm" onClick={() => toast.push("Ask your gym to link you to a trainer — the invite comes from their side.", "info")}>How do I get a plan?</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <MetricGrid>
        <Stat label="Current streak" value={streak} unit="days" hint={streak === 0 ? "Log a session to start one" : "Consecutive days trained"} />
        <Stat label="Adherence (28d)" value={adherence === null ? "—" : adherence} unit={adherence === null ? "" : "%"} hint={adherence === null ? "No data yet" : "Completed ÷ planned sessions"} chart={<Ring value={adherence} size={54} stroke={5} />} />
        <Stat label="Sessions logged" value={state.sessions.filter((s) => s.completedAt).length} hint={`${state.plan.days.length}-day programme`} />
        <Stat label="Today's volume" value={Math.round(volume)} unit="kg" hint="Sum of reps × load for completed sets" />
      </MetricGrid>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200/70">Today · Day {day.dayIndex + 1}</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.03em]">{day.label}</h2>
            <p className="mt-1 text-sm text-[#e9f3f5]/50">{day.focus}</p>
          </div>
          <Chip tone="aurora" dot>
            {state.plan.name}
          </Chip>
        </div>

        <div className="mt-6 space-y-3">
          {sets.map((set, index) => (
            <div
              key={`${set.exerciseId}-${set.setIndex}-${index}`}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
            >
              <label className="flex min-w-[190px] flex-1 items-center gap-3">
                <input
                  type="checkbox"
                  checked={set.completed}
                  onChange={(event) =>
                    setSets((current) => current.map((row, i) => (i === index ? { ...row, completed: event.target.checked } : row)))
                  }
                  className="h-4 w-4 rounded accent-violet-400"
                />
                <span>
                  <span className="block text-sm font-bold">{set.name}</span>
                  <span className="block text-[11px] text-[#e9f3f5]/40">Set {set.setIndex + 1}</span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-[11px] text-[#e9f3f5]/50">
                Reps
                <input
                  type="number"
                  value={set.reps}
                  min={0}
                  onChange={(event) =>
                    setSets((current) => current.map((row, i) => (i === index ? { ...row, reps: Number(event.target.value) } : row)))
                  }
                  className="w-16 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-sm tabular-nums text-[#e9f3f5] outline-none focus:border-violet-300/40"
                />
              </label>
              <label className="flex items-center gap-2 text-[11px] text-[#e9f3f5]/50">
                kg
                <input
                  type="number"
                  value={set.loadKg}
                  min={0}
                  step="0.5"
                  onChange={(event) =>
                    setSets((current) => current.map((row, i) => (i === index ? { ...row, loadKg: Number(event.target.value) } : row)))
                  }
                  className="w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-sm tabular-nums text-[#e9f3f5] outline-none focus:border-violet-300/40"
                />
              </label>
              <span className="w-20 text-right text-xs font-bold tabular-nums text-[#e9f3f5]/60">
                {Math.round(set.reps * set.loadKg)} kg
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Session notes for your coach" hint={demo ? "Demo mode: this stays in memory." : undefined}>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Felt strong on the top set, lower back slightly tight." />
          </Field>
          <Field label="Session RPE">
            <Select value={rpe} onChange={(event) => setRpe(Number(event.target.value))}>
              {[5, 6, 7, 8, 9, 10].map((value) => (
                <option key={value} value={value}>
                  {value} / 10
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#e9f3f5]/45">
            {sets.filter((set) => set.completed).length} of {sets.length} sets ticked ·{" "}
            {state.plan.trainerNotes ? `Coach note: ${state.plan.trainerNotes}` : "No coach note on this block"}
          </p>
          <Button loading={saving} onClick={submit} size="lg" disabled={sets.every((set) => !set.completed)}>
            Save session
          </Button>
        </div>
      </Panel>

      <Panel>
        <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/60">Recent sessions</h3>
        {state.sessions.filter((s) => s.completedAt).length === 0 ? (
          <NoData what="log your first session above" className="mt-4 block" />
        ) : (
          <DataTable
            className="mt-4"
            rows={state.sessions.filter((s) => s.completedAt).slice(0, 6)}
            columns={[
              { key: "date", header: "Date", render: (row) => <span className="tabular-nums">{isoDay(row.completedAt as string)}</span> },
              { key: "day", header: "Session", render: (row) => row.dayLabel },
              { key: "sets", header: "Sets", align: "right", render: (row) => <span className="tabular-nums">{row.sets.length}</span> },
              { key: "volume", header: "Volume", align: "right", render: (row) => <span className="tabular-nums">{row.volumeKg.toLocaleString("en-IN")} kg</span> },
              { key: "rpe", header: "RPE", align: "right", render: (row) => <span className="tabular-nums">{row.sessionRpe ?? "—"}</span> },
            ]}
          />
        )}
      </Panel>
    </div>
  );
}

function buildSets(day: WorkoutDay | null): SetLog[] {
  if (!day) return [];
  return day.blocks.flatMap((block) =>
    Array.from({ length: block.sets }, (_, setIndex) => ({
      exerciseId: block.exerciseId,
      name: block.name,
      setIndex,
      reps: Number.parseInt(block.reps, 10) || 8,
      loadKg: block.loadKg ?? 20,
      rpe: block.rpe,
      completed: false,
    })),
  );
}

/* ── Coach ──────────────────────────────────────────────────────── */

function CoachView({ state }: { state: ClientState }) {
  const shared = state.notes.filter((note) => note.visibility === "shared");
  const trainerName = state.notes[0]?.trainerId ?? "Your trainer";
  const next = state.appointments
    .filter((appointment) => new Date(appointment.startsAt).getTime() >= Date.now())
    .filter((appointment) => appointment.status === "confirmed" || appointment.status === "requested")[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Panel>
        <div className="flex items-center gap-4">
          <Avatar name={trainerName} size="lg" />
          <div>
            <h2 className="text-lg font-black tracking-[-0.02em]">{trainerName}</h2>
            <p className="text-xs text-[#e9f3f5]/45">
              {state.plan ? `Programme author · ${state.plan.name}` : "No programme published yet"}
            </p>
          </div>
        </div>

        <Divider className="my-5" />

        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/55">Shared notes</p>
        {shared.length === 0 ? (
          <NoData what="your coach has not shared a note yet" className="mt-3 block" />
        ) : (
          <ul className="mt-3 space-y-3">
            {shared.map((note) => (
              <li key={note.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-sm leading-6 text-[#e9f3f5]/85">{note.body}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[#e9f3f5]/35">
                  {relativeTime(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-[11px] leading-5 text-[#e9f3f5]/35">
          Direct messaging is not enabled in this release — bring questions to your next appointment so
          the answer is recorded against your programme.
        </p>
      </Panel>

      <div className="space-y-6">
        <Panel>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/55">Next appointment</p>
          {next ? (
            <div className="mt-3">
              <p className="text-lg font-black tabular-nums">{new Date(next.startsAt).toLocaleString("en-IN")}</p>
              <p className="mt-1 text-xs text-[#e9f3f5]/50">
                {next.type.toUpperCase()} · {next.location || "Location TBC"}
              </p>
              <Chip className="mt-3" tone={next.status === "confirmed" ? "vital" : "solar"} dot>
                {next.status}
              </Chip>
            </div>
          ) : (
            <NoData what="nothing booked — request a slot from Appointments" className="mt-3 block" />
          )}
        </Panel>

        <Panel>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/55">Nutrition targets</p>
          {state.nutritionPlan ? (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Calories", `${state.nutritionPlan.targets.calories} kcal`],
                ["Protein", `${state.nutritionPlan.targets.protein} g`],
                ["Carbs", `${state.nutritionPlan.targets.carbs} g`],
                ["Fat", `${state.nutritionPlan.targets.fat} g`],
                ["Water", `${(state.nutritionPlan.hydrationMl / 1000).toFixed(1)} L`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/40">{label}</p>
                  <p className="mt-1 font-bold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <NoData what="your coach has not set nutrition targets" className="mt-3 block" />
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ── Schedule ───────────────────────────────────────────────────── */

function ScheduleView({ state, onChanged }: { state: ClientState; onChanged: () => void }) {
  const tenant = useTenant();
  const { user } = useAuth();
  const toast = useToast();
  const [slots, setSlots] = useState<Array<{ label: string; startsAt: string }>>([]);
  const [selected, setSelected] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  const upcoming = state.appointments
    .filter((appointment) => new Date(appointment.startsAt).getTime() >= Date.now() - 3_600_000)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const past = state.appointments
    .filter((appointment) => new Date(appointment.startsAt).getTime() < Date.now() - 3_600_000)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  async function loadSlots() {
    setLoadingSlots(true);
    const trainerId = state.plan?.trainerId ?? state.notes[0]?.trainerId ?? state.assignment?.trainerId;
    if (!trainerId) {
      setLoadingSlots(false);
      toast.push("No trainer is linked to your account yet.", "error");
      return;
    }
    const availability = await tenant.listAvailability(trainerId);
    const slots: Array<{ label: string; startsAt: string }> = [];
    const now = new Date();
    for (let dayAhead = 1; dayAhead <= 10; dayAhead++) {
      const date = new Date(now.getTime() + dayAhead * 86_400_000);
      const weekday = date.getDay();
      for (const window of availability.filter((row) => row.weekday === weekday && row.active)) {
        const [startHour, startMinute] = window.startTime.split(":").map(Number);
        const [endHour] = window.endTime.split(":").map(Number);
        for (let hour = startHour; hour + 1 <= endHour; hour += Math.max(1, Math.round(window.slotMinutes / 60))) {
          const slotStart = new Date(date);
          slotStart.setHours(hour, startMinute, 0, 0);
          if (slotStart.getTime() <= now.getTime()) continue;
          const taken = state.appointments.some(
            (appointment) =>
              Math.abs(new Date(appointment.startsAt).getTime() - slotStart.getTime()) < 60_000 &&
              appointment.status !== "cancelled",
          );
          if (taken) continue;
          slots.push({ label: slotStart.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), startsAt: slotStart.toISOString() });
        }
      }
      if (slots.length >= 12) break;
    }
    setSlots(slots.slice(0, 12));
    setLoadingSlots(false);
    if (slots.length === 0) toast.push("No bookable slots published for the next 10 days.", "info");
  }

  async function request() {
    const slot = slots.find((item) => item.startsAt === selected);
    if (!slot) return;
    try {
      await tenant.bookAppointment({
        clientId: user!.id,
        trainerId: state.plan?.trainerId ?? state.notes[0]?.trainerId ?? state.assignment?.trainerId,
        type: "pt",
        startsAt: slot.startsAt,
        endsAt: new Date(new Date(slot.startsAt).getTime() + 3_600_000).toISOString(),
      });
      toast.push("Slot requested — your coach confirms it.", "success");
      setSelected("");
      setSlots([]);
      onChanged();
    } catch (error) {
      toast.push(error instanceof PermissionError ? "You cannot book for this account." : "Booking failed. Try again.", "error");
    }
  }

  async function cancel(id: string) {
    try {
      await tenant.setAppointmentStatus(id, "cancelled", user!.id);
      toast.push("Appointment cancelled.", "success");
      onChanged();
    } catch {
      toast.push("Could not cancel. Please call the gym.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black tracking-[-0.02em]">Request a session</h2>
            <p className="mt-1 text-xs text-[#e9f3f5]/50">Slots come from your coach's published availability.</p>
          </div>
          <Button variant="outline" size="sm" loading={loadingSlots} onClick={loadSlots}>
            Find slots
          </Button>
        </div>

        {slots.length > 0 && (
          <>
            <div className="mt-5 flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.startsAt}
                  type="button"
                  onClick={() => setSelected(slot.startsAt)}
                  className={
                    "rounded-xl border px-3.5 py-2 text-xs font-semibold tabular-nums transition " +
                    (selected === slot.startsAt
                      ? "border-violet-300/50 bg-violet-300/15 text-violet-50"
                      : "border-white/10 bg-white/[0.02] text-[#e9f3f5]/70 hover:border-white/20")
                  }
                >
                  {slot.label}
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <Button disabled={!selected} onClick={request}>
                Request slot
              </Button>
            </div>
          </>
        )}
      </Panel>

      <Panel>
        <h2 className="text-base font-black tracking-[-0.02em]">Upcoming</h2>
        {upcoming.length === 0 ? (
          <NoData what="no upcoming appointments" className="mt-3 block" />
        ) : (
          <ul className="mt-4 space-y-2">
            {upcoming.map((appointment) => (
              <li key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div>
                  <p className="text-sm font-bold tabular-nums">{new Date(appointment.startsAt).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-[#e9f3f5]/45">
                    {appointment.type.toUpperCase()} · {appointment.location || "TBC"} · {appointment.notes || "No notes"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip tone={statusTone(appointment.status)} dot>
                    {appointment.status}
                  </Chip>
                  {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                    <Button variant="ghost" size="sm" onClick={() => cancel(appointment.id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <h2 className="text-base font-black tracking-[-0.02em]">History</h2>
        {past.length === 0 ? (
          <NoData what="no completed appointments yet" className="mt-3 block" />
        ) : (
          <DataTable
            className="mt-4"
            dense
            rows={past.slice(0, 10)}
            columns={[
              { key: "when", header: "When", render: (row) => <span className="tabular-nums">{new Date(row.startsAt).toLocaleDateString("en-IN")}</span> },
              { key: "type", header: "Type", render: (row) => row.type.toUpperCase() },
              { key: "status", header: "Status", render: (row) => <Chip tone={statusTone(row.status)}>{row.status}</Chip> },
            ]}
          />
        )}
      </Panel>
    </div>
  );
}

function statusTone(status: string): "vital" | "solar" | "ember" | "muted" | "azure" {
  switch (status) {
    case "completed":
      return "vital";
    case "confirmed":
      return "azure";
    case "requested":
    case "rescheduled":
      return "solar";
    case "no_show":
    case "cancelled":
      return "ember";
    default:
      return "muted";
  }
}

/* ── Program ────────────────────────────────────────────────────── */

function PlanView({ state }: { state: ClientState }) {
  const [openDay, setOpenDay] = useState(0);
  if (!state.plan) {
    return <EmptyState title="No programme yet" body="When your trainer publishes a block it appears here with every exercise, set and target load." />;
  }
  const day = state.plan.days[openDay];
  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-[-0.03em]">{state.plan.name}</h2>
            <p className="mt-1 text-sm text-[#e9f3f5]/50">
              {state.plan.days.length} sessions per week · started {isoDay(state.plan.startDate)}
              {state.plan.endDate ? ` · ends ${isoDay(state.plan.endDate)}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Chip tone={state.plan.status === "active" ? "vital" : "muted"} dot>
              {state.plan.status}
            </Chip>
            <Chip tone="azure">{state.plan.goal.replace("-", " ")}</Chip>
          </div>
        </div>
        {state.plan.trainerNotes && (
          <p className="mt-4 rounded-xl border border-violet-300/20 bg-violet-300/[0.06] p-4 text-sm leading-6 text-violet-50/90">
            <span className="font-bold uppercase tracking-[0.14em] text-violet-200/80">Coach note · </span>
            {state.plan.trainerNotes}
          </p>
        )}
      </Panel>

      <Tabs
        tabs={state.plan.days.map((row, index) => ({ value: String(index), label: row.label }))}
        value={String(openDay)}
        onChange={(value) => setOpenDay(Number(value))}
      />

      {day && (
        <Panel>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/40">{day.focus}</p>
          <div className="mt-4 space-y-2">
            {day.blocks.map((block) => (
              <div key={`${block.exerciseId}-${block.name}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div>
                  <p className="text-sm font-bold">{block.name}</p>
                  <p className="text-[11px] text-[#e9f3f5]/40">{block.exerciseId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums text-[#e9f3f5]/65">
                  <span>{block.sets} sets</span>
                  <span>{block.reps} reps</span>
                  <span>{block.loadKg ? `${block.loadKg} kg` : "bodyweight"}</span>
                  <span>{block.restSec}s rest</span>
                  {block.rpe && <Chip tone="muted">RPE {block.rpe}</Chip>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      <p className="text-[11px] leading-5 text-[#e9f3f5]/35">
        Only your coach can change this prescription. If something does not fit, raise it at your next
        appointment — the change then carries an author and a timestamp.
      </p>
    </div>
  );
}

/* ── Progress ───────────────────────────────────────────────────── */

function ProgressView({ state, onChanged }: { state: ClientState; onChanged: () => void }) {
  const tenant = useTenant();
  const { user } = useAuth();
  const toast = useToast();
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [range, setRange] = useState<"14" | "28" | "90">("28");

  const sessions = state.sessions;
  const series = weeklyVolumeSeries(sessions, 8);
  const records = personalRecords(sessions, 5);
  const trend = weightTrendPerWeek(state.progress);
  const adherence = adherenceRate(sessions, state.plan ? [state.plan] : []);

  const heat = useMemo(() => {
    const days = Array.from({ length: Number(range) }, (_, index) => {
      const date = new Date(Date.now() - index * 86_400_000).toISOString().slice(0, 10);
      const volume = sessions
        .filter((session) => (session.completedAt ?? "").slice(0, 10) === date)
        .reduce((sum, session) => sum + session.volumeKg, 0);
      return { date, intensity: volume === 0 ? 0 : Math.min(1, volume / 6000) };
    });
    return days.reverse();
  }, [sessions, range]);

  async function addEntry() {
    if (!weight) return;
    try {
      await tenant.addProgress({
        clientId: user!.id,
        date: new Date().toISOString().slice(0, 10),
        weightKg: Number(weight),
        waistCm: waist ? Number(waist) : null,
      });
      setWeight("");
      setWaist("");
      toast.push("Measurement saved.", "success");
      onChanged();
    } catch {
      toast.push("Could not save your measurement.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <MetricGrid>
        <Stat
          label="Weight trend"
          value={trend === null ? "—" : `${trend > 0 ? "+" : ""}${trend}`}
          unit={trend === null ? "" : "kg / wk"}
          hint={trend === null ? "Needs 3 weigh-ins" : "Least-squares slope of your records"}
          chart={<Sparkline values={state.progress.map((entry) => entry.weightKg)} tone={trend !== null && trend < 0 ? "#34e08a" : "#5eead4"} />}
        />
        <Stat label="Adherence" value={adherence === null ? "—" : adherence} unit={adherence === null ? "" : "%"} hint={adherence === null ? "No programme yet" : "Last 28 days"} chart={<Ring value={adherence} size={54} stroke={5} />} />
        <Stat label="Streak" value={currentStreak(sessions)} unit="days" hint="Consecutive training days" />
        <Stat
          label="Logged volume"
          value={(sessions.reduce((sum, session) => sum + session.volumeKg, 0) / 1000).toFixed(1)}
          unit="t"
          hint="Lifetime tonnage in this workspace"
        />
      </MetricGrid>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-black tracking-[-0.02em]">Weekly volume</h2>
            <Segmented
              options={[
                { value: "14", label: "14d" },
                { value: "28", label: "28d" },
                { value: "90", label: "90d" },
              ]}
              value={range}
              onChange={setRange}
            />
          </div>
          {series.every((week) => week.volume === 0) ? (
            <NoData what="no completed sessions in the last 8 weeks" className="mt-6 block" />
          ) : (
            <>
              <div className="mt-4">
                <BarSeries
                  bars={series.map((week) => ({ label: isoDay(week.week).slice(5), value: week.volume }))}
                  valueFormatter={(value) => `${value.toLocaleString("en-IN")} kg`}
                  tone="#5eead4"
                />
              </div>
              <Divider className="my-6" />
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/55">Training days</p>
              <div className="mt-3">
                <HeatStrip days={heat} />
              </div>
            </>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <h2 className="text-base font-black tracking-[-0.02em]">Personal records</h2>
            {records.length === 0 ? (
              <NoData what="log a session with load to establish a baseline" className="mt-3 block" />
            ) : (
              <ul className="mt-4 space-y-2">
                {records.map((record) => (
                  <li key={record.exerciseId} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <div>
                      <p className="text-sm font-bold">{record.name}</p>
                      <p className="text-[11px] text-[#e9f3f5]/40">estimated 1RM {record.estimated1rm} kg</p>
                    </div>
                    <p className="text-sm font-black tabular-nums">{record.loadKg} kg × {record.reps}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <h2 className="text-base font-black tracking-[-0.02em]">Log a measurement</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Weight (kg)">
                <Input type="number" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="78.4" />
              </Field>
              <Field label="Waist (cm)">
                <Input type="number" value={waist} onChange={(event) => setWaist(event.target.value)} placeholder="84" />
              </Field>
            </div>
            <Button className="mt-4 w-full" disabled={!weight} onClick={addEntry}>
              Save measurement
            </Button>
            {state.progress.length > 1 && (
              <div className="mt-5">
                <TrendChart
                  points={state.progress.map((entry) => entry.weightKg)}
                  labels={[isoDay(state.progress[0].date).slice(5), isoDay(state.progress[state.progress.length - 1].date).slice(5)]}
                  height={120}
                />
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ── Goals ──────────────────────────────────────────────────────── */

function GoalsView({ state }: { state: ClientState }) {
  if (state.goals.length === 0) {
    return <EmptyState title="No goals set" body="Goals you agree with your coach appear here with progress computed from your records." />;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {state.goals.map((goal) => {
        const progress = goalProgress(goal);
        return (
          <Panel key={goal.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-black tracking-[-0.02em]">{goal.title}</h2>
                <p className="mt-1 text-xs text-[#e9f3f5]/45">
                  {goal.start} → {goal.target} {goal.unit}
                  {goal.dueDate ? ` · due ${isoDay(goal.dueDate)}` : ""}
                </p>
              </div>
              <Chip tone={goal.status === "achieved" ? "vital" : "aurora"} dot>
                {goal.status}
              </Chip>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs tabular-nums text-[#e9f3f5]/55">
                <span>Now {goal.current} {goal.unit}</span>
                <span>{progress === null ? "—" : `${progress}%`}</span>
              </div>
              <ProgressBar value={progress ?? 0} />
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

/* ── Nutrition ──────────────────────────────────────────────────── */

function NutritionView({ state, onChanged }: { state: ClientState; onChanged: () => void }) {
  const tenant = useTenant();
  const { user } = useAuth();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const todayLog = state.nutritionLogs.find((log) => log.date === today) ?? null;
  const adherence = nutritionAdherence(state.nutritionLogs, state.nutritionPlan);
  const [water, setWater] = useState(0);

  async function addWater(amount: number) {
    setWater(amount);
    try {
      await tenant.upsertNutritionLog({
        clientId: user!.id,
        date: today,
        totals: todayLog?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 },
        waterMl: (todayLog?.waterMl ?? 0) + amount,
      });
      onChanged();
    } catch {
      toast.push("Could not save hydration.", "error");
    }
  }

  if (!state.nutritionPlan) {
    return <EmptyState title="No nutrition targets yet" body="Once your coach publishes macro targets they appear here, with adherence measured against them." />;
  }

  const target = state.nutritionPlan.targets;
  return (
    <div className="space-y-6">
      <MetricGrid>
        <Stat label="Calories today" value={todayLog?.totals.calories ?? 0} unit={`/ ${target.calories}`} hint={todayLog ? "Against coach target" : "No log today yet"} />
        <Stat label="Protein today" value={todayLog?.totals.protein ?? 0} unit={`/ ${target.protein} g`} hint="Primary lever for body composition" />
        <Stat label="Hydration" value={((todayLog?.waterMl ?? 0) / 1000).toFixed(1)} unit={`/ ${(state.nutritionPlan.hydrationMl / 1000).toFixed(1)} L`} hint="Tap to add 250 ml" />
        <Stat label="Adherence" value={adherence === null ? "—" : adherence} unit={adherence === null ? "" : "%"} hint={adherence === null ? "Log 14 days to measure" : "Days within 15% of target"} chart={<Ring value={adherence} size={54} stroke={5} />} />
      </MetricGrid>

      <Panel>
        <h2 className="text-base font-black tracking-[-0.02em]">Today's plan</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {state.nutritionPlan.meals.map((meal) => (
            <div key={meal.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{meal.label}</p>
                <span className="text-[11px] tabular-nums text-[#e9f3f5]/45">{meal.time} · {meal.calories} kcal</span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-[#e9f3f5]/60">
                {meal.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[250, 500, 750].map((amount) => (
            <Button key={amount} variant="outline" size="sm" onClick={() => addWater(amount)} loading={water === amount}>
              + {amount} ml water
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => onChanged()}>
            Refresh
          </Button>
        </div>
      </Panel>
    </div>
  );
}
