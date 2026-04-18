import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { useAppContext } from "../app/context/AppContext";
import { exportRowsToXlsx } from "../app/utils/export";
import { canManageAccounts } from "../app/utils/permissions";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/common/Button";
import { DataTable, TableColumn } from "../components/common/DataTable";
import { SystemItem } from "../app/types";

export function SystemManagementPage() {
  const { systems, addSystem, authUser } = useAppContext();
  const [draft, setDraft] = useState("");

  const columns = useMemo<TableColumn<SystemItem>[]>(
    () => [
      { key: "label", header: "系统名称", sortable: true, sortValue: (row) => row.label, render: (row) => row.label },
      { key: "id", header: "系统标识", render: (row) => row.id },
      { key: "editable", header: "来源", render: (row) => (row.editable ? "业务维护" : "内置") },
      { key: "createdAt", header: "创建时间", sortable: true, sortValue: (row) => row.createdAt, render: (row) => row.createdAt },
    ],
    [],
  );

  return (
    <AppShell
      pageTitle="系统管理"
      pageDescription="统一管理顶部全局系统标签，后续新系统由管理员手动增加。"
      pageActions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              exportRowsToXlsx(
                systems
                  .filter((item) => item.id !== "all")
                  .map((row) => ({
                    系统名称: row.label,
                    系统标识: row.id,
                    来源: row.editable ? "业务维护" : "内置",
                    创建时间: row.createdAt,
                  })),
                "系统管理导出",
                "系统管理",
              )
            }
          >
            <Download className="mr-1 h-4 w-4" />
            导出 XLSX
          </Button>
          {canManageAccounts(authUser) ? (
            <>
              <input
                className="field-input w-44"
                placeholder="输入系统名称"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <Button
                onClick={() => {
                  addSystem(draft);
                  setDraft("");
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                新增系统
              </Button>
            </>
          ) : null}
        </div>
      }
    >
      <section className="tonal-panel p-5">
        <DataTable
          rows={systems.filter((item) => item.id !== "all")}
          columns={columns}
          emptyTitle="暂无系统"
          emptyDescription="管理员可在这里维护系统标签，并同步到顶部全局切换。"
        />
      </section>
    </AppShell>
  );
}
