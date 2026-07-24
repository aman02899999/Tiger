/* ---------------------------------------------------------------- */
/* Razorpay integration helper.                                       */
/*                                                                    */
/* SECURITY: only the PUBLIC Key ID (key_id, starts with "rzp_")      */
/* belongs in the frontend. It is read from the env var              */
/*   VITE_RAZORPAY_KEY_ID                                             */
/* NEVER put your Razorpay KEY SECRET in this file or any frontend    */
/* code — it must live only on a backend/cloud function that creates  */
/* orders and verifies payment signatures.                            */
/*                                                                    */
/* PRODUCTION FLOW (recommended):                                     */
/*   1. Backend creates an Order via Razorpay API (uses the secret)   */
/*      and returns the order_id.                                     */
/*   2. Frontend opens Checkout with that order_id (pass it below).   */
/*   3. On success, backend verifies the payment signature before     */
/*      unlocking the plan/item.                                      */
/* Without a backend order_id + verification, treat success as        */
/* provisional only.                                                  */
/* ---------------------------------------------------------------- */

export const RAZORPAY_KEY_ID: string = import.meta.env.VITE_RAZORPAY_KEY_ID ?? "";

export function isRazorpayConfigured(): boolean {
  return RAZORPAY_KEY_ID.startsWith("rzp_");
}

let scriptPromise: Promise<boolean> | null = null;

/** Lazily load Razorpay's checkout.js from their CDN. */
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => { scriptPromise = null; resolve(false); };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export interface RazorpayOptions {
  amount: number;          // in the smallest currency unit (paise for INR)
  currency?: string;       // default "INR"
  name: string;            // merchant/app name shown on the checkout
  description: string;     // item/plan description
  prefillEmail?: string;
  prefillName?: string;
  orderId?: string;        // pass a backend-created order_id in production
  onSuccess: (paymentId: string, raw: unknown) => void;
  onDismiss?: () => void;
}

/**
 * Open the Razorpay Checkout modal. Returns false if Razorpay isn't
 * configured or the script failed to load (caller should fall back).
 */
export async function openRazorpayCheckout(opts: RazorpayOptions): Promise<boolean> {
  if (!isRazorpayConfigured()) return false;
  const ok = await loadRazorpay();
  if (!ok) return false;

  const config: Record<string, unknown> = {
    key: RAZORPAY_KEY_ID,
    amount: opts.amount,
    currency: opts.currency ?? "INR",
    name: opts.name,
    description: opts.description,
    prefill: { email: opts.prefillEmail ?? "", name: opts.prefillName ?? "" },
    theme: { color: "#a78bfa" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (response: any) => opts.onSuccess(response?.razorpay_payment_id ?? "", response),
    modal: { ondismiss: () => opts.onDismiss?.() },
  };
  if (opts.orderId) config.order_id = opts.orderId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rzp = new (window as any).Razorpay(config);
  rzp.open();
  return true;
}
