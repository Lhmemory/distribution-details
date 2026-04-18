import { SystemItem, UserAccount } from "../types";
import { canAccessSystem } from "./permissions";

export function getVisibleSystems(systems: SystemItem[], user: UserAccount | null) {
  if (!user) return [];
  if (user.role === "admin") return systems;
  return systems.filter(
    (system) => system.id === "all" || canAccessSystem(user, system.id, "view"),
  );
}
