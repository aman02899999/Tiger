# Tiger — trusted backend

Everything in this folder runs **outside the browser**. It is the only component permitted to set
custom claims, write entitlements, record payments or append to the audit log — and `firestore.rules`
enforces that by denying those writes to every client session, including `super_admin`.

```
functions/
  src/verification.ts          pure crypto + pricing + grant derivation (unit-tested, no deps)
  src/index.ts                 Cloud Functions v2 handlers
  scripts/bootstrap-admin.mjs  one-time first-admin promotion
```

## Why it exists

| Without a backend | With this backend |
|---|---|
| `VITE_ADMIN_PASSWORD` in the JS bundle grants admin | `super_admin` is a custom claim only the Admin SDK can set |
| Browser writes `plan: "elite"` into the user document | Webhook verifies the provider signature, then writes `entitlements/{id}` |
| Roles assigned from a dropdown | `adminAssignRole` re-checks the caller's claim, writes the membership, sets the claim, appends an audit entry |
| Prices sent by the client | `buildOrderDraft` prices from the server-side catalog; the client names a plan, never an amount |

## Functions

| Function | Kind | Caller | Effect |
|---|---|---|---|
| `adminProvisionGym` | callable | `super_admin` | Creates `gyms/{id}`, owner membership, owner claims, audit entry — one transaction |
| `adminAssignRole` | callable | `super_admin` | Replaces memberships, sets claims, optional manual entitlement, audit |
| `gymAddMember` | callable | `gym_owner` of the gym | Adds a trainer (active) or member (pending) |
| `createCheckout` | callable | any signed-in user | Creates a Razorpay order server-side with catalog pricing; records `payments/{orderId}` as `created` |
| `paymentWebhook` | HTTPS | Razorpay | Verifies HMAC signature, derives the grant, writes payment + entitlement + audit, idempotent on `providerRef`, handles refunds/failures/disputes |
| `onUserCreate` | Firestore trigger | — | Seeds `{ role: "client", gymId: null }` when an account has no claim. Never promotes |

## Provisioning a real deployment

```bash
# 0. deps
cd functions && npm install

# 1. one-time: promote the first platform admin (run locally, never in CI)
export GOOGLE_APPLICATION_CREDENTIALS=/path/service-account.json
node scripts/bootstrap-admin.mjs founder@yourcompany.com

# 2. secrets (prompted, never committed)
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET

# 3. deploy functions + rules together
firebase deploy --only functions,firestore:rules,storage:rules,firestore:indexes

# 4. register the webhook URL in the Razorpay dashboard
#    https://<region>-<project>.cloudfunctions.net/paymentWebhook
#    events: payment.captured, payment.failed, refund.processed
```

Then, from the console (or `adminProvisionGym` via the SDK): create the first gym, appoint its owner,
and add trainers. Members join with the gym's `joinCode`, which creates a `pending` membership an owner
approves.

## Required environment

| Variable | Where | Purpose |
|---|---|---|
| `VITE_FIREBASE_*` | hosting build | browser SDK configuration (public by design) |
| `RAZORPAY_KEY_ID` | Secret Manager | order creation |
| `RAZORPAY_KEY_SECRET` | Secret Manager | order creation + signature checks |
| `RAZORPAY_WEBHOOK_SECRET` | Secret Manager | webhook signature verification |
| `GOOGLE_APPLICATION_CREDENTIALS` | local only | bootstrap script |

If the Razorpay secrets are absent, `createCheckout` throws `failed-precondition` and the UI shows
*"Payment verification is not configured in this environment. Nothing was charged and no plan changed."*
That is the intended behaviour: no silent simulation, no fake entitlement.

## Testing

The pure half is covered by the repository test suite:

```bash
node ../scripts/test-saas.mjs
```

which asserts signature verification (valid / tampered / missing), constant-time comparison,
amount and currency mismatch rejection, refund revocation, idempotency keys, coupon maths and
entitlement derivation — all without touching the network.
