export type PaymentStatus = "pending" | "active" | "cancelled" | "expired" | "refunded" | "revoked";

export type PurchaseVerification = {
  ok: boolean;
  status: PaymentStatus;
  message?: string;
};

export interface PaymentProvider {
  verifyPurchase(purchaseToken: string): Promise<PurchaseVerification>;
}

export interface EntitlementService {
  applyEntitlement(userId: string, purchaseToken: string, status: PaymentStatus): Promise<void>;
  revokeEntitlement(userId: string, reason: string): Promise<void>;
}

export interface PurchaseVerifier {
  verifyPurchase(provider: string, purchaseToken: string): Promise<PurchaseVerification>;
}

export function createManualConfigurationError(provider: string): PurchaseVerification {
  return {
    ok: false,
    status: "pending",
    message: `${provider} verification is not configured. Manual configuration required before live entitlement is granted.`,
  };
}

export async function verifyTrustedPurchase(
  verifier: PurchaseVerifier,
  provider: string,
  purchaseToken: string,
): Promise<PurchaseVerification> {
  if (!provider || !purchaseToken) {
    return {
      ok: false,
      status: "pending",
      message: "Purchase verification requires a provider and purchaseToken.",
    };
  }

  return verifier.verifyPurchase(provider, purchaseToken);
}
