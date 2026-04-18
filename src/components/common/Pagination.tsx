import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export function Pagination({
  page,
  totalPages,
  summary,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  summary?: string;
  onPageChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-1 py-4">
      <div className="flex items-center gap-3 text-xs text-muted">
        <p>
          第 {page} / {totalPages} 页
        </p>
        {summary ? <p>{summary}</p> : null}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          上一页
        </Button>
        <Button
          variant="secondary"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          下一页
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
