import { Settings2 } from "lucide-react";
import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../../app/context/AppContext";
import { getVisibleSystems } from "../../app/utils/permissions";

export function SystemTabs() {
  const { systems, selectedSystemId, setSelectedSystemId, authUser } = useAppContext();
  const visibleSystems = useMemo(() => getVisibleSystems(authUser, systems), [authUser, systems]);

  return (
    <header className="soft-panel mb-4 flex min-h-[52px] flex-col gap-2 px-2 py-2 xl:mb-5 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleSystems.map((system) => (
          <button
            key={system.id}
            className={`min-h-9 shrink-0 rounded-mono px-4 text-sm font-semibold transition ${
              selectedSystemId === system.id
                ? "bg-primary text-white shadow-sm"
                : "text-[#344054] hover:bg-primary-soft hover:text-primary"
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
          className="inline-flex min-h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-mono px-3 text-sm font-semibold text-[#344054] transition hover:bg-surface-low hover:text-primary"
        >
          <Settings2 className="mr-1 h-4 w-4" />
          系统管理
        </NavLink>
      </div>
    </header>
  );
}
