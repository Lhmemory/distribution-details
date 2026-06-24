import { Bell, ChevronDown, CircleHelp, LogOut, Menu, UserRound } from "lucide-react";
import { PropsWithChildren, ReactNode, useState } from "react";
import { useAppContext } from "../../app/context/AppContext";
import { getVisibleSystems } from "../../app/utils/permissions";
import { Button } from "../common/Button";
import { Sidebar } from "./Sidebar";
import { SystemTabs } from "./SystemTabs";

interface AppShellProps {
  pageTitle: string;
  pageDescription?: string;
  pageActions?: ReactNode;
  showSystemTabs?: boolean;
}

export function AppShell({
  pageTitle,
  pageDescription,
  pageActions,
  showSystemTabs = true,
  children,
}: PropsWithChildren<AppShellProps>) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const {
    authUser,
    authMode,
    bootstrapStatus,
    bootstrapMessage,
    systems,
    selectedSystemId,
    setSelectedSystemId,
    logout,
  } = useAppContext();
  const visibleSystems = getVisibleSystems(authUser, systems);

  return (
    <div className="flex min-h-screen bg-canvas text-text">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-line bg-surface-base/95 px-3 backdrop-blur lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="secondary" className="min-h-9 px-3 lg:hidden" aria-label="打开导航" onClick={() => setMobileNavOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold leading-tight text-text lg:text-xl">{pageTitle}</h1>
              {pageDescription ? <p className="mt-0.5 hidden max-w-3xl truncate text-xs text-muted 2xl:block">{pageDescription}</p> : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {showSystemTabs ? (
              <label className="hidden items-center gap-2 rounded-mono border border-line bg-surface-base px-3 py-2 text-sm text-muted shadow-subtle sm:flex">
                <span className="whitespace-nowrap">当前系统</span>
                <select
                  className="max-w-44 bg-transparent text-sm font-semibold text-text outline-none lg:max-w-56"
                  value={selectedSystemId}
                  onChange={(event) => setSelectedSystemId(event.target.value)}
                >
                  {visibleSystems.map((system) => (
                    <option key={system.id} value={system.id}>
                      {system.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button className="hidden h-10 w-10 items-center justify-center rounded-mono text-text transition hover:bg-surface-low sm:inline-flex" aria-label="通知">
              <Bell className="h-5 w-5" />
            </button>
            <button className="hidden h-10 w-10 items-center justify-center rounded-mono text-text transition hover:bg-surface-low sm:inline-flex" aria-label="帮助">
              <CircleHelp className="h-5 w-5" />
            </button>
            <div className="flex min-h-10 items-center gap-2 rounded-mono px-1.5 py-1 transition hover:bg-surface-low sm:px-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                {authUser?.name?.slice(0, 1) ?? <UserRound className="h-4 w-4" />}
              </span>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold leading-4 text-text">{authUser?.name ?? "未登录"}</p>
                <p className="mt-0.5 text-xs text-muted">{authUser?.role ?? "访客"}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted md:block" />
            </div>
            <button className="hidden h-10 w-10 items-center justify-center rounded-mono text-muted transition hover:bg-critical-bg hover:text-critical lg:inline-flex" aria-label="退出登录" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
          {showSystemTabs ? <SystemTabs /> : null}

          {authMode === "supabase" && (bootstrapStatus === "loading" || bootstrapMessage) ? (
            <div className="mb-4 rounded-mono border border-blue-100 bg-primary-soft px-4 py-3 text-sm text-primary-dim shadow-subtle">
              {bootstrapStatus === "loading" ? "正在同步云端数据..." : bootstrapMessage}
            </div>
          ) : null}

          <div className="mb-4 flex flex-col gap-3 sm:gap-4 xl:mb-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 xl:hidden">
              {pageDescription ? <p className="max-w-3xl text-sm text-muted">{pageDescription}</p> : null}
            </div>
            {pageActions ? <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:justify-end">{pageActions}</div> : null}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
