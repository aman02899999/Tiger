# Tiger Production Readiness

This document records the repository’s current production status as implemented and verified in the working branch.

## Executive summary

Status: NO-GO FOR LIVE SAAS DEPLOYMENT

Tiger contains several safer frontend controls, but it is not a live production SaaS deployment. Browser workflows are prevented from granting course enrollment or changing a persisted plan, and the repository now contains claims-based Firestore and Storage rule foundations. However, the custom-claim provisioning service, gym tenant model, trainer-client authorization flows, payment-verification backend, deployed rules, and automated emulator coverage are not yet present.

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
| Firestore rules | BLOCKED | Claims-based, fail-closed rules are in the repository, but require deployed Firebase custom claims, a gym/trainer schema, and emulator verification |
| Storage rules | BLOCKED | Private health upload rules are in the repository, but require deployment and a trainer-client access design before trainer sharing is enabled |
| Payment security | BLOCKED | A Google Play verification Function is implemented but not installed, configured, deployed, or webhook-tested |
| API key exposure | PASS | No production secrets are checked into source; env-driven configuration is used |
| Secret scan | PASS | No committed private keys or service account material were found in the source tree |

## Authentication and RBAC

| Item | Status | Notes |
|---|---|---|
| Firebase Auth | PASS | Enabled only with valid Firebase env config |
| Admin access gating | BLOCKED | A browser password is not an authorization boundary; server-issued `super_admin` custom claims are required |
| Role provisioning | BLOCKED | A server-only custom-claim Function is implemented, but the first super-admin bootstrap and deployment remain required |
| Trainer/client separation | BLOCKED | Server-managed assignment and active-relationship read rules are implemented, but gym-scoped product data and emulator coverage are still required |

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
| Server-side verification | BLOCKED | `verifyPlaySubscription` exists but requires Play Console service-account access, a secret, deployment, and integration testing |
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
| `npm test` | PASS | Existing product tests are available |
| Firestore emulator rules tests | IMPLEMENTED, NOT RUN IN THIS CHECKOUT | Covers profile entitlement, enrollment, trainer, and tenant boundaries; requires Firebase emulator runtime |
| TypeScript compile | MANUAL VERIFICATION REQUIRED | Run `npm run typecheck` after dependency installation |
| Production build | MANUAL VERIFICATION REQUIRED | Run `npm run build` after dependency installation |
| CI workflow | IMPLEMENTED | Pull requests and the hardening branch run typecheck, product tests, Firestore emulator tests, and build |
| Lint | BLOCKED | No dedicated lint command was defined in the project scripts |

## Manual configuration required

The following items still require real external credentials or console setup:

1. Firebase project values for auth, database, and storage
2. Firebase Admin/custom-claim provisioning for `super_admin`, `gym_owner`, `trainer`, and `client`
3. A gym-scoped tenant and `trainerClients` authorization model, with deployed and emulator-tested rules
4. Real Android signing certificate fingerprint in `public/.well-known/assetlinks.json`
5. Backend payment verification and entitlement issuance service
6. Deploy Firestore and Storage rules and validate them against production queries/uploads
7. Real API credentials for weather/AQI/location if those providers are enabled for production

## Production verdict

NO-GO FOR LIVE SAAS DEPLOYMENT

This is the honest current state for the repository: the codebase has a safer rules foundation and the browser no longer self-issues course access or paid plans, but it still requires a trusted backend, deployed custom claims and rules, gym/trainer authorization, payment verification, and end-to-end testing before it can be treated as a live commercial SaaS platform.
