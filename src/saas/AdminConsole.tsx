/* ═══════════════════════════════════════════════════════════════════
   PLATFORM ADMIN CONSOLE
   ───────────────────────────────────────────────────────────────────
   Replaces the old browser-password admin panel. Differences that
   matter:

     • Access requires the `super_admin` CUSTOM CLAIM. There is no
       password in the bundle to read in view-source, and no path from
       the client to assign itself a role.
     • Data lives in Firestore. The old panel wrote CMS content to
       localStorage, so "publishing" changed only the admin's own
       browser.
     • Role and entitlement changes go through a trusted backend
       endpoint (`/api/admin/*`). If it is not deployed, the console
       says so instead of pretending the change applied.
   ═══════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { adminAssignRole, BackendError } from "../services/backend";
import { useAuth } from "../auth/AuthSystem";
import { useAsyncData, useTenant } from "../data/DataProvider";
import { formatInr, isoDay, relativeTime } from "../data/analytics";
import type { Entitlement, Gym } from "../domain/models";
import {
  Button,
  Chip,
  DataTable,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  MetricGrid,
  Modal,
  NoData,
  PageHeader,
  Panel,
  Select,
  Stat,
  Tabs,
  useToast,
} from "../ui/kit";
import { WorkspaceFrame, type NavGroup } from "./Shell";

type Section = "platform" | "tenants" | "people" | "commercial" | "audit" | "runbook";

const NAV: NavGroup[] = [
  {
    group: "Platform",
    items: [
      { id: "platform", label: "Pulse" },
      { id: "tenants", label: "Tenants" },
      { id: "people", label: "People & Roles" },
    ],
  },
  {
    group: "Commercial",
    items: [
      { id: "commercial", label: "Entitlements" },
      { id: "audit", label: "Audit Trail" },
    ],
  },
  {
    group: "Operations",
    items: [{ id: "runbook", label: "Provisioning Runbook" }],
  },
];

const ROLE_OPTIONS = ["super_admin", "gym_owner", "trainer", "client"] as const;
const PLAN_OPTIONS = ["free", "pro", "elite", "gym_growth", "gym_scale", "gym_enterprise"] as const;

export default function AdminConsole() {
  const tenant = useTenant();
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("platform");
  const [roleTarget, setRoleTarget] = useState<string | null>(null);

  const gyms = useAsyncData(() => tenant.listGyms(), [tenant, user?.id]);
  const users = useAsyncData(() => tenant.listAllUsers(), [tenant, user?.id]);
  const memberships = useAsyncData(() => tenant.listAllMemberships(), [tenant, user?.id]);
  const entitlements = useAsyncData(() => tenant.listAllEntitlements(), [tenant, user?.id]);
  const payments = useAsyncData(() => tenant.listPayments(), [tenant, user?.id]);
  const audit = useAsyncData(() => tenant.listAudit(null), [tenant, user?.id]);

  const gymById = useMemo(() => new Map((gyms.data ?? []).map((gym) => [gym.id, gym])), [gyms.data]);
  const entitlementsBySubject = useMemo(
    () => new Map((entitlements.data ?? []).map((entitlement) => [entitlement.subjectId, entitlement])),
    [entitlements.data],
  );

  const totals = useMemo(() => {
    const rows = memberships.data ?? [];
    return {
      tenants: (gyms.data ?? []).length,
      users: (users.data ?? []).length,
      trainers: rows.filter((row) => row.role === "trainer").length,
      clients: rows.filter((row) => row.role === "client").length,
      mrr: (payments.data ?? [])
        .filter((payment) => payment.status === "captured" && new Date(payment.createdAt).getTime() > Date.now() - 30 * 86_400_000)
        .reduce((sum, payment) => sum + payment.amountMinor, 0),
    };
  }, [gyms.data, users.data, memberships.data, payments.data]);

  const headerCopy: Record<Section, { title: string; subtitle: string }> = {
    platform: { title: "Platform pulse", subtitle: "Tenants, identities and verified revenue" },
    tenants: { title: "Tenants", subtitle: "Every gym on the platform" },
    people: { title: "People & roles", subtitle: "Claims are assigned by the trusted backend only" },
    commercial: { title: "Entitlements", subtitle: "Read-only view of what the payment backend issued" },
    audit: { title: "Audit trail", subtitle: "Append-only record written by the backend" },
    runbook: { title: "Provisioning runbook", subtitle: "Exactly how to bring a real tenant online" },
  };

  return (
    <WorkspaceFrame
      nav={NAV}
      active={section}
      onSelect={(id) => setSection(id as Section)}
      title={headerCopy[section].title}
      subtitle={headerCopy[section].subtitle}
    >
      {section === "platform" && (
        <div className="space-y-6">
          <MetricGrid>
            <Stat label="Tenants" value={totals.tenants} hint="Gyms provisioned on the platform" />
            <Stat label="Identities" value={totals.users} hint={`${totals.trainers} trainers · ${totals.clients} members`} />
            <Stat label="Captured · 30d" value={totals.mrr ? formatInr(totals.mrr) : "—"} hint={totals.mrr ? "Webhook-verified payments" : "No data yet"} tone="gold" />
            <Stat label="Audit events" value={(audit.data ?? []).length} hint="Recent backend activity" />
          </MetricGrid>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <PageHeader eyebrow="Supply" title="Tenants by status" />
              {(gyms.data ?? []).length === 0 ? (
                <NoData what="no gyms have been provisioned" className="mt-4 block" />
              ) : (
                <ul className="mt-4 space-y-2">
                  {(gyms.data ?? []).map((gym) => (
                    <li key={gym.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                      <div>
                        <p className="text-sm font-bold">{gym.name}</p>
                        <p className="text-[11px] text-[#e9f3f5]/40">
                          {gym.city ?? "—"} · owner {gym.ownerId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip tone="azure">{gym.plan}</Chip>
                        <Chip tone={gym.status === "active" ? "vital" : "ember"} dot>
                          {gym.status}
                        </Chip>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel>
              <PageHeader eyebrow="Governance" title="Recent privileged activity" />
              {(audit.data ?? []).length === 0 ? (
                <NoData what="no backend audit events recorded yet" className="mt-4 block" />
              ) : (
                <ul className="mt-4 space-y-2">
                  {(audit.data ?? []).slice(0, 6).map((event) => (
                    <li key={event.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                      <p className="text-sm font-semibold">{event.action}</p>
                      <p className="text-[11px] text-[#e9f3f5]/40">
                        {event.entity}/{event.entityId} · {event.actorRole} · {relativeTime(event.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}

      {section === "tenants" && (
        <Panel padded={false}>
          {gyms.loading ? (
            <div className="p-6">
              <LoadingRows rows={4} />
            </div>
          ) : (gyms.data ?? []).length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon="◎"
                title="No tenants yet"
                body="Provision the first gym with the backend callable (`admin.provisionGym`). It creates the gym document, the owner membership and the owner's claims in one transaction."
              />
            </div>
          ) : (
            <DataTable
              rows={gyms.data ?? []}
              columns={[
                { key: "name", header: "Gym", render: (row) => <span className="text-sm font-bold">{row.name}</span> },
                { key: "slug", header: "Handle", render: (row) => <span className="font-mono text-xs text-[#e9f3f5]/55">/{row.slug}</span> },
                { key: "owner", header: "Owner", render: (row) => <span className="font-mono text-xs text-[#e9f3f5]/55">{row.ownerId}</span> },
                { key: "seats", header: "Seats", align: "right", render: (row) => <span className="tabular-nums">{row.seats.members} / {row.seats.trainers} tr</span> },
                { key: "plan", header: "Plan", render: (row) => <Chip tone="azure">{row.plan}</Chip> },
                { key: "status", header: "Status", render: (row) => <Chip tone={row.status === "active" ? "vital" : "ember"} dot>{row.status}</Chip> },
                { key: "created", header: "Created", render: (row) => <span className="text-xs tabular-nums text-[#e9f3f5]/55">{isoDay(row.createdAt)}</span> },
              ]}
            />
          )}
        </Panel>
      )}

      {section === "people" && (
        <div className="space-y-5">
          <Panel>
            <PageHeader
              eyebrow="Least privilege"
              title="Role assignment"
              subtitle="Changes are applied by the trusted backend, which also refreshes the affected user's claims. The browser never writes a role."
            />
          </Panel>
          <Panel padded={false}>
            {users.loading ? (
              <div className="p-6">
                <LoadingRows rows={5} />
              </div>
            ) : (users.data ?? []).length === 0 ? (
              <div className="p-6">
                <NoData what="no user documents are visible to this session" />
              </div>
            ) : (
              <DataTable
                rows={users.data ?? []}
                columns={[
                  { key: "name", header: "Person", render: (row) => <span className="text-sm font-bold">{row.name}</span> },
                  { key: "email", header: "Email", render: (row) => <span className="text-xs text-[#e9f3f5]/55">{row.email}</span> },
                  { key: "role", header: "Claim", render: (row) => <Chip tone={row.role === "super_admin" ? "solar" : row.role === "gym_owner" ? "azure" : row.role === "trainer" ? "aurora" : "muted"}>{row.role}</Chip> },
                  { key: "gym", header: "Gym", render: (row) => <span className="font-mono text-xs text-[#e9f3f5]/45">{gymById.get(row.gymId ?? "")?.name ?? row.gymId ?? "—"}</span> },
                  { key: "entitlement", header: "Entitlement", render: (row) => <span className="text-xs text-[#e9f3f5]/60">{entitlementsBySubject.get(row.id)?.plan ?? "—"}</span> },
                  {
                    key: "actions",
                    header: "",
                    align: "right",
                    render: (row) => (
                      <Button variant="outline" size="sm" onClick={() => setRoleTarget(row.id)}>
                        Change role
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </Panel>
        </div>
      )}

      {section === "commercial" && (
        <div className="space-y-6">
          <Panel tone="gold">
            <p className="text-sm font-bold text-amber-100">These records are read-only from the app</p>
            <p className="mt-1 text-xs leading-5 text-amber-100/70">
              `firestore.rules` denies every client write to `entitlements`, `payments` and `subscriptions`.
              They are produced by the payment webhook after signature verification, which is what makes an
              upgrade a business fact instead of a UI state.
            </p>
          </Panel>
          <Panel padded={false}>
            {entitlements.loading ? (
              <div className="p-6">
                <LoadingRows rows={4} />
              </div>
            ) : (entitlements.data ?? []).length === 0 ? (
              <div className="p-6">
                <NoData what="no entitlements have been issued" />
              </div>
            ) : (
              <DataTable
                rows={entitlements.data ?? []}
                columns={[
                  { key: "subject", header: "Subject", render: (row: Entitlement) => <span className="flex items-center gap-2 text-sm font-bold">{row.subjectType === "gym" ? "🏛" : "👤"} {row.subjectId}</span> },
                  { key: "plan", header: "Plan", render: (row: Entitlement) => <Chip tone={row.plan.startsWith("gym") ? "solar" : "aurora"}>{row.plan}</Chip> },
                  { key: "status", header: "Status", render: (row: Entitlement) => <Chip tone={row.status === "active" ? "vital" : row.status === "pending" ? "solar" : "ember"} dot>{row.status}</Chip> },
                  { key: "source", header: "Source", render: (row: Entitlement) => <span className="text-xs text-[#e9f3f5]/60">{row.source}</span> },
                  { key: "expiry", header: "Expires", render: (row: Entitlement) => <span className="text-xs tabular-nums text-[#e9f3f5]/60">{row.expiresAt ? isoDay(row.expiresAt) : "—"}</span> },
                  { key: "updated", header: "Updated", render: (row: Entitlement) => <span className="text-xs text-[#e9f3f5]/45">{relativeTime(row.updatedAt)}</span> },
                ]}
              />
            )}
          </Panel>
        </div>
      )}

      {section === "audit" && (
        <Panel padded={false}>
          {(audit.data ?? []).length === 0 ? (
            <div className="p-6">
              <NoData what="no audit events visible. In production the backend writes these on every privileged action." />
            </div>
          ) : (
            <DataTable
              rows={audit.data ?? []}
              columns={[
                { key: "at", header: "When", render: (row) => <span className="tabular-nums text-xs">{new Date(row.at).toLocaleString("en-IN")}</span> },
                { key: "actor", header: "Actor", render: (row) => <span className="font-mono text-xs text-[#e9f3f5]/55">{row.actorId}</span> },
                { key: "role", header: "Role", render: (row) => <Chip tone="muted">{row.actorRole}</Chip> },
                { key: "action", header: "Action", render: (row) => <span className="text-sm font-semibold">{row.action}</span> },
                { key: "entity", header: "Entity", render: (row) => <span className="text-xs text-[#e9f3f5]/55">{row.entity}/{row.entityId}</span> },
                { key: "gym", header: "Tenant", render: (row) => <span className="text-xs text-[#e9f3f5]/55">{gymById.get(row.gymId ?? "")?.name ?? row.gymId ?? "platform"}</span> },
              ]}
            />
          )}
        </Panel>
      )}

      {section === "runbook" && <Runbook gyms={gyms.data ?? []} />}

      <RoleChangeModal
        open={Boolean(roleTarget)}
        onClose={() => setRoleTarget(null)}
        userId={roleTarget ?? ""}
        gyms={gyms.data ?? []}
        onDone={() => users.reload()}
      />
    </WorkspaceFrame>
  );
}

/* ── Role change (backend callable) ─────────────────────────────── */

function RoleChangeModal({
  open,
  onClose,
  userId,
  gyms,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  gyms: Gym[];
  onDone: () => void;
}) {
  const toast = useToast();
  const { refreshClaims } = useAuth();
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("trainer");
  const [gymId, setGymId] = useState(gyms[0]?.id ?? "");
  const [plan, setPlan] = useState<(typeof PLAN_OPTIONS)[number]>("free");
  const [busy, setBusy] = useState(false);

  async function apply() {
    setBusy(true);
    try {
      /* A callable, not `fetch("/api/...")`. The old path was never routed —
         the SPA catch-all answered it with index.html and HTTP 200, so this
         dialog reported "Role updated" on a privileged action that had not
         happened. A callable throws instead of quietly succeeding. */
      await adminAssignRole({
        userId,
        role,
        gymId: role === "super_admin" ? null : gymId,
        plan: plan === "free" ? null : plan,
      });
      toast.push("Role updated. The user's claims refresh on their next token.", "success");
      onDone();
      if (userId === "self") void refreshClaims();
      onClose();
    } catch (error) {
      toast.push(
        error instanceof BackendError
          ? error.message
          : "No role was changed. See the provisioning runbook.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change role & entitlement"
      description="Executed by the backend with the Firebase Admin SDK; the browser only requests it."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={apply}>
            Apply via backend
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="User">
          <Input value={userId} readOnly />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Gym" hint={role === "super_admin" ? "Platform admins are not tenant-scoped." : undefined}>
          <Select value={gymId} onChange={(event) => setGymId(event.target.value)} disabled={role === "super_admin"}>
            {gyms.length === 0 && <option value="">No gyms provisioned</option>}
            {gyms.map((gym) => (
              <option key={gym.id} value={gym.id}>
                {gym.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Entitlement plan" hint="Written to entitlements/{uid} by the backend.">
          <Select value={plan} onChange={(event) => setPlan(event.target.value as typeof plan)}>
            {PLAN_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <p className="mt-4 text-[11px] leading-5 text-[#e9f3f5]/40">
        This console never writes claims directly. The callable verifies that the caller holds
        `super_admin`, writes the membership and entitlement, then sets the claim and writes an audit
        entry in the same transaction.
      </p>
    </Modal>
  );
}

/* ── Runbook ────────────────────────────────────────────────────── */

function Runbook({ gyms }: { gyms: Gym[] }) {
  const [tab, setTab] = useState<"bootstrap" | "tenant" | "billing" | "env">("bootstrap");
  return (
    <div className="space-y-5">
      <Tabs
        tabs={[
          { value: "bootstrap", label: "1. Bootstrap admin" },
          { value: "tenant", label: "2. First gym" },
          { value: "billing", label: "3. Payments" },
          { value: "env", label: "4. Environment" },
        ]}
        value={tab}
        onChange={(value) => setTab(value as typeof tab)}
      />

      {tab === "bootstrap" && (
        <Panel>
          <PageHeader eyebrow="One-time" title="Promote the first platform admin" subtitle="Run this once, locally, with a service-account key. It cannot be done from the browser by design." />
          <pre className="mt-5 overflow-x-auto rounded-xl border border-white/[0.07] bg-[#060b13] p-4 text-[12px] leading-6 text-[#cfe9e4]">
{`# functions/.env  (never committed)
export GOOGLE_APPLICATION_CREDENTIALS=/path/service-account.json

cd functions && npm install
node scripts/bootstrap-admin.mjs you@yourcompany.com

# → verifies the user exists in Firebase Auth
# → sets { role: "super_admin", gymId: null } as a custom claim
# → writes users/{uid}.role so the UI can mirror it
# → appends an auditLog entry`}
          </pre>
          <p className="mt-4 text-xs leading-6 text-[#e9f3f5]/55">
            After this, every other role change happens through the callable in the console above.
            `firestore.rules` gives `super_admin` exactly the access it needs and nothing more — the
            claim is the only key.
          </p>
        </Panel>
      )}

      {tab === "tenant" && (
        <Panel>
          <PageHeader
            eyebrow="Repeatable"
            title="Provision a gym"
            subtitle={gyms.length > 0 ? `${gyms.length} tenant(s) already provisioned` : "No tenants provisioned yet"}
          />
          <pre className="mt-5 overflow-x-auto rounded-xl border border-white/[0.07] bg-[#060b13] p-4 text-[12px] leading-6 text-[#cfe9e4]">
{`# as super_admin, or from the Admin SDK script
admin.provisionGym({
  name: "Iron Arc Strength Club",
  slug: "iron-arc",
  ownerId: "<firebase auth uid of the owner>",
  plan: "growth",
  seats: { trainers: 5, members: 150 },
  city: "Bengaluru",
})

# writes, in one transaction:
#   gyms/{gymId}
#   memberships/{gymId}_{ownerId}   role: gym_owner
#   users/{ownerId}.gymId           (display mirror)
#   custom claims  { role: "gym_owner", gymId, gymIds: [gymId] }
#   auditLog/{auto}                 action: gym.provision`}
          </pre>
          <p className="mt-4 text-xs leading-6 text-[#e9f3f5]/55">
            Members join with the gym's `joinCode`, which creates a `pending` membership that an owner
            approves. Trainers are added the same way, then linked to members on the retention board.
          </p>
        </Panel>
      )}

      {tab === "billing" && (
        <Panel>
          <PageHeader eyebrow="Trust boundary" title="Payments and entitlements" subtitle="Provider → webhook → verified writes. Nothing else may set a plan." />
          <pre className="mt-5 overflow-x-auto rounded-xl border border-white/[0.07] bg-[#060b13] p-4 text-[12px] leading-6 text-[#cfe9e4]">
{`# 1. create the order (callable, authenticated)
createCheckout({ plan: "gym_scale", gymId })   → { orderId, amount, keyId }

# 2. provider completes the payment, then calls the webhook
POST /paymentWebhook
  X-Razorpay-Signature: <hmac-sha256 of the raw body>

# 3. the function (functions/src/verification.ts)
verifyWebhookSignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET)
verifyPaymentCaptured(payload, RAZORPAY_KEY_SECRET)
  → payments/{paymentId}     status: captured, verifiedBy: "webhook:razorpay"
  → entitlements/{subject}   status: active, expiresAt from the order
  → auditLog/{auto}          action: entitlement.grant
  → idempotent on providerRef`}
          </pre>
          <p className="mt-4 text-xs leading-6 text-[#e9f3f5]/55">
            Refunds, failures and chargebacks are handled by the same webhook and move the entitlement
            to `refunded` / `revoked`. Because the client is read-only on these documents, a member can
            never hold a plan the provider did not sell them.
          </p>
        </Panel>
      )}

      {tab === "env" && (
        <Panel>
          <PageHeader eyebrow="Configuration" title="Environment and secrets" />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/45">Browser (public)</p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07] bg-[#060b13] p-4 text-[12px] leading-6 text-[#cfe9e4]">
{`VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID`}
              </pre>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/45">Backend secrets (never shipped)</p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07] bg-[#060b13] p-4 text-[12px] leading-6 text-[#cfe9e4]">
{`RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
ADMIN_BOOTSTRAP_EMAIL   # local script only`}
              </pre>
            </div>
          </div>
          <p className="mt-5 text-xs leading-6 text-[#e9f3f5]/55">
            The old old bundled admin password is gone: a password shipped in a JS bundle is not
            authentication. Deploy rules with
            {" "}<span className="font-mono text-[#cfe9e4]">firebase deploy --only firestore:rules,storage:rules,firestore:indexes</span>.
          </p>
        </Panel>
      )}
    </div>
  );
}
