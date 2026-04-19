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
  const [headlineColumn, ...detailColumns] = columns;
  const actionColumn = detailColumns.find((column) => column.key === "actions");
  const contentColumns = detailColumns.filter((column) => column.key !== "actions");

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
      <div className="md:hidden">
        <div className="space-y-3">
          {pageRows.map((row, rowIndex) => (
            <article
              key={rowIndex}
              className="overflow-hidden rounded-mono border border-line/70 bg-surface-base shadow-ambient"
            >
              {headlineColumn ? (
                <div className="border-b border-line/70 bg-[#f7fafc] px-4 py-3">
                  <p className="mb-1 text-[11px] font-semibold tracking-[0.12em] text-muted">{headlineColumn.header}</p>
                  <div className={clsx("text-base font-semibold leading-6 text-text", headlineColumn.cellClassName)}>
                    {headlineColumn.render(row)}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-0">
                {contentColumns.map((column) => (
                  <div
                    key={column.key}
                    className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 border-b border-line/60 px-4 py-3 last:border-b-0"
                  >
                    <p className="pt-0.5 text-[11px] font-semibold tracking-[0.08em] text-muted">{column.header}</p>
                    <div className={clsx("min-w-0 text-sm leading-6 text-text", column.cellClassName)}>
                      {column.render(row)}
                    </div>
                  </div>
                ))}
              </div>

              {actionColumn ? (
                <div className="border-t border-line/70 bg-[#fbfdff] px-4 py-3">
                  <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-muted">{actionColumn.header}</p>
                  <div className={clsx("mobile-actions text-sm text-text", actionColumn.cellClassName)}>
                    {actionColumn.render(row)}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-mono bg-surface-base shadow-ambient md:block">
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
