import { Plus, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../../app/context/AppContext";
import { canManageAccounts, getVisibleSystems } from "../../app/utils/permissions";
import { Button } from "../common/Button";

export function SystemTabs() {
  const { systems, selectedSystemId, setSelectedSystemId, addSystem, authUser } = useAppContext();
  const [draftSystem, setDraftSystem] = useState("");
  const visibleSystems = useMemo(() => getVisibleSystems(authUser, systems), [authUser, systems]);

  function handleAddSystem() {
    if (!draftSystem.trim()) return;
    addSystem(draftSystem);
    setDraftSystem("");
  }

  return (
    <header className="soft-panel mb-4 flex flex-col gap-3 px-2 py-2 xl:mb-5 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleSystems.map((system) => (
          <button
            key={system.id}
            className={`shrink-0 rounded-mono px-4 py-2.5 text-sm font-semibold transition ${
              selectedSystemId === system.id
                ? "bg-primary text-white shadow-sm"
                : "text-text hover:bg-primary-soft hover:text-primary"
            }`}
            onClick={() => setSelectedSystemId(system.id)}
          >
            {system.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:flex sm:flex-row sm:items-center">
        <NavLink
          to="/system-management"
          className="inline-flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-mono px-4 text-sm font-semibold text-text transition hover:bg-surface-low"
        >
          <Settings2 className="mr-1 h-4 w-4" />
          系统管理
        </NavLink>
        {canManageAccounts(authUser) ? (
          <>
          <input
            className="field-input w-full bg-white sm:w-44"
            placeholder="新增系统"
            value={draftSystem}
            onChange={(event) => setDraftSystem(event.target.value)}
          />
          <Button className="justify-center" onClick={handleAddSystem}>
            <Plus className="mr-1 h-4 w-4" />
            新增系统
          </Button>
          </>
        ) : null}
      </div>
    </header>
  );
}
