import { Button } from "./Button";

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-mono bg-critical-bg/10 px-6 text-center">
      <p className="mb-1 text-sm font-semibold text-critical">{title}</p>
      <p className="mb-4 max-w-md text-sm text-muted">{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          重试
        </Button>
      ) : null}
    </div>
  );
}
