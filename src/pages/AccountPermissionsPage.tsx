import { Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppContext } from "../app/context/AppContext";
import { UserAccount } from "../app/types";
import { exportRowsToXlsx } from "../app/utils/export";
import { cnRoleLabel } from "../app/utils/format";
import { canManageAccounts } from "../app/utils/permissions";
import { Badge } from "../components/common/Badge";
import { Button } from "../components/common/Button";
import { DataTable, TableColumn } from "../components/common/DataTable";
import { AppShell } from "../components/layout/AppShell";
import { UserDrawer } from "../components/permissions/UserDrawer";

export function AccountPermissionsPage() {
  const { users, systems, upsertUser, authUser } = useAppContext();
  const [activeUser, setActiveUser] = useState<UserAccount | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const systemLabelMap = useMemo(
    () => new Map(systems.map((item) => [item.id, item.label])),
    [systems],
  );

  const columns = useMemo<TableColumn<UserAccount>[]>(
    () => [
      { key: "name", header: "姓名", sortable: true, sortValue: (row) => row.name, render: (row) => row.name },
      { key: "account", header: "账号", render: (row) => row.account },
      { key: "email", header: "邮箱", render: (row) => row.email },
      { key: "role", header: "角色", render: (row) => <Badge tone={row.role === "admin" ? "primary" : row.role === "editor" ? "success" : "neutral"}>{cnRoleLabel(row.role)}</Badge> },
      {
        key: "viewSystems",
        header: "查看权限",
        render: (row) => row.viewSystemIds.map((id) => systemLabelMap.get(id)).filter(Boolean).join("、"),
      },
      {
        key: "editSystems",
        header: "编辑权限",
        render: (row) =>
          row.role === "viewer"
            ? "只读"
            : row.editSystemIds.map((id) => systemLabelMap.get(id)).filter(Boolean).join("、") || "未分配",
      },
      { key: "updatedAt", header: "更新时间", sortable: true, sortValue: (row) => row.updatedAt, render: (row) => row.updatedAt },
      {
        key: "actions",
        header: "操作",
        render: (row) => (
          <Button
            variant="secondary"
            className="min-h-8 px-3"
            disabled={!canManageAccounts(authUser)}
            onClick={() => {
              setActiveUser(row);
              setDrawerOpen(true);
            }}
          >
            编辑
          </Button>
        ),
      },
    ],
    [authUser, systemLabelMap],
  );

  return (
    <AppShell
      pageTitle="账号权限"
      pageDescription="admin 可创建账号、分配角色、分配系统查看权限和编辑权限。viewer 只读，editor 可修改业务数据。"
      pageActions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              exportRowsToXlsx(
                users.map((row) => ({
                  姓名: row.name,
                  账号: row.account,
                  邮箱: row.email,
                  角色: cnRoleLabel(row.role),
                  查看权限: row.viewSystemIds.map((id) => systemLabelMap.get(id)).filter(Boolean).join("、"),
                  编辑权限:
                    row.role === "viewer"
                      ? "只读"
                      : row.editSystemIds.map((id) => systemLabelMap.get(id)).filter(Boolean).join("、") || "未分配",
                  更新时间: row.updatedAt,
                })),
                "账号权限导出",
                "账号权限",
              )
            }
          >
            <Download className="mr-1 h-4 w-4" />
            导出 XLSX
          </Button>
          {canManageAccounts(authUser) ? (
            <Button
              onClick={() => {
                setActiveUser(null);
                setDrawerOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              新增账号
            </Button>
          ) : null}
        </div>
      }
    >
      <section className="tonal-panel p-5">
        <DataTable
          rows={users}
          columns={columns}
          emptyTitle="暂无账号"
          emptyDescription="管理员可新建账号，并分配系统查看权限和编辑权限。"
        />
      </section>

      <UserDrawer
        open={drawerOpen}
        systems={systems}
        initialValue={activeUser}
        onClose={() => setDrawerOpen(false)}
        onSubmit={(record) => {
          upsertUser(record);
          setDrawerOpen(false);
        }}
      />
    </AppShell>
  );
}
