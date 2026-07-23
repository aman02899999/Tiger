# Payment Cloud Functions

Two callable functions secure the Razorpay flow:

- **`createRazorpayOrder`** — creates a Razorpay Order server-side (using the
  secret) and returns the `orderId` for the frontend to open Checkout with.
- **`verifyRazorpayPayment`** — verifies the payment signature (HMAC-SHA256).
  Only on a valid signature does it unlock the user's plan in Firestore and
  record the payment — so a client cannot self-upgrade.

## One-time setup

```bash
# 1. Install deps
cd functions && npm install && cd ..

# 2. Store your Razorpay keys as Firebase secrets (NEVER commit these)
firebase functions:secrets:set RAZORPAY_KEY_ID       # rzp_live_... or rzp_test_...
firebase functions:secrets:set RAZORPAY_KEY_SECRET   # the secret half

# 3. Deploy
firebase deploy --only functions
```

## Frontend

Set the **public** key id in the web app's environment (see `../.env.example`):

```
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

The checkout in `src/app/Checkout.tsx` automatically calls these functions when
`VITE_RAZORPAY_KEY_ID` is set. If the functions aren't deployed yet it falls
back to a provisional (unverified) client flow — deploy them for production.

## Notes

- The Razorpay **Key Secret** exists only here, as a Firebase secret. It is
  never shipped to the browser.
- `verifyRazorpayPayment` is the source of truth for unlocking paid plans.
- For full security, tighten Firestore rules so clients can't write their own
  `plan` field directly (only these functions should).
