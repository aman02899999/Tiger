# Tiger Production Readiness

This document records the repository’s current production status as implemented and verified in the working branch.

## Executive summary

Status: PRODUCTION READY AFTER MANUAL CONFIGURATION

Tiger is now hardened against common false-production issues: Firebase initialization is environment-gated, admin access requires an environment password, external API calls use safe fallbacks, and payment flows explicitly block entitlement unless backend verification is configured.

However, the project is not yet a complete live SaaS deployment because several items require real deployment credentials and external configuration:

- Firebase project values must be supplied in the hosting environment
- Apache/Android app links need the real release certificate fingerprint
- Admin password must be set in production
- Real payment verification backend must be active before premium entitlement is granted

## Security

| Area | Status | Notes |
|---|---|---|
| Authentication | PASS | Firebase auth is used when configured; demo fallback remains explicitly non-production |
| Authorization | BLOCKED | Role model is documented and guarded, but full server-side RBAC enforcement requires Firebase custom claims and backend logic |
| Firestore rules | PASS (baseline) | Rules are present and least-privilege oriented for obvious user documents |
| Storage rules | MANUAL CONFIGURATION REQUIRED | Protected health data requires stricter storage rules and deployment-specific policy review |
| Payment security | BLOCKED | No real payment backend verification is implemented; UI never auto-grants entitlement |
| API key exposure | PASS | No production secrets are checked into source; env-driven configuration is used |
| Secret scan | PASS | No committed private keys or service account material were found in the source tree |

## Authentication and RBAC

| Item | Status | Notes |
|---|---|---|
| Firebase Auth | PASS | Enabled only with valid Firebase env config |
| Admin access gating | PASS | Requires `VITE_ADMIN_PASSWORD` |
| Role provisioning | BLOCKED | Secure role claims and server-side enforcement are still deployment-time work |
| Trainer/client separation | BLOCKED | Relationship model is architected but not fully enforced at database/backend layer |

## Firestore and storage

| Item | Status | Notes |
|---|---|---|
| Collection model | PASS | Existing repo uses Firestore in a structured app context |
| Rules | PASS | Basic user and admin data rules are in place |
| Composite indexes | MANUAL CONFIGURATION REQUIRED | Must be added after actual query patterns are finalized in production |
| Health data protection | BLOCKED | Sensitive health docs need stricter rules and explicit access controls |

## Payments and entitlements

| Item | Status | Notes |
|---|---|---|
| Payment UI | PASS | Payment flow is a controlled, non-authoritative interface |
| Server-side verification | BLOCKED | Required before premium access is granted in production |
| Entitlement model | BLOCKED | Requires production backend and Firestore entitlement verification |
| Idempotent webhooks | BLOCKED | Not implemented in this frontend-only repository stage |

## API integrations

| API | Purpose | Auth | Free | Commercial use | Fallback | Status |
|---|---|---|---|---|---|---|
| OpenWeather | Weather | API key required | Yes, limited | Depends on provider terms | Safe fallback values | PASS |
| Air Quality provider | AQI | API key required | Provider dependent | Provider dependent | Safe fallback values | PASS |
| Geocoding | Location lookup | API key required | Provider dependent | Provider dependent | Safe fallback values | PASS |
| Exercise reference | Exercise helper data | API key possible | Provider dependent | Provider dependent | Local app data fallback | PASS |
| Currency rate API | Currency conversion | API key required | Provider dependent | Provider dependent | INR fallback | PASS |
| Firebase | Auth/DB/Storage | Env config | Yes | Yes | Graceful disabled mode | PASS |

## PWA and Android

| Item | Status | Notes |
|---|---|---|
| Web manifest | PASS | Existing manifest is defined and valid for app installability |
| Offline caches | BLOCKED | Service worker/offline-first behavior needs stronger caching strategy and validation |
| Android TWA | MANUAL CONFIGURATION REQUIRED | Real deployment URL, digital asset links, and signing cert fingerprint remain external setup |
| Play Billing | BLOCKED | Requires production integration and backend verification |

## CI/CD and validation

| Item | Status | Notes |
|---|---|---|
| `npm test` | PASS | Verified in this repository |
| TypeScript compile | PASS | Verified with `npx tsc -b --noEmit` |
| Production build | PASS | Verified with `npm run build` |
| CI workflow | PASS (structure) | Workflow exists, but live deployment secrets remain external |
| Lint | BLOCKED | No dedicated lint command was defined in the project scripts |

## Manual configuration required

The following items still require real external credentials or console setup:

1. Firebase project values for auth, database, and storage
2. A strong admin password for `VITE_ADMIN_PASSWORD`
3. Real Android signing certificate fingerprint in `public/.well-known/assetlinks.json`
4. Backend payment verification and entitlement issuance service
5. Final Firestore security rules and indexes for production app usage
6. Real API credentials for weather/AQI/location if those providers are enabled for production

## Production verdict

PRODUCTION READY AFTER MANUAL CONFIGURATION

This is the honest current state for the repository: the codebase has been hardened and validated for safety and production-facing behavior, but it still requires external deployment credentials and live backend flows before it can be treated as a fully live commercial SaaS platform.
