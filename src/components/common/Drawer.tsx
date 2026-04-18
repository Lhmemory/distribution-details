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
    <div className="fixed inset-0 z-50 flex justify-end bg-surface-dim/45 backdrop-blur-[1px]">
      <button className="flex-1" aria-label="关闭抽屉" onClick={onClose} />
      <div className="flex h-full w-full max-w-xl flex-col bg-surface-high p-6 shadow-ambient">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-text">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          </div>
          <Button variant="ghost" className="px-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">{children}</div>
        {footer ? <div className="mt-6 border-t border-line pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
