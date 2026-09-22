/* ═══════════════════════════════════════════════════════════════════
   GYM BILLING — seats, plan and renewal for the tenant
   ───────────────────────────────────────────────────────────────────
   The gym is the paying entity. Entitlements sit on `entitlements/{gymId}`
   and are written by the verified provider webhook; this screen reads
   them and starts a provider checkout through a trusted function.
   Nothing here can raise a seat limit or extend an expiry.
   ═══════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { startProviderCheckout, checkoutFailureMessage } from "../services/providerCheckout";
import type { CheckoutPlan } from "../services/backend";
import { useAuth } from "../auth/AuthSystem";
import { useAsyncData, useTenant } from "../data/DataProvider";
import { formatInr, isoDay } from "../data/analytics";
import type { EntitlementPlan, EntitlementStatus, GymPlan } from "../domain/models";
import { Button, Chip, DataTable, Divider, EmptyState, LoadingRows, MetricGrid, NoData, Panel, ProgressBar, Stat, useToast } from "../ui/kit";

const TIERS: Record<GymPlan, { label: string; price: number; seats: { trainers: number; members: number }; blurb: string }> = {
  trial: { label: "Trial", price: 0, seats: { trainers: 2, members: 25 }, blurb: "Evaluate the workspace with a real roster." },
  growth: { label: "Growth", price: 499_900, seats: { trainers: 5, members: 150 }, blurb: "Single-site gyms running a coached member base." },
  scale: { label: "Scale", price: 999_900, seats: { trainers: 15, members: 500 }, blurb: "Multi-trainer floors with retention targets." },
  enterprise: { label: "Enterprise", price: 1_499_900, seats: { trainers: 60, members: 5000 }, blurb: "Multi-site groups, audit export, priority support." },
};

/** Maps an entitlement plan onto the gym tier it unlocks (client tiers fall back to growth). */
/* The inverse of `gymPlanOf`: the backend catalog keys gym plans as
   `gym_*`, this screen labels them without the prefix. `trial` has no
   catalog price, so it is not purchasable and is excluded by the type. */
function catalogPlanFor(plan: Exclude<GymPlan, "trial">): CheckoutPlan {
  return `gym_${plan}` as CheckoutPlan;
}

function gymPlanOf(plan: EntitlementPlan): GymPlan {
  switch (plan) {
    case "gym_scale":
      return "scale";
    case "gym_enterprise":
      return "enterprise";
    case "gym_growth":
      return "growth";
    default:
      return "trial";
  }
}

const STATUS_TONE: Record<EntitlementStatus, "vital" | "solar" | "ember" | "muted" | "azure"> = {
  active: "vital",
  pending: "solar",
  cancelled: "ember",
  expired: "muted",
  refunded: "ember",
  revoked: "ember",
};

export default function GymBilling() {
  const tenant = useTenant();
  const { gym, demo } = useAuth();
  const toast = useToast();
  const [starting, setStarting] = useState(false);

  const data = useAsyncData(
    async () => {
      const [entitlement, payments] = await Promise.all([tenant.getGymEntitlement(), tenant.listPayments()]);
      return { entitlement, payments };
    },
    [tenant, gym?.id],
  );

  async function startCheckout(plan: GymPlan) {
    if (plan === "trial") return;
    setStarting(true);
    try {
      /* Gym plans are priced from the same backend catalog as member plans;
         the only difference is the subject the entitlement lands on, which the
         backend derives from `gymId` — never from anything the browser claims. */
      await startProviderCheckout({
        plan: catalogPlanFor(plan),
        cycle: "monthly",
        gymId: gym?.id ?? null,
        description: `Tiger ${plan} (gym)`,
        onSubmitted: () =>
          toast.push("Payment submitted. Seats update once the provider confirms the payment.", "success"),
      });
    } catch (error) {
      toast.push(checkoutFailureMessage(error), "error");
    } finally {
      setStarting(false);
    }
  }

  if (data.loading) return <LoadingRows rows={4} />;
  const entitlement = data.data?.entitlement ?? null;
  const payments = data.data?.payments ?? [];
  const tier = entitlement ? TIERS[gymPlanOf(entitlement.plan)] ?? null : null;
  const seats = entitlement?.seats ?? gym?.seats ?? null;

  return (
    <div className="space-y-6">
      <MetricGrid>
        <Stat
          label="Subscription"
          value={tier?.label ?? "None"}
          hint={entitlement ? `${entitlement.source} · ${entitlement.status}` : "No entitlement recorded for this gym"}
          tone={entitlement?.plan === "gym_enterprise" ? "gold" : "default"}
        />
        <Stat
          label="Member seats"
          value={seats ? seats.members : "—"}
          hint={entitlement?.expiresAt ? `Renews, or expires, ${isoDay(entitlement.expiresAt)}` : "No renewal date on record"}
        />
        <Stat label="Trainer seats" value={seats ? seats.trainers : "—"} hint="Invite trainers up to this limit" />
        <Stat
          label="Billed monthly"
          value={tier && tier.price > 0 ? formatInr(tier.price) : "—"}
          hint={tier?.price ? "Excluding GST" : "No active subscription"}
        />
      </MetricGrid>

      <Panel>
        <h2 className="text-base font-black tracking-[-0.02em]">Your tier</h2>
        {!entitlement ? (
          <div className="mt-4">
            <EmptyState
              icon="◆"
              title="No gym subscription on record"
              body="Members can still be managed, but seat limits and priority support stay locked until a verified subscription exists. Nothing is granted from the browser."
              action={
                <Button variant="gold" size="sm" loading={starting} onClick={() => startCheckout("growth")}>
                  Start Growth — ₹4,999/month
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Chip tone={STATUS_TONE[entitlement.status]} dot>
                {entitlement.status}
              </Chip>
              <Chip tone="azure">{entitlement.source}</Chip>
              {entitlement.providerRef && <Chip tone="muted">{entitlement.providerRef}</Chip>}
            </div>
            {tier && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/45">Member capacity</p>
                  <ProgressBar value={gym?.seats ? (gym.seats.members / tier.seats.members) * 100 : 0} />
                  <p className="mt-2 text-xs tabular-nums text-[#e9f3f5]/45">
                    Using {gym?.seats.members ?? 0} of {tier.seats.members}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#e9f3f5]/45">Trainer capacity</p>
                  <ProgressBar value={gym?.seats ? (gym.seats.trainers / tier.seats.trainers) * 100 : 0} tone="solar" />
                  <p className="mt-2 text-xs tabular-nums text-[#e9f3f5]/45">
                    Using {gym?.seats.trainers ?? 0} of {tier.seats.trainers}
                  </p>
                </div>
              </div>
            )}
            <Divider className="my-5" />
            <p className="text-[11px] leading-5 text-[#e9f3f5]/40">{tier?.blurb}</p>
          </>
        )}
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        {(["growth", "scale", "enterprise"] as GymPlan[]).map((plan) => {
          const row = TIERS[plan];
          const current = entitlement ? gymPlanOf(entitlement.plan) === plan : false;
          return (
            <Panel key={plan} tone={plan === "enterprise" ? "gold" : "default"}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-[0.14em]">{row.label}</p>
                {current && <Chip tone="vital">current</Chip>}
              </div>
              <p className="mt-3 text-2xl font-black tabular-nums">{formatInr(row.price)}<span className="text-xs font-bold text-[#e9f3f5]/45">/mo</span></p>
              <p className="mt-2 text-[11px] leading-5 text-[#e9f3f5]/50">{row.blurb}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-[#e9f3f5]/70">
                <li>{row.seats.members.toLocaleString("en-IN")} member seats</li>
                <li>{row.seats.trainers} trainer seats</li>
                <li>{plan === "enterprise" ? "Audit export + SLA" : "Retention analytics"}</li>
              </ul>
              <Button
                className="mt-5 w-full"
                size="sm"
                variant={plan === "enterprise" ? "gold" : "outline"}
                disabled={current}
                loading={starting}
                onClick={() => startCheckout(plan)}
              >
                {current ? "Active" : `Switch to ${row.label}`}
              </Button>
            </Panel>
          );
        })}
      </div>

      <Panel>
        <h2 className="text-base font-black tracking-[-0.02em]">Tenant ledger</h2>
        {payments.length === 0 ? (
          <NoData what="no payments recorded against this gym" className="mt-3 block" />
        ) : (
          <DataTable
            className="mt-4"
            rows={payments}
            columns={[
              { key: "date", header: "Date", render: (row) => <span className="tabular-nums">{isoDay(row.createdAt)}</span> },
              { key: "amount", header: "Amount", align: "right", render: (row) => <span className="tabular-nums">{formatInr(row.amountMinor)}</span> },
              { key: "plan", header: "Plan", render: (row) => <Chip tone="azure">{row.plan}</Chip> },
              { key: "status", header: "Status", render: (row) => <Chip tone={row.status === "captured" ? "vital" : row.status === "failed" ? "ember" : "solar"}>{row.status}</Chip> },
              { key: "verified", header: "Verified", render: (row) => <span className="text-xs text-[#e9f3f5]/55">{row.verifiedAt ? isoDay(row.verifiedAt) : "pending"}</span> },
            ]}
          />
        )}
      </Panel>

      {demo && (
        <p className="text-[11px] leading-5 text-amber-100/70">
          Demo workspace: the provider endpoints above are intentionally unreachable, so switching tiers
          fails loudly rather than simulating an upgrade.
        </p>
      )}
    </div>
  );
}
