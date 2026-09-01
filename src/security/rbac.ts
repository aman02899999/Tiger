export type Role = "super_admin" | "gym_owner" | "trainer" | "client";
export type RelationshipStatus = "active" | "inactive" | "pending";

export type TrainerClientRelationship = {
  trainerId: string;
  clientId: string;
  gymId: string;
  status: RelationshipStatus;
  createdAt?: string;
  updatedAt?: string;
};

export function canAssignRole(actorRole: string | null | undefined, targetRole: Role | string): boolean {
  if (!actorRole) return false;

  if (actorRole === "super_admin") {
    return ["super_admin", "gym_owner", "trainer", "client"].includes(targetRole);
  }

  if (actorRole === "gym_owner") {
    return targetRole === "trainer" || targetRole === "client";
  }

  return false;
}

export function canAccessGym(
  actorRole: string | null | undefined,
  actorGymId: string | null | undefined,
  targetGymId: string | null | undefined,
): boolean {
  if (!actorRole || !targetGymId) return false;
  if (actorRole === "super_admin") return true;
  if (!actorGymId) return false;
  if (actorRole === "gym_owner" || actorRole === "trainer" || actorRole === "client") {
    return actorGymId === targetGymId;
  }
  return false;
}

export function canAccessClient(
  actorRole: string | null | undefined,
  actorId: string | null | undefined,
  targetClientId: string | null | undefined,
  actorGymId: string | null | undefined,
  relationship?: TrainerClientRelationship | null,
): boolean {
  if (!actorRole || !actorId || !targetClientId) return false;

  if (actorRole === "super_admin") return true;
  if (actorRole === "client") return actorId === targetClientId;

  if (actorRole === "gym_owner" && actorGymId) {
    return relationship?.gymId === actorGymId;
  }

  if (actorRole === "trainer") {
    if (!relationship) return false;
    if (relationship.trainerId !== actorId) return false;
    if (relationship.clientId !== targetClientId) return false;
    if (relationship.gymId !== actorGymId) return false;
    return relationship.status === "active";
  }

  return false;
}

export function canReadUser(
  actorRole: string | null | undefined,
  actorId: string | null | undefined,
  targetUserId: string | null | undefined,
  actorGymId: string | null | undefined,
  targetGymId: string | null | undefined,
  relationship?: TrainerClientRelationship | null,
): boolean {
  if (!actorRole || !actorId || !targetUserId) return false;
  if (actorRole === "super_admin") return true;
  if (actorId === targetUserId) return true;

  if (actorRole === "gym_owner") {
    return actorGymId === targetGymId;
  }

  if (actorRole === "trainer") {
    return Boolean(
      relationship &&
        relationship.trainerId === actorId &&
        relationship.clientId === targetUserId &&
        relationship.gymId === actorGymId &&
        relationship.gymId === targetGymId &&
        relationship.status === "active",
    );
  }

  return false;
}

export function isPrivilegedRole(role: string | null | undefined): boolean {
  return role === "super_admin" || role === "gym_owner" || role === "trainer";
}
