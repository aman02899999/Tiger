# Tiger trusted Firebase backend

This package owns privileged operations. Browser code must not set roles, gym membership, paid plans, course enrollment, payment status, or entitlements.

## Before deployment

1. Bootstrap the first `super_admin` custom claim with Firebase Admin tooling outside the browser.
2. Grant the Cloud Functions runtime service account access to the Google Play Developer API in Play Console.
3. Set the Firebase secret: `firebase functions:secrets:set PLAY_PACKAGE_NAME`.
4. Install and verify: `npm install`, `npm run build`, then `firebase deploy --only functions,firestore:rules,storage`.

`verifyPlaySubscription` verifies active subscriptions with Google Play before it writes `entitlements/{uid}`. It intentionally rejects invalid, inactive, expired, or unconfigured purchases. One-time products and provider webhooks require separate verified flows before they can grant access.
