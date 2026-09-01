export type SecurityAuditEvent = {
  actorRole: string | null | undefined;
  actorId: string | null | undefined;
  targetUserId?: string | null;
  targetGymId?: string | null;
  relationship?: {
    trainerId: string;
    clientId: string;
    gymId: string;
    status: "active" | "inactive" | "pending";
  } | null;
};

export function evaluateSecurity(event: SecurityAuditEvent): boolean {
  const { actorRole, actorId, targetUserId, targetGymId, relationship } = event;
  if (!actorRole || !actorId) return false;

  if (actorRole === "super_admin") return true;
  if (actorRole === "client") return actorId === targetUserId;
  if (actorRole === "gym_owner") return targetGymId === relationship?.gymId || targetGymId === null;
  if (actorRole === "trainer") {
    return Boolean(
      relationship &&
      relationship.trainerId === actorId &&
      relationship.clientId === targetUserId &&
      relationship.gymId === targetGymId &&
      relationship.status === "active",
    );
  }

  return false;
}
