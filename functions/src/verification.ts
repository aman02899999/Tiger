/* ═══════════════════════════════════════════════════════════════════
   PAYMENT VERIFICATION — pure, crypto-only, fully unit-testable
   ───────────────────────────────────────────────────────────────────
   This module deliberately imports nothing but Node's crypto. That is
   what lets `scripts/test-saas.mjs` prove signature handling, amount
   matching, idempotency keys and entitlement derivation without a
   Firebase project, a Razorpay account or the network.

   The rule it enforces: an entitlement is derived from a webhook whose
   signature verified against the provider secret AND whose amount
   matches the catalog price for the SKU the order declared. Anything
   else is recorded as `failed`/`disputed`, never as a grant.
   ═══════════════════════════════════════════════════════════════════ */

import { createHmac, timingSafeEqual } from "node:crypto";

/* ── Plan catalog (single source of truth for price) ───────────── */

export type EntitlementPlan =
  | "free"
  | "pro"
  | "elite"
  | "gym_growth"
  | "gym_scale"
  | "gym_enterprise";

export type BillingCycle = "monthly" | "annual" | "lifetime";

export type PlanDefinition = {
  plan: EntitlementPlan;
  subjectType: "user" | "gym";
  /** Price in the smallest currency unit (paise). */
  amountMinor: Record<BillingCycle, number>;
  seats?: { trainers: number; members: number };
  /** Days the entitlement stays valid; null = never expires. */
  durationDays: Record<BillingCycle, number | null>;
};

export const PLAN_CATALOG: Record<EntitlementPlan, PlanDefinition> = {
  free: {
    plan: "free",
    subjectType: "user",
    amountMinor: { monthly: 0, annual: 0, lifetime: 0 },
    durationDays: { monthly: null, annual: null, lifetime: null },
  },
  pro: {
    plan: "pro",
    subjectType: "user",
    amountMinor: { monthly: 19_900, annual: 149_900, lifetime: 0 },
    durationDays: { monthly: 31, annual: 366, lifetime: null },
  },
  elite: {
    plan: "elite",
    subjectType: "user",
    amountMinor: { monthly: 39_900, annual: 299_900, lifetime: 699_900 },
    durationDays: { monthly: 31, annual: 366, lifetime: null },
  },
  gym_growth: {
    plan: "gym_growth",
    subjectType: "gym",
    amountMinor: { monthly: 499_900, annual: 4_999_900, lifetime: 0 },
    seats: { trainers: 5, members: 150 },
    durationDays: { monthly: 31, annual: 366, lifetime: null },
  },
  gym_scale: {
    plan: "gym_scale",
    subjectType: "gym",
    amountMinor: { monthly: 999_900, annual: 9_999_900, lifetime: 0 },
    seats: { trainers: 15, members: 500 },
    durationDays: { monthly: 31, annual: 366, lifetime: null },
  },
  gym_enterprise: {
    plan: "gym_enterprise",
    subjectType: "gym",
    amountMinor: { monthly: 1_499_900, annual: 14_999_900, lifetime: 0 },
    seats: { trainers: 60, members: 5000 },
    durationDays: { monthly: 31, annual: 366, lifetime: null },
  },
};

export const CURRENCY = "INR";

/* ── Signature verification ─────────────────────────────────────── */

export type SignatureResult =
  | { ok: true }
  | { ok: false; reason: "missing_signature" | "missing_secret" | "invalid_signature" };

/**
 * Razorpay signs the RAW request body with HMAC-SHA256 using the webhook
 * secret and sends it hex-encoded in `X-Razorpay-Signature`.
 * Comparison is constant-time — a length-varying compare leaks the prefix.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  webhookSecret: string | null | undefined,
): SignatureResult {
  if (!signatureHeader) return { ok: false, reason: "missing_signature" };
  if (!webhookSecret) return { ok: false, reason: "missing_secret" };

  const expected = createHmac("sha256", webhookSecret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.trim().toLowerCase();
  if (provided.length !== expected.length) return { ok: false, reason: "invalid_signature" };

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  return timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: "invalid_signature" };
}

/* ── Webhook payload handling ───────────────────────────────────── */

export type WebhookEvent = {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        notes?: Record<string, string>;
        email?: string;
        contact?: string;
      };
    };
    refund?: { entity?: { payment_id?: string; amount?: number; status?: string } };
  };
};

export type VerifiedGrant = {
  ok: true;
  providerRef: string;
  orderId: string | null;
  amountMinor: number;
  currency: string;
  plan: EntitlementPlan;
  cycle: BillingCycle;
  subjectType: "user" | "gym";
  subjectId: string;
  gymId: string | null;
  /** Idempotency key — the same providerRef may only be applied once. */
  idempotencyKey: string;
  /** Derived validity window. */
  expiresAt: string | null;
};

export type VerificationFailure = {
  ok: false;
  reason:
    | "unknown_event"
    | "missing_payment"
    | "missing_notes"
    | "unknown_plan"
    | "amount_mismatch"
    | "currency_mismatch"
    | "not_captured";
  detail?: string;
};

export type GrantResult = VerifiedGrant | VerificationFailure;

const CAPTURED_STATES = new Set(["captured", "authorized"]);

/**
 * Turns a verified webhook into a grant decision. Pure: same input,
 * same decision, so it can be replayed in tests and in the emulator.
 */
export function deriveGrant(event: WebhookEvent, now = new Date()): GrantResult {
  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    return { ok: false, reason: "unknown_event", detail: event.event };
  }
  const entity = event.payload?.payment?.entity;
  if (!entity?.id) return { ok: false, reason: "missing_payment" };

  const notes = entity.notes ?? {};
  const plan = notes.plan as EntitlementPlan | undefined;
  if (!plan || !notes.subjectId) return { ok: false, reason: "missing_notes" };

  const definition = PLAN_CATALOG[plan];
  if (!definition) return { ok: false, reason: "unknown_plan", detail: plan };

  const cycle = (notes.cycle as BillingCycle) ?? "monthly";
  if (entity.currency && entity.currency.toUpperCase() !== CURRENCY) {
    return { ok: false, reason: "currency_mismatch", detail: entity.currency };
  }

  const expected = definition.amountMinor[cycle] ?? 0;
  if (typeof entity.amount === "number" && entity.amount !== expected) {
    return { ok: false, reason: "amount_mismatch", detail: `${entity.amount} != ${expected}` };
  }
  if (entity.status && !CAPTURED_STATES.has(entity.status)) {
    return { ok: false, reason: "not_captured", detail: entity.status };
  }

  const days = definition.durationDays[cycle];
  const expiresAt = days === null ? null : new Date(now.getTime() + days * 86_400_000).toISOString();

  return {
    ok: true,
    providerRef: entity.id,
    orderId: entity.order_id ?? null,
    amountMinor: expected,
    currency: CURRENCY,
    plan,
    cycle,
    subjectType: definition.subjectType,
    subjectId: notes.subjectId,
    gymId: notes.gymId ?? null,
    idempotencyKey: `${entity.id}:${plan}:${cycle}`,
    expiresAt,
  };
}

/** Refunds and failures revoke rather than delete — history must survive. */
export function revocationFor(event: WebhookEvent): { status: "refunded" | "failed" | "disputed"; providerRef: string } | null {
  const paymentId = event.payload?.refund?.entity?.payment_id ?? event.payload?.payment?.entity?.id;
  if (!paymentId) return null;
  switch (event.event) {
    case "refund.processed":
    case "payment.refunded":
      return { status: "refunded", providerRef: paymentId };
    case "payment.failed":
      return { status: "failed", providerRef: paymentId };
    case "payment.disputed":
      return { status: "disputed", providerRef: paymentId };
    default:
      return null;
  }
}

/* ── Order construction (server-side pricing) ───────────────────── */

export type OrderDraft = {
  amountMinor: number;
  currency: string;
  notes: Record<string, string>;
  receipt: string;
};

/** The browser sends a plan id, never a price. Pricing happens here. */
export function buildOrderDraft(input: {
  plan: EntitlementPlan;
  cycle: BillingCycle;
  subjectId: string;
  gymId?: string | null;
  now?: Date;
}): OrderDraft {
  const definition = PLAN_CATALOG[input.plan];
  if (!definition) throw new Error(`Unknown plan: ${input.plan}`);
  const amountMinor = definition.amountMinor[input.cycle] ?? 0;
  const stamp = (input.now ?? new Date()).getTime();
  return {
    amountMinor,
    currency: CURRENCY,
    notes: {
      plan: input.plan,
      cycle: input.cycle,
      subjectId: input.subjectId,
      subjectType: definition.subjectType,
      gymId: input.gymId ?? "",
    },
    receipt: `tiger_${input.plan}_${stamp}`.slice(0, 40),
  };
}

/** Coupons are validated on the server; the client only names a code. */
export const COUPONS: Record<string, { percentOff: number; label: string }> = {
  LAUNCH20: { percentOff: 20, label: "Launch offer" },
  WELCOME50: { percentOff: 50, label: "First-time welcome discount" },
};

export function applyCoupon(amountMinor: number, code: string | null | undefined): number {
  if (!code) return amountMinor;
  const coupon = COUPONS[code.trim().toUpperCase()];
  if (!coupon) return amountMinor;
  return Math.max(0, Math.round(amountMinor * (1 - coupon.percentOff / 100)));
}

/* ── Entitlement document shape written by the backend ─────────── */

export type EntitlementDocument = {
  subjectType: "user" | "gym";
  subjectId: string;
  gymId: string | null;
  plan: EntitlementPlan;
  status: "active";
  source: "razorpay" | "play" | "manual" | "trial";
  startedAt: string;
  expiresAt: string | null;
  seats?: { trainers: number; members: number };
  providerRef: string;
  updatedAt: string;
};

export function entitlementFromGrant(grant: VerifiedGrant, now = new Date()): EntitlementDocument {
  const definition = PLAN_CATALOG[grant.plan];
  return {
    subjectType: grant.subjectType,
    subjectId: grant.subjectId,
    gymId: grant.gymId,
    plan: grant.plan,
    status: "active",
    source: "razorpay",
    startedAt: now.toISOString(),
    expiresAt: grant.expiresAt,
    ...(definition.seats ? { seats: definition.seats } : {}),
    providerRef: grant.providerRef,
    updatedAt: now.toISOString(),
  };
}

/* ═══════════════════════════════════════════════════════════════════
   GOOGLE PLAY BILLING
   ───────────────────────────────────────────────────────────────────
   The Android build is a Trusted Web Activity, so digital purchases
   made inside it MUST go through Play Billing (Play policy), not the
   Razorpay path the website uses. Play hands the client an opaque
   `purchaseToken`; that token proves nothing until it is exchanged
   with Google's Android Publisher API server-side.

   These functions are the pure half of that exchange — the product-id
   mapping and the entitlement shape — kept here so `test-saas.mjs`
   asserts the same mapping the deployed function runs on. The network
   call itself lives in `index.ts::verifyPlayPurchase`.

   Product ids are created in Play Console; see PLAY_CONSOLE_SETUP.md.
   A product id absent from this catalog is refused rather than guessed,
   because guessing is how an unpriced SKU becomes a free Elite plan.
   ═══════════════════════════════════════════════════════════════════ */

export type PlayProductKind = "subscription" | "onetime";

export type PlayProductDefinition = {
  productId: string;
  plan: EntitlementPlan;
  cycle: BillingCycle;
  kind: PlayProductKind;
};

export const PLAY_PRODUCT_CATALOG: Record<string, PlayProductDefinition> = {
  pro_monthly: { productId: "pro_monthly", plan: "pro", cycle: "monthly", kind: "subscription" },
  pro_annual: { productId: "pro_annual", plan: "pro", cycle: "annual", kind: "subscription" },
  elite_monthly: { productId: "elite_monthly", plan: "elite", cycle: "monthly", kind: "subscription" },
  elite_annual: { productId: "elite_annual", plan: "elite", cycle: "annual", kind: "subscription" },
  elite_lifetime: { productId: "elite_lifetime", plan: "elite", cycle: "lifetime", kind: "onetime" },
};

/** The catalog entry for a Play product id, or null when the id is unknown. */
export function playProductFor(productId: string | null | undefined): PlayProductDefinition | null {
  if (typeof productId !== "string" || !productId) return null;
  return PLAY_PRODUCT_CATALOG[productId] ?? null;
}

/**
 * True only for the subscription state Google reports for a live, paying
 * subscription. Grace period and on-hold deliberately do NOT grant: they
 * mean Google is still trying to charge the card.
 */
export function isActivePlayState(state: string | null | undefined): boolean {
  return state === "SUBSCRIPTION_STATE_ACTIVE";
}

export type PlayVerificationInput = {
  uid: string;
  productId: string;
  /** RFC3339 expiry from Google for a subscription; null for a one-time product. */
  expiryTime?: string | null;
  /** SHA-256 of the purchase token — the token itself is never stored. */
  purchaseTokenHash: string;
};

export type PlayVerificationFailure = {
  ok: false;
  reason: "unknown_product" | "missing_uid" | "missing_token_hash" | "expired";
};

export type PlayVerificationSuccess = {
  ok: true;
  entitlement: EntitlementDocument;
  product: PlayProductDefinition;
};

/**
 * Turns a *already-verified-with-Google* purchase into the entitlement
 * document to persist. Refuses unknown products, missing identities and
 * already-expired subscriptions instead of defaulting them to something
 * generous.
 */
export function entitlementFromPlay(
  input: PlayVerificationInput,
  now = new Date(),
): PlayVerificationSuccess | PlayVerificationFailure {
  if (!input.uid) return { ok: false, reason: "missing_uid" };
  if (!input.purchaseTokenHash) return { ok: false, reason: "missing_token_hash" };

  const product = playProductFor(input.productId);
  if (!product) return { ok: false, reason: "unknown_product" };

  const definition = PLAN_CATALOG[product.plan];

  /* A lifetime product never expires. A subscription expires when Google
     says it does; if Google already reports a past expiry we refuse rather
     than grant a window that has closed. */
  let expiresAt: string | null = null;
  if (product.cycle !== "lifetime") {
    if (input.expiryTime) {
      const parsed = new Date(input.expiryTime);
      if (Number.isNaN(parsed.getTime())) return { ok: false, reason: "expired" };
      if (parsed.getTime() <= now.getTime()) return { ok: false, reason: "expired" };
      expiresAt = parsed.toISOString();
    } else {
      /* Google omitted an expiry on a recurring product — fall back to the
         catalog duration rather than treating it as perpetual. */
      const days = definition.durationDays[product.cycle];
      expiresAt = days === null ? null : new Date(now.getTime() + days * 86_400_000).toISOString();
    }
  }

  return {
    ok: true,
    product,
    entitlement: {
      subjectType: "user",
      subjectId: input.uid,
      gymId: null,
      plan: product.plan,
      status: "active",
      source: "play",
      startedAt: now.toISOString(),
      expiresAt,
      ...(definition.seats ? { seats: definition.seats } : {}),
      providerRef: `play:${input.purchaseTokenHash}`,
      updatedAt: now.toISOString(),
    },
  };
}
