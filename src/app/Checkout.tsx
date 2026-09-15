import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthSystem";
import { isPlayBillingAvailable, purchaseWithPlayBilling, acknowledgePlayPurchase } from "./PlayBilling";

const PAYMENT_SETUP_MESSAGE =
  "Payment verification is not configured in this environment. Nothing was charged and no plan changed — entitlements are issued only by a verified provider webhook.";

const PLAY_VERIFICATION_MESSAGE =
  "The Play purchase could not be server-verified yet, so no entitlement was granted. It unlocks automatically once the backend acknowledges the purchase token.";

/* ---------------------------------------------------------------- */
/* Checkout — the UI half of the payment path                        */
/*                                                                    */
/* TRUST BOUNDARY: this component collects intent and starts a        */
/* provider checkout through the trusted backend. It cannot grant     */
/* anything. The previous implementation called                      */
/* `updateUser({ plan })` straight from the browser, which let any    */
/* session promote itself to Elite. That call is removed:             */
/* entitlements are written only by a verified provider webhook, and  */
/* `firestore.rules` denies client writes to commercial fields.       */
/* ---------------------------------------------------------------- */

export type PlanId = "pro" | "elite" | "lifetime";

export interface PlanDef {
  id: PlanId;
  label: string;
  planValue: "Pro" | "Elite";
  monthly: number;
  annual: number; // per year
  lifetime?: number;
  tagline: string;
}

export const PLANS: Record<PlanId, PlanDef> = {
  pro: { id: "pro", label: "Pro", planValue: "Pro", monthly: 199, annual: 1499, tagline: "Unlimited AI coaching & full library access" },
  elite: { id: "elite", label: "Elite Family", planValue: "Elite", monthly: 399, annual: 2999, tagline: "Everything in Pro, for up to 8 family members" },
  lifetime: { id: "lifetime", label: "Lifetime Elite", planValue: "Elite", monthly: 0, annual: 0, lifetime: 6999, tagline: "Pay once, own Elite forever" },
};

// Maps an internal plan+cycle to the Play Console product id that must be
// created for it (see PLAY_CONSOLE_SETUP.md). Subscriptions use base plans
// named "monthly"/"annual" under a single product per tier.
function playSkuFor(planId: PlanId, cycle: "monthly" | "annual"): string {
  if (planId === "lifetime") return "elite_lifetime";
  return `${planId}_${cycle}`;
}

const COUPONS: Record<string, { pct: number; label: string }> = {
  LAUNCH20: { pct: 20, label: "Launch offer" },
  WELCOME50: { pct: 50, label: "First-time welcome discount" },
};

interface ItemPurchase {
  id: string;
  title: string;
  price: number;
  onSuccess: () => void;
}

type CheckoutState =
  | { kind: "plan"; plan: PlanId; cycle: "monthly" | "annual" }
  | { kind: "item"; item: ItemPurchase };

interface CheckoutContextValue {
  openCheckout: (plan: PlanId, cycle?: "monthly" | "annual") => void;
  openItemCheckout: (item: ItemPurchase) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout must be used within CheckoutProvider");
  return ctx;
}

function priceFor(plan: PlanDef, cycle: "monthly" | "annual") {
  if (plan.id === "lifetime") return plan.lifetime!;
  return cycle === "annual" ? plan.annual : plan.monthly;
}

type Step = "plan" | "pay" | "processing" | "success";

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CheckoutState | null>(null);
  const openCheckout = useCallback((plan: PlanId, cycle: "monthly" | "annual" = "monthly") => {
    setState({ kind: "plan", plan, cycle });
  }, []);
  const openItemCheckout = useCallback((item: ItemPurchase) => {
    setState({ kind: "item", item });
  }, []);
  const value = useMemo(() => ({ openCheckout, openItemCheckout }), [openCheckout, openItemCheckout]);

  return (
    <CheckoutContext.Provider value={value}>
      {children}
      {state && <CheckoutModal state={state} onClose={() => setState(null)} />}
    </CheckoutContext.Provider>
  );
}

function CheckoutModal({ state, onClose }: { state: CheckoutState; onClose: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("pay");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; pct: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  // Play Store policy requires digital purchases inside an Android app
  // distributed via Play to go through Play Billing. undefined = still
  // checking; true/false decides which payment UI renders below.
  const [playAvailable, setPlayAvailable] = useState<boolean | undefined>(undefined);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    isPlayBillingAvailable().then(setPlayAvailable);
  }, []);

  const plan = state.kind === "plan" ? PLANS[state.plan] : null;
  const basePrice = state.kind === "plan" ? priceFor(plan!, state.cycle) : state.item.price;
  const discount = appliedCoupon ? Math.round((basePrice * appliedCoupon.pct) / 100) : 0;
  const finalPrice = basePrice - discount;
  const isLifetime = plan?.id === "lifetime";
  const title = state.kind === "plan" ? plan!.label : state.item.title;
  const tagline = state.kind === "plan" ? plan!.tagline : "Instant digital delivery to your device";
  const isRecurring = state.kind === "plan" && !isLifetime;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function applyCoupon() {
    const code = coupon.trim().toUpperCase();
    const found = COUPONS[code];
    if (!found) { setCouponMsg("Invalid or expired code."); setAppliedCoupon(null); return; }
    setAppliedCoupon({ code, pct: found.pct });
    setCouponMsg(`✓ ${found.label} applied — ${found.pct}% off`);
  }

  async function payViaPlay() {
    setStep("processing");
    const sku = state.kind === "plan" ? playSkuFor(state.plan, state.cycle) : state.item.id.replace(/^(guide|bundle)-/, "$1_");
    try {
      const result = await purchaseWithPlayBilling(sku);
      if (!result) {
        setStep("pay");
        return;
      }

      /* A purchase token proves nothing until Google's server-side
         acknowledgement round-trips through our backend. Until that endpoint
         is deployed we stop here — the honest branch the old code hardcoded
         as `verificationRequired = true`. */
      const verified = await verifyPlayPurchaseState(result.purchaseToken, sku);
      if (!verified) {
        setStep("pay");
        setFailure(PLAY_VERIFICATION_MESSAGE);
        return;
      }

      await acknowledgePlayPurchase(result.purchaseToken);
      if (state.kind === "item") state.item.onSuccess();
      setStep("success");
      setTimeout(onClose, 2400);
    } catch {
      setStep("pay");
    }
  }

  /** Asks the trusted backend to verify a Play purchase before anything unlocks. */
  async function verifyPlayPurchaseState(purchaseToken: string, sku: string): Promise<boolean> {
    try {
      const response = await fetch("/api/billing/play-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseToken, sku, userId: user?.id }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function pay() {
    if (playAvailable) return payViaPlay();
    setStep("processing");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: state.kind === "plan" ? state.plan : null,
          itemId: state.kind === "item" ? state.item.id : null,
          cycle: state.kind === "plan" ? state.cycle : null,
          coupon: appliedCoupon?.code ?? null,
          userId: user?.id ?? null,
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const payload = (await response.json()) as { checkoutUrl?: string };
      if (!payload.checkoutUrl) throw new Error("no checkout url");
      window.location.href = payload.checkoutUrl;
    } catch {
      setStep("pay");
      setFailure(PAYMENT_SETUP_MESSAGE);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={step === "pay" ? onClose : undefined}>
      <div className="glass-card w-full max-w-md overflow-hidden rounded-3xl bg-[#0a141f]/97" onClick={(e) => e.stopPropagation()}>
        {failure && (
          <div className="border-b border-rose-400/25 bg-rose-500/10 px-6 py-3 text-[12px] leading-5 text-rose-100">
            {failure}
          </div>
        )}
        {step === "processing" ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-300/25 border-t-violet-300" />
            <p className="text-sm font-bold text-[#e9f3f5]/80">Contacting payment backend…</p>
            <p className="text-xs text-[#e9f3f5]/55">Server-side verification is required before entitlements are granted.</p>
          </div>
        ) : step === "success" ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-400/15 text-4xl">✅</div>
            <h3 className="text-xl font-black text-emerald-300">Purchase submitted</h3>
            <p className="text-sm text-[#e9f3f5]/70">
              <span className="font-bold text-[#ffb627]">{title}</span> activates as soon as the provider
              webhook is verified — usually within seconds.
            </p>
            <p className="text-xs text-[#e9f3f5]/50">
              You can close this window. A receipt goes to {user?.email ?? "your registered email"}.
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-[#e9f3f5]/10 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">{state.kind === "plan" ? "Upgrade to" : "Purchase"}</p>
                  <h3 className="text-2xl font-black">{title}</h3>
                  <p className="mt-0.5 text-xs text-[#e9f3f5]/62">{tagline}</p>
                </div>
                <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-[#e9f3f5]/15 px-3 py-1.5 text-xs text-[#e9f3f5]/70 hover:bg-[#e9f3f5]/8">✕</button>
              </div>

              <div className="mt-4 flex items-end gap-2">
                {discount > 0 && <span className="text-lg text-[#e9f3f5]/40 line-through">₹{basePrice}</span>}
                <span className="text-4xl font-black tabular-nums text-[#ffb627]">₹{finalPrice}</span>
                {isRecurring && <span className="pb-1 text-xs text-[#e9f3f5]/62">/{state.kind === "plan" && state.cycle === "annual" ? "year" : "month"}</span>}
              </div>
              {discount > 0 && <p className="mt-1 text-xs font-bold text-emerald-300">You saved ₹{discount} with {appliedCoupon?.code}</p>}
            </div>

            <div className="p-6">
              {playAvailable === undefined ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-300/25 border-t-violet-300" />
                </div>
              ) : playAvailable ? (
                <>
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-300/25 bg-emerald-300/8 px-4 py-3">
                    <span className="text-xl">▶️</span>
                    <div>
                      <p className="text-sm font-bold text-emerald-200">Google Play Billing</p>
                      <p className="text-xs text-[#e9f3f5]/62">Charged to your Play Store payment method — cancel anytime from Play Store {'>'} Subscriptions.</p>
                    </div>
                  </div>
                  <button type="button" onClick={pay} className="btn-gloss w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-white">
                    ▶️ Continue with Google Play
                  </button>
                  <p className="mt-3 text-xs text-[#e9f3f5]/60">This environment is not configured for live entitlement verification. The app will not grant premium access until the backend confirms the purchase.</p>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-[#e9f3f5]/12 bg-[#e9f3f5]/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-200/80">Hosted provider checkout</p>
                    <p className="mt-2 text-xs leading-5 text-[#e9f3f5]/62">
                      You are handed to the payment provider's own page. Card, UPI and net-banking details
                      are entered there — this app never receives or stores them, and it cannot mark a
                      payment as captured.
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <input value={coupon} onChange={(e) => { setCoupon(e.target.value); setCouponMsg(null); }} placeholder="Coupon code (try LAUNCH20)" className="flex-1 rounded-xl border border-[#e9f3f5]/12 bg-[#0a141f] px-4 py-2.5 text-sm outline-none focus:border-violet-200/40" />
                    <button type="button" onClick={applyCoupon} className="rounded-xl border border-[#ffb627]/30 bg-[#ffb627]/10 px-4 text-xs font-bold text-[#ffb627] hover:bg-[#ffb627]/20">Apply</button>
                  </div>
                  {couponMsg && <p className={`mt-1.5 text-xs font-semibold ${appliedCoupon ? "text-emerald-300" : "text-rose-300"}`}>{couponMsg}</p>}
                  <p className="mt-1.5 text-[10px] text-[#e9f3f5]/45">Final price and coupon validity are re-checked on the server when the order is created.</p>

                  <button type="button" onClick={pay} className="btn-gloss mt-5 w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-white">
                    Continue to secure checkout
                  </button>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[10px] text-[#e9f3f5]/50">
                    <span>Server-priced orders</span>
                    <span>·</span>
                    <span>Webhook-verified entitlement</span>
                    <span>·</span>
                    <span>Refunds revoke, never delete</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
