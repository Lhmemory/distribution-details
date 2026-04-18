import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
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
    <header className="soft-panel mb-5 flex flex-col gap-4 px-4 py-4 xl:flex-row xl:items-center xl:justify-between xl:px-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleSystems.map((system) => (
          <button
            key={system.id}
            className={`rounded-mono px-3 py-2 text-sm font-medium transition ${
              selectedSystemId === system.id
                ? "bg-surface-base text-primary shadow-ambient"
                : "text-muted hover:bg-surface-base hover:text-text"
            }`}
            onClick={() => setSelectedSystemId(system.id)}
          >
            {system.label}
          </button>
        ))}
      </div>

      {canManageAccounts(authUser) ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="field-input w-full bg-white sm:w-44"
            placeholder="新增系统"
            value={draftSystem}
            onChange={(event) => setDraftSystem(event.target.value)}
          />
          <Button onClick={handleAddSystem}>
            <Plus className="mr-1 h-4 w-4" />
            新增系统
          </Button>
        </div>
      ) : null}
    </header>
  );
}
