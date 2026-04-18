export function LoadingState({ label = "数据加载中..." }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-mono bg-surface-low text-sm text-muted">
      {label}
    </div>
  );
}
