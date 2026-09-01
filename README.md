# Tiger

Tiger is a fitness and wellness platform built with React, Vite, TypeScript, and Firebase.

## Local development

1. Install dependencies:
   npm install
2. Copy `.env.example` to `.env.local` and fill in the required values.
3. Start the app:
   npm run dev

## Production guardrails

This project is intentionally safe-by-default:

- Firebase is only initialized when all required Firebase environment variables are present.
- The browser never assigns privileged roles. Production RBAC is implemented through Firebase Authentication custom claims and trusted backend provisioning.
- External API calls use TTL caching and graceful fallback values.
- Payment flows explicitly require backend verification before granting entitlements.
- Private health data and tenant-scoped resources require authenticated authorization and database rules, not frontend-only filtering.

## Production RBAC model

Roles are restricted to the trusted Firebase custom-claim model:

- `super_admin`
- `gym_owner`
- `trainer`
- `client`

The frontend must never assign these roles. The trusted provider is Firebase Admin SDK / secure backend logic. This repository includes RBAC helpers and security architecture documentation, but live role assignment remains a deployment-time configuration step.

## Deployment checklist

- Set Firebase values in the hosting environment.
- Add the production admin password.
- Add the live API keys for weather, AQI, geocoding, exercise, and currencies as needed.
- Add the real Android signing certificate fingerprint to `public/.well-known/assetlinks.json`.
- Validate the deployment with `npm test` and `npm run build`.

## Scripts

- `npm run dev` – local development server
- `npm run build` – production bundle build
- `npm test` – fitness insight regression checks
- `npx tsc -b --noEmit` – TypeScript validation
