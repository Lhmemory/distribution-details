import { Bell, CircleHelp, Menu, UserRound } from "lucide-react";
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
  } = useAppContext();
  const visibleSystems = getVisibleSystems(authUser, systems);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-[68px] items-center justify-between border-b border-line bg-surface-base/95 px-4 backdrop-blur lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="secondary" className="min-h-9 px-3 lg:hidden" onClick={() => setMobileNavOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold leading-tight text-text lg:text-2xl">{pageTitle}</h1>
              {pageDescription ? <p className="mt-0.5 hidden max-w-3xl truncate text-sm text-muted xl:block">{pageDescription}</p> : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {showSystemTabs ? (
              <select
                className="hidden min-h-10 rounded-mono border border-line bg-surface-base px-3 text-sm font-medium text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 sm:block"
                value={selectedSystemId}
                onChange={(event) => setSelectedSystemId(event.target.value)}
              >
                {visibleSystems.map((system) => (
                  <option key={system.id} value={system.id}>
                    当前系统：{system.label}
                  </option>
                ))}
              </select>
            ) : null}
            <button className="hidden rounded-mono p-2.5 text-text transition hover:bg-surface-low sm:inline-flex" aria-label="通知">
              <Bell className="h-5 w-5" />
            </button>
            <button className="hidden rounded-mono p-2.5 text-text transition hover:bg-surface-low sm:inline-flex" aria-label="帮助">
              <CircleHelp className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 rounded-mono px-2 py-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                {authUser?.name?.slice(0, 1) ?? <UserRound className="h-4 w-4" />}
              </span>
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold leading-4 text-text">{authUser?.name ?? "未登录"}</p>
                <p className="mt-0.5 text-xs text-muted">{authUser?.role ?? "访客"}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
          {showSystemTabs ? <SystemTabs /> : null}

          {authMode === "supabase" && (bootstrapStatus === "loading" || bootstrapMessage) ? (
            <div className="mb-4 rounded-mono border border-blue-100 bg-primary-soft px-4 py-3 text-sm text-primary-dim">
              {bootstrapStatus === "loading" ? "正在同步云端数据..." : bootstrapMessage}
            </div>
          ) : null}

          <div className="mb-5 flex flex-col gap-3 sm:gap-4 xl:mb-6 xl:flex-row xl:items-end xl:justify-between">
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
