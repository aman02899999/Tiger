export const VALID_ROLES = ["super_admin", "gym_owner", "trainer", "client"] as const;
export type ValidRole = (typeof VALID_ROLES)[number];

export type TrustedRoleClaims = {
  role: ValidRole;
  gymId?: string | null;
  // The browser never sets these. Only a trusted backend / Firebase Admin SDK should assign them.
};

export function isValidRole(role: string | null | undefined): role is ValidRole {
  return !!role && VALID_ROLES.includes(role as ValidRole);
}

export function createTrustedRoleClaims(role: string, gymId?: string | null): TrustedRoleClaims | null {
  if (!isValidRole(role)) {
    return null;
  }
  return {
    role,
    gymId: gymId ?? null,
  };
}

export function canClientAssignRole(targetRole: string | null | undefined): boolean {
  return !targetRole || !["super_admin", "gym_owner", "trainer"].includes(targetRole);
}

export function requireTrustedRoleClaims(claims: Partial<TrustedRoleClaims> | null | undefined): TrustedRoleClaims | null {
  if (!claims || !isValidRole(claims.role)) {
    return null;
  }
  return createTrustedRoleClaims(claims.role, claims.gymId ?? null);
}
