# Tiger — repository analysis, branch merge, and what is left

Written against `claude/repo-analysis-merge-main-ykxlok`. Everything stated as
verified here was run in this working tree; everything not verified says so.

---

## 1. The headline

**"Merge all branches into main" is not possible as stated, and doing it would
destroy work.** Two of the large branches are *competing rewrites of the same
files*, not parallel features. One deletes what the other rebuilds:

| File | `arena/01a0a4d2-tiger` | `claude/magical-lamport-s44ngo` |
| --- | --- | --- |
| `src/admin/AdminPanel.tsx` | deletes it (replaced by `src/saas/AdminConsole.tsx`) | rewrites it (+271 lines) |
| `src/auth/Login.tsx` | deletes it (folded into `AuthSystem`) | keeps and restyles it |
| `src/App.tsx` | +113 lines, SaaS shell | −949 lines, light-theme rewrite |
| `src/app/NutritionTracker.tsx` | keeps | deletes it |
| `scripts/test-insights.mjs` | keeps (36 assertions) | deletes it |
| `firestore.rules` | 538-line claims-based rewrite | 270-line different rewrite |
| `functions/` | TypeScript, 6 callables + webhook | JavaScript, different shape |

A git merge of both produces 55 conflicts whose resolution is a product
decision — dark premium theme with a real tenant model, or light off-white/orange
theme with more consumer features — not a merge conflict anyone can resolve
mechanically. **Picking one was necessary. I picked the SaaS spine, and salvaged
what was portable from the other.**

## 2. Branch inventory

Seven remote branches. Conflict counts are from `git merge-tree` against `main`.

| Branch | Ahead / behind main | Conflicts | Verdict |
| --- | --- | --- | --- |
| `arena/01a0a4d2-tiger` | 11 / 0 | **0** | **Merged.** The SaaS spine. |
| `claude/festive-dirac-ke8hgx` | 1 / 25 | **0** | **Merged.** `.claude/` design skills only, no product code. |
| `production/tiger-gym-saas-upgrade` | 8 / 2 | 4 | **Salvaged selectively** — see §3. |
| `claude/magical-lamport-s44ngo` | 42 / 5 | **55** | **Competing rewrite.** 22 files salvaged; the rest is an either/or. |
| `arena/019f9d33-tiger` | 2 / 4 | 4 | **Nothing to take.** It is the pre-hardening ancestor of the already-merged PR #31: it *deletes* `src/security/*` and `src/services/*` that `main` has. |
| `codespace-ominous-broccoli-…` | 0 / 1 | — | Already in `main` (it is `main`'s parent). |
| `main` | — | — | Base. |

### What `arena/01a0a4d2-tiger` brought in (+18,987 lines, 0 conflicts)

`functions/` (6 callables, a signature-verified Razorpay webhook, a claims
trigger) · claims-based RBAC and a permission matrix · a domain model with
validation · a tenant-scoped data layer · four role workspaces (admin, gym,
trainer, client) · member and gym billing · a design-token UI kit · a 76-assertion
proof suite · a GitHub Actions quality gate · `scripts/check-firebase.mjs`.

It also fixed, before I touched anything, the worst thing in `main`:
`VITE_ADMIN_PASSWORD` was compared **in the browser**, and every `VITE_*` value
is compiled into the client bundle. Anyone could read the admin password in
view-source. `AdminPanel.tsx` is gone and the proof suite now fails the build if
the variable ever returns.

## 3. Bugs found and fixed

All five were live in the merged tree. None were compile errors — `main`
typechecked, tested and built green throughout, which is precisely why they
survived.

### 3.1 The trusted backend was unreachable *(critical)*

Nothing in `src/` imported `firebase/functions`. The entire Cloud Functions
backend — role assignment, gym provisioning, checkout, payment verification —
had no caller. Five screens instead did:

```
fetch("/api/billing/checkout")      fetch("/api/billing/play-verify")
fetch("/api/billing/gym-checkout")  fetch("/api/admin/assign-role")
```

No hosting config routes `/api/**`. `firebase.json` and `vercel.json` both
rewrite `**` → `/index.html`. **Those requests returned the SPA shell with HTTP
200.** Two of them read that as success:

* **Checkout's Play path** took `response.ok` as proof a purchase was verified,
  then called `onSuccess()` and unlocked the content — for any purchase,
  including ones Google had rejected. Free premium to anyone who opened the
  Android app.
* **AdminConsole** showed "Role updated" and closed the dialog after a
  privileged role change that never happened.

**Fixed:** `src/firebase.ts` exposes a callable client with an explicit region;
`src/services/backend.ts` wraps each callable with types and normalises errors so
a transport failure can never read as success; `src/services/providerCheckout.ts`
is one implementation of "open the payment sheet" replacing four divergent
copies, and holds no database handle so it cannot grant anything.

### 3.2 No Play Billing verification existed

`PlayBilling.ts` obtained a `purchaseToken` and declared
`requiresServerSideVerification(): true`, but no function anywhere verified one.
The only implementation was on the abandoned `production/` branch.

**Fixed:** ported and hardened as `verifyPlayPurchase`. It exchanges the token
with Google's Android Publisher API, is idempotent on the token's SHA-256,
**refuses a token replayed from another account**, stores only the hash, and
trusts Google over the caller when they disagree about the product. The pure
half (`PLAY_PRODUCT_CATALOG`, `entitlementFromPlay`) lives in
`verification.ts` so the proof suite asserts the same mapping the deployed
function runs on: an unknown SKU is refused rather than defaulted, and a
recurring plan is never issued without an expiry.

### 3.3 Paid guides were free to anyone who edited one devtools key

`PDFStore.tsx` kept a `localStorage` list of "purchased" ids that it both wrote
and trusted. Setting that key granted the whole catalog.

**Fixed:** access is the backend entitlement (`useEntitlement` +
`entitlementIsLive`), which only the payment webhook writes.

### 3.4 Prices the backend could not charge

The guide cards advertised "₹299 / Buy Now". The backend's `PLAN_CATALOG` has no
per-guide SKU, so `createCheckout` could never price one.

**Fixed:** the cards say "Included with Pro", and Checkout says the same when
asked for an item.

### 3.5 133 MB of generated transcripts in the tree

Two `.txt` audit logs, tracked. Every clone and every CI checkout paid for them.

**Fixed:** removed and ignored. Tracked content 133 MB → 8 MB. They remain in
git history; purging that needs `git filter-repo` and a force-push, which is a
call for the repo owner, not for me.

## 4. Salvaged from the competing branch

22 self-contained tools — they imported only `useAuth` and `addXP`, both present
— now live behind `src/app/ToolsGrid.tsx`, a searchable index reached from the
client workspace nav:

Body Fat Estimator · Waist-to-Hip Ratio · Weight Goal Projector · Heart Rate
Zones · VO₂ Max Estimator · Pace Calculator · Calorie Burn Converter · RPE &
Load · DOTS Score · Split Finder · Workout of the Day · Cooldown Generator ·
Portion Guide · Hydration Tracker · Glossary · Flashcards · Myth Buster · Health
IQ Quiz · Calorie Guess · This or That · Brain Teaser · Dosha Quiz

Every one is `lazy()`. Twenty-two features cost **8 kB** of the main bundle; each
loads its own ~5 kB chunk when opened. A test asserts the index and the files
agree in both directions, so a tool can neither go missing nor go unrouted.

**Not ported** (they depend on that branch's rewritten `App.tsx`, `AuthSystem`
and theme, or duplicate the merged tree's own workspaces): `Blog`,
`EducationLibrary`, the four `*Library` pages, `Newsletter`, `LearnHub`,
`ToolsHub`, `WellnessScore`, `SplitPlanner`, `TrainerApp`, `RoleSelect`,
`notifications.ts`, `push.ts`, `razorpay.ts`, `trainerStore.ts`.

Genuinely valuable and worth a follow-up: **background Web Push**
(`push.ts` + its service worker + VAPID Cloud Function) has no equivalent in the
merged tree.

## 5. Verification

Run in this tree, all passing:

```
npm run typecheck                 → clean
npm --prefix functions run typecheck → clean
npm test                          → 36 insight + 90 SaaS assertions
npm run build                     → clean
```

The suite grew by 16 tests, each pinning a bug above so it cannot return:
the `/api/*` scan, client-reaches-backend, one-shared-checkout-path, the
entitlement gate, unchargeable prices, the tool index, and eight Play-billing
cases.

## 6. What is still not "pro premium", honestly

Ordered by what I would do next.

1. **Deploy the backend.** Every fix in §3.1–3.2 is code, not a running system.
   Until `npm run deploy:functions` runs with `RAZORPAY_*` and
   `PLAY_PACKAGE_NAME` in Secret Manager, checkout throws instead of silently
   lying — better, but still not selling. `npm run check:firebase` reports what
   is missing.
2. **The PDFs are public files.** `public/guides/*.pdf` is fetchable by URL no
   matter what §3.3 gates. Move them to Cloud Storage behind `storage.rules` and
   serve time-limited URLs. This is the one finding I fixed only at the UI layer.
3. **Emulator-based rules tests.** The suite asserts 13 invariants by *parsing*
   `firestore.rules`. That catches a missing rule, not a wrong one. The
   abandoned `production/` branch had `@firebase/rules-unit-testing` tests;
   they were written against different rules and need the emulator in CI. Worth
   redoing properly.
4. **Bundle size.** `HeroOrb` is 898 kB (Three.js) and the main chunk 1.2 MB.
   On the Indian mobile connections this product targets, that is the single
   biggest felt-quality problem. Lazy-load the 3D hero below the fold and split
   the workspace routes the way §4 splits the tools.
5. **No test runs the UI.** 126 assertions cover logic, rules and wiring; zero
   render a component. Every bug in §3 was a wiring bug that a single Playwright
   pass over checkout and the admin dialog would have caught. There is a
   Chromium in the dev container already.
6. **Restricted-content exposure.** The steroid/SARM/TRT/PCT guides are hidden
   on the Play channel by id (`PDFStore.tsx` + `PlatformChannel.ts`), which is
   the right call and was already here. But the gate is cosmetic while §6.2 is
   open: the file is still reachable by URL inside the Play build, which is what
   Play policy actually cares about. Fixing §6.2 fixes this too.
7. **`docs/SAAS_TRANSFORMATION.md` and `docs/PRODUCTION_READINESS.md`** predate
   this work and describe the `/api/billing/*` endpoints as the payment path.
   They need a pass.

## 7. Recommended branch cleanup

* Delete `arena/019f9d33-tiger` — strictly older than `main`.
* Delete `codespace-ominous-broccoli-…` — merged.
* Delete `arena/01a0a4d2-tiger` and `claude/festive-dirac-ke8hgx` once this PR
  lands — fully merged here.
* **Keep `claude/magical-lamport-s44ngo`** until someone decides on the theme
  and ports Web Push. It is the only copy of 42 commits of work.
* Delete `production/tiger-gym-saas-upgrade` once §6.3 is done — its rules tests
  are the last thing in it worth having.
