import { Role, SystemItem, UserAccount } from "../types";

export function canEditRole(role: Role) {
  return role === "editor" || role === "admin";
}

export function canManageAccounts(user: UserAccount | null) {
  return user?.role === "admin";
}

export function canAccessSystem(user: UserAccount | null, systemId: string, level: "view" | "edit" = "view") {
  if (!user || systemId === "all") return false;
  if (user.role === "admin") return true;
  if (level === "edit") return user.editSystemIds.includes(systemId);
  return user.viewSystemIds.includes(systemId) || user.editSystemIds.includes(systemId);
}

export function getVisibleSystems(user: UserAccount | null, systems: SystemItem[]) {
  if (!user) return systems.filter((item) => item.id === "all");
  if (user.role === "admin") return systems;

  return systems.filter(
    (item) =>
      item.id === "all" ||
      user.viewSystemIds.includes(item.id) ||
      user.editSystemIds.includes(item.id),
  );
}
