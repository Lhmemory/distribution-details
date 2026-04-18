import { clsx } from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { AsyncStatus } from "../../app/types";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { Pagination } from "./Pagination";

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  rows: T[];
  columns: TableColumn<T>[];
  status?: AsyncStatus;
  pageSize?: number;
  paginationSummary?: string;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle?: string;
  errorDescription?: string;
}

export function DataTable<T>({
  rows,
  columns,
  status = "ready",
  pageSize = 8,
  paginationSummary,
  emptyTitle,
  emptyDescription,
  errorTitle = "数据加载失败",
  errorDescription = "请稍后重试，或检查接口配置。",
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const target = columns.find((column) => column.key === sortKey);
    if (!target?.sortValue) return rows;

    return [...rows].sort((left, right) => {
      const leftValue = target.sortValue!(left);
      const rightValue = target.sortValue!(right);
      if (leftValue === rightValue) return 0;
      const order = leftValue > rightValue ? 1 : -1;
      return sortDirection === "asc" ? order : order * -1;
    });
  }, [columns, rows, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  }

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState title={errorTitle} description={errorDescription} />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div>
      <div className="overflow-x-auto rounded-mono bg-surface-base shadow-ambient">
        <table className="table-grid">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(column.headerClassName)}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.sortable ? (
                    <button className="flex items-center gap-1.5 text-left" onClick={() => toggleSort(column.key)}>
                      <span>{column.header}</span>
                      {sortKey === column.key ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.key} className={clsx(column.cellClassName)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        summary={paginationSummary}
        onPageChange={setPage}
      />
    </div>
  );
}
