/* ═══════════════════════════════════════════════════════════════════
   PROVIDER CHECKOUT
   ───────────────────────────────────────────────────────────────────
   One implementation of "take the user to the payment sheet", shared by
   every upgrade button in the app (landing checkout, Pricing, client
   billing, gym billing).

   WHY IT IS SHARED: each of those screens previously POSTed to its own
   `/api/billing/...` path. None of those paths existed — Firebase
   Hosting and Vercel both rewrite `**` to `/index.html`, so the fetch
   returned the SPA shell with HTTP 200 and the code then either parsed
   HTML as JSON (and showed "not configured") or, in the Play path,
   treated `response.ok` as proof of payment. Routing every screen
   through the same callable removes four ways to get that wrong.

   WHAT THIS CANNOT DO: grant anything. It asks the backend to price and
   create an order, then hands control to the provider's own sheet. The
   provider's webhook is the only writer of `entitlements/*`.
   ═══════════════════════════════════════════════════════════════════ */

import {
  BackendError,
  createCheckout,
  type CheckoutCycle,
  type CheckoutPlan,
  type CreateCheckoutResponse,
} from "./backend";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let scriptPromise: Promise<boolean> | null = null;

/** Loads the provider's checkout script once. Resolves false if it is blocked. */
export function loadProviderScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      scriptPromise = null; /* allow a retry on the next attempt */
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export type ProviderCheckoutOptions = {
  plan: CheckoutPlan;
  cycle: CheckoutCycle;
  gymId?: string | null;
  coupon?: string | null;
  /** Shown on the provider sheet; purely cosmetic. */
  description?: string;
  email?: string | null;
  /** Called when the sheet closes after submission. NOT a grant. */
  onSubmitted?: () => void;
  /** Called when the user dismisses the sheet without paying. */
  onDismissed?: () => void;
};

/**
 * Creates a server-priced order and opens the provider's sheet for it.
 *
 * Throws `BackendError` when the backend refuses, is unconfigured, or the
 * provider script cannot load — so a caller that reaches the next line knows
 * the sheet really opened. It still does not know that money settled.
 */
export async function startProviderCheckout(options: ProviderCheckoutOptions): Promise<CreateCheckoutResponse> {
  const order = await createCheckout({
    plan: options.plan,
    cycle: options.cycle,
    gymId: options.gymId ?? null,
    coupon: options.coupon ?? null,
  });

  const ready = await loadProviderScript();
  if (!ready || !window.Razorpay) {
    throw new BackendError(
      "unavailable",
      "The payment provider's checkout could not be loaded. Nothing was charged — check your connection or any script blocker and try again.",
    );
  }

  const checkout = new window.Razorpay({
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: "Tiger",
    description: options.description ?? "Tiger membership",
    prefill: options.email ? { email: options.email } : undefined,
    theme: { color: "#7c3aed" },
    /* Deliberately no handler that unlocks anything: the sheet closing means
       the user finished, never that the payment settled. */
    handler: () => options.onSubmitted?.(),
    modal: { ondismiss: () => options.onDismissed?.() },
  });
  checkout.open();
  return order;
}

/** The message to show a user when a checkout attempt throws. */
export function checkoutFailureMessage(error: unknown): string {
  if (error instanceof BackendError) return error.message;
  return "Payment could not be started. Nothing was charged and no plan changed.";
}
