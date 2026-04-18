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
}

export function AppShell({
  pageTitle,
  pageDescription,
  pageActions,
  children,
}: PropsWithChildren<AppShellProps>) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { authUser } = useAppContext();

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1 px-4 py-4 lg:px-6">
        <div className="soft-panel mb-4 flex items-center justify-between px-4 py-3 lg:hidden">
          <div>
            <p className="text-base font-semibold text-text">{pageTitle}</p>
            <p className="text-xs text-muted">{authUser?.name ?? "未登录"}</p>
          </div>
          <Button variant="secondary" className="min-h-9 px-3" onClick={() => setMobileNavOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <SystemTabs />

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-[1.75rem] font-semibold text-text">{pageTitle}</h1>
            {pageDescription ? <p className="mt-1 max-w-3xl text-sm text-muted">{pageDescription}</p> : null}
          </div>
          {pageActions}
        </div>
        {children}
      </div>
    </div>
  );
}
