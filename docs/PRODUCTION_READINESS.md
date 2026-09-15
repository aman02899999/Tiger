# Tiger — Production Readiness

> Verified on branch `arena/01a0a4d2-tiger`, 2026-09-15.
> Re-verify with: `npm run verify` (typecheck → both test suites → production build).

## Verdict

**PRODUCTION READY AFTER MANUAL CONFIGURATION.**
**NOT PRODUCTION READY as shipped in this repository**, because it intentionally contains no
Firebase project, no payment-provider credentials and no deployed Cloud Functions. Those are the
"after manual configuration" steps in §4 — they cannot be performed from inside the repository, and
nothing in the app pretends that they have been done.

The difference between this state and "not production ready" is that every *code* obligation is
implemented and executable-proven: tenancy, claims, rules, entitlement, verification, audit and the
trainer→client loop. The remaining risk is configuration and operations, not missing logic.

## 1. What is implemented and proven

| Area | Status | Evidence |
|---|---|---|
| Custom-claims RBAC | DONE | `src/security/permissions.ts`; matrix asserted in `scripts/test-saas.mjs` group 1 |
| Multi-tenancy | DONE | every tenant write is stamped with the claim's `gymId` in `src/data/repos.ts`; cross-gym writes rejected (group 2) |
| Trainer↔client authority | DONE | an ACTIVE `trainerClients/{trainerId_clientId}` row in the same gym, asserted in `firestore.rules` and group 1/2 |
| Firestore rules | DONE | `firestore.rules`; 7 invariants parsed and asserted (group 5), registry↔rules agreement both ways (group 6) |
| Storage rules | DONE | `storage.rules`; private/health/avatar gates asserted, health reads anchored to the member's gym via `gymOf()` |
| Entitlement read-only | DONE | `entitlements`, `payments`, `auditLog` are `write: if false` for every browser session; group 3 |
| Payment verification | DONE | HMAC-SHA256 webhook verification, server-side pricing, idempotency, revocation — `functions/src/verification.ts`, group 4 |
| Trusted backend | DONE (not deployed) | `functions/` typechecks with `npm --prefix functions run typecheck` |
| Composite indexes | DONE | `firestore.indexes.json`, generated from the registry; `npm run check:indexes` fails on drift |
| Audit trail | DONE | privileged actions append to `auditLog` from the backend; the console reads it (`useAuditTrail`) |
| CI gate | DONE | `.github/workflows/quality.yml` runs typecheck, index check, both suites, build, and the functions typecheck |
| Workspace wiring | DONE | group 10 asserts each role's primary read returns joined data, and that an empty tenant reports `null`, never `0` |
| Honesty pass | DONE | fabricated user counts, ratings, uptime, testimonials, "AI trained on Indian dishes" and the fake billing tab are corrected — `npm run test:saas` scans for the admin password and simulated payments |

## 2. What is deliberately NOT claimed

| Tempting claim | Reality in this repository |
|---|---|
| "Encrypted at rest with our keys / DPDP certified" | Storage is Firestore/Cloud Storage with Google-managed keys; region, retention and key management are deployment choices. `src/legal/LegalPages.tsx` now says exactly that. |
| "Penetration tested" | No third-party assessment has been performed. |
| "99.9% uptime" | No SLA instrument exists. |
| "AI trained on Indian dishes" | There is no vision model. Food data comes from a curated list plus Open Food Facts barcodes. |
| "HIPAA / medical-grade" | The lab-report reader shows educational reference ranges; it is not a medical device. |
| "50,000+ users" | No user-base measurement exists in this repository. |

## 3. Verification commands and their meaning

```bash
npm ci                                  # reproducible install
npm run typecheck                       # tsc -b --noEmit
npm run check:indexes                   # registry → firestore.indexes.json is in sync
npm run test:insights                   # 36 assertions: insight maths + API normalisers
npm run test:saas                       # 76 assertions: permissions, tenancy, entitlement, payments, rules, indexes, tokens, hygiene, workspace wiring
npm run build                           # includes scripts/check-3d.mjs (visual-depth guard)
npm run typecheck:functions             # trusted backend compiles
git diff --check                        # no whitespace errors or conflict markers
```

`npm run test:saas` is the load-bearing one. It compiles the real modules under test, then asserts the
security decisions — a weakened rule, a widened capability, a client-writable commercial document or a
drifted index fails the run and therefore CI.

## 4. Manual configuration required before going live

### 4.0 Current state of the wired project

| Item | Value | State |
|---|---|---|
| Project | `tiger-fitness-pro-2f047` | configured in `.env.local` (git-ignored) and `.firebaserc` |
| Hosting targets | `tiger-fitness-pro-2f047-c4f21` (`main`) | declared in `firebase.json` |
| Client config | `VITE_FIREBASE_*` | **done** — six required values, mutually consistent |
| Sign-in screen | live mode + operator checklist | verified: the dev server inlines the real project id |
| Firestore rules | `firestore.rules` | **not deployed yet** (step 2) |
| Storage rules | `storage.rules` | **not deployed yet** (step 2) |
| Composite indexes | `firestore.indexes.json` (22) | **not deployed yet** (step 2) |
| Cloud Functions | `functions/` | **not deployed** (step 5) |
| First `super_admin` | — | **not created** (step 3) |

Check all of this from your own machine — the pass-3 probes need outbound HTTPS to Google, which
sandboxes and CI usually block:

```bash
npm run check:firebase
```

### 4.1 Steps

1. **Sign in to the CLI** — `npm run fb -- login` (aliases `npx firebase-tools@latest`).
2. **Deploy the security model** — `npm run deploy:rules`.
   *Until this runs, Firestore and Storage answer with the default deny. That is the safe failure, and
   the app now says so instead of bouncing you back to the sign-in screen.*
3. **Create your own account** through the app's sign-up screen, then promote it once, locally:
   `export GOOGLE_APPLICATION_CREDENTIALS=/path/service-account.json && node functions/scripts/bootstrap-admin.mjs you@example.com`
   There is no endpoint that can do this — by design.
4. **Authorise the domains you serve from** — Firebase Console → Authentication → Settings →
   Authorized domains. Add `localhost`, your hosting domain, and any preview/staging host; otherwise
   Google pop-up sign-in fails with `auth/unauthorized-domain` (the app now names that error).
5. **Payment provider** — `firebase functions:secrets:set RAZORPAY_KEY_ID|RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET`,
   then `npm run deploy:functions` and register the printed URL as a webhook for
   `payment.captured`, `payment.failed` and `refund.processed`.
6. **Provision the first gym** — in the platform console (or `adminProvisionGym`), then invite the
   owner and trainers.
7. **Hosting** — `npm run deploy:hosting`, or `npm run deploy:all` for everything at once.
8. **Android signing** — place the release SHA-256 in `public/.well-known/assetlinks.json`.
9. **Optional providers** — weather/AQI/geocoding/currency keys are off by default and are not required
   for the coaching loop.

### 4.2 Local emulators (no cloud project needed)

```bash
npm run emulators      # auth 9099 · functions 5001 · firestore 8080 · storage 9199 · hosting 5000 · UI 4000
```

The emulator suite is the only place the repository-level isolation proofs can be exercised against
real Firestore rules; `scripts/test-saas.mjs` currently uses the in-memory `DemoSource` instead.

Until step 4 is complete, `createCheckout` fails with `failed-precondition` and the UI states:
*"Payment verification is not configured in this environment. Nothing was charged and no plan changed."*
That is the intended behaviour — never a simulated success.

## 5. Known gaps (honest backlog)

- **Legacy consumer screens still use `localStorage`** for non-authoritative personal records
  (habits, XP, saved photos). They never gate entitlements or roles, but they are not yet on the
  repository layer. Tracked in `docs/SAAS_TRANSFORMATION.md` §6 phase 14.
- **Attendance check-in** (QR/geofence) is not implemented; appointments record status only.
- **No load testing** has been run against a populated project; index coverage is asserted, performance
  is not.
- **Email/WhatsApp digests** are not implemented (needs a provider + opt-in policy).
- **`scripts/test-saas.mjs` uses the in-memory `DemoSource`** for repository-level isolation proofs.
  The same assertions against the Firestore emulator would be stronger; the emulator is not installed
  in this environment.
