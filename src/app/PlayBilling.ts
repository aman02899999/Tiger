/* ---------------------------------------------------------------- */
/* Google Play Billing bridge — used only when this web app is       */
/* running inside the Android Trusted Web Activity (see /android).   */
/* Talks to Play through the standard W3C Digital Goods API, which   */
/* the TWA's androidbrowserhelper:billing library implements.        */
/*                                                                    */
/* On the regular website this API does not exist, so isAvailable()  */
/* returns false and Checkout.tsx falls back to the UPI/Card/         */
/* Netbanking flow — exactly the split Play Store policy requires:    */
/* digital subscriptions sold *inside* an Android app distributed     */
/* via Play must go through Play Billing, not a third-party gateway.  */
/* ---------------------------------------------------------------- */

const SERVICE_URL = "https://play.google.com/billing";

// Product IDs must exactly match what you create in Play Console
// (see ANDROID_APP.md / PLAY_CONSOLE_SETUP.md for the full list).
export const PLAY_SKUS = {
  pro_monthly: "pro_monthly",
  pro_annual: "pro_annual",
  elite_monthly: "elite_monthly",
  elite_annual: "elite_annual",
  elite_lifetime: "elite_lifetime", // one-time managed product, not a subscription
} as const;

export type PlaySku = (typeof PLAY_SKUS)[keyof typeof PLAY_SKUS];

interface DigitalGoodsService {
  getDetails(itemIds: string[]): Promise<Array<{ itemId: string; price: { currency: string; value: string }; title: string; description: string }>>;
  listPurchases(): Promise<Array<{ itemId: string; purchaseToken: string }>>;
  consume(purchaseToken: string): Promise<void>;
}

declare global {
  interface Window {
    getDigitalGoodsService?: (serviceUrl: string) => Promise<DigitalGoodsService>;
  }
}

let cachedService: DigitalGoodsService | null | undefined;

async function getService(): Promise<DigitalGoodsService | null> {
  if (cachedService !== undefined) return cachedService;
  if (typeof window === "undefined" || !window.getDigitalGoodsService) {
    cachedService = null;
    return null;
  }
  try {
    cachedService = await window.getDigitalGoodsService(SERVICE_URL);
  } catch {
    cachedService = null;
  }
  return cachedService;
}

/** True only inside the installed Android app (TWA) with Play Billing wired up. */
export async function isPlayBillingAvailable(): Promise<boolean> {
  return (await getService()) !== null;
}

/** Live price/title from Play Console for a SKU, for display before purchase. */
export async function getPlayProductDetails(sku: PlaySku) {
  const service = await getService();
  if (!service) return null;
  const [details] = await service.getDetails([sku]);
  return details ?? null;
}

/**
 * Launches the native Play Billing purchase sheet via the Payment Request
 * API (the browser-side half of the Digital Goods flow) and resolves once
 * Play reports the purchase as complete. Subscriptions use the base plan
 * matching `sku`; elite_lifetime is a one-time managed product.
 */
export async function purchaseWithPlayBilling(sku: PlaySku | string): Promise<{ purchaseToken: string } | null> {
  if (!(await isPlayBillingAvailable())) return null;
  if (!("PaymentRequest" in window)) return null;

  const methodData = [{ supportedMethods: SERVICE_URL, data: { sku } }];
  const details = { total: { label: "Total", amount: { currency: "INR", value: "0" } } };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PaymentRequest ctor isn't typed for the Play method
  const request = new (window as any).PaymentRequest(methodData, details);
  const response = await request.show();
  const purchaseToken: string | undefined = response?.details?.purchaseToken ?? response?.details?.token;
  await response.complete("success");
  if (!purchaseToken) return null;
  return { purchaseToken };
}

/** Acknowledge/consume a completed one-time purchase so Play doesn't refund it after 3 days. */
export async function acknowledgePlayPurchase(purchaseToken: string) {
  const service = await getService();
  await service?.consume(purchaseToken).catch(() => { /* best-effort */ });
}
