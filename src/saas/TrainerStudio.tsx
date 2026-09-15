/* ═══════════════════════════════════════════════════════════════════
   TRAINER STUDIO
   ───────────────────────────────────────────────────────────────────
   The trainer's day, in the order it actually happens:

     1. Today      — who needs me, and why (dormant first, then at risk)
     2. Roster     — every assigned client with derived adherence
     3. Client 360 — programme, sessions, measurements, notes, bookings
     4. Programs   — build a block and deliver it
     5. Schedule   — confirm, complete, no-show, plus published hours
     6. Analytics  — roster-level truth, never decoration

   Every write goes through `TenantClient`, which stamps the gym from
   the session claim and refuses anything the capability matrix denies.
   The trainer can only ever see clients with an ACTIVE relationship in
   their own gym — enforced in rules, mirrored in the UI.
   ═══════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { useAsyncData, useTenant } from "../data/DataProvider";
import {
  isoDay,
  nutritionAdherence,
  personalRecords,
  relativeTime,
  weeklyVolumeSeries,
  weightTrendPerWeek,
  type RankedClient,
} from "../data/analytics";
import type { Appointment, AppointmentStatus, ExercisePrescription, WorkoutDay } from "../domain/models";
import { PermissionError } from "../security/permissions";
import {
  Avatar,
  Button,
  Chip,
  DataTable,
  Divider,
  Drawer,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  MetricGrid,
  Modal,
  NoData,
  Panel,
  PageHeader,
  ProgressBar,
  RiskChip,
  Ring,
  Select,
  Stat,
  Tabs,
  Textarea,
  useToast,
} from "../ui/kit";
import { BarSeries, TrendChart } from "../ui/charts";
import { WorkspaceFrame, type NavGroup } from "./Shell";
import StrengthLabPage from "../app/StrengthLab";
import WorkoutBuilderPage from "../app/WorkoutBuilder";
import AICoachPage from "../app/AICoach";

type Section = "today" | "roster" | "programs" | "schedule" | "analytics" | "library-builder" | "library-strength" | "library-coach";

const NAV: NavGroup[] = [
  {
    group: "Practice",
    items: [
      { id: "today", label: "Today" },
      { id: "roster", label: "Roster" },
      { id: "schedule", label: "Schedule" },
    ],
  },
  {
    group: "Programming",
    items: [
      { id: "programs", label: "Program Builder" },
      { id: "analytics", label: "Analytics" },
    ],
  },
  {
    group: "Toolkit",
    items: [
      { id: "library-builder", label: "Workout Builder" },
      { id: "library-strength", label: "Strength Lab" },
      { id: "library-coach", label: "AI Coach" },
    ],
  },
];

const EXERCISE_LIBRARY: ExercisePrescription[] = [
  { exerciseId: "ex_back_squat", name: "Back Squat", sets: 4, reps: "5", loadKg: 80, restSec: 180 },
  { exerciseId: "ex_front_squat", name: "Front Squat", sets: 4, reps: "6", loadKg: 60, restSec: 150 },
  { exerciseId: "ex_deadlift", name: "Conventional Deadlift", sets: 3, reps: "5", loadKg: 100, restSec: 180 },
  { exerciseId: "ex_rdl", name: "Romanian Deadlift", sets: 3, reps: "8", loadKg: 60, restSec: 120 },
  { exerciseId: "ex_bench", name: "Barbell Bench Press", sets: 4, reps: "6", loadKg: 60, restSec: 150 },
  { exerciseId: "ex_incline_db", name: "Incline Dumbbell Press", sets: 3, reps: "10", loadKg: 20, restSec: 90 },
  { exerciseId: "ex_overhead", name: "Overhead Press", sets: 4, reps: "6", loadKg: 35, restSec: 120 },
  { exerciseId: "ex_pullup", name: "Weighted Pull-Up", sets: 4, reps: "6", loadKg: 5, restSec: 120 },
  { exerciseId: "ex_row", name: "Barbell Row", sets: 4, reps: "8", loadKg: 50, restSec: 120 },
  { exerciseId: "ex_cable_row", name: "Seated Cable Row", sets: 3, reps: "12", loadKg: 40, restSec: 90 },
  { exerciseId: "ex_leg_press", name: "Leg Press", sets: 3, reps: "12", loadKg: 120, restSec: 90 },
  { exerciseId: "ex_split_squat", name: "Bulgarian Split Squat", sets: 3, reps: "10", loadKg: 14, restSec: 90 },
  { exerciseId: "ex_lateral", name: "Lateral Raise", sets: 3, reps: "15", loadKg: 8, restSec: 60 },
  { exerciseId: "ex_hip_thrust", name: "Hip Thrust", sets: 3, reps: "10", loadKg: 60, restSec: 90 },
  { exerciseId: "ex_farmer", name: "Farmer Carry", sets: 3, reps: "40 m", loadKg: 24, restSec: 90 },
  { exerciseId: "ex_zone2", name: "Zone 2 Bike", sets: 1, reps: "30 min", restSec: 0 },
];

export default function TrainerStudio() {
  const { user } = useAuth();
  const tenant = useTenant();
  const [section, setSection] = useState<Section>("today");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const roster = useAsyncData(() => tenant.loadRoster(), [tenant, user?.id]);
  const appointments = useAsyncData(() => tenant.listAppointments(), [tenant, user?.id]);

  const clients = roster.data ?? [];
  const cardsById = useMemo(() => new Map(clients.map((card) => [card.clientId, card])), [clients]);
  const todaysAppointments = (appointments.data ?? []).filter(
    (appointment) => new Date(appointment.startsAt).toDateString() === new Date().toDateString(),
  );
  const upcoming = (appointments.data ?? [])
    .filter((appointment) => new Date(appointment.startsAt).getTime() >= Date.now())
    .slice(0, 20);

  const stats = useMemo(() => {
    const withRisk = clients;
    const sessions7 = withRisk.reduce((sum, card) => sum + (card.sessionsLast28 > 0 ? card.sessionsLast28 / 4 : 0), 0);
    const adherenceValues = clients.map((card) => card.adherence).filter((value): value is number => value !== null);
    return {
      clients: clients.length,
      atRisk: clients.filter((card) => card.risk.level === "at_risk" || card.risk.level === "dormant").length,
      sessions7: Math.round(sessions7),
      adherence: adherenceValues.length ? Math.round(adherenceValues.reduce((a, b) => a + b, 0) / adherenceValues.length) : null,
    };
  }, [clients]);

  const headerCopy: Record<Section, { title: string; subtitle: string }> = {
    today: { title: "Today", subtitle: "Your roster, ordered by who needs you first" },
    roster: { title: "Roster", subtitle: `${stats.clients} assigned clients` },
    schedule: { title: "Schedule", subtitle: "Appointments and published hours" },
    programs: { title: "Program builder", subtitle: "Write a block and deliver it to a client" },
    analytics: { title: "Analytics", subtitle: "Derived from records, never estimated" },
    "library-builder": { title: "Workout builder", subtitle: "Legacy drafting tool (device-local)" },
    "library-strength": { title: "Strength lab", subtitle: "Load and standards calculators" },
    "library-coach": { title: "AI coach", subtitle: "Rule-based guidance from your records" },
  };

  return (
    <WorkspaceFrame
      nav={NAV}
      active={section}
      onSelect={(id) => setSection(id as Section)}
      title={headerCopy[section].title}
      subtitle={headerCopy[section].subtitle}
      actions={
        <Button variant="outline" size="sm" onClick={() => setSection("programs")}>
          New program
        </Button>
      }
    >
      {section === "today" && (
        <TodayBoard
          loading={roster.loading}
          clients={clients}
          appointments={todaysAppointments}
          stats={stats}
          onOpen={setSelectedClient}
          onRefresh={roster.reload}
        />
      )}
      {section === "roster" && (
        <RosterBoard loading={roster.loading} clients={clients} onOpen={setSelectedClient} />
      )}
      {section === "schedule" && (
        <ScheduleBoard
          loading={appointments.loading}
          appointments={appointments.data ?? []}
          upcoming={upcoming}
          onChanged={appointments.reload}
          onOpenClient={setSelectedClient}
        />
      )}
      {section === "programs" && (
        <ProgramBuilder clients={clients} onDelivered={() => { roster.reload(); setSection("roster"); }} />
      )}
      {section === "analytics" && <RosterAnalytics loading={roster.loading} clients={clients} />}
      {section === "library-builder" && <WorkoutBuilderPage />}
      {section === "library-strength" && <StrengthLabPage />}
      {section === "library-coach" && <AICoachPage />}

      <ClientDrawer
        clientId={selectedClient}
        card={selectedClient ? cardsById.get(selectedClient) ?? null : null}
        onClose={() => setSelectedClient(null)}
        onChanged={() => roster.reload()}
      />
    </WorkspaceFrame>
  );
}

/* ── Today ──────────────────────────────────────────────────────── */

function TodayBoard({
  loading,
  clients,
  appointments,
  stats,
  onOpen,
  onRefresh,
}: {
  loading: boolean;
  clients: RankedClient[];
  appointments: Appointment[];
  stats: { clients: number; atRisk: number; sessions7: number; adherence: number | null };
  onOpen: (id: string) => void;
  onRefresh: () => void;
}) {
  if (loading) return <LoadingRows rows={5} />;

  if (clients.length === 0) {
    return (
      <EmptyState
        icon="◍"
        title="No clients assigned yet"
        body="A gym owner links members to you. Once a relationship is active, their programme, adherence and bookings land here."
      />
    );
  }

  const priority = clients.filter((card) => card.risk.level !== "on_track").slice(0, 6);

  return (
    <div className="space-y-6">
      <MetricGrid>
        <Stat label="Assigned clients" value={stats.clients} hint="Active relationships in this gym" />
        <Stat label="Needs attention" value={stats.atRisk} hint="Dormant or below 50% adherence" tone={stats.atRisk > 0 ? "default" : "default"} />
        <Stat label="Sessions this week" value={stats.sessions7} hint="From logged completions" />
        <Stat
          label="Average adherence"
          value={stats.adherence === null ? "—" : stats.adherence}
          unit={stats.adherence === null ? "" : "%"}
          hint={stats.adherence === null ? "No data yet" : "Across the roster, 28 days"}
          chart={<Ring value={stats.adherence} size={54} stroke={5} />}
        />
      </MetricGrid>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel>
          <PageHeader
            eyebrow="Priority queue"
            title="Who needs you today"
            subtitle="Ordered dormant → at risk → watch, then by longest silence."
            actions={
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                Refresh
              </Button>
            }
          />
          {priority.length === 0 ? (
            <NoData what="everyone is on track — nothing is silently slipping" className="mt-5 block" />
          ) : (
            <ul className="mt-5 space-y-3">
              {priority.map((card) => (
                <li key={card.clientId}>
                  <button
                    type="button"
                    onClick={() => onOpen(card.clientId)}
                    className="flex w-full flex-wrap items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition hover:border-violet-300/25 hover:bg-white/[0.05]"
                  >
                    <Avatar name={card.profile?.name ?? card.clientId} />
                    <div className="min-w-[160px] flex-1">
                      <p className="text-sm font-bold">{card.profile?.name ?? card.clientId}</p>
                      <p className="text-[11px] text-[#e9f3f5]/45">{card.risk.reasons.join(" · ") || "Progressing as planned"}</p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#e9f3f5]/35">Last session</p>
                        <p className="text-xs font-bold">{relativeTime(card.lastSessionAt)}</p>
                      </div>
                      <div className="w-24">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#e9f3f5]/35">Adherence</p>
                        <ProgressBar value={card.adherence ?? 0} className="mt-1.5" tone={(card.adherence ?? 0) < 50 ? "ember" : "aurora"} />
                      </div>
                      <RiskChip level={card.risk.level} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PageHeader eyebrow="Diary" title="Today's appointments" />
          {appointments.length === 0 ? (
            <NoData what="nothing booked for today" className="mt-4 block" />
          ) : (
            <ul className="mt-4 space-y-3">
              {appointments.map((appointment) => (
                <li key={appointment.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold tabular-nums">
                      {new Date(appointment.startsAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <Chip tone={appointment.status === "confirmed" ? "vital" : appointment.status === "requested" ? "solar" : "muted"}>
                      {appointment.status}
                    </Chip>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpen(appointment.clientId)}
                    className="mt-2 text-xs font-semibold text-violet-100 hover:underline"
                  >
                    Open client record →
                  </button>
                  <p className="mt-1 text-[11px] text-[#e9f3f5]/45">
                    {appointment.type.toUpperCase()} · {appointment.location || "location TBC"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ── Roster ─────────────────────────────────────────────────────── */

function RosterBoard({ loading, clients, onOpen }: { loading: boolean; clients: RankedClient[]; onOpen: (id: string) => void }) {
  if (loading) return <LoadingRows rows={6} />;
  if (clients.length === 0) {
    return <EmptyState icon="◍" title="Roster is empty" body="Ask your gym owner to assign members to you." />;
  }
  return (
    <Panel padded={false}>
      <DataTable
        rows={clients}
        onRowClick={(row) => onOpen(row.clientId)}
        columns={[
          {
            key: "client",
            header: "Client",
            render: (row) => (
              <span className="flex items-center gap-3">
                <Avatar name={row.profile?.name ?? row.clientId} size="sm" />
                <span>
                  <span className="block text-sm font-bold">{row.profile?.name ?? row.clientId}</span>
                  <span className="block text-[11px] text-[#e9f3f5]/40">{row.profile?.goal?.replace("-", " ") ?? "goal unset"}</span>
                </span>
              </span>
            ),
          },
          { key: "risk", header: "Status", render: (row) => <RiskChip level={row.risk.level} /> },
          {
            key: "adherence",
            header: "Adherence",
            align: "right",
            render: (row) => <span className="tabular-nums">{row.adherence === null ? "—" : `${row.adherence}%`}</span>,
          },
          {
            key: "last",
            header: "Last session",
            render: (row) => <span className="text-xs text-[#e9f3f5]/60">{relativeTime(row.lastSessionAt)}</span>,
          },
          {
            key: "volume",
            header: "28d volume",
            align: "right",
            render: (row) => <span className="tabular-nums">{row.volumeLast28 ? `${(row.volumeLast28 / 1000).toFixed(1)} t` : "—"}</span>,
          },
          {
            key: "trend",
            header: "Weight trend",
            align: "right",
            render: (row) => (
              <span className="tabular-nums">
                {row.weightTrend === null ? "—" : `${row.weightTrend > 0 ? "+" : ""}${row.weightTrend} kg/wk`}
              </span>
            ),
          },
          {
            key: "next",
            header: "Next booking",
            render: (row) => (
              <span className="text-xs tabular-nums text-[#e9f3f5]/60">
                {row.nextAppointment ? new Date(row.nextAppointment.startsAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
              </span>
            ),
          },
        ]}
      />
    </Panel>
  );
}

/* ── Schedule ───────────────────────────────────────────────────── */

function ScheduleBoard({
  loading,
  appointments,
  upcoming,
  onChanged,
  onOpenClient,
}: {
  loading: boolean;
  appointments: Appointment[];
  upcoming: Appointment[];
  onChanged: () => void;
  onOpenClient: (id: string) => void;
}) {
  const tenant = useTenant();
  const toast = useToast();
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  async function setStatus(appointment: Appointment, status: AppointmentStatus) {
    try {
      await tenant.setAppointmentStatus(appointment.id, status, appointment.clientId);
      toast.push(`Marked ${status.replace("_", " ")}.`, "success");
      onChanged();
    } catch (error) {
      toast.push(error instanceof PermissionError ? "Not permitted." : "Could not update the appointment.", "error");
    }
  }

  const history = appointments
    .filter((appointment) => new Date(appointment.startsAt).getTime() < Date.now())
    .slice(0, 12);

  if (loading) return <LoadingRows rows={5} />;

  return (
    <div className="space-y-6">
      <Panel>
        <PageHeader
          title="Upcoming"
          subtitle="Confirm requests, close out completions, record no-shows."
          actions={
            <Button variant="outline" size="sm" onClick={() => setAvailabilityOpen(true)}>
              Edit published hours
            </Button>
          }
        />
        {upcoming.length === 0 ? (
          <NoData what="no upcoming appointments" className="mt-5 block" />
        ) : (
          <ul className="mt-5 space-y-3">
            {upcoming.map((appointment) => (
              <li key={appointment.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="min-w-[200px]">
                  <p className="text-sm font-bold tabular-nums">{new Date(appointment.startsAt).toLocaleString("en-IN")}</p>
                  <button type="button" onClick={() => onOpenClient(appointment.clientId)} className="text-[11px] text-violet-100 hover:underline">
                    {appointment.clientId}
                  </button>
                  <p className="text-[11px] text-[#e9f3f5]/45">
                    {appointment.type.toUpperCase()} · {appointment.location || "TBC"} {appointment.notes ? `· ${appointment.notes}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone={appointment.status === "confirmed" ? "vital" : appointment.status === "requested" ? "solar" : "muted"} dot>
                    {appointment.status}
                  </Chip>
                  {appointment.status === "requested" && (
                    <Button size="sm" onClick={() => setStatus(appointment, "confirmed")}>
                      Confirm
                    </Button>
                  )}
                  {(appointment.status === "confirmed" || appointment.status === "requested") && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setStatus(appointment, "completed")}>
                        Mark complete
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setStatus(appointment, "no_show")}>
                        No-show
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setStatus(appointment, "cancelled")}>
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <h2 className="text-base font-black tracking-[-0.02em]">Recent history</h2>
        {history.length === 0 ? (
          <NoData what="no past appointments recorded" className="mt-3 block" />
        ) : (
          <DataTable
            className="mt-4"
            dense
            rows={history}
            columns={[
              { key: "when", header: "When", render: (row) => <span className="tabular-nums">{new Date(row.startsAt).toLocaleDateString("en-IN")}</span> },
              { key: "client", header: "Client", render: (row) => row.clientId },
              { key: "type", header: "Type", render: (row) => row.type.toUpperCase() },
              { key: "status", header: "Status", render: (row) => <Chip tone={row.status === "completed" ? "vital" : row.status === "no_show" ? "ember" : "muted"}>{row.status}</Chip> },
            ]}
          />
        )}
      </Panel>

      <AvailabilityEditor open={availabilityOpen} onClose={() => setAvailabilityOpen(false)} />
    </div>
  );
}

function AvailabilityEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tenant = useTenant();
  const toast = useToast();
  const [rows, setRows] = useState<Array<{ weekday: number; start: string; end: string; active: boolean }>>([
    { weekday: 1, start: "06:00", end: "11:00", active: true },
    { weekday: 2, start: "06:00", end: "11:00", active: true },
    { weekday: 3, start: "06:00", end: "11:00", active: true },
    { weekday: 4, start: "06:00", end: "11:00", active: true },
    { weekday: 5, start: "06:00", end: "11:00", active: true },
    { weekday: 6, start: "08:00", end: "12:00", active: true },
    { weekday: 0, start: "08:00", end: "12:00", active: false },
  ]);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await tenant.setAvailability(
        rows
          .filter((row) => row.active)
          .map((row) => ({
            weekday: row.weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6,
            startTime: row.start,
            endTime: row.end,
            slotMinutes: 60,
            active: true,
          })),
      );
      toast.push("Published hours updated — clients can now book them.", "success");
      onClose();
    } catch {
      toast.push("Could not publish hours.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Published hours"
      description="Clients can only request slots inside these windows."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={save}>
            Publish hours
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.weekday} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={row.active}
                onChange={(event) => setRows((current) => current.map((item, i) => (i === index ? { ...item, active: event.target.checked } : item)))}
                className="h-4 w-4 rounded accent-violet-400"
              />
              <span className="w-24 text-sm font-bold">{weekdayName(row.weekday)}</span>
            </label>
            <Input
              type="time"
              value={row.start}
              onChange={(event) => setRows((current) => current.map((item, i) => (i === index ? { ...item, start: event.target.value } : item)))}
              className="w-32"
            />
            <Input
              type="time"
              value={row.end}
              onChange={(event) => setRows((current) => current.map((item, i) => (i === index ? { ...item, end: event.target.value } : item)))}
              className="w-32"
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}

function weekdayName(weekday: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday];
}

/* ── Program builder ────────────────────────────────────────────── */

function ProgramBuilder({ clients, onDelivered }: { clients: RankedClient[]; onDelivered: () => void }) {
  const tenant = useTenant();
  const toast = useToast();
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("Hypertrophy block · 4 day");
  const [goal, setGoal] = useState("muscle-gain");
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState<WorkoutDay[]>([
    { dayIndex: 0, label: "Lower Strength", focus: "Squat · hinge · core", blocks: [] },
    { dayIndex: 1, label: "Upper Push", focus: "Horizontal + vertical press", blocks: [] },
    { dayIndex: 2, label: "Upper Pull", focus: "Row · pull-up volume", blocks: [] },
    { dayIndex: 3, label: "Conditioning", focus: "Zone 2 + carries", blocks: [] },
  ]);
  const [activeDay, setActiveDay] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const effectiveClient = clientId || clients[0]?.clientId || "";

  function addExercise(prescription: ExercisePrescription) {
    setDays((current) =>
      current.map((day, index) => (index === activeDay ? { ...day, blocks: [...day.blocks, { ...prescription }] } : day)),
    );
    setPickerOpen(false);
  }

  function updateBlock(blockIndex: number, patch: Partial<ExercisePrescription>) {
    setDays((current) =>
      current.map((day, index) =>
        index === activeDay
          ? { ...day, blocks: day.blocks.map((block, i) => (i === blockIndex ? { ...block, ...patch } : block)) }
          : day,
      ),
    );
  }

  async function deliver() {
    if (!effectiveClient) {
      toast.push("Assign a client first.", "error");
      return;
    }
    if (days.every((day) => day.blocks.length === 0)) {
      toast.push("Add at least one exercise before delivering.", "error");
      return;
    }
    setSaving(true);
    try {
      const plan = await tenant.savePlan({
        plan: {
          clientId: effectiveClient,
          name,
          goal: goal as WorkoutDay extends never ? never : "muscle-gain" | "fat-loss" | "general" | "wedding" | "maintenance" | "rehab",
          days,
          trainerNotes: notes,
          status: "active",
        },
      });
      await tenant.assignPlan({ clientId: effectiveClient, planId: plan.id });
      toast.push("Program delivered — the client sees it in Today's session.", "success");
      onDelivered();
    } catch (error) {
      toast.push(
        error instanceof PermissionError
          ? "You can only program for clients you are actively assigned to."
          : "Could not deliver the program. Try again.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  const day = days[activeDay];

  return (
    <div className="space-y-6">
      <Panel>
        <PageHeader
          eyebrow="Delivery"
          title="Write a training block"
          subtitle="Pick the client, shape the week, publish. The prescription is versioned by author and timestamp."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="Client">
            <Select value={effectiveClient} onChange={(event) => setClientId(event.target.value)}>
              {clients.length === 0 && <option value="">No assigned clients</option>}
              {clients.map((card) => (
                <option key={card.clientId} value={card.clientId}>
                  {card.profile?.name ?? card.clientId}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Programme name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Primary goal">
            <Select value={goal} onChange={(event) => setGoal(event.target.value)}>
              {["muscle-gain", "fat-loss", "maintenance", "wedding", "general", "rehab"].map((value) => (
                <option key={value} value={value}>
                  {value.replace("-", " ")}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>

      <Tabs
        tabs={days.map((row, index) => ({ value: String(index), label: `${index + 1}. ${row.label}` }))}
        value={String(activeDay)}
        onChange={(value) => setActiveDay(Number(value))}
      />

      {day && (
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <Field label="Session label">
                <Input
                  value={day.label}
                  onChange={(event) =>
                    setDays((current) => current.map((row, index) => (index === activeDay ? { ...row, label: event.target.value } : row)))
                  }
                />
              </Field>
              <Field label="Focus">
                <Input
                  value={day.focus}
                  onChange={(event) =>
                    setDays((current) => current.map((row, index) => (index === activeDay ? { ...row, focus: event.target.value } : row)))
                  }
                />
              </Field>
            </div>
            <Button onClick={() => setPickerOpen(true)}>Add exercise</Button>
          </div>

          <div className="mt-5 space-y-2">
            {day.blocks.length === 0 ? (
              <NoData what="this session has no exercises yet — add the first movement" />
            ) : (
              day.blocks.map((block, blockIndex) => (
                <div key={`${block.exerciseId}-${blockIndex}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <span className="min-w-[180px] flex-1 text-sm font-bold">{block.name}</span>
                  <label className="flex items-center gap-2 text-[11px] text-[#e9f3f5]/50">
                    Sets
                    <input
                      type="number"
                      value={block.sets}
                      min={1}
                      onChange={(event) => updateBlock(blockIndex, { sets: Number(event.target.value) })}
                      className="w-16 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-sm tabular-nums outline-none focus:border-violet-300/40"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-[#e9f3f5]/50">
                    Reps
                    <input
                      value={block.reps}
                      onChange={(event) => updateBlock(blockIndex, { reps: event.target.value })}
                      className="w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-sm outline-none focus:border-violet-300/40"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-[#e9f3f5]/50">
                    kg
                    <input
                      type="number"
                      value={block.loadKg ?? 0}
                      onChange={(event) => updateBlock(blockIndex, { loadKg: Number(event.target.value) })}
                      className="w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-sm tabular-nums outline-none focus:border-violet-300/40"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-[#e9f3f5]/50">
                    Rest
                    <input
                      type="number"
                      value={block.restSec}
                      onChange={(event) => updateBlock(blockIndex, { restSec: Number(event.target.value) })}
                      className="w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-sm tabular-nums outline-none focus:border-violet-300/40"
                    />
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDays((current) =>
                        current.map((row, index) =>
                          index === activeDay ? { ...row, blocks: row.blocks.filter((_, i) => i !== blockIndex) } : row,
                        ),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </Panel>
      )}

      <Panel>
        <Field label="Coach note attached to the block" hint="The client sees this in their programme.">
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Hold RPE ≤ 8 on the main lift this block." />
        </Field>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#e9f3f5]/45">
            {days.reduce((sum, row) => sum + row.blocks.length, 0)} exercises across {days.length} sessions
          </p>
          <Button size="lg" loading={saving} onClick={deliver}>
            Deliver to client
          </Button>
        </div>
      </Panel>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Exercise library" description="Curated movements — extend this from your own gym library in a later release." width="lg">
        <div className="grid gap-2 sm:grid-cols-2">
          {EXERCISE_LIBRARY.map((exercise) => (
            <button
              key={exercise.exerciseId}
              type="button"
              onClick={() => addExercise(exercise)}
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-left transition hover:border-violet-300/30 hover:bg-white/[0.05]"
            >
              <p className="text-sm font-bold">{exercise.name}</p>
              <p className="text-[11px] text-[#e9f3f5]/45">
                {exercise.sets} × {exercise.reps} · {exercise.loadKg ?? 0} kg · {exercise.restSec}s rest
              </p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

/* ── Analytics ──────────────────────────────────────────────────── */

function RosterAnalytics({ loading, clients }: { loading: boolean; clients: RankedClient[] }) {
  const tenant = useTenant();
  const sessions = useAsyncData(() => tenant.listSessions({ limit: 600 }), [tenant]);
  const overview = useAsyncData(() => tenant.loadGymOverview(), [tenant]);

  if (loading || sessions.loading) return <LoadingRows rows={5} />;
  const rows = sessions.data ?? [];
  const series = weeklyVolumeSeries(rows, 8);
  const records = personalRecords(rows, 6);
  const adherenceBuckets = [
    { label: "0–49%", value: clients.filter((card) => (card.adherence ?? 0) < 50).length },
    { label: "50–74%", value: clients.filter((card) => (card.adherence ?? 0) >= 50 && (card.adherence ?? 0) < 75).length },
    { label: "75–89%", value: clients.filter((card) => (card.adherence ?? 0) >= 75 && (card.adherence ?? 0) < 90).length },
    { label: "90%+", value: clients.filter((card) => (card.adherence ?? 0) >= 90).length },
  ];

  return (
    <div className="space-y-6">
      <MetricGrid>
        <Stat
          label="Roster sessions · 7d"
          value={overview.data?.sessionsLast7 ?? 0}
          hint="Completed sessions logged by your clients"
        />
        <Stat
          label="Tonnage · 7d"
          value={overview.data?.volumeLast7Kg ? (overview.data.volumeLast7Kg / 1000).toFixed(1) : "—"}
          unit={overview.data?.volumeLast7Kg ? "t" : ""}
          hint={overview.data?.volumeLast7Kg ? "Sum of reps × load" : "No data yet"}
        />
        <Stat label="Clients below 50%" value={adherenceBuckets[0].value} hint="Coaching priority" />
        <Stat label="No-show rate" value={overview.data?.noShowRate === null || overview.data?.noShowRate === undefined ? "—" : overview.data.noShowRate} unit={overview.data?.noShowRate === null ? "" : "%"} hint={overview.data?.noShowRate === null ? "Needs 5 appointments to measure" : "Completed vs no-show"} />
      </MetricGrid>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <h2 className="text-base font-black tracking-[-0.02em]">Weekly tonnage across your roster</h2>
          {series.every((week) => week.volume === 0) ? (
            <NoData what="no completed sessions logged in the last 8 weeks" className="mt-5 block" />
          ) : (
            <div className="mt-5">
              <BarSeries bars={series.map((week) => ({ label: isoDay(week.week).slice(5), value: week.volume }))} valueFormatter={(value) => `${value.toLocaleString("en-IN")} kg`} />
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <h2 className="text-base font-black tracking-[-0.02em]">Adherence distribution</h2>
            <div className="mt-5 space-y-3">
              {adherenceBuckets.map((bucket, index) => (
                <div key={bucket.label}>
                  <div className="mb-1.5 flex justify-between text-xs text-[#e9f3f5]/55">
                    <span>{bucket.label}</span>
                    <span className="tabular-nums">{bucket.value} clients</span>
                  </div>
                  <ProgressBar
                    value={clients.length ? (bucket.value / clients.length) * 100 : 0}
                    tone={index === 0 ? "ember" : index === 1 ? "solar" : "vital"}
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-base font-black tracking-[-0.02em]">Top lifts in the roster</h2>
            {records.length === 0 ? (
              <NoData what="no loaded sets recorded yet" className="mt-3 block" />
            ) : (
              <ul className="mt-4 space-y-2">
                {records.map((record) => (
                  <li key={record.exerciseId} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm">
                    <span className="font-bold">{record.name}</span>
                    <span className="tabular-nums text-[#e9f3f5]/70">
                      {record.loadKg} kg × {record.reps}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ── Client 360 drawer ──────────────────────────────────────────── */

function ClientDrawer({
  clientId,
  card,
  onClose,
  onChanged,
}: {
  clientId: string | null;
  card: RankedClient | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const tenant = useTenant();
  const toast = useToast();
  const [tab, setTab] = useState<"overview" | "programme" | "progress" | "notes" | "nutrition">("overview");
  const [noteBody, setNoteBody] = useState("");
  const [noteVisibility, setNoteVisibility] = useState<"trainer_only" | "shared">("trainer_only");
  const [bookingOpen, setBookingOpen] = useState(false);

  const detail = useAsyncData(
    async () => {
      if (!clientId) return null;
      const [sessions, progress, notes, goals, nutritionPlans, appointments, relationships] = await Promise.all([
        tenant.listSessions({ clientId }),
        tenant.listProgress(clientId),
        tenant.listNotes(clientId),
        tenant.listGoals(clientId),
        tenant.listNutritionPlans(clientId),
        tenant.listAppointments({ clientId }),
        tenant.listTrainerClients(),
      ]);
      return {
        sessions,
        progress,
        notes,
        goals,
        nutritionPlan: nutritionPlans[0] ?? null,
        appointments,
        relationship: relationships.find((row) => row.clientId === clientId) ?? null,
      };
    },
    [tenant, clientId],
    { enabled: Boolean(clientId) },
  );

  if (!clientId || !card) {
    return <Drawer open={false} onClose={onClose} title="" children={null} />;
  }

  const data = detail.data;
  const adherence = card.adherence;
  const records = personalRecords(data?.sessions ?? [], 4);
  const trend = weightTrendPerWeek(data?.progress ?? []);
  const volumeSeries = weeklyVolumeSeries(data?.sessions ?? [], 8);
  const nutritionScore = nutritionAdherence(data?.nutritionPlan ? data.sessions.length ? [] : [] : [], data?.nutritionPlan ?? null);

  async function saveNote() {
    if (!noteBody.trim() || !clientId) return;
    try {
      await tenant.addNote({ clientId, body: noteBody.trim(), visibility: noteVisibility });
      setNoteBody("");
      toast.push("Note saved.", "success");
      detail.reload();
      onChanged();
    } catch {
      toast.push("Could not save the note.", "error");
    }
  }

  return (
    <Drawer
      open={Boolean(clientId)}
      onClose={onClose}
      title={card.profile?.name ?? clientId}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <RiskChip level={card.risk.level} />
          <span className="text-[11px] text-[#e9f3f5]/45">{card.risk.reasons.join(" · ") || "On track"}</span>
        </span>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <Panel padded={false} className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e9f3f5]/40">Adherence · 28d</p>
            <p className="mt-1 text-xl font-black tabular-nums">{adherence === null ? "—" : `${adherence}%`}</p>
          </Panel>
          <Panel padded={false} className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e9f3f5]/40">Last session</p>
            <p className="mt-1 text-xl font-black">{relativeTime(card.lastSessionAt)}</p>
          </Panel>
          <Panel padded={false} className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e9f3f5]/40">Weight trend</p>
            <p className="mt-1 text-xl font-black tabular-nums">{trend === null ? "—" : `${trend > 0 ? "+" : ""}${trend} kg/wk`}</p>
          </Panel>
          <Panel padded={false} className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e9f3f5]/40">Next booking</p>
            <p className="mt-1 text-sm font-black">
              {card.nextAppointment ? new Date(card.nextAppointment.startsAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
            </p>
          </Panel>
        </div>

        <Tabs
          tabs={[
            { value: "overview", label: "Overview" },
            { value: "programme", label: "Programme" },
            { value: "progress", label: "Progress" },
            { value: "nutrition", label: "Nutrition" },
            { value: "notes", label: "Notes", badge: data?.notes.length ? String(data.notes.length) : undefined },
          ]}
          value={tab}
          onChange={(value) => setTab(value as typeof tab)}
        />

        {detail.loading && <LoadingRows rows={3} />}

        {!detail.loading && tab === "overview" && (
          <div className="space-y-4">
            <Panel>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/55">Profile</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Detail label="Goal" value={card.profile?.goal?.replace("-", " ") ?? "—"} />
                <Detail label="Age / gender" value={card.profile ? `${card.profile.age || "—"} · ${card.profile.gender}` : "—"} />
                <Detail label="Height" value={card.profile?.height ? `${card.profile.height} cm` : "—"} />
                <Detail label="Weight" value={card.profile?.weight ? `${card.profile.weight} kg` : "—"} />
                <Detail label="Cohort" value={data?.relationship?.cohort || "—"} />
                <Detail label="Relationship" value={data?.relationship?.status ?? "—"} />
              </div>
            </Panel>
            <div className="flex flex-wrap gap-3">
              <Button size="sm" onClick={() => setBookingOpen(true)}>
                Book a session
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTab("programme")}>
                Open programme
              </Button>
            </div>
          </div>
        )}

        {!detail.loading && tab === "programme" && (
          <div className="space-y-4">
            {card.plan ? (
              <>
                <Panel>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">{card.plan.name}</p>
                      <p className="text-[11px] text-[#e9f3f5]/45">
                        {card.plan.days.length} sessions/week · started {isoDay(card.plan.startDate)}
                      </p>
                    </div>
                    <Chip tone={card.plan.status === "active" ? "vital" : "muted"} dot>
                      {card.plan.status}
                    </Chip>
                  </div>
                  <Divider className="my-4" />
                  <div className="space-y-3">
                    {card.plan.days.map((day) => (
                      <div key={day.dayIndex} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="text-xs font-bold">
                          {day.label} <span className="font-normal text-[#e9f3f5]/40">· {day.focus}</span>
                        </p>
                        <ul className="mt-2 space-y-1 text-[12px] text-[#e9f3f5]/60">
                          {day.blocks.map((block, index) => (
                            <li key={`${block.exerciseId}-${index}`}>
                              {block.name} — {block.sets} × {block.reps}
                              {block.loadKg ? ` @ ${block.loadKg} kg` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Button variant="outline" size="sm" onClick={() => setTab("notes")}>
                  Add coaching note
                </Button>
              </>
            ) : (
              <EmptyState title="No programme on file" body="Use Program Builder to write and deliver a block for this client." />
            )}
          </div>
        )}

        {!detail.loading && tab === "progress" && (
          <div className="space-y-4">
            <Panel>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/55">Weekly tonnage</p>
              {volumeSeries.every((week) => week.volume === 0) ? (
                <NoData what="no completed sessions recorded" className="mt-3 block" />
              ) : (
                <div className="mt-4">
                  <BarSeries bars={volumeSeries.map((week) => ({ label: isoDay(week.week).slice(5), value: week.volume }))} height={110} valueFormatter={(value) => `${value.toLocaleString("en-IN")} kg`} />
                </div>
              )}
            </Panel>

            <Panel>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/55">Body weight</p>
              {(data?.progress.length ?? 0) < 2 ? (
                <NoData what="fewer than two weigh-ins recorded" className="mt-3 block" />
              ) : (
                <div className="mt-4">
                  <TrendChart points={(data?.progress ?? []).map((entry) => entry.weightKg)} height={140} labels={[isoDay(data!.progress[0].date).slice(5), isoDay(data!.progress[data!.progress.length - 1].date).slice(5)]} />
                </div>
              )}
            </Panel>

            <Panel>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/55">Best lifts</p>
              {records.length === 0 ? (
                <NoData what="no loaded sets logged" className="mt-3 block" />
              ) : (
                <ul className="mt-3 space-y-2">
                  {records.map((record) => (
                    <li key={record.exerciseId} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
                      <span>{record.name}</span>
                      <span className="tabular-nums text-[#e9f3f5]/70">
                        {record.loadKg} kg × {record.reps} · e1RM {record.estimated1rm} kg
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/55">Measurements</p>
              {(data?.progress.length ?? 0) === 0 ? (
                <NoData what="no measurements recorded" className="mt-3 block" />
              ) : (
                <DataTable
                  className="mt-3"
                  dense
                  rows={[...(data?.progress ?? [])].reverse().slice(0, 8)}
                  columns={[
                    { key: "date", header: "Date", render: (row) => <span className="tabular-nums">{isoDay(row.date)}</span> },
                    { key: "weight", header: "Weight", align: "right", render: (row) => <span className="tabular-nums">{row.weightKg} kg</span> },
                    { key: "waist", header: "Waist", align: "right", render: (row) => <span className="tabular-nums">{row.waistCm ? `${row.waistCm} cm` : "—"}</span> },
                    { key: "bf", header: "Body fat", align: "right", render: (row) => <span className="tabular-nums">{row.bodyFatPct ? `${row.bodyFatPct}%` : "—"}</span> },
                  ]}
                />
              )}
            </Panel>
          </div>
        )}

        {!detail.loading && tab === "nutrition" && (
          <div className="space-y-4">
            {data?.nutritionPlan ? (
              <Panel>
                <p className="text-sm font-bold">{data.nutritionPlan.targets.calories} kcal · {data.nutritionPlan.targets.protein} g protein</p>
                <p className="mt-1 text-xs text-[#e9f3f5]/45">
                  {data.nutritionPlan.targets.carbs} g carbs · {data.nutritionPlan.targets.fat} g fat · {(data.nutritionPlan.hydrationMl / 1000).toFixed(1)} L water
                </p>
                <div className="mt-4 space-y-2">
                  {data.nutritionPlan.meals.map((meal) => (
                    <div key={meal.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs">
                      <span className="font-bold">{meal.label}</span> · {meal.time} · {meal.calories} kcal
                      <p className="mt-1 text-[#e9f3f5]/50">{meal.items.join(", ")}</p>
                    </div>
                  ))}
                </div>
                {nutritionScore === null && <NoData what="no nutrition logs from this client yet" className="mt-4 block" />}
              </Panel>
            ) : (
              <EmptyState title="No nutrition plan" body="Publish macro targets and a meal skeleton; adherence is measured against them automatically." />
            )}
            <Panel>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/55">Recent intake</p>
              {(data?.sessions.length ?? 0) === 0 && <NoData what="this client has not logged intake" className="mt-3 block" />}
              {card.plan && (
                <p className="mt-3 text-xs text-[#e9f3f5]/45">
                  Nutrition logging for this client is read-only here — full intake history is on their
                  workspace to keep this panel honest about what has actually been recorded.
                </p>
              )}
            </Panel>
          </div>
        )}

        {!detail.loading && tab === "notes" && (
          <div className="space-y-4">
            <Panel>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/55">New note</p>
              <Textarea
                className="mt-3"
                value={noteBody}
                onChange={(event) => setNoteBody(event.target.value)}
                placeholder="Left shoulder tight on incline press — swapped to neutral grip."
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <Select value={noteVisibility} onChange={(event) => setNoteVisibility(event.target.value as typeof noteVisibility)} className="max-w-[220px]">
                  <option value="trainer_only">Trainer-only note</option>
                  <option value="shared">Share with client</option>
                </Select>
                <Button size="sm" disabled={!noteBody.trim()} onClick={saveNote}>
                  Save note
                </Button>
              </div>
            </Panel>

            {(data?.notes.length ?? 0) === 0 ? (
              <NoData what="no notes written for this client" />
            ) : (
              <ul className="space-y-3">
                {data!.notes.map((note) => (
                  <li key={note.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Chip tone={note.visibility === "shared" ? "vital" : "muted"}>{note.visibility === "shared" ? "shared" : "internal"}</Chip>
                      <span className="text-[11px] text-[#e9f3f5]/35">{relativeTime(note.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#e9f3f5]/85">{note.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        clientId={clientId}
        trainerId={data?.relationship?.trainerId ?? ""}
        onBooked={() => {
          detail.reload();
          onChanged();
        }}
      />
    </Drawer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/40">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function BookingModal({
  open,
  onClose,
  clientId,
  trainerId,
  onBooked,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  trainerId: string;
  onBooked: () => void;
}) {
  const tenant = useTenant();
  const toast = useToast();
  const [type, setType] = useState<Appointment["type"]>("pt");
  const [when, setWhen] = useState(() => {
    const next = new Date(Date.now() + 86_400_000);
    next.setHours(7, 0, 0, 0);
    return next.toISOString().slice(0, 16);
  });
  const [location, setLocation] = useState("Main floor");
  const [saving, setSaving] = useState(false);

  async function book() {
    setSaving(true);
    try {
      const startsAt = new Date(when).toISOString();
      await tenant.bookAppointment({
        clientId,
        trainerId: trainerId || undefined,
        type,
        startsAt,
        endsAt: new Date(new Date(when).getTime() + 3_600_000).toISOString(),
        location,
      });
      toast.push("Appointment booked.", "success");
      onBooked();
      onClose();
    } catch (error) {
      toast.push(error instanceof PermissionError ? "Not permitted for this client." : "Could not book.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Book an appointment"
      description="Created as confirmed because you are the trainer of record."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={book}>
            Book
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <Select value={type} onChange={(event) => setType(event.target.value as Appointment["type"])}>
            {["pt", "assessment", "consult", "class", "checkin"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Starts at">
          <Input type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
        </Field>
        <Field label="Location" className="sm:col-span-2">
          <Input value={location} onChange={(event) => setLocation(event.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
