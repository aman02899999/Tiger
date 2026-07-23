/* ================================================================== */
/* Cloud Functions — Razorpay order creation & payment verification.   */
/*                                                                     */
/* The Razorpay KEY SECRET lives ONLY here (as a Firebase secret), never */
/* in the frontend. Set the secrets once with:                          */
/*   firebase functions:secrets:set RAZORPAY_KEY_ID                      */
/*   firebase functions:secrets:set RAZORPAY_KEY_SECRET                  */
/* then deploy:  firebase deploy --only functions                       */
/* ================================================================== */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");

admin.initializeApp();

const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");

// Map internal plan values to what we allow writing server-side.
const ALLOWED_PLANS = new Set(["Pro", "Elite"]);

/**
 * Create a Razorpay Order (server-side, using the secret) and return the
 * order id + public key id for the frontend to open Checkout with.
 */
exports.createRazorpayOrder = onCall(
  { secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], cors: true },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "You must be signed in to pay.");

    const amount = Math.round(Number(req.data && req.data.amount)); // in paise
    const currency = (req.data && req.data.currency) || "INR";
    if (!amount || amount < 100) throw new HttpsError("invalid-argument", "Invalid amount.");

    const rzp = new Razorpay({
      key_id: RAZORPAY_KEY_ID.value(),
      key_secret: RAZORPAY_KEY_SECRET.value(),
    });

    try {
      const order = await rzp.orders.create({
        amount,
        currency,
        receipt: `rcpt_${req.auth.uid}_${Date.now()}`,
        notes: { uid: req.auth.uid },
      });
      return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: RAZORPAY_KEY_ID.value() };
    } catch (err) {
      console.error("createRazorpayOrder failed", err);
      throw new HttpsError("internal", "Could not create the payment order.");
    }
  }
);

/**
 * Verify the payment signature server-side. Only if valid do we unlock the
 * plan on the user's Firestore document — so a client can't self-upgrade.
 */
exports.verifyRazorpayPayment = onCall(
  { secrets: [RAZORPAY_KEY_SECRET], cors: true },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "You must be signed in.");

    const { orderId, paymentId, signature, plan } = req.data || {};
    if (!orderId || !paymentId || !signature) {
      throw new HttpsError("invalid-argument", "Missing payment fields.");
    }

    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET.value())
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    let valid = false;
    try {
      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(String(signature), "utf8");
      valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch (_) {
      valid = false;
    }

    if (!valid) return { valid: false };

    const uid = req.auth.uid;
    const userRef = admin.firestore().collection("users").doc(uid);

    // Record the payment (audit trail).
    await userRef.collection("payments").add({
      orderId,
      paymentId,
      plan: plan || null,
      at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Unlock the plan server-side only after a verified payment.
    if (plan && ALLOWED_PLANS.has(plan)) {
      await userRef.set(
        { plan, planUpdatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    return { valid: true };
  }
);
