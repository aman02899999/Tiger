/* ═══════════════════════════════════════════════════════════════════
   TRUSTED BACKEND CLIENT
   ───────────────────────────────────────────────────────────────────
   The only channel between the browser and the privileged Cloud
   Functions in `/functions`. Everything here is a *request*; nothing
   here grants anything. The backend re-verifies the caller's claims on
   every call, and `firestore.rules` denies client writes to the
   commercial collections these functions own.

   WHY THIS FILE EXISTS: Checkout previously POSTed to `/api/billing/*`,
   which no hosting config ever routed. Both Firebase Hosting and Vercel
   rewrite `**` to `/index.html`, so those fetches resolved to the SPA
   shell with HTTP 200 — and the Play path treated `response.ok` as
   proof of payment. Callables cannot silently succeed that way: an
   unreachable or unauthorised call throws.
   ═══════════════════════════════════════════════════════════════════ */

import { httpsCallable, type HttpsCallableResult } from "firebase/functions";
import { functions } from "../firebase";

/** Raised when the backend is not reachable or refused the request. */
export class BackendError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "BackendError";
    this.code = code;
  }
}

const NOT_CONFIGURED =
  "The trusted backend is not configured in this environment. Nothing was charged and no plan changed.";

async function call<Req, Res>(name: string, payload: Req): Promise<Res> {
  if (!functions) throw new BackendError("unavailable", NOT_CONFIGURED);
  try {
    const fn = httpsCallable<Req, Res>(functions, name);
    const result: HttpsCallableResult<Res> = await fn(payload);
    return result.data;
  } catch (error) {
    const code = (error as { code?: string }).code ?? "internal";
    const message = (error as { message?: string }).message ?? "The request could not be completed.";
    /* Normalised so callers never have to pattern-match Firebase internals,
       and never mistake a transport failure for a success. */
    throw new BackendError(code.replace(/^functions\//, ""), message);
  }
}

/* ── billing ────────────────────────────────────────────────────── */

export type CheckoutPlan = "pro" | "elite" | "gym_growth" | "gym_scale" | "gym_enterprise";
export type CheckoutCycle = "monthly" | "annual" | "lifetime";

export type CreateCheckoutRequest = {
  plan: CheckoutPlan;
  cycle: CheckoutCycle;
  gymId?: string | null;
  coupon?: string | null;
};

export type CreateCheckoutResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

/** Creates a server-priced provider order. Does NOT capture payment. */
export function createCheckout(request: CreateCheckoutRequest) {
  return call<CreateCheckoutRequest, CreateCheckoutResponse>("createCheckout", {
    gymId: null,
    coupon: null,
    ...request,
  });
}

export type VerifyPlayPurchaseRequest = {
  purchaseToken: string;
  productId: string;
};

export type VerifyPlayPurchaseResponse = {
  status: "active";
  plan: string;
  expiresAt?: string | null;
  idempotent?: boolean;
};

/**
 * Exchanges a Play purchase token for an entitlement. Resolves only when
 * Google itself confirmed the purchase; otherwise it throws.
 */
export function verifyPlayPurchase(request: VerifyPlayPurchaseRequest) {
  return call<VerifyPlayPurchaseRequest, VerifyPlayPurchaseResponse>("verifyPlayPurchase", request);
}

/* ── administration ─────────────────────────────────────────────── */

export function adminAssignRole(request: {
  userId: string;
  role: "super_admin" | "gym_owner" | "trainer" | "client";
  gymId?: string | null;
  /** Optional manual entitlement granted alongside the role. */
  plan?: string | null;
}) {
  return call<typeof request, { ok: true }>("adminAssignRole", {
    gymId: null,
    plan: null,
    ...request,
  });
}

export function adminProvisionGym(request: {
  name: string;
  slug: string;
  ownerId: string;
  plan?: string;
  city?: string | null;
}) {
  return call<typeof request, { gymId: string }>("adminProvisionGym", request);
}

export function gymAddMember(request: { gymId: string; userId: string; role: "trainer" | "client" }) {
  return call<typeof request, { ok: true }>("gymAddMember", request);
}
