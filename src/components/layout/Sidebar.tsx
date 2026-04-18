import {
  ChartColumn,
  FileSpreadsheet,
  LayoutDashboard,
  Package2,
  Settings2,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { useAppContext } from "../../app/context/AppContext";

const navItems = [
  { to: "/overview", label: "总览", icon: LayoutDashboard },
  { to: "/products", label: "产品信息", icon: Package2 },
  { to: "/price-guides", label: "价格指引", icon: FileSpreadsheet },
  { to: "/stores", label: "门店信息", icon: Store },
  { to: "/sales", label: "销售数据", icon: ChartColumn },
  { to: "/system-management", label: "系统管理", icon: Settings2 },
  { to: "/account-permissions", label: "账号权限", icon: Users },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { authUser } = useAppContext();

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
          "fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-surface-low px-5 py-6 transition-transform lg:static lg:h-screen lg:w-56 lg:px-4 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-mono bg-primary text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-text">华南重客</p>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">SCKA</p>
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
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  "relative flex items-center gap-3 rounded-mono px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-surface-base text-primary shadow-ambient"
                    : "text-muted hover:bg-surface-high hover:text-text",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-primary" /> : null}
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-mono bg-surface-base p-4 shadow-ambient">
          <p className="text-sm font-semibold text-text">{authUser?.name ?? "访客"}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{authUser?.role ?? "未登录"}</p>
        </div>
      </aside>
    </>
  );
}
