#!/usr/bin/env node
/**
 * ONE-TIME BOOTSTRAP — promote the first platform admin.
 *
 * Run locally with a service-account key. This is deliberately a script and
 * not an API: there must be no endpoint anywhere that turns an arbitrary
 * caller into a `super_admin`.
 *
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   node scripts/bootstrap-admin.mjs you@yourcompany.com
 *
 * It will:
 *   1. look the user up in Firebase Auth (they must have signed up first)
 *   2. set the `super_admin` custom claim
 *   3. mirror the role onto users/{uid} for display
 *   4. append an auditLog entry
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/bootstrap-admin.mjs <email>");
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_CONFIG) {
  console.error(
    "No credentials found. Set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON file, or run inside a Google Cloud environment.",
  );
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();

const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { role: "super_admin", gymId: null, gymIds: [] });

await db.collection("users").doc(user.uid).set(
  { role: "super_admin", gymId: null, updatedAt: FieldValue.serverTimestamp() },
  { merge: true },
);

await db.collection("auditLog").add({
  actorId: "bootstrap:script",
  actorRole: "system",
  gymId: null,
  action: "role.bootstrap",
  entity: "users",
  entityId: user.uid,
  at: FieldValue.serverTimestamp(),
  meta: { email },
});

console.log(`✓ ${email} (${user.uid}) is now super_admin.`);
console.log("  The claim takes effect the next time the user's ID token refreshes (≤1h, or on re-login).");
console.log("  Next: provision the first gym with adminProvisionGym, then invite the owner.");
