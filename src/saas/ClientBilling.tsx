/* ═══════════════════════════════════════════════════════════════════
   BILLING — what a member sees about money
   ───────────────────────────────────────────────────────────────────
   Hard rule enforced here and in `firestore.rules`: the browser is a
   READER of commercial state. This screen can:

     • show the entitlement the backend issued (plan, status, expiry)
     • show payment history written by the verified webhook
     • start a provider checkout via a trusted Cloud Function

   It cannot mark a payment captured, extend an expiry, or flip a plan.
   The previous build wrote `plan` straight into the user document from
   `Checkout.tsx`; that path is removed.
   ═══════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { useAuth } from "../auth/AuthSystem";
import { useAsyncData, useTenant } from "../data/DataProvider";
import { formatInr, isoDay } from "../data/analytics";
import type { EntitlementStatus } from "../domain/models";
import { Chip, DataTable, Divider, EmptyState, LoadingRows, Panel, Stat, Button, MetricGrid, NoData, useToast } from "../ui/kit";

const PLAN_COPY: Record<string, { label: string; price: string; includes: string[] }> = {
  free: { label: "Free", price: "₹0", includes: ["Assigned programme from your gym", "Session logging", "Progress analytics"] },
  pro: {
    label: "Pro",
    price: "₹199 / month",
    includes: ["Everything in Free", "Full tracker library", "AI coach suggestions", "Unlimited history"],
  },
  elite: {
    label: "Elite",
    price: "₹399 / month",
    includes: ["Everything in Pro", "Family profiles", "Priority support", "Advanced recovery tools"],
  },
  gym_growth: { label: "Gym Growth seat", price: "Billed to your gym", includes: ["Member features funded by the gym"] },
  gym_scale: { label: "Gym Scale seat", price: "Billed to your gym", includes: ["Member features funded by the gym"] },
  gym_enterprise: { label: "Enterprise seat", price: "Billed to your gym", includes: ["Member features funded by the gym"] },
};

const STATUS_TONE: Record<EntitlementStatus, "vital" | "solar" | "ember" | "muted" | "azure"> = {
  active: "vital",
  pending: "solar",
  cancelled: "ember",
  expired: "muted",
  refunded: "ember",
  revoked: "ember",
};

export default function ClientBilling() {
  const tenant = useTenant();
  const { user, demo, gym } = useAuth();
  const toast = useToast();
  const [starting, setStarting] = useState(false);

  const data = useAsyncData(
    async () => {
      const [entitlement, gymEntitlement, payments] = await Promise.all([
        tenant.getEntitlement(user!.id),
        tenant.getGymEntitlement(),
        tenant.listPayments(),
      ]);
      return { entitlement, gymEntitlement, payments };
    },
    [tenant, user?.id],
  );

  async function startCheckout(plan: "pro" | "elite") {
    setStarting(true);
    try {
      /* The only supported path to an entitlement: a trusted function creates the
         provider order, the provider webhook verifies it and writes entitlements/{uid}. */
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId: user?.id, gymId: gym?.id ?? null }),
      });
      if (!response.ok) throw new Error(`checkout endpoint returned ${response.status}`);
      const payload = (await response.json()) as { checkoutUrl?: string };
      if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }
      throw new Error("no checkout url");
    } catch {
      toast.push(
        "Payment verification is not configured in this environment. Nothing was charged and no plan changed.",
        "error",
      );
    } finally {
      setStarting(false);
    }
  }

  if (data.loading) return <LoadingRows rows={4} />;
  const entitlement = data.data?.entitlement ?? null;
  const gymEntitlement = data.data?.gymEntitlement ?? null;
  const payments = data.data?.payments ?? [];
  const effective = entitlement ?? gymEntitlement;
  const copy = effective ? PLAN_COPY[effective.plan] ?? PLAN_COPY.free : PLAN_COPY.free;

  return (
    <div className="space-y-6">
      <MetricGrid>
        <Stat
          label="Plan"
          value={copy.label}
          hint={effective ? `Source: ${effective.source}` : "No entitlement on record"}
          tone={effective?.plan === "elite" ? "gold" : "default"}
        />
        <Stat
          label="Status"
          value={effective ? effective.status : "none"}
          hint={effective?.expiresAt ? `Renews/expires ${isoDay(effective.expiresAt)}` : "No expiry recorded"}
        />
        <Stat
          label="Seats covered"
          value={effective?.seats ? effective.seats.members : gymEntitlement?.seats?.members ?? "—"}
          hint={gymEntitlement ? "Funded by your gym subscription" : "Individual subscription"}
        />
        <Stat
          label="Payments on record"
          value={payments.length}
          hint={payments.length === 0 ? "No data yet — nothing has been charged" : "Verified by the provider webhook"}
        />
      </MetricGrid>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel>
          <h2 className="text-base font-black tracking-[-0.02em]">Your entitlement</h2>
          {!effective ? (
            <div className="mt-4">
              <EmptyState
                icon="◆"
                title="No active subscription"
                body="Nothing has been issued to this account. If your gym pays for your seat, it appears here once their subscription is verified."
                action={
                  <Button variant="gold" size="sm" loading={starting} onClick={() => startCheckout("pro")}>
                    See Pro — ₹199/month
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Chip tone={STATUS_TONE[effective.status]} dot>
                  {effective.status}
                </Chip>
                <Chip tone="azure">{effective.source}</Chip>
                {effective.providerRef && <Chip tone="muted">{effective.providerRef}</Chip>}
              </div>
              <ul className="mt-5 space-y-2">
                {copy.includes.map((line) => (
                  <li key={line} className="flex items-start gap-3 text-sm text-[#e9f3f5]/75">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />
                    {line}
                  </li>
                ))}
              </ul>
              <Divider className="my-5" />
              <p className="text-[11px] leading-5 text-[#e9f3f5]/40">
                Entitlements are written by the verified payment webhook and are read-only from the app.
                Cancellations and refunds change this document; they never delete your training history.
              </p>
            </>
          )}
        </Panel>

        <Panel tone={effective?.plan === "elite" ? "gold" : "default"}>
          <h2 className="text-base font-black tracking-[-0.02em]">Upgrade</h2>
          <div className="mt-4 space-y-3">
            {(["pro", "elite"] as const).map((plan) => (
              <div key={plan} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{PLAN_COPY[plan].label}</p>
                  <p className="text-sm font-black tabular-nums">{PLAN_COPY[plan].price}</p>
                </div>
                <p className="mt-1 text-[11px] text-[#e9f3f5]/45">{PLAN_COPY[plan].includes[1]}</p>
                <Button
                  className="mt-3 w-full"
                  size="sm"
                  variant={plan === "elite" ? "gold" : "outline"}
                  loading={starting}
                  onClick={() => startCheckout(plan)}
                >
                  {effective?.plan === plan ? "Manage subscription" : `Choose ${PLAN_COPY[plan].label}`}
                </Button>
              </div>
            ))}
          </div>
          {demo && (
            <p className="mt-4 text-[11px] leading-5 text-amber-100/70">
              Demo workspace: no payment provider is connected, so this button intentionally fails loudly
              instead of pretending to upgrade you.
            </p>
          )}
        </Panel>
      </div>

      <Panel>
        <h2 className="text-base font-black tracking-[-0.02em]">Payment history</h2>
        {payments.length === 0 ? (
          <NoData what="no payments have been recorded for this account" className="mt-3 block" />
        ) : (
          <DataTable
            className="mt-4"
            rows={payments}
            columns={[
              { key: "date", header: "Date", render: (row) => <span className="tabular-nums">{isoDay(row.createdAt)}</span> },
              { key: "ref", header: "Reference", render: (row) => <span className="font-mono text-xs">{row.providerRef}</span> },
              { key: "amount", header: "Amount", align: "right", render: (row) => <span className="tabular-nums">{formatInr(row.amountMinor)}</span> },
              { key: "status", header: "Status", render: (row) => <Chip tone={row.status === "captured" ? "vital" : row.status === "failed" ? "ember" : "solar"}>{row.status}</Chip> },
              { key: "verified", header: "Verified by", render: (row) => <span className="text-xs text-[#e9f3f5]/55">{row.verifiedBy ?? "awaiting webhook"}</span> },
            ]}
          />
        )}
      </Panel>
    </div>
  );
}
