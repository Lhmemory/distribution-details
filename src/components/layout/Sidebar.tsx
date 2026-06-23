import {
  ChartColumn,
  FileSpreadsheet,
  LayoutDashboard,
  Package2,
  PanelLeftClose,
  Settings2,
  BarChart3,
  Store,
  Users,
  X,
} from "lucide-react";
import { clsx } from "clsx";
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
  const { authUser } = useAppContext();
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
          "fixed inset-y-0 left-0 z-50 flex w-[min(20rem,85vw)] shrink-0 flex-col border-r border-line bg-surface-base px-4 py-5 transition-transform lg:static lg:h-screen lg:w-64 lg:translate-x-0 lg:px-4 lg:py-6",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center justify-between gap-3 lg:mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-mono bg-primary-soft text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-text">华南重客基础资料后台</p>
              <p className="mt-0.5 text-xs text-muted">Master Data Console</p>
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
                  "relative flex items-center gap-3 rounded-mono px-3 py-3 text-sm font-medium transition lg:px-4",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-text hover:bg-surface-low hover:text-primary",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-primary" /> : null}
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-line pt-4">
          <div className="mb-4 flex items-center gap-3 rounded-mono bg-surface-low p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
              {authUser?.name?.slice(0, 1) ?? "访"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{authUser?.name ?? "访客"}</p>
              <p className="mt-0.5 text-xs text-muted">{authUser?.role ?? "未登录"}</p>
            </div>
          </div>
          <button className="flex w-full items-center gap-3 rounded-mono px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-low hover:text-text">
            <PanelLeftClose className="h-4 w-4" />
            收起菜单
          </button>
        </div>
      </aside>
    </>
  );
}
