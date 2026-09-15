# Tiger — Repository Analysis, Brainstorm & SaaS Transformation Plan

> Audit date: 2026-09-15 · Branch audited: `main` @ `d480413` + working branch `arena/01a0a4d2-tiger`
> Scope: full repository, all refs, all history reachable from `origin`, plus the two archived audit logs committed at the repo root.

---

## 1. Executive summary

**What Tiger is today:** a very large, single-page React 19 + Vite 7 + Tailwind 4 fitness/wellness
**consumer** app (≈25k lines of first-party TS/TSX, 60+ feature screens) with a thin Firebase layer and a
marketing site. It is a *feature-rich app*, not yet a *SaaS product*.

**What "ultra-premium SaaS" requires that is missing:**

| Pillar | Today | Required |
|---|---|---|
| Identity | Firebase Auth (optional) + a `DEMO_PROFILE` fallback that silently becomes a "user" | Real auth, real claims, no silent fake session |
| Authorisation | Docs + helper functions; browser is trusted to be honest | Custom-claims RBAC enforced by rules + backend, verified by executable tests |
| Tenancy | `gymId` appears in rules but no gym lifecycle, no membership model, no provisioning | Gym → Memberships → TrainerClient graph, enforced server-side |
| Trainer product | **Absent.** No roster, no client 360, no plan assignment, no notes, no appointments | Full trainer workspace |
| Client product | Consumer screens backed by `localStorage` | Assigned plans/workouts from Firestore + own activity writes |
| Analytics | Static numbers in marketing pages; demo stats in profile | Firestore-derived, honest "No data yet" states |
| Billing | `simulatePayment()` in `Checkout.tsx`; `plan` written into the user profile by the browser | Provider → trusted backend → verification → entitlement → Firestore (read-only client) |
| Admin | `VITE_ADMIN_PASSWORD` compared in the browser; CMS data in `localStorage` | `super_admin` claim gating, Firestore CMS, audit log |
| Content claims | "Join 50,000+ Indians", "4.9★ Play Store Rating", "99% Uptime SLA", fabricated testimonials and user tables | Every claim verifiable or removed |
| Design system | One very good marketing palette (Aurora), ad-hoc utility soup in product screens | Tokenised premium surface kit with consistent depth, rhythm, states |
| Tests | 36 assertions on insight maths + 2 API normalisers | + tenancy, permission matrix, entitlement, signature verification, rules invariants |
| CI | Build + hosting deploy on `main` | Typecheck + tests + rules lint + build gating; rules deployed with hosting |

**Verdict:** `NOT PRODUCTION READY` → target `PRODUCTION READY AFTER MANUAL CONFIGURATION`.
No amount of UI polish makes this a SaaS product until tenancy, claims, entitlement and the trainer/client
loop are real. That is what this branch implements.

---

## 2. Repository & branch analysis

### 2.1 Ref inventory (fetched live from `origin`)

```
origin/HEAD -> origin/main
origin/main                                  ← only remote branch
arena/01a0a4d2-tiger (local, this session)   ← branched from d480413
```

Findings:

1. **The branches the archived audits reference no longer exist.** `tiger-production-audit-20260831-172331.txt`
   and `tiger-full-production-action-20260901-042417.txt` were produced on
   `production/tiger-gym-saas-upgrade` and `production/api-and-security-hardening`, with tags
   `checkpoint-phase2-2026-08-31` and `checkpoint-before-prod-hardening-2026-08-31`.
   `git branch -r` and `git tag` are both empty apart from `main` — **those refs were deleted/never pushed**.
   Consequence: the only surviving evidence of the previous hardening pass is the two log files
   (134 MB combined) committed at the repository root, plus whatever of that work already landed in `main`.
2. **The hardening that *did* land in `main`** is real but partial:
   `src/security/{rbac,payment,role-provisioning,security-tests}.ts`, `firestore.rules`, `storage.rules`,
   `src/services/api/{client,wger,open-food-facts}.ts`, `src/app/PlatformChannel.ts`, `src/app/PlayBilling.ts`.
3. **The 134 MB of audit logs are committed to Git.** They are build logs containing bundled `dist/`
   and `node_modules`-style text dumps, and they contain *self-referential recursion* (the log lists itself
   being listed). They bloat every clone, break `git diff` ergonomics, and add zero product value.
   → **Action taken:** moved out of the tree in this branch (see §7, item D1) and covered by `.gitignore`.
4. History is 32+ PRs of feature accretion, one `Merge pull request #32` head. No commit in history
   implements a tenant model, a trainer workflow, or a verified payment path.

### 2.2 What actually runs (verified)

```
npm run build        → node scripts/check-3d.mjs && vite build   (custom 3D-flattening linter)
npm test             → test-insights.mjs (36) + test-saas.mjs (64)
npm run typecheck    → tsc -b --noEmit                            (clean)
npm run check:indexes→ registry → firestore.indexes.json drift guard
npm run typecheck:functions → functions/ compiles (trusted backend)
```
Bundle shape before this branch: one 1.2 MB `index` chunk + 898 kB `HeroOrb` (three.js) chunk.
No i18n, no router (hash-based `#app`), no state library, no lint config, no CI gate on tests.

### 2.3 Data reality (the core problem)

`localStorage` is used **107 times across 31 files**. In 12 of them it *is* the database:
workouts, nutrition, measurements, progress photos, mood, sleep, supplements, calendar, habits,
admin CMS (`tfp_blogs`, `tfp_users`, `tfp_pricing_plans`, …).

That is a **consumer single-player app**. A SaaS has:

- many users per tenant, one tenant per gym, strict isolation;
- a *trainer* writing plans that a *client* must receive and cannot forge;
- billing entitlements a browser must never be able to grant itself;
- records that survive a device wipe and follow the account.

Everything in this transformation flows from that one distinction.

### 2.4 Honesty debt found in user-facing copy

| Claim | Where | Reality |
|---|---|---|
| (each row below is **corrected** in this branch — see §7 D3/D5) | | |
| "Join 50,000+ Indians" | `src/auth/Login.tsx` | No user base is measured anywhere |
| "50K+ Active Users", "4.9★ Play Store Rating", "99% Uptime SLA" | `src/admin/types.ts` (`defaultHeroStats`) | Invented |
| 4 named testimonials with specific outcomes | `src/admin/types.ts` | Invented |
| 5-user admin table with streaks | `src/admin/types.ts` (`defaultUsers`) | Invented |
| "AI model was trained specifically on common Indian dishes" | FAQ default | No model is trained; there is no vision model in the repo |
| "Medical Report Analyzer / Health Risk Prediction" | feature lists | `BloodReport.tsx` is educational reference ranges, not diagnosis |
| "Next billing: July 1, 2025", "user@paytm" | `SaaSApp.tsx` billing tab | Hardcoded placeholder presented as account state |

All of the above are corrected or qualified in this branch (§7, item D3).

---

## 3. Gap analysis — consumer app → premium gym SaaS

```
                 today                                target
  user ──localStorage──▶ nothing            gym ──▶ memberships ──▶ trainer|client
                                             │
                                             ├─ trainerClients(active) ──▶ plans, notes,
                                             │      appointments, attendance, progress
                                             └─ entitlements ◀── verified payments
```

### 3.1 Identity & claims
- `getAuth()` returns `null` when env is missing, and `AuthProvider` then **sets `DEMO_PROFILE`** as the
  signed-in user — including `role: "client"`, `gymId: "demo-gym"`. Every downstream screen trusts it.
- `updateUser()` lets the browser `updateDoc(users/uid, { plan, role, gymId, streak, stats })`.
  `firestore.rules` blocks `role`/`gymId` changes but **not `plan`**, so today a client can self-upgrade to
  Elite with one devtools line. That is a live monetisation hole.
- Roles are only *documented*; `getIdTokenResult()` is never called, so custom claims are never read.

### 3.2 Tenancy
- `trainerClients/{trainerId_clientId}` is referenced by rules and `rbac.ts`, but **nothing in the app ever
  creates, reads or lists a relationship**. There is no gym document, no membership, no invite flow,
  no join-code, no trainer roster.
- No composite indexes exist, so any real roster query (`gymId == X && status == active`) would fail at
  runtime on a populated project.

### 3.3 Trainer / client product loop
Absent end-to-end: create plan → assign → client sees it → client logs a session → trainer sees adherence.
`WorkoutBuilder.tsx` and `WorkoutCalendar.tsx` write to `localStorage` only.

### 3.4 Billing
`Checkout.tsx` has an explicit `simulatePayment()` and calls `updateUser({ plan })`. `src/security/payment.ts`
defines good interfaces and then has **no implementation and no caller**. `PlayBilling.ts` is a UI-only shim.
No webhook, no signature verification, no entitlement document, no revocation path.

### 3.5 Admin
`VITE_ADMIN_PASSWORD` is shipped in the client bundle — anyone can read it in `view-source`. All CMS data
is per-browser `localStorage`, so "admin edits" are invisible to real users.

### 3.6 Premium-ness (design)
The marketing shell is genuinely good (Aurora palette, tilt-3D, scroll reveals, `check-3d.mjs` guard).
The product shell is not: emoji navigation, ~120 inline Tailwind strings per screen, no shared primitives,
no loading/empty/error vocabulary, no density or data-viz language, no keyboard command surface.

---

## 4. Brainstorm — what "ultra-premium gym SaaS" actually means here

Ranked by revenue impact per unit of work (this ordering drove the roadmap):

1. **Gym ownership is the money unit, not the individual.** A gym pays ₹4,999–₹14,999/month for 100–600
   members and 3–15 trainers; a consumer pays ₹199. Sell seats + trainer tooling, keep the consumer app as
   the free funnel into gyms. → *Gym console, trainer seats, member import, per-gym branding.*
2. **The trainer's daily loop is the retention engine.** A trainer who plans Monday's session inside Tiger on
   Sunday night will never churn, and drags the whole roster with them. Build the trainer's day first:
   roster → client 360 → assign → review.
3. **Verifiable data beats pretty data.** Adherence %, weekly volume, PR detection, and honest
   "No data yet" states build coach trust faster than any animation. Fake metrics destroy it.
4. **Entitlement is a server fact.** The only defensible design: provider → webhook → signature verification
   → entitlement doc → rules that make the client **read-only** on anything commercial.
5. **Multi-tenant by construction.** Every persistent row carries `gymId`; the rules refuse a write whose
   `gymId` does not match the caller's claim. Client-side filtering is presentation, never protection.
6. **Premium is restraint.** Fewer, better surfaces: one command palette, one tile language, tabular figures,
   hairline borders, deliberate empty states, no emoji-as-icon in product chrome.
7. **Honesty is a feature.** Removing "50,000+ users" and inventing disclaimers is what a company that
   expects enterprise logos does.

### 4.1 Role capability matrix (implemented in `src/security/permissions.ts`)

| Capability | super_admin | gym_owner | trainer | client |
|---|---|---|---|---|
| Manage gyms / provision owners | ✅ | — | — | — |
| Set roles & claims | ✅ | — | — | — |
| Create trainers, invite members | ✅ | ✅ (own gym) | — | — |
| Create/assign plans, notes, appointments | ✅ | ✅ (own gym) | ✅ (assigned, active clients) | — |
| Log own workout/nutrition/progress | — | own only | own only | ✅ |
| Read client health data | ✅ (audited) | ✅ own gym | ✅ assigned only | ✅ self only |
| Write entitlement / payment / subscription | ✅ (backend only) | — | — | — |
| Read own entitlement | ✅ | ✅ | ✅ | ✅ |

### 4.2 Money model (documented, not hardcoded into the UI)

| SKU | Price | Target |
|---|---|---|
| Free (Client) | ₹0 | Funnel: tracking, community, 3 AI insights/day |
| Pro (Client) | ₹199/mo · ₹1,499/yr | Unlimited coaching, streaks, recipes |
| Elite (Client) | ₹399/mo · ₹2,999/yr | Full library, family profiles, priority support |
| **Gym Growth** | ₹4,999/mo | ≤150 members, ≤5 trainer seats |
| **Gym Scale** | ₹9,999/mo | ≤500 members, ≤15 trainer seats |
| **Gym Enterprise** | ₹14,999/mo+ | Unlimited + SSO + audit export + SLA |

Gym tiers are billed to the **gym**, and entitlements are attached to `gyms/{gymId}` — a member never
pays to be in a gym, and a gym owner never pays per client-side click.

### 4.3 Differentiators worth building next (post-branch backlog, in order)

1. Attendance by QR/geofence check-in → drives `Attendance` analytics a gym owner actually buys.
2. Trainer schedule with recurring blocks + client self-booking against `trainerAvailability`.
3. Client risk board: "silent for 9 days", "adherence < 50%", sorted by revenue at risk.
4. Program library with clone-to-client (one template → N assignments, one click).
5. Gym-level WhatsApp/email reminder digests (server-side, GDPR/DPDP-aware, opt-in only).
6. Nudges for renewals: entitlement expiring in 7 days → owner dashboard task list.

---

## 5. Target architecture (implemented in this branch)

```
src/
  domain/        models.ts · collections.ts · validation.ts      ← pure, testable, no React
  security/      permissions.ts · guard.tsx · rbac.ts · payment.ts
  data/          datasource.ts · repos.ts · demoSeed.ts · hooks.ts · analytics.ts
  ui/            kit.tsx · charts.tsx · tokens.ts                ← premium primitives
  saas/          Shell.tsx · TrainerStudio.tsx · ClientWorkspace.tsx
                 GymConsole.tsx · AdminConsole.tsx · Pricing.tsx
functions/       Razorpay order + webhook verification, claims provisioning, audit
firestore.rules  tenant-scoped, claim-driven, client read-only on commercial data
storage.rules    per-user private, per-gym trainer-readable, health data write-restricted
scripts/         test-insights.mjs (existing) · test-saas.mjs (tenancy/permissions/rules/webhooks)
```

**Data flow invariant:** every write goes `UI → repo (validates + stamps gymId) → Firestore rules (verify
claim + relationship) → Firestore`. Reads that the rules would refuse never render; when a query returns
nothing the UI must say **"No data yet"** — never invent a number.

**Degradation contract:** if Firebase env vars are absent, the app runs a *clearly labelled* Demo Workspace
with in-memory seed data. Demo mode never grants entitlements, never writes to Firestore, and every screen
carries the banner. This replaces the old silent `DEMO_PROFILE` fallback.

---

## 6. Roadmap

| Phase | Deliverable | Status on this branch |
|---|---|---|
| 0 | Repository/branch analysis, honesty audit, architecture | ✅ this document |
| 1 | Domain model + tenant-scoped data layer + demo/live data sources | ✅ `src/domain`, `src/data` |
| 2 | Claims-based RBAC + permission matrix + guards | ✅ `src/security/permissions.ts`, `guard.tsx` |
| 3 | Firestore + Storage rules rewritten around `gymId`/relationship/entitlement | ✅ `firestore.rules`, `storage.rules` |
| 4 | Executable proofs: permission matrix, tenant isolation, entitlement read-only, webhook signatures, rules invariants | ✅ `scripts/test-saas.mjs` — 76 assertions, green |
| 5 | Trusted backend: role provisioning, gym provisioning, Razorpay order + verified webhook | ✅ `functions/` — installs and typechecks (`npm run typecheck:functions`) |
| 6 | Trainer Studio (roster, client 360, plan builder, assignment, notes, appointments, analytics) | ✅ `src/saas/TrainerStudio.tsx` |
| 7 | Client Workspace (today's assigned session, logging, progress, appointments, goals) | ✅ `src/saas/ClientWorkspace.tsx` |
| 8 | Gym Console for owners (trainers, members, adherence, revenue, seats) | ✅ `src/saas/GymConsole.tsx` |
| 9 | Super-admin console on Firestore (no browser password) | ✅ `src/saas/AdminConsole.tsx` |
| 10 | Billing: entitlement-driven upgrade, browser read-only | ✅ `src/saas/Pricing.tsx` (member + gym pricing, hosted-checkout hand-off, read-only entitlement); `src/saas/{ClientBilling,GymBilling}.tsx` for history |
| 11 | Premium UI kit + charts + honest empty states | ✅ `src/ui/{kit,charts,tokens}.tsx` (tokens asserted against `index.css`) |
| 11b | Access guards + domain hooks so screens cannot read across tenants | ✅ `src/security/guard.tsx`, `src/data/hooks.ts` |
| 11c | Write-shape validation, separate from authority | ✅ `src/domain/validation.ts` |
| 12 | Claims correction across marketing + admin defaults | ✅ `Login.tsx`, `admin/types.ts`, hero copy |
| 13 | CI gate: typecheck + tests + index drift + build + functions typecheck | ✅ `.github/workflows/quality.yml` |
| 14 | Migrate the remaining 31 localStorage screens to repos | 🔜 backlog (documented, phased) |
| 15 | Attendance/QR check-in, WhatsApp digests, program library clone | 🔜 backlog |

---

## 7. Log of concrete changes on `arena/01a0a4d2-tiger`

**D1 — Repository hygiene**
- Moved the two 134 MB audit logs out of the tracked tree into `docs/audit-archive/` (git-ignored), keeping
  their conclusions summarised here so no evidence is lost and clones stop paying 134 MB.

**D2 — SaaS core** (see §5) — domain, data, permissions, rules, functions, tests, UI kit, workspaces.

**D3 — Honesty corrections**
- `Login.tsx` / `SignupPage`: "Join 50,000+ Indians" → factual product statement; demo-account button now
  routes to the labelled Demo Workspace instead of silently fabricating an account.
- `admin/types.ts`: `defaultHeroStats`, `defaultTestimonials`, `defaultUsers`, `defaultSubscribers` replaced
  with empty arrays + explicit "seed from your own data" guidance; the admin console shows *real* Firestore
  counts and an honest empty state instead of invented rows.
- FAQ/blog marketing copy: medical and AI-training claims qualified.
- `SaaSApp.tsx` billing tab: removed the hardcoded "Next billing: July 1, 2025" and `user@paytm` payment
  method; it now renders the user's real entitlement or "No active subscription".

**D5 — Hardening pass 2 (this session, verified by `npm run test:saas`)**
- **Storage authorisation hole fixed.** `health/{userId}` reads were gated with
  `isGymOwnerOf(claimGym())`, which is true for *any* gym owner — a cross-tenant read of lab reports and
  body photos. Now anchored with `gymOf(userId)`, resolved from the member's own user document, and the
  test asserts that form specifically.
- **`plan.write` was unreachable for trainers.** `savePlan` checked authority before loading the
  relationship row, so the `isActiveTrainerOf` branch could never be satisfied and every trainer write
  failed with a permission error. The relationship is now resolved first and used for both `plan.write`
  and `plan.assign`.
- **Relationship and roster reads narrowed to what rules would allow.** A trainer's
  `listAllRelationships()` returns only their own rows (Firestore refuses the broader query anyway), and
  `loadClientCards()` filters requested ids through `user.read` *before* reading, so demo mode is exactly
  as strict as production.
- **Self-writes now require a tenant.** `session.log`, `nutritionLog.write`, `progress.write`,
  `goal.write` and `appointment.write` previously allowed `isSelf(...)` with no gym claim, while the
  rules required `gymId == claim`. The capability matrix now matches the rules.
- **Legacy CMS tightened.** `blogs` writes are `super_admin` only (gym staff had no business publishing),
  and the public newsletter collection is now key-limited and email-shape-checked instead of
  `allow create: if true`.
- **Members can see their coach.** `isClientOfTrainer()` lets a client read exactly the profile of the
  trainer assigned to them — and no other user document.
- **Composite indexes committed** (22) and generated from the registry by `scripts/gen-indexes.mjs`;
  `npm run check:indexes` fails the build on drift.
- **Premium surfaces completed**: `src/ui/tokens.ts`, `src/security/guard.tsx`, `src/data/hooks.ts`,
  `src/domain/validation.ts`, `src/saas/Pricing.tsx`, plus a command palette, breadcrumbs and an
  entitlement-driven plan badge in `src/saas/Shell.tsx`.
- **Legacy billing tab rewritten** — the last hardcoded "Next billing: July 1, 2025" / `user@paytm`
  placeholder is gone; it now renders the real entitlement and payment ledger.
- **Audit logs untracked** (138 MB) and moved to the ignored `docs/audit-archive/`.
- **CI gate added** (`.github/workflows/quality.yml`): typecheck → index drift → both suites → build →
  functions typecheck.

**D4 — Monetisation hole**
- The client can no longer write `plan`, `subscription`, `entitlement` or `payment` fields: rules reject it,
  `updateUser()` strips it, and plan UI reads from `entitlements/{uid}` only.

---

## 8. Remaining manual configuration (cannot be done in this repository)

1. Firebase project + `.env` values (`VITE_FIREBASE_*`) — see `.env.example`.
2. `firebase deploy --only firestore:rules,storage:rules,firestore:indexes`.
3. Razorpay (or Play Billing) keys as Cloud Functions secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `RAZORPAY_WEBHOOK_SECRET`.
4. Promote the first `super_admin` via the documented one-time bootstrap
   (`node functions/scripts/bootstrap-admin.mjs you@company.com` — requires `GOOGLE_APPLICATION_CREDENTIALS`).
5. Cloud Functions deploy + webhook URL registered with the provider.
6. Android signing SHA-256 into `public/.well-known/assetlinks.json`.
7. Optional provider keys for weather/AQI/geocoding/currency — off by default and never required for the
   SaaS loop.
