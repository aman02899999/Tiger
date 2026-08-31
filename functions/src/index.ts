import { createHash } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { google } from "googleapis";

initializeApp();

const db = getFirestore();
const auth = getAuth();
const playPackageName = defineSecret("PLAY_PACKAGE_NAME");
const roles = ["super_admin", "gym_owner", "trainer", "client"] as const;
type Role = (typeof roles)[number];

function requireSuperAdmin(request: { auth?: { token: Record<string, unknown> } | null }) {
  if (!request.auth || request.auth.token.role !== "super_admin") {
    throw new HttpsError("permission-denied", "A super_admin custom claim is required.");
  }
}

function parseRole(value: unknown): Role {
  if (!roles.includes(value as Role)) {
    throw new HttpsError("invalid-argument", "role must be super_admin, gym_owner, trainer, or client.");
  }
  return value as Role;
}

/** Server-only custom-claim provisioning. Bootstrap the first super_admin with Firebase Admin tooling. */
export const setUserRole = onCall(async (request) => {
  requireSuperAdmin(request);
  const { uid, role: rawRole, gymId } = request.data ?? {};
  if (typeof uid !== "string" || uid.length === 0 || typeof gymId !== "string" || gymId.length === 0) {
    throw new HttpsError("invalid-argument", "uid and gymId are required.");
  }

  const role = parseRole(rawRole);
  await auth.setCustomUserClaims(uid, { role, gymId });
  await db.collection("users").doc(uid).set({
    role,
    gymId,
    roleUpdatedAt: FieldValue.serverTimestamp(),
    roleUpdatedBy: request.auth!.uid,
  }, { merge: true });
  return { uid, role, gymId, refreshTokenRequired: true };
});

/** Verifies a Play subscription with Google before issuing a Firestore entitlement. */
export const verifyPlaySubscription = onCall({ secrets: [playPackageName] }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign-in is required.");
  const purchaseToken = request.data?.purchaseToken;
  if (typeof purchaseToken !== "string" || purchaseToken.length < 20) {
    throw new HttpsError("invalid-argument", "A valid Play purchase token is required.");
  }

  const packageName = playPackageName.value();
  if (!packageName) throw new HttpsError("failed-precondition", "PLAY_PACKAGE_NAME is not configured.");

  const publisher = google.androidpublisher({
    version: "v3",
    auth: new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/androidpublisher"] }),
  });

  let purchase;
  try {
    purchase = await publisher.purchases.subscriptionsv2.get({ packageName, token: purchaseToken });
  } catch (error) {
    console.error("Google Play verification failed", error);
    throw new HttpsError("failed-precondition", "Google Play could not verify this subscription.");
  }

  const state = purchase.data.subscriptionState;
  const lineItem = purchase.data.lineItems?.[0];
  if (state !== "SUBSCRIPTION_STATE_ACTIVE" || !lineItem?.productId) {
    throw new HttpsError("failed-precondition", "This purchase is not an active subscription.");
  }

  const tokenHash = createHash("sha256").update(purchaseToken).digest("hex");
  const entitlement = {
    provider: "google_play",
    productId: lineItem.productId,
    status: "active",
    expiresAt: lineItem.expiryTime ?? null,
    purchaseTokenHash: tokenHash,
    verifiedAt: FieldValue.serverTimestamp(),
  };
  await db.collection("entitlements").doc(request.auth.uid).set(entitlement, { merge: true });
  await db.collection("paymentVerifications").doc(tokenHash).set({
    uid: request.auth.uid,
    provider: "google_play",
    productId: lineItem.productId,
    state,
    verifiedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { status: "active", productId: lineItem.productId, expiresAt: lineItem.expiryTime ?? null };
});
