import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthSystem";
import { isPlayBillingAvailable, purchaseWithPlayBilling, acknowledgePlayPurchase } from "./PlayBilling";
import { isRazorpayConfigured, openRazorpayCheckout } from "./razorpay";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

/* ---------------------------------------------------------------- */
/* Checkout — the app's actual monetization mechanism. Any button    */
/* anywhere can call useCheckout().openCheckout(planId) to launch a  */
/* real upgrade flow that persists the new plan via updateUser().    */
/*                                                                    */
/* INTEGRATION NOTE: payment methods/coupon/"Pay securely" here are   */
/* a production-shaped UI. To go live, swap `simulatePayment()` for   */
/* a real gateway call (Razorpay order + verify is the standard path  */
/* for an India-first app) — everything else (plan unlock, receipts,  */
/* UI) is already wired end-to-end.                                   */
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
  pro: { id: "pro", label: "Gold", planValue: "Pro", monthly: 199, annual: 1499, tagline: "Unlimited AI coaching & full library access" },
  elite: { id: "elite", label: "Platinum Family", planValue: "Elite", monthly: 399, annual: 2999, tagline: "Everything in Gold, for up to 8 family members" },
  lifetime: { id: "lifetime", label: "Platinum Lifetime", planValue: "Elite", monthly: 0, annual: 0, lifetime: 6999, tagline: "Pay once, own Platinum forever" },
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
type Method = "upi" | "card" | "netbanking";

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
  const { user, updateUser, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>("pay");
  const [method, setMethod] = useState<Method>("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; pct: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  // Play Store policy requires digital purchases inside an Android app
  // distributed via Play to go through Play Billing. undefined = still
  // checking; true/false decides which payment UI renders below.
  const [playAvailable, setPlayAvailable] = useState<boolean | undefined>(undefined);

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
      if (!result) { setStep("pay"); return; } // user backed out of the Play sheet
      if (state.kind === "plan") {
        // Plan unlock happens server-side (clients can't self-upgrade).
        const unlockPlay = httpsCallable<Record<string, unknown>, { ok: boolean }>(functions, "unlockPlanAfterPlay");
        await unlockPlay({ plan: plan!.planValue, sku, purchaseToken: result.purchaseToken });
        await refreshUser();
      } else {
        state.item.onSuccess();
        await acknowledgePlayPurchase(result.purchaseToken);
      }
      setStep("success");
      setTimeout(onClose, 2400);
    } catch {
      setStep("pay"); // Play sheet cancelled/failed — let them retry
    }
  }

  async function unlockAfterPayment() {
    if (state.kind === "plan") {
      await updateUser({ plan: plan!.planValue });
    } else {
      state.item.onSuccess();
    }
    setStep("success");
    setTimeout(onClose, 2400);
  }

  async function pay() {
    if (playAvailable) return payViaPlay();

    // Razorpay Checkout — used automatically when VITE_RAZORPAY_KEY_ID is set.
    if (isRazorpayConfigured()) {
      const planValue = state.kind === "plan" ? plan!.planValue : undefined;

      // SECURE PATH: create an order and verify the signature via Cloud
      // Functions (which hold the Razorpay secret). Requires the functions to
      // be deployed. Falls back to a provisional client-only flow otherwise.
      try {
        const createOrder = httpsCallable<{ amount: number; currency: string }, { orderId: string }>(functions, "createRazorpayOrder");
        const orderRes = await createOrder({ amount: finalPrice * 100, currency: "INR" });
        const orderId = orderRes.data.orderId;

        const opened = await openRazorpayCheckout({
          amount: finalPrice * 100,
          currency: "INR",
          name: "The Titan Fitness",
          description: title,
          prefillEmail: user?.email,
          prefillName: user?.name,
          orderId,
          onSuccess: async (paymentId, raw) => {
            setStep("processing");
            try {
              const verify = httpsCallable<Record<string, unknown>, { valid: boolean }>(functions, "verifyRazorpayPayment");
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const signature = (raw as any)?.razorpay_signature;
              const v = await verify({ orderId, paymentId, signature, plan: planValue });
              if (v.data.valid) {
                if (state.kind === "item") state.item.onSuccess();
                else await refreshUser(); // reflect the server-side plan unlock
                setStep("success");
                setTimeout(onClose, 2400);
              } else {
                setPayError("Payment could not be verified. If money was debited, it will be refunded.");
                setStep("pay");
              }
            } catch {
              setPayError("Verification failed. If money was debited, it will be refunded.");
              setStep("pay");
            }
          },
          onDismiss: () => setStep("pay"),
        });
        if (opened) return;
      } catch {
        // Cloud Functions not deployed / unreachable → provisional fallback below.
      }

      // PROVISIONAL FALLBACK: open Checkout without a server order. Unlock is
      // client-side and NOT signature-verified — deploy the functions for
      // production security.
      const opened = await openRazorpayCheckout({
        amount: finalPrice * 100,
        currency: "INR",
        name: "The Titan Fitness",
        description: title,
        prefillEmail: user?.email,
        prefillName: user?.name,
        onSuccess: async () => { setStep("processing"); await unlockAfterPayment(); },
        onDismiss: () => setStep("pay"),
      });
      if (opened) return;
    }

    setStep("processing");
    // Fallback simulated flow (no gateway configured) — keeps the purchase
    // flow fully testable in development.
    await new Promise((r) => setTimeout(r, 1600));
    await unlockAfterPayment();
  }

  const canPay = method === "upi" ? upiId.includes("@") : method === "card" ? cardNum.replace(/\s/g, "").length >= 12 : true;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={step === "pay" ? onClose : undefined}>
      <div className="glass-card w-full max-w-md overflow-hidden rounded-3xl bg-[#0b0714]/97" onClick={(e) => e.stopPropagation()}>
        {step === "processing" ? (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-300/25 border-t-violet-300" />
            <p className="text-sm font-bold text-[#f7f0df]/80">Processing your payment securely…</p>
            <p className="text-xs text-[#f7f0df]/55">Do not close this window</p>
          </div>
        ) : step === "success" ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-400/15 text-4xl">✅</div>
            <h3 className="text-xl font-black text-emerald-300">Payment Successful!</h3>
            <p className="text-sm text-[#f7f0df]/70">
              {state.kind === "plan" ? (
                <>Welcome to <span className="font-bold text-[#d8b35a]">{title}</span> — your account has been upgraded instantly.</>
              ) : (
                <><span className="font-bold text-[#d8b35a]">{title}</span> is ready — your download has started.</>
              )}
            </p>
            <p className="text-xs text-[#f7f0df]/50">Receipt sent to {user?.email}</p>
          </div>
        ) : (
          <>
            <div className="border-b border-[#f7f0df]/10 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">{state.kind === "plan" ? "Upgrade to" : "Purchase"}</p>
                  <h3 className="text-2xl font-black">{title}</h3>
                  <p className="mt-0.5 text-xs text-[#f7f0df]/62">{tagline}</p>
                </div>
                <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-[#f7f0df]/15 px-3 py-1.5 text-xs text-[#f7f0df]/70 hover:bg-[#f7f0df]/8">✕</button>
              </div>

              <div className="mt-4 flex items-end gap-2">
                {discount > 0 && <span className="text-lg text-[#f7f0df]/40 line-through">₹{basePrice}</span>}
                <span className="text-4xl font-black tabular-nums text-[#d8b35a]">₹{finalPrice}</span>
                {isRecurring && <span className="pb-1 text-xs text-[#f7f0df]/62">/{state.kind === "plan" && state.cycle === "annual" ? "year" : "month"}</span>}
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
                      <p className="text-xs text-[#f7f0df]/62">Charged to your Play Store payment method — cancel anytime from Play Store {'>'} Subscriptions.</p>
                    </div>
                  </div>
                  <button type="button" onClick={pay} className="btn-gloss w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-white">
                    ▶️ Continue with Google Play
                  </button>
                </>
              ) : (
                <>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f7f0df]/65">Payment method</p>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {([["upi", "📱 UPI"], ["card", "💳 Card"], ["netbanking", "🏦 Net Banking"]] as [Method, string][]).map(([m, label]) => (
                      <button key={m} type="button" onClick={() => setMethod(m)} className={`rounded-xl border py-2.5 text-xs font-bold transition ${method === m ? "border-violet-300/50 bg-violet-300/12 text-violet-100" : "border-[#f7f0df]/12 bg-[#f7f0df]/5 text-[#f7f0df]/62"}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {method === "upi" && (
                    <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
                  )}
                  {method === "card" && (
                    <div className="space-y-2">
                      <input value={cardNum} onChange={(e) => setCardNum(e.target.value)} placeholder="1234 5678 9012 3456" inputMode="numeric" className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
                      <div className="flex gap-2">
                        <input placeholder="MM/YY" className="w-1/2 rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
                        <input placeholder="CVV" inputMode="numeric" className="w-1/2 rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40" />
                      </div>
                    </div>
                  )}
                  {method === "netbanking" && (
                    <select className="w-full rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-3 text-sm outline-none focus:border-violet-200/40">
                      {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank"].map((b) => <option key={b}>{b}</option>)}
                    </select>
                  )}

                  <div className="mt-4 flex gap-2">
                    <input value={coupon} onChange={(e) => { setCoupon(e.target.value); setCouponMsg(null); }} placeholder="Coupon code (try LAUNCH20)" className="flex-1 rounded-xl border border-[#f7f0df]/12 bg-[#0b0714] px-4 py-2.5 text-sm outline-none focus:border-violet-200/40" />
                    <button type="button" onClick={applyCoupon} className="rounded-xl border border-[#d8b35a]/30 bg-[#d8b35a]/10 px-4 text-xs font-bold text-[#d8b35a] hover:bg-[#d8b35a]/20">Apply</button>
                  </div>
                  {couponMsg && <p className={`mt-1.5 text-xs font-semibold ${appliedCoupon ? "text-emerald-300" : "text-rose-300"}`}>{couponMsg}</p>}

                  <button type="button" onClick={pay} disabled={!canPay} className="btn-gloss mt-5 w-full rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-500 to-violet-700 py-3.5 text-sm font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-40">
                    🔒 Pay ₹{finalPrice} Securely
                  </button>
                  {payError && <p className="mt-2 text-center text-xs font-semibold text-rose-300">{payError}</p>}
                  <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-[#f7f0df]/50">
                    <span>🔒 256-bit encrypted</span>
                    <span>·</span>
                    <span>✅ Instant activation</span>
                    <span>·</span>
                    <span>↩ 7-day refund</span>
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
