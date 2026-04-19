import { Role, SystemItem, UserAccount } from "../types";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildPermissionSet(user: UserAccount | null) {
  if (!user) return new Set<string>();
  return new Set(
    [...user.viewSystemIds, ...user.editSystemIds]
      .filter((item) => Boolean(item))
      .map((item) => normalize(item)),
  );
}

export function canEditRole(role: Role) {
  return role === "editor" || role === "admin";
}

export function canManageAccounts(user: UserAccount | null) {
  return user?.role === "admin";
}

export function canAccessSystem(user: UserAccount | null, systemId: string, level: "view" | "edit" = "view") {
  if (!user || systemId === "all") return false;
  if (user.role === "admin") return true;

  const normalizedId = normalize(systemId);
  if (level === "edit") {
    return user.editSystemIds.map((item) => normalize(item)).includes(normalizedId);
  }

  return (
    user.viewSystemIds.map((item) => normalize(item)).includes(normalizedId) ||
    user.editSystemIds.map((item) => normalize(item)).includes(normalizedId)
  );
}

export function getVisibleSystems(user: UserAccount | null, systems: SystemItem[]) {
  if (!user) return systems.filter((item) => item.id === "all");
  if (user.role === "admin") return systems;

  const permissions = buildPermissionSet(user);
  return systems.filter((item) => {
    if (item.id === "all") return true;
    return permissions.has(normalize(item.id)) || permissions.has(normalize(item.label));
  });
}
