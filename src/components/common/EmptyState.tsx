export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-mono bg-surface-low px-6 text-center">
      <p className="mb-1 text-sm font-semibold text-text">{title}</p>
      <p className="max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}
