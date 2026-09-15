# Tiger

Tiger is a fitness and wellness platform built with React, Vite, TypeScript, and Firebase.

## Local development

```bash
npm ci
cp .env.example .env.local        # optional — without it the app runs the labelled Demo Workspace
npm run dev
```

## Quality gate

```bash
npm run verify          # typecheck → both test suites → production build
npm run test:saas       # 67 assertions: RBAC, tenancy, entitlement, payments, rules, indexes, tokens, workspace read paths
npm run test:insights   # 36 assertions: insight maths + API response normalisers
npm run check:indexes   # firestore.indexes.json is generated from the collection registry
npm run typecheck:functions
```

`scripts/check-3d.mjs` runs first inside `npm run build`: it fails the build if a 3D tilt subtree is
flattened by an intermediate surface.

## Security model (short version)

- **Roles come from custom claims**, not documents: `super_admin | gym_owner | trainer | client`.
  `src/security/permissions.ts` holds the capability matrix; `scripts/test-saas.mjs` asserts every
  decision, including that a missing `gymId` claim denies.
- **Tenants are enforced in the database.** Every tenant document carries `gymId`; `firestore.rules`
  compares it to the caller's claim and refuses anything that does not match. Client-side filtering is
  presentation only.
- **A trainer's authority is a row**, not a role: an *active* `trainerClients/{trainerId_clientId}`
  document in the same gym. Without it, a trainer sees nothing.
- **Money is a server fact.** The browser sends a plan id; the backend prices it, the provider takes the
  payment, the webhook signature is verified, and only then is `entitlements/{subjectId}` written.
  `entitlements`, `payments` and `auditLog` are `write: if false` for every browser session, including
  `super_admin`. See `functions/README.md`.
- **Health documents are owner-only by default.** `storage.rules` resolves the member's gym through
  `gymOf()` rather than trusting the caller's own claim.
- **No frontend admin password.** There is no `VITE_ADMIN_PASSWORD`; the first platform admin is created
  once by `functions/scripts/bootstrap-admin.mjs`.

## Production RBAC model

Roles are restricted to the trusted Firebase custom-claim model:

- `super_admin`
- `gym_owner`
- `trainer`
- `client`

The frontend never assigns them. Claims are written by the trusted backend in `functions/`
(`adminProvisionGym`, `adminAssignRole`, `gymAddMember`) or, once, by
`functions/scripts/bootstrap-admin.mjs`. A user document's `role`/`gymId` are a display mirror only —
authorisation always reads the token.

## Deployment checklist

See `docs/PRODUCTION_READINESS.md` §4 for the full list. The short version:

1. Create the Firebase project and set `VITE_FIREBASE_*`.
2. `firebase deploy --only firestore:rules,storage:rules,firestore:indexes`
3. `node functions/scripts/bootstrap-admin.mjs you@company.com`
4. Set the Razorpay secrets, deploy `functions/`, register the webhook.
5. Provision the first gym, invite the owner and trainers.
6. Optional: weather/AQI/geocoding/currency keys. The coaching loop does not need them.
- Add the real Android signing certificate fingerprint to `public/.well-known/assetlinks.json`.
- Validate the deployment with `npm test` and `npm run build`.

## Scripts

- `npm run dev` – local development server
- `npm run build` – production bundle build
- `npm test` – fitness insight regression checks
- `npx tsc -b --noEmit` – TypeScript validation
