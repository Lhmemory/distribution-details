import {
  BarChart3,
  ChartColumn,
  FileSpreadsheet,
  LayoutDashboard,
  Package2,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Store,
  Users,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppContext } from "../../app/context/AppContext";
import { canManageAccounts } from "../../app/utils/permissions";

const navItems = [
  { to: "/overview", label: "总览", icon: LayoutDashboard },
  { to: "/products", label: "产品信息", icon: Package2 },
  { to: "/price-guides", label: "价格指引", icon: FileSpreadsheet },
  { to: "/stores", label: "门店信息", icon: Store },
  { to: "/sales", label: "销售数据", icon: ChartColumn },
  { to: "/system-management", label: "系统基本信息", icon: Settings2 },
  { to: "/account-permissions", label: "账号权限", icon: Users },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { authUser, selectedSystemId, systems } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);
  const selectedSystem = systems.find((system) => system.id === selectedSystemId)?.label ?? "未选择系统";
  const visibleNavItems = canManageAccounts(authUser)
    ? navItems
    : navItems.filter((item) => item.to !== "/account-permissions");

  return (
    <>
      {mobileOpen ? (
        <button
          aria-label="关闭导航"
          className="fixed inset-0 z-40 bg-canvas/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] shrink-0 flex-col border-r border-line bg-surface-base px-4 py-4 transition-all lg:static lg:h-screen lg:translate-x-0",
          collapsed ? "lg:w-[76px] lg:px-3" : "lg:w-[252px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-5 flex h-12 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-mono bg-primary-soft text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className={clsx("min-w-0", collapsed && "lg:hidden")}>
              <p className="truncate text-base font-bold text-text">华南重客基础资料后台</p>
              <p className="mt-0.5 truncate text-xs text-muted">Master Data Console</p>
            </div>
          </div>
          <button
            aria-label="关闭导航"
            className="rounded-mono p-2 text-muted transition hover:bg-surface-base hover:text-text lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  "relative flex min-h-11 items-center gap-3 rounded-mono px-3 text-sm font-medium transition",
                  isActive
                    ? "bg-primary-soft text-primary shadow-subtle"
                    : "text-[#344054] hover:bg-surface-low hover:text-primary",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-primary" /> : null}
                  <item.icon className={clsx("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-[#475467]")} />
                  <span className={clsx("truncate", collapsed && "lg:hidden")}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-line pt-4">
          <div className={clsx("mb-4 flex items-center gap-3 rounded-mono bg-surface-low p-3", collapsed && "lg:justify-center lg:px-2")}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
              {authUser?.name?.slice(0, 1) ?? "访"}
            </span>
            <div className={clsx("min-w-0", collapsed && "lg:hidden")}>
              <p className="truncate text-sm font-semibold text-text">{authUser?.name ?? "访客"}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{selectedSystem}</p>
            </div>
          </div>
          <button
            className={clsx(
              "flex w-full items-center gap-3 rounded-mono px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-low hover:text-text",
              collapsed && "lg:justify-center lg:px-2",
            )}
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            <span className={clsx(collapsed && "lg:hidden")}>{collapsed ? "展开菜单" : "收起菜单"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
