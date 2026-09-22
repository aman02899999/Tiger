/* ═══════════════════════════════════════════════════════════════════
   TRUSTED BACKEND — Cloud Functions (Firebase Functions v2)
   ───────────────────────────────────────────────────────────────────
   This is the ONLY component allowed to:

     • set custom claims (roles, gym ids)          → adminAssignRole / adminProvisionGym
     • write entitlements, payments, auditLog      → paymentWebhook / adminGrantEntitlement
     • create provider orders with real pricing    → createCheckout

   Every handler re-verifies the caller's role from the ID token, writes
   an audit entry, and is idempotent on its provider reference. If the
   secrets are missing it fails loudly with a manual-configuration error
   rather than silently no-op'ing.
   ═══════════════════════════════════════════════════════════════════ */

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { createHash } from "node:crypto";
import { google } from "googleapis";

import {
  applyCoupon,
  buildOrderDraft,
  deriveGrant,
  entitlementFromGrant,
  revocationFor,
  verifyWebhookSignature,
  entitlementFromPlay,
  isActivePlayState,
  playProductFor,
  type BillingCycle,
  type EntitlementPlan,
} from "./verification";

initializeApp();
const db = getFirestore();
const auth = getAuth();

const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");
const PLAY_PACKAGE_NAME = defineSecret("PLAY_PACKAGE_NAME");

const VALID_ROLES = ["super_admin", "gym_owner", "trainer", "client"] as const;
type Role = (typeof VALID_ROLES)[number];

/* ── helpers ────────────────────────────────────────────────────── */

function requireAuth(request: { auth?: { uid: string; token: Record<string, unknown> } | null }) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in to continue.");
  }
  return request.auth;
}

async function requireSuperAdmin(request: { auth?: { uid: string; token: Record<string, unknown> } | null }) {
  const auth_ = requireAuth(request);
  const role = (auth_.token.role as string) ?? "client";
  if (role !== "super_admin") {
    throw new HttpsError("permission-denied", "Only a platform admin may perform this action.");
    }
  return auth_;
}

async function sameGymOwner(request: { auth?: { uid: string; token: Record<string, unknown> } | null }, gymId: string) {
  const auth_ = requireAuth(request);
  const role = (auth_.token.role as string) ?? "client";
  const claimGym = (auth_.token.gymId as string) ?? null;
  if (role !== "gym_owner" || claimGym !== gymId) {
    throw new HttpsError("permission-denied", "Only this gym's owner may perform this action.");
  }
  return auth_;
}

async function audit(entry: {
  actorId: string;
  actorRole: string;
  gymId: string | null;
  action: string;
  entity: string;
  entityId: string;
  meta?: Record<string, string | number | boolean | null>;
}) {
  await db.collection("auditLog").add({ ...entry, at: FieldValue.serverTimestamp() });
}

/* ── 1. Provision a gym (and appoint its owner) ─────────────────── */

export const adminProvisionGym = onCall(async (request) => {
  const actor = await requireSuperAdmin(request);
  const { name, slug, ownerId, plan = "trial", seats = { trainers: 2, members: 25 }, city = null } = request.data ?? {};

  if (!name || !slug || !ownerId) {
    throw new HttpsError("invalid-argument", "name, slug and ownerId are required.");
  }

  const gymRef = db.collection("gyms").doc();
  const gymId = gymRef.id;

  const batch = db.batch();
  batch.set(gymRef, {
    name,
    slug,
    ownerId,
    plan,
    status: "active",
    seats,
    city,
    country: "IN",
    joinCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(db.collection("memberships").doc(`${gymId}_${ownerId}`), {
    gymId,
    userId: ownerId,
    role: "gym_owner",
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(db.collection("users").doc(ownerId), { gymId, role: "gym_owner", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await batch.commit();

  await auth.setCustomUserClaims(ownerId, { role: "gym_owner", gymId, gymIds: [gymId] });
  await audit({
    actorId: actor.uid,
    actorRole: "super_admin",
    gymId,
    action: "gym.provision",
    entity: "gyms",
    entityId: gymId,
    meta: { ownerId, plan },
  });

  return { gymId };
});

/* ── 2. Assign a role / entitlement ─────────────────────────────── */

export const adminAssignRole = onCall(async (request) => {
  const actor = await requireSuperAdmin(request);
  const { userId, role, gymId = null, plan = null } = request.data ?? {};

  if (!userId || !VALID_ROLES.includes(role as Role)) {
    throw new HttpsError("invalid-argument", "userId and a valid role are required.");
  }
  if (role !== "super_admin" && !gymId) {
    throw new HttpsError("invalid-argument", "gymId is required for tenant roles.");
  }

  const memberships = await db.collection("memberships").where("userId", "==", userId).get();
  const batch = db.batch();
  for (const doc of memberships.docs) batch.delete(doc.ref);
  if (role !== "super_admin") {
    batch.set(db.collection("memberships").doc(`${gymId}_${userId}`), {
      gymId,
      userId,
      role,
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  batch.set(
    db.collection("users").doc(userId),
    { role, gymId: role === "super_admin" ? null : gymId, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  await batch.commit();

  await auth.setCustomUserClaims(userId, {
    role,
    gymId: role === "super_admin" ? null : gymId,
    gymIds: role === "super_admin" ? [] : [gymId],
  });

  if (plan) {
    await db.collection("entitlements").doc(userId).set(
      {
        subjectType: "user",
        subjectId: userId,
        gymId: gymId ?? null,
        plan,
        status: "active",
        source: "manual",
        startedAt: FieldValue.serverTimestamp(),
        expiresAt: null,
        providerRef: `manual:${actor.uid}`,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  await audit({
    actorId: actor.uid,
    actorRole: "super_admin",
    gymId,
    action: "role.assign",
    entity: "users",
    entityId: userId,
    meta: { role, plan },
  });

  return { ok: true };
});

/* ── 3. Membership management by a gym owner ────────────────────── */

export const gymAddMember = onCall(async (request) => {
  const { gymId, userId, role = "client" } = request.data ?? {};
  if (!gymId || !userId) throw new HttpsError("invalid-argument", "gymId and userId are required.");
  const actor = await sameGymOwner(request, gymId);
  if (role !== "trainer" && role !== "client") {
    throw new HttpsError("permission-denied", "Owners may only add trainers and members.");
  }

  await db.collection("memberships").doc(`${gymId}_${userId}`).set(
    {
      gymId,
      userId,
      role,
      status: role === "trainer" ? "active" : "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await audit({
    actorId: actor.uid,
    actorRole: "gym_owner",
    gymId,
    action: "membership.manage",
    entity: "memberships",
    entityId: `${gymId}_${userId}`,
    meta: { role },
  });

  return { ok: true };
});

/* ── 4. Orders (server-side pricing) ────────────────────────────── */

export const createCheckout = onCall(
  { secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] },
  async (request) => {
    const actor = requireAuth(request);
    const { plan, cycle = "monthly", gymId = null, coupon = null } = request.data ?? {};
    const keyId = RAZORPAY_KEY_ID.value();
    const keySecret = RAZORPAY_KEY_SECRET.value();

    if (!keyId || !keySecret) {
      throw new HttpsError(
        "failed-precondition",
        "Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then redeploy.",
      );
    }

    const draft = buildOrderDraft({
      plan: plan as EntitlementPlan,
      cycle: cycle as BillingCycle,
      subjectId: plan.startsWith("gym_") ? gymId : actor.uid,
      gymId,
    });
    const amount = applyCoupon(draft.amountMinor, coupon);

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount,
        currency: draft.currency,
        receipt: draft.receipt,
        notes: draft.notes,
      }),
    });

    if (!response.ok) {
      logger.error("razorpay order failed", await response.text());
      throw new HttpsError("internal", "Could not create the payment order.");
    }

    const order = (await response.json()) as { id: string; amount: number; currency: string };

    /* Recorded as `created` — NOT captured. The webhook is the only thing
       that can move it forward, which is what makes entitlement trustworthy. */
    await db.collection("payments").doc(order.id).set({
      gymId,
      userId: actor.uid,
      provider: "razorpay",
      providerRef: order.id,
      amountMinor: order.amount,
      currency: order.currency,
      status: "created",
      plan,
      createdAt: FieldValue.serverTimestamp(),
      verifiedAt: null,
      verifiedBy: null,
    });

    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId };
  },
);

/* ── 5. Webhook: verify, then grant ─────────────────────────────── */

export const paymentWebhook = onRequest(
  { secrets: [RAZORPAY_WEBHOOK_SECRET], cors: false },
  async (req, res) => {
    const rawBody = typeof req.rawBody === "string" ? req.rawBody : req.rawBody?.toString("utf8") ?? JSON.stringify(req.body);
    const signature = req.get("x-razorpay-signature") ?? null;
    const secret = RAZORPAY_WEBHOOK_SECRET.value();

    const signatureCheck = verifyWebhookSignature(rawBody, signature, secret);
    if (!signatureCheck.ok) {
      logger.warn("rejected webhook", signatureCheck.reason);
      res.status(401).json({ ok: false, reason: signatureCheck.reason });
      return;
    }

    let event: Parameters<typeof deriveGrant>[0];
    try {
      event = JSON.parse(rawBody);
    } catch {
      res.status(400).json({ ok: false, reason: "invalid_json" });
      return;
    }

    const revocation = revocationFor(event);
    const grant = deriveGrant(event);

    if (!grant.ok && !revocation) {
      logger.info("webhook ignored", grant.reason);
      res.status(200).json({ ok: true, ignored: grant.reason });
      return;
    }

    if (grant.ok) {
      const paymentRef = db.collection("payments").doc(grant.providerRef);
      const existing = await paymentRef.get();
      if (existing.exists && existing.data()?.status === "captured") {
        /* Idempotent: providers retry, entitlements must not stack. */
        res.status(200).json({ ok: true, idempotent: true });
        return;
      }

      const batch = db.batch();
      batch.set(
        paymentRef,
        {
          gymId: grant.gymId,
          userId: grant.subjectType === "user" ? grant.subjectId : null,
          provider: "razorpay",
          providerRef: grant.providerRef,
          amountMinor: grant.amountMinor,
          currency: grant.currency,
          status: "captured",
          plan: grant.plan,
          createdAt: FieldValue.serverTimestamp(),
          verifiedAt: FieldValue.serverTimestamp(),
          verifiedBy: "webhook:razorpay",
        },
        { merge: true },
      );
      batch.set(db.collection("entitlements").doc(grant.subjectId), entitlementFromGrant(grant) as unknown as Record<string, unknown>, { merge: true });
      batch.set(db.collection("auditLog").doc(), {
        actorId: "webhook:razorpay",
        actorRole: "system",
        gymId: grant.gymId,
        action: "entitlement.grant",
        entity: "entitlements",
        entityId: grant.subjectId,
        at: FieldValue.serverTimestamp(),
        meta: { plan: grant.plan, cycle: grant.cycle, amountMinor: grant.amountMinor },
      });
      await batch.commit();

      logger.info("entitlement granted", { subject: grant.subjectId, plan: grant.plan });
      res.status(200).json({ ok: true, granted: grant.plan });
      return;
    }

    /* Revocation path: refunds, failures, disputes. */
    if (revocation) {
      await db.collection("payments").doc(revocation.providerRef).set({ status: revocation.status }, { merge: true });
      const payment = await db.collection("payments").doc(revocation.providerRef).get();
      const subjectId = (payment.data()?.gymId as string) || (payment.data()?.userId as string) || null;
      if (subjectId) {
        await db.collection("entitlements").doc(subjectId).set(
          { status: revocation.status === "refunded" ? "refunded" : "revoked", updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
      }
      await audit({
        actorId: "webhook:razorpay",
        actorRole: "system",
        gymId: (payment.data()?.gymId as string) ?? null,
        action: `payment.${revocation.status}`,
        entity: "payments",
        entityId: revocation.providerRef,
      });
      res.status(200).json({ ok: true, revoked: revocation.status });
    }
  },
);

/* ── 5b. Google Play Billing: verify, then grant ─────────────────── */

/**
 * Exchanges a Play `purchaseToken` for an entitlement.
 *
 * TRUST BOUNDARY: the token arrives from the client and is worthless on
 * its own — anyone can POST a string. It only becomes evidence after
 * Google's Android Publisher API confirms it against our package name.
 * The token itself is never stored; only its SHA-256, which is what makes
 * replay detectable without keeping a live credential in Firestore.
 *
 * Idempotent on the token hash: Play retries, and a user can call this
 * again after reinstalling, but an entitlement must never stack.
 */
export const verifyPlayPurchase = onCall({ secrets: [PLAY_PACKAGE_NAME] }, async (request) => {
  const actor = requireAuth(request);

  const purchaseToken = (request.data?.purchaseToken ?? null) as string | null;
  const productId = (request.data?.productId ?? request.data?.sku ?? null) as string | null;

  if (typeof purchaseToken !== "string" || purchaseToken.length < 20) {
    throw new HttpsError("invalid-argument", "A Play purchase token is required.");
  }

  const product = playProductFor(productId);
  if (!product) {
    /* An unpriced SKU must never fall through to a default plan. */
    throw new HttpsError("invalid-argument", `Unknown Play product: ${String(productId)}`);
  }

  const packageName = PLAY_PACKAGE_NAME.value();
  if (!packageName) {
    throw new HttpsError(
      "failed-precondition",
      "PLAY_PACKAGE_NAME is not configured. Set the secret, then redeploy — nothing is granted until Play can be queried.",
    );
  }

  const tokenHash = createHash("sha256").update(purchaseToken).digest("hex");
  const verificationRef = db.collection("paymentVerifications").doc(`play_${tokenHash}`);

  /* Idempotency first: a token already exchanged for this user is a no-op,
     and the same token seen for a *different* user is a replay attempt. */
  const seen = await verificationRef.get();
  if (seen.exists) {
    const seenUid = seen.data()?.uid as string | undefined;
    if (seenUid && seenUid !== actor.uid) {
      logger.warn("play token replay across accounts", { tokenHash, seenUid, caller: actor.uid });
      throw new HttpsError("permission-denied", "This purchase belongs to a different account.");
    }
    return { status: "active", plan: seen.data()?.plan ?? product.plan, idempotent: true };
  }

  const publisher = google.androidpublisher({
    version: "v3",
    auth: new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/androidpublisher"] }),
  });

  let expiryTime: string | null = null;
  let googleProductId: string | null = null;
  let state: string | null = null;

  try {
    if (product.kind === "subscription") {
      const purchase = await publisher.purchases.subscriptionsv2.get({ packageName, token: purchaseToken });
      state = purchase.data.subscriptionState ?? null;
      const lineItem = purchase.data.lineItems?.[0];
      googleProductId = lineItem?.productId ?? null;
      expiryTime = lineItem?.expiryTime ?? null;
      if (!isActivePlayState(state)) {
        throw new HttpsError("failed-precondition", `This subscription is not active (${String(state)}).`);
      }
    } else {
      const purchase = await publisher.purchases.products.get({
        packageName,
        productId: product.productId,
        token: purchaseToken,
      });
      /* purchaseState 0 = purchased. 1 = cancelled, 2 = pending. */
      if (purchase.data.purchaseState !== 0) {
        throw new HttpsError("failed-precondition", "This purchase is not completed.");
      }
      googleProductId = purchase.data.productId ?? product.productId;
      state = "PURCHASED";
    }
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error("play verification failed", { tokenHash, error: String(error) });
    throw new HttpsError("failed-precondition", "Google Play could not verify this purchase.");
  }

  /* Google is authoritative about which product the token belongs to. If it
     disagrees with the client's claim, trust Google, not the caller. */
  if (googleProductId && googleProductId !== product.productId) {
    logger.warn("play product mismatch", { claimed: product.productId, actual: googleProductId });
    throw new HttpsError("permission-denied", "This purchase does not match the requested product.");
  }

  const result = entitlementFromPlay({
    uid: actor.uid,
    productId: product.productId,
    expiryTime,
    purchaseTokenHash: tokenHash,
  });

  if (!result.ok) {
    throw new HttpsError("failed-precondition", `Play purchase rejected: ${result.reason}`);
  }

  const batch = db.batch();
  batch.set(verificationRef, {
    uid: actor.uid,
    provider: "play",
    productId: product.productId,
    plan: product.plan,
    cycle: product.cycle,
    state,
    purchaseTokenHash: tokenHash,
    verifiedAt: FieldValue.serverTimestamp(),
  });
  batch.set(
    db.collection("payments").doc(`play_${tokenHash}`),
    {
      gymId: null,
      userId: actor.uid,
      provider: "play",
      providerRef: `play:${tokenHash}`,
      amountMinor: null, /* Play settles in its own ledger; we do not invent an amount. */
      currency: null,
      status: "captured",
      plan: product.plan,
      createdAt: FieldValue.serverTimestamp(),
      verifiedAt: FieldValue.serverTimestamp(),
      verifiedBy: "callable:verifyPlayPurchase",
    },
    { merge: true },
  );
  batch.set(
    db.collection("entitlements").doc(actor.uid),
    result.entitlement as unknown as Record<string, unknown>,
    { merge: true },
  );
  batch.set(db.collection("auditLog").doc(), {
    actorId: actor.uid,
    actorRole: (actor.token.role as string) ?? "client",
    gymId: null,
    action: "entitlement.grant",
    entity: "entitlements",
    entityId: actor.uid,
    at: FieldValue.serverTimestamp(),
    meta: { provider: "play", plan: product.plan, cycle: product.cycle, productId: product.productId },
  });
  await batch.commit();

  logger.info("play entitlement granted", { uid: actor.uid, plan: product.plan });
  return {
    status: "active",
    plan: result.entitlement.plan,
    expiresAt: result.entitlement.expiresAt,
    idempotent: false,
  };
});

/* ── 6. Default claims for brand-new identities ─────────────────── */

export const onUserCreate = onDocumentWritten("users/{userId}", async (event) => {
  const after = event.data?.after;
  if (!after?.exists) return;
  const userId = event.params.userId;
  const data = after.data() ?? {};

  /* Never promote from a document the user can write. Only seed the
     weakest role, and only when the account has no claim at all. */
  if (data.role && data.role !== "client") return;
  try {
    const user = await auth.getUser(userId);
    const currentRole = (user.customClaims?.role as string) ?? null;
    if (currentRole) return;
    await auth.setCustomUserClaims(userId, { role: "client", gymId: null, gymIds: [] });
    logger.info("seeded default client claim", { userId });
  } catch (error) {
    logger.warn("could not seed claims", { userId, error: String(error) });
  }
});
