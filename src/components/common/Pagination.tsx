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
    <div className="flex flex-col gap-3 px-1 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1 text-xs text-muted sm:flex-row sm:items-center sm:gap-3">
        <p>
          第 {page} / {totalPages} 页
        </p>
        {summary ? <p>{summary}</p> : null}
      </div>
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
        <Button
          variant="secondary"
          className="justify-center"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          上一页
        </Button>
        <Button
          variant="secondary"
          className="justify-center"
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
