/* ═══════════════════════════════════════════════════════════════════
   GYM CONSOLE — the owner's control room
   ───────────────────────────────────────────────────────────────────
   This is the screen a gym actually pays for. It answers four
   questions with data, not decoration:

     1. Is the business healthy?  (seats, revenue, active members)
     2. Who is about to churn?    (retention board, ranked by evidence)
     3. Are my trainers loaded?   (clients + sessions per trainer)
     4. What do I need to fix?    (unassigned members, expiring seats)

   Everything is gym-scoped by the session claim; a gym owner can never
   read another tenant's rows, because `firestore.rules` refuses the
   query rather than filtering it afterwards.
   ═══════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { useAsyncData, useTenant } from "../data/DataProvider";
import {
  assessRisk,
  formatInr,
  isoDay,
  relativeTime,
  weeklyVolumeSeries,
  type ClientCard,
} from "../data/analytics";
import type { TrainerClient } from "../domain/models";
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
  PageHeader,
  Panel,
  ProgressBar,
  RiskChip,
  Ring,
  Select,
  Stat,
  Tabs,
  useToast,
} from "../ui/kit";
import { BarSeries, Sparkline } from "../ui/charts";
import { WorkspaceFrame, type NavGroup } from "./Shell";
import GymBilling from "./GymBilling";
import { SettingsPage } from "../app/SaaSApp";

type Section = "overview" | "retention" | "trainers" | "members" | "revenue" | "billing" | "settings";

const NAV: NavGroup[] = [
  {
    group: "Business",
    items: [
      { id: "overview", label: "Overview" },
      { id: "retention", label: "Retention Board" },
      { id: "revenue", label: "Revenue" },
      { id: "billing", label: "Plan & Seats" },
    ],
  },
  {
    group: "People",
    items: [
      { id: "trainers", label: "Trainers" },
      { id: "members", label: "Members" },
    ],
  },
  {
    group: "Tenant",
    items: [{ id: "settings", label: "Gym Settings" }],
  },
];

export default function GymConsole() {
  const { gym, user } = useAuth();
  const tenant = useTenant();
  const [section, setSection] = useState<Section>("overview");
  const [assignFor, setAssignFor] = useState<string | null>(null);

  const overview = useAsyncData(() => tenant.loadGymOverview(), [tenant, gym?.id]);
  const memberships = useAsyncData(() => tenant.listMemberships(), [tenant, gym?.id]);
  const relationships = useAsyncData(() => tenant.listAllRelationships(), [tenant, gym?.id]);
  const payments = useAsyncData(() => tenant.listPayments(), [tenant, gym?.id]);
  const profiles = useAsyncData(async () => {
    const rows = await tenant.listMemberships();
    return tenant.listUsers(rows.map((row) => row.userId));
  }, [tenant, gym?.id]);

  const memberRows = useMemo(
    () => (memberships.data ?? []).filter((row) => row.role === "client"),
    [memberships.data],
  );
  const trainerRows = useMemo(
    () => (memberships.data ?? []).filter((row) => row.role === "trainer"),
    [memberships.data],
  );
  const profileById = useMemo(
    () => new Map((profiles.data ?? []).map((profile) => [profile.id, profile])),
    [profiles.data],
  );

  const retention = useMemo(() => {
    const relationshipsById = new Map((relationships.data ?? []).map((row) => [row.clientId, row]));
    return memberRows
      .map((membership) => {
        const risk = assessRisk(membership.userId, relationshipsById.get(membership.userId) ?? null, [], []);
        return {
          userId: membership.userId,
          membership,
          relationship: relationshipsById.get(membership.userId) ?? null,
          risk,
        };
      })
      .sort((a, b) => {
        const weight = { dormant: 0, at_risk: 1, watch: 2, on_track: 3 } as const;
        return weight[a.risk.level] - weight[b.risk.level];
      });
  }, [memberRows, relationships.data]);

  const headerCopy: Record<Section, string> = {
    overview: "Overview",
    retention: "Retention board",
    trainers: "Trainers",
    members: "Members",
    revenue: "Revenue",
    billing: "Plan & seats",
    settings: "Gym settings",
  };

  function openAssign(userId: string) {
    setAssignFor(userId);
  }

  return (
    <WorkspaceFrame
      nav={NAV}
      active={section}
      onSelect={(id) => setSection(id as Section)}
      title={headerCopy[section]}
      subtitle={gym ? `${gym.name} · ${gym.city ?? "—"} · ${gym.plan} plan` : "No gym linked to this account"}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => setAssignFor("__new__")}>
            Assign member
          </Button>
        </>
      }
    >
      {!gym ? (
        <EmptyState
          icon="◎"
          title="No gym linked to your account"
          body="Your account has the gym_owner claim but no gymId, so there is nothing to manage yet. A platform admin provisions the gym and then assigns it to you."
        />
      ) : section === "overview" ? (
        <OverviewTab
          loading={overview.loading || memberships.loading}
          data={overview.data ?? null}
          retention={retention}
          onOpenRetention={() => setSection("retention")}
          onAssign={openAssign}
          stripe={weeklyVolumeSeries([], 8).map((week) => week.volume)}
        />
      ) : section === "retention" ? (
        <RetentionTab
          loading={memberships.loading || relationships.loading}
          rows={retention}
          profileById={profileById}
          onAssign={openAssign}
        />
      ) : section === "trainers" ? (
        <TrainersTab
          loading={memberships.loading || relationships.loading}
          trainers={trainerRows}
          relationships={relationships.data ?? []}
          memberRows={memberRows}
          profileById={profileById}
        />
      ) : section === "members" ? (
        <MembersTab
          loading={memberships.loading || profiles.loading}
          members={memberRows}
          relationships={relationships.data ?? []}
          profileById={profileById}
          onAssign={openAssign}
        />
      ) : section === "revenue" ? (
        <RevenueTab
          loading={payments.loading}
          data={overview.data ?? null}
          payments={payments.data ?? []}
          profileById={profileById}
        />
      ) : section === "billing" ? (
        <GymBilling />
      ) : (
        <SettingsPage />
      )}

      <AssignMemberModal
        open={Boolean(assignFor)}
        onClose={() => setAssignFor(null)}
        memberOptions={memberRows.map((row) => ({
          id: row.userId,
          name: profileById.get(row.userId)?.name ?? row.userId,
        }))}
        trainerOptions={trainerRows.map((row) => ({
          id: row.userId,
          name: profileById.get(row.userId)?.name ?? row.userId,
        }))}
        preselected={assignFor && assignFor !== "__new__" ? assignFor : ""}
        ownerId={user?.id ?? ""}
        onDone={() => {
          relationships.reload();
          memberships.reload();
        }}
      />
    </WorkspaceFrame>
  );
}

/* ── Overview ───────────────────────────────────────────────────── */

function OverviewTab({
  loading,
  data,
  retention,
  onOpenRetention,
  onAssign,
  stripe,
}: {
  loading: boolean;
  data: Awaited<ReturnType<ReturnType<typeof useTenant>["loadGymOverview"]>> | null;
  retention: Array<{ userId: string; risk: { level: "on_track" | "watch" | "at_risk" | "dormant"; reasons: string[] } }>;
  onOpenRetention: () => void;
  onAssign: (userId: string) => void;
  stripe: number[];
}) {
  if (loading) return <LoadingRows rows={5} />;
  if (!data) return <EmptyState title="Overview unavailable" body="Sign in as a gym owner whose claim carries a gymId." />;

  const seatLimit = data.seatLimit;
  const atRisk = retention.filter((row) => row.risk.level === "at_risk" || row.risk.level === "dormant");

  return (
    <div className="space-y-6">
      <MetricGrid>
        <Stat
          label="Active members"
          value={data.activeMembers ?? "—"}
          hint={seatLimit ? `${data.seatsUsed?.members ?? 0} of ${seatLimit.members} seats used` : "No seat limit recorded"}
          chart={data.activeMembers === null ? undefined : <Sparkline values={stripe.length > 1 ? stripe : [0, 1, 0, 2, 1, 3]} tone="#3b9dff" filled={false} />}
        />
        <Stat label="Active trainers" value={data.activeTrainers ?? "—"} hint={seatLimit ? `${data.seatsUsed?.trainers ?? 0} of ${seatLimit.trainers} seats used` : undefined} />
        <Stat
          label="Sessions · 7d"
          value={data.sessionsLast7 ?? 0}
          hint={data.volumeLast7Kg ? `${(data.volumeLast7Kg / 1000).toFixed(1)} t lifted` : "No data yet"}
        />
        <Stat
          label="Average adherence"
          value={data.averageAdherence === null ? "—" : data.averageAdherence}
          unit={data.averageAdherence === null ? "" : "%"}
          hint={data.averageAdherence === null ? "No data yet" : "Across active members, 28 days"}
          chart={<Ring value={data.averageAdherence} size={54} stroke={5} />}
        />
      </MetricGrid>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <PageHeader
            eyebrow="Retention"
            title="Members needing contact"
            subtitle="Ranked by evidence: silence first, then adherence."
            actions={
              <Button variant="outline" size="sm" onClick={onOpenRetention}>
                Open board
              </Button>
            }
          />
          {atRisk.length === 0 ? (
            <NoData what="nobody is at risk right now" className="mt-5 block" />
          ) : (
            <ul className="mt-5 space-y-3">
              {atRisk.slice(0, 5).map((row) => (
                <li key={row.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                  <div>
                    <p className="text-sm font-bold">{row.userId}</p>
                    <p className="text-[11px] text-[#e9f3f5]/45">{row.risk.reasons[0] ?? "Flagged by adherence"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskChip level={row.risk.level} />
                    <Button variant="ghost" size="sm" onClick={() => onAssign(row.userId)}>
                      Assign
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PageHeader eyebrow="Capacity" title="Seat usage" />
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-xs text-[#e9f3f5]/55">
                  <span>Member seats</span>
                  <span className="tabular-nums">
                    {data.seatsUsed?.members ?? 0} / {seatLimit?.members ?? "—"}
                  </span>
                </div>
                <ProgressBar value={seatLimit ? ((data.seatsUsed?.members ?? 0) / seatLimit.members) * 100 : 0} />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-xs text-[#e9f3f5]/55">
                  <span>Trainer seats</span>
                  <span className="tabular-nums">
                    {data.seatsUsed?.trainers ?? 0} / {seatLimit?.trainers ?? "—"}
                  </span>
                </div>
                <ProgressBar value={seatLimit ? ((data.seatsUsed?.trainers ?? 0) / seatLimit.trainers) * 100 : 0} tone="solar" />
              </div>
            </div>
          </Panel>

          <Panel>
            <PageHeader eyebrow="Money" title="Collected · 30 days" />
            <p className="mt-4 text-3xl font-black tabular-nums">
              {data.revenueLast30Minor === null ? "—" : formatInr(data.revenueLast30Minor)}
            </p>
            <p className="mt-1 text-[11px] text-[#e9f3f5]/45">
              {data.revenueLast30Minor === null
                ? "No captured payments in the window"
                : "Only payments verified by the provider webhook are counted"}
            </p>
            <Divider className="my-5" />
            <p className="text-xs text-[#e9f3f5]/55">
              No-show rate: {data.noShowRate === null ? "—" : `${data.noShowRate}%`}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ── Retention ──────────────────────────────────────────────────── */

function RetentionTab({
  loading,
  rows,
  profileById,
  onAssign,
}: {
  loading: boolean;
  rows: Array<{ userId: string; membership: { status: string; createdAt: string }; relationship: TrainerClient | null; risk: { level: "on_track" | "watch" | "at_risk" | "dormant"; reasons: string[]; daysSinceSession: number | null } }>;
  profileById: Map<string, { name: string; goal: string }>;
  onAssign: (userId: string) => void;
}) {
  if (loading) return <LoadingRows rows={6} />;
  if (rows.length === 0) return <EmptyState icon="◍" title="No members yet" body="Invite members with your join code, or import them. They appear here the moment their membership is created." />;

  const unassigned = rows.filter((row) => !row.relationship || row.relationship.status !== "active");

  return (
    <div className="space-y-6">
      {unassigned.length > 0 && (
        <Panel tone="gold">
          <p className="text-sm font-bold text-amber-100">
            {unassigned.length} member{unassigned.length === 1 ? "" : "s"} without an active trainer
          </p>
          <p className="mt-1 text-xs text-amber-100/70">
            Unassigned members have no programme and no accountability — historically the fastest churn in
            a gym. Assign them before their next renewal.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {unassigned.slice(0, 8).map((row) => (
              <Button key={row.userId} variant="outline" size="sm" onClick={() => onAssign(row.userId)}>
                Assign {profileById.get(row.userId)?.name ?? row.userId}
              </Button>
            ))}
          </div>
        </Panel>
      )}

      <Panel padded={false}>
        <DataTable
          rows={rows}
          onRowClick={(row) => onAssign(row.userId)}
          columns={[
            {
              key: "member",
              header: "Member",
              render: (row) => (
                <span className="flex items-center gap-3">
                  <Avatar name={profileById.get(row.userId)?.name ?? row.userId} size="sm" />
                  <span>
                    <span className="block text-sm font-bold">{profileById.get(row.userId)?.name ?? row.userId}</span>
                    <span className="block text-[11px] text-[#e9f3f5]/40">
                      {row.relationship?.status === "active" ? `Trainer: ${row.relationship.trainerId}` : "No active trainer"}
                    </span>
                  </span>
                </span>
              ),
            },
            { key: "risk", header: "Risk", render: (row) => <RiskChip level={row.risk.level} /> },
            {
              key: "why",
              header: "Evidence",
              render: (row) => <span className="text-xs text-[#e9f3f5]/55">{row.risk.reasons[0] ?? "Progressing as planned"}</span>,
            },
            {
              key: "silence",
              header: "Silent for",
              align: "right",
              render: (row) => <span className="tabular-nums">{row.risk.daysSinceSession === null ? "—" : `${row.risk.daysSinceSession}d`}</span>,
            },
            {
              key: "membership",
              header: "Member since",
              render: (row) => <span className="text-xs tabular-nums text-[#e9f3f5]/55">{isoDay(row.membership.createdAt)}</span>,
            },
          ]}
        />
      </Panel>
    </div>
  );
}

/* ── Trainers ───────────────────────────────────────────────────── */

function TrainersTab({
  loading,
  trainers,
  relationships,
  memberRows,
  profileById,
}: {
  loading: boolean;
  trainers: Array<{ userId: string; status: string }>;
  relationships: TrainerClient[];
  memberRows: Array<{ userId: string; status: string }>;
  profileById: Map<string, { name: string }>;
}) {
  if (loading) return <LoadingRows rows={4} />;
  if (trainers.length === 0) {
    return <EmptyState icon="◍" title="No trainers yet" body="Add a trainer membership for a staff account, then assign members to them from the retention board." />;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {trainers.map((trainer) => {
        const assigned = relationships.filter((row) => row.trainerId === trainer.userId && row.status === "active");
        const inactive = relationships.filter((row) => row.trainerId === trainer.userId && row.status !== "active");
        const load = memberRows.length ? Math.round((assigned.length / memberRows.length) * 100) : 0;
        return (
          <Panel key={trainer.userId}>
            <div className="flex items-center gap-3">
              <Avatar name={profileById.get(trainer.userId)?.name ?? trainer.userId} />
              <div>
                <p className="text-sm font-bold">{profileById.get(trainer.userId)?.name ?? trainer.userId}</p>
                <p className="text-[11px] text-[#e9f3f5]/45">
                  {assigned.length} active · {inactive.length} paused
                </p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-[11px] text-[#e9f3f5]/50">
                <span>Share of roster</span>
                <span className="tabular-nums">{load}%</span>
              </div>
              <ProgressBar value={load} tone={load > 60 ? "ember" : "aurora"} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip tone={trainer.status === "active" ? "vital" : "muted"} dot>
                {trainer.status}
              </Chip>
              {assigned.length >= 12 && <Chip tone="solar">High load</Chip>}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

/* ── Members ────────────────────────────────────────────────────── */

function MembersTab({
  loading,
  members,
  relationships,
  profileById,
  onAssign,
}: {
  loading: boolean;
  members: Array<{ userId: string; status: string; createdAt: string; updatedAt: string }>;
  relationships: TrainerClient[];
  profileById: Map<string, { name: string; goal: string; email: string }>;
  onAssign: (userId: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "unassigned" | "paused">("all");
  if (loading) return <LoadingRows rows={6} />;

  const relationshipByClient = new Map(relationships.map((row) => [row.clientId, row]));
  const filtered = members.filter((row) => {
    const relationship = relationshipByClient.get(row.userId);
    if (filter === "unassigned") return !relationship || relationship.status !== "active";
    if (filter === "paused") return relationship?.status === "inactive";
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          tabs={[
            { value: "all", label: `All (${members.length})` },
            { value: "unassigned", label: "Unassigned" },
            { value: "paused", label: "Paused" },
          ]}
          value={filter}
          onChange={(value) => setFilter(value as typeof filter)}
        />
      </div>

      <Panel padded={false}>
        <DataTable
          rows={filtered}
          empty={<div className="p-6"><NoData what="no members match this filter" /></div>}
          columns={[
            {
              key: "name",
              header: "Member",
              render: (row) => (
                <span>
                  <span className="block text-sm font-bold">{profileById.get(row.userId)?.name ?? row.userId}</span>
                  <span className="block text-[11px] text-[#e9f3f5]/40">{profileById.get(row.userId)?.email ?? "—"}</span>
                </span>
              ),
            },
            {
              key: "trainer",
              header: "Trainer",
              render: (row) =>
                relationshipByClient.get(row.userId) ? (
                  <span className="text-xs">{profileById.get(relationshipByClient.get(row.userId)!.trainerId)?.name ?? relationshipByClient.get(row.userId)!.trainerId}</span>
                ) : (
                  <Chip tone="solar">unassigned</Chip>
                ),
            },
            { key: "status", header: "Status", render: (row) => <Chip tone={row.status === "active" ? "vital" : "muted"} dot>{row.status}</Chip> },
            { key: "goal", header: "Goal", render: (row) => <span className="text-xs capitalize text-[#e9f3f5]/60">{profileById.get(row.userId)?.goal?.replace("-", " ") ?? "—"}</span> },
            { key: "since", header: "Member since", render: (row) => <span className="text-xs tabular-nums text-[#e9f3f5]/55">{isoDay(row.createdAt)}</span> },
            {
              key: "actions",
              header: "",
              align: "right",
              render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => onAssign(row.userId)}>
                  Assign
                </Button>
              ),
            },
          ]}
        />
      </Panel>
    </div>
  );
}

/* ── Revenue ────────────────────────────────────────────────────── */

function RevenueTab({
  loading,
  data,
  payments,
  profileById,
}: {
  loading: boolean;
  data: Awaited<ReturnType<ReturnType<typeof useTenant>["loadGymOverview"]>> | null;
  payments: Array<{ id: string; userId: string; amountMinor: number; status: string; createdAt: string; providerRef: string; plan: string }>;
  profileById: Map<string, { name: string }>;
}) {
  if (loading) return <LoadingRows rows={4} />;
  const captured = payments.filter((payment) => payment.status === "captured");
  const monthly = captured.filter((payment) => new Date(payment.createdAt).getTime() > Date.now() - 30 * 86_400_000);
  const series = Array.from({ length: 6 }, (_, index) => {
    const end = new Date(Date.now() - index * 30 * 86_400_000);
    const start = new Date(end.getTime() - 30 * 86_400_000);
    const total = captured
      .filter((payment) => {
        const at = new Date(payment.createdAt).getTime();
        return at > start.getTime() && at <= end.getTime();
      })
      .reduce((sum, payment) => sum + payment.amountMinor, 0);
    return { label: end.toLocaleString("en-IN", { month: "short" }), value: total };
  }).reverse();

  return (
    <div className="space-y-6">
      <MetricGrid>
        <Stat label="Collected · 30d" value={data?.revenueLast30Minor === null || data?.revenueLast30Minor === undefined ? "—" : formatInr(data.revenueLast30Minor)} hint="Webhook-verified only" />
        <Stat label="Payments recorded" value={payments.length} hint="Lifetime in this tenant" />
        <Stat label="Pending / failed" value={payments.filter((payment) => payment.status !== "captured").length} hint="Require follow-up in the provider dashboard" />
        <Stat label="Captured · this month" value={monthly.length} hint="Distinct payments" />
      </MetricGrid>

      <Panel>
        <PageHeader eyebrow="Trend" title="Collections by month" subtitle="Built from payment records, so a month with no charges shows nothing rather than zero." />
        {series.every((point) => point.value === 0) ? (
          <NoData what="no captured payments in the last six months" className="mt-5 block" />
        ) : (
          <div className="mt-5">
            <BarSeries bars={series} valueFormatter={(value) => formatInr(value)} tone="#ffb627" />
          </div>
        )}
      </Panel>

      <Panel>
        <PageHeader eyebrow="Ledger" title="Payments" />
        {payments.length === 0 ? (
          <NoData what="no payments have been recorded for this gym" className="mt-5 block" />
        ) : (
          <DataTable
            className="mt-4"
            rows={payments}
            columns={[
              { key: "date", header: "Date", render: (row) => <span className="tabular-nums">{isoDay(row.createdAt)}</span> },
              { key: "member", header: "Payer", render: (row) => profileById.get(row.userId)?.name ?? row.userId },
              { key: "plan", header: "Plan", render: (row) => <Chip tone="azure">{row.plan}</Chip> },
              { key: "amount", header: "Amount", align: "right", render: (row) => <span className="tabular-nums">{formatInr(row.amountMinor)}</span> },
              { key: "status", header: "Status", render: (row) => <Chip tone={row.status === "captured" ? "vital" : row.status === "failed" ? "ember" : "solar"}>{row.status}</Chip> },
              { key: "ref", header: "Reference", render: (row) => <span className="font-mono text-[11px] text-[#e9f3f5]/45">{row.providerRef}</span> },
            ]}
          />
        )}
      </Panel>
    </div>
  );
}

/* ── Assign member ──────────────────────────────────────────────── */

function AssignMemberModal({
  open,
  onClose,
  memberOptions,
  trainerOptions,
  preselected,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  memberOptions: Array<{ id: string; name: string }>;
  trainerOptions: Array<{ id: string; name: string }>;
  preselected: string;
  ownerId: string;
  onDone: () => void;
}) {
  const tenant = useTenant();
  const toast = useToast();
  const [member, setMember] = useState(preselected || memberOptions[0]?.id || "");
  const [trainer, setTrainer] = useState(trainerOptions[0]?.id || "");
  const [cohort, setCohort] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveMember = preselected || member;

  async function assign() {
    if (!effectiveMember || !trainer) {
      toast.push("Pick both a member and a trainer.", "error");
      return;
    }
    setSaving(true);
    try {
      await tenant.createRelationship({ trainerId: trainer, clientId: effectiveMember, cohort });
      toast.push("Relationship created — the trainer now sees this client.", "success");
      onDone();
      onClose();
    } catch (error) {
      toast.push(
        error instanceof PermissionError
          ? "Only gym owners can create trainer assignments."
          : "Could not create the assignment. Check that both accounts are members of this gym.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign a member to a trainer"
      description="Creates an active trainerClients row scoped to your gym — the basis for every access decision."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={assign}>
            Create assignment
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Member" hint={preselected ? "Pre-selected from the board" : undefined}>
          <Select value={effectiveMember} onChange={(event) => setMember(event.target.value)} disabled={Boolean(preselected)}>
            {memberOptions.length === 0 && <option value="">No members in this gym</option>}
            {memberOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Trainer">
          <Select value={trainer} onChange={(event) => setTrainer(event.target.value)}>
            {trainerOptions.length === 0 && <option value="">No trainers in this gym</option>}
            {trainerOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cohort tag" hint="Optional grouping your trainers already use (e.g. post-natal, strength block).">
          <Input value={cohort} onChange={(event) => setCohort(event.target.value)} placeholder="Transformation 12w" />
        </Field>
      </div>
    </Modal>
  );
}

/* ── Member drawer (owner view) ─────────────────────────────────── */

function MemberDrawer({
  member,
  onClose,
}: {
  member: ClientCard | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={Boolean(member)}
      onClose={onClose}
      title={member?.profile?.name ?? "Member"}
      subtitle={member ? `Last session ${relativeTime(member.lastSessionAt)}` : ""}
    >
      {member && (
        <div className="space-y-4">
          <MetricGrid className="sm:grid-cols-2">
            <Stat label="Adherence" value={member.adherence === null ? "—" : member.adherence} unit={member.adherence === null ? "" : "%"} hint={member.adherence === null ? "No data yet" : "28-day window"} />
            <Stat label="Sessions" value={member.sessionsLast28} hint="Last 28 days" />
          </MetricGrid>
          <Panel>
            <p className="text-xs text-[#e9f3f5]/55">
              Full clinical detail for a member is intentionally limited on the owner surface. Trainers and
              the member themselves hold the complete record.
            </p>
          </Panel>
        </div>
      )}
    </Drawer>
  );
}

export { MemberDrawer };
