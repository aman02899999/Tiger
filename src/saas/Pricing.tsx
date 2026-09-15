/* ═══════════════════════════════════════════════════════════════════
   PRICING & ENTITLEMENT
   ───────────────────────────────────────────────────────────────────
   The commercial front door for a member, a trainer buying their own
   tools, or a gym buying seats.

   What this screen is allowed to do:
     • read the caller's entitlement document,
     • open a hosted checkout session through the trusted backend,
     • explain exactly what happens to money and when access flips.

   What it may never do (and says so on the page):
     • write an entitlement, a payment, a subscription or a plan,
     • treat a redirect as a purchase,
     • show a "success" state the server has not confirmed.
   ═══════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { Button, Chip, Panel, SectionTitle, Spinner, Stat, useToast } from "../ui/kit";
import { useAuth } from "../auth/AuthSystem";
import { useGymEntitlement, useEntitlement } from "../data/hooks";
import { entitlementIsLive } from "../domain/validation";
import type { EntitlementPlan } from "../domain/models";
import { relativeTime } from "../data/analytics";
import { cn } from "../utils/cn";

type Audience = "member" | "gym";

type PlanCard = {
  plan: EntitlementPlan;
  name: string;
  monthly: number;
  annual: number;
  audience: Audience;
  blurb: string;
  features: string[];
  seats?: string;
  featured?: boolean;
};

/* Prices live in exactly two places: here (display) and
   `functions/src/verification.ts` (authority). The server re-prices every
   order, so a mismatch shows up as a rejected checkout, not a discount. */
export const PLAN_CARDS: PlanCard[] = [
  {
    plan: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    audience: "member",
    blurb: "Track training, nutrition and progress on your own.",
    features: ["Session logging", "Indian food database", "Progress and measurement history", "3 insights a day"],
  },
  {
    plan: "pro",
    name: "Pro",
    monthly: 199,
    annual: 1499,
    audience: "member",
    blurb: "For the member who wants coaching around their own training.",
    features: ["Everything in Free", "Unlimited insights and trends", "Full exercise library", "Priority support"],
    featured: true,
  },
  {
    plan: "elite",
    name: "Elite",
    monthly: 399,
    annual: 2999,
    audience: "member",
    blurb: "Family profiles, the whole library, and the deepest analytics.",
    features: ["Everything in Pro", "Family profiles", "Advanced body composition trends", "Export your data any time"],
  },
  {
    plan: "gym_growth",
    name: "Gym Growth",
    monthly: 4999,
    annual: 49_999,
    audience: "gym",
    blurb: "Run a studio with a real coaching workflow.",
    features: ["Trainer roster and assignments", "Programme builder", "Retention board", "Member billing ledger"],
    seats: "≤150 members · ≤5 trainer seats",
  },
  {
    plan: "gym_scale",
    name: "Gym Scale",
    monthly: 9999,
    annual: 99_999,
    audience: "gym",
    blurb: "For multi-floor gyms with a full coaching team.",
    features: ["Everything in Growth", "Up to 15 trainer seats", "Gym-wide adherence analytics", "Audit trail"],
    seats: "≤500 members · ≤15 trainer seats",
    featured: true,
  },
  {
    plan: "gym_enterprise",
    name: "Gym Enterprise",
    monthly: 14_999,
    annual: 149_999,
    audience: "gym",
    blurb: "Multi-site operators with compliance requirements.",
    features: ["Everything in Scale", "Multi-site memberships", "Audit export", "Named onboarding"],
    seats: "Unlimited members · 60+ trainer seats",
  },
];

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function Pricing({ audience = "member" }: { audience?: Audience }) {
  const toast = useToast();
  const { user, session, demo } = useAuth();
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [pending, setPending] = useState<EntitlementPlan | null>(null);

  const memberEntitlement = useEntitlement();
  const gymEntitlement = useGymEntitlement();
  const entitlement = audience === "gym" ? gymEntitlement.data : memberEntitlement.data;
  const live = entitlementIsLive(entitlement);

  const cards = useMemo(() => PLAN_CARDS.filter((card) => card.audience === audience), [audience]);

  async function startCheckout(plan: EntitlementPlan) {
    if (demo) {
      toast.push("The demo workspace cannot take payments. Connect Firebase and the payment provider to run a real checkout.", "info");
      return;
    }
    setPending(plan);
    try {
      /* The browser names a plan. The backend prices it, creates the
         provider order, and only a verified webhook grants access. */
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle, userId: session?.uid ?? null, gymId: audience === "gym" ? session?.claims.gymId ?? null : null }),
      });
      if (!response.ok) throw new Error(`checkout ${response.status}`);
      const payload = (await response.json()) as { checkoutUrl?: string };
      if (!payload.checkoutUrl) throw new Error("no checkout url");
      window.location.href = payload.checkoutUrl;
    } catch {
      toast.push(
        "Payment verification is not configured in this environment. Nothing was charged and no plan changed.",
        "error",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionTitle
          title={audience === "gym" ? "Gym plans" : "Membership"}
          subtitle={
            audience === "gym"
              ? "Billed to the gym, not to each member. Seats are enforced by the backend when it provisions staff."
              : "Your plan is a backend record. This page can read it — it can never change it."
          }
        />
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
          {(["monthly", "annual"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCycle(option)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition",
                cycle === option ? "bg-white/12 text-white" : "text-[#e9f3f5]/55 hover:text-white",
              )}
            >
              {option}
              {option === "annual" && <span className="ml-1.5 text-[10px] text-emerald-300">2 months free</span>}
            </button>
          ))}
        </div>
      </div>

      <Panel className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e9f3f5]/40">Current entitlement</p>
          <div className="mt-2 flex items-center gap-3">
            {memberEntitlement.loading || gymEntitlement.loading ? (
              <Spinner />
            ) : entitlement ? (
              <>
                <Chip tone={live ? "vital" : "muted"} dot>
                  {entitlement.plan}
                </Chip>
                <span className="text-sm text-[#e9f3f5]/70">
                  {entitlement.status}
                  {entitlement.expiresAt ? ` · renews ${new Date(entitlement.expiresAt).toLocaleDateString("en-IN")}` : " · no expiry"}
                  {entitlement.source ? ` · source: ${entitlement.source}` : ""}
                </span>
              </>
            ) : (
              <span className="text-sm text-[#e9f3f5]/55">No entitlement on record — you are on the free tier.</span>
            )}
          </div>
        </div>
        <p className="max-w-sm text-xs leading-5 text-[#e9f3f5]/45">
          Entitlements are written only by the verified payment webhook. The app cannot grant access, and a failed
          checkout leaves your plan untouched.
        </p>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        {cards.map((card) => {
          const price = cycle === "annual" ? card.annual : card.monthly;
          const isCurrent = entitlement?.plan === card.plan && live;
          return (
            <Panel
              key={card.plan}
              className={cn(
                "flex flex-col justify-between gap-5",
                card.featured && "border-violet-300/30 bg-gradient-to-b from-violet-300/[0.08] to-transparent",
              )}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black tracking-[-0.02em]">{card.name}</p>
                    <p className="mt-1 text-xs leading-5 text-[#e9f3f5]/55">{card.blurb}</p>
                  </div>
                  {card.featured && <Chip tone="aurora">Most chosen</Chip>}
                </div>

                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black tabular-nums">{formatInr(price)}</span>
                  {price > 0 && <span className="pb-1 text-xs text-[#e9f3f5]/50">/{cycle === "annual" ? "year" : "month"}</span>}
                </div>
                {card.seats && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e9f3f5]/40">{card.seats}</p>}

                <ul className="space-y-2 text-sm text-[#e9f3f5]/72">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300/70" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {card.plan === "free" ? (
                <Button variant="outline" disabled className="w-full">
                  Included with every account
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={card.featured ? "primary" : "outline"}
                  disabled={pending !== null || isCurrent}
                  onClick={() => void startCheckout(card.plan)}
                >
                  {isCurrent ? "Current plan" : pending === card.plan ? "Opening checkout…" : `Choose ${card.name}`}
                </Button>
              )}
            </Panel>
          );
        })}
      </div>

      <Panel className="space-y-4">
        <SectionTitle title="How money and access actually flow" subtitle="The same four steps for every plan." />
        <ol className="grid gap-4 md:grid-cols-4">
          {[
            { step: "01", title: "Server prices the order", body: "Your browser sends a plan id. The amount comes from the server-side catalogue." },
            { step: "02", title: "Provider takes payment", body: "Card, UPI and net-banking details are entered on the provider's hosted page — never here." },
            { step: "03", title: "Webhook is verified", body: "The signature is checked against the provider secret and the amount is matched to the plan." },
            { step: "04", title: "Entitlement is written", body: "Only then does the backend write your entitlement. Rules make it read-only for every browser." },
          ].map((item) => (
            <li key={item.step} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-200/80">{item.step}</p>
              <p className="mt-2 text-sm font-bold">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-[#e9f3f5]/55">{item.body}</p>
            </li>
          ))}
        </ol>
        {entitlement?.updatedAt && (
          <p className="text-xs text-[#e9f3f5]/40">Last entitlement change: {relativeTime(entitlement.updatedAt)}</p>
        )}
      </Panel>

      {!user && (
        <Panel className="text-sm text-[#e9f3f5]/60">
          Sign in to see your plan. {demo && "This is the demo workspace: no payments are processed and nothing is saved."}
        </Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Refunds" value="Provider-issued" hint="A refund revokes the entitlement; history is kept" />
        <Stat label="Receipts" value="Provider-sent" hint="We store the provider reference, never card data" />
        <Stat label="Cancelling" value="Anytime" hint="Access runs to the end of the paid period" />
      </div>
    </div>
  );
}
