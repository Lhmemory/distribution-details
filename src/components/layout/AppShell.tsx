import { Menu } from "lucide-react";
import { PropsWithChildren, ReactNode, useState } from "react";
import { useAppContext } from "../../app/context/AppContext";
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
  const { authUser, authMode, bootstrapStatus, bootstrapMessage } = useAppContext();

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="min-w-0 flex-1 px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
        <div className="soft-panel mb-4 flex items-center justify-between px-3 py-3 sm:px-4 lg:hidden">
          <div>
            <p className="text-base font-semibold text-text">{pageTitle}</p>
            <p className="text-xs text-muted">{authUser?.name ?? "未登录"}</p>
          </div>
          <Button variant="secondary" className="min-h-9 px-3" onClick={() => setMobileNavOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {showSystemTabs ? <SystemTabs /> : null}

        {authMode === "supabase" && (bootstrapStatus === "loading" || bootstrapMessage) ? (
          <div className="mb-4 rounded-mono border border-line bg-surface-low px-4 py-3 text-sm text-muted">
            {bootstrapStatus === "loading" ? "正在同步云端数据..." : bootstrapMessage}
          </div>
        ) : null}

        <div className="mb-5 flex flex-col gap-3 sm:gap-4 xl:mb-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-[1.9rem] font-semibold leading-tight text-text sm:text-[2.1rem]">{pageTitle}</h1>
            {pageDescription ? <p className="mt-1 max-w-3xl text-sm text-muted">{pageDescription}</p> : null}
          </div>
          {pageActions ? <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:justify-end">{pageActions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
