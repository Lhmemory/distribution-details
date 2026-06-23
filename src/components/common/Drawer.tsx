import { X } from "lucide-react";
import { PropsWithChildren, ReactNode } from "react";
import { Button } from "./Button";

interface DrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  onClose: () => void;
}

export function Drawer({
  open,
  title,
  subtitle,
  footer,
  onClose,
  children,
}: PropsWithChildren<DrawerProps>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-surface-dim/35 backdrop-blur-[1px]">
      <button className="flex-1" aria-label="关闭抽屉" onClick={onClose} />
      <div className="flex h-full w-full max-w-xl flex-col border-l border-line bg-surface-base shadow-ambient">
        <div className="border-b border-line px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg font-semibold text-text sm:text-xl">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          </div>
          <Button variant="ghost" className="shrink-0 px-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">{children}</div>
        {footer ? <div className="border-t border-line px-4 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </div>
  );
}
