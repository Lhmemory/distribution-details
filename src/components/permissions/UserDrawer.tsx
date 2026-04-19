import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SystemItem, UserAccount } from "../../app/types";
import { Button } from "../common/Button";
import { Drawer } from "../common/Drawer";
import { FormField } from "../common/FormField";

const createSchema = z.object({
  name: z.string().trim().min(2, "请输入姓名"),
  account: z.string().trim().min(2, "请输入账号"),
  password: z.string().trim().min(6, "初始密码至少 6 位"),
  role: z.enum(["viewer", "editor", "admin"]),
  viewSystemIds: z.array(z.string()).min(1, "至少分配一个查看系统"),
  editSystemIds: z.array(z.string()),
});

const editSchema = z.object({
  name: z.string().trim().min(2, "请输入姓名"),
  account: z.string().trim().min(2, "请输入账号"),
  password: z.string(),
  role: z.enum(["viewer", "editor", "admin"]),
  viewSystemIds: z.array(z.string()).min(1, "至少分配一个查看系统"),
  editSystemIds: z.array(z.string()),
});

type FormShape = z.infer<typeof editSchema>;

export function UserDrawer({
  open,
  systems,
  initialValue,
  submitting,
  submitError,
  onClose,
  onSubmit,
}: {
  open: boolean;
  systems: SystemItem[];
  initialValue?: UserAccount | null;
  submitting?: boolean;
  submitError?: string;
  onClose: () => void;
  onSubmit: (payload: { record: UserAccount; password?: string; isNew: boolean }) => Promise<void>;
}) {
  const isEditing = Boolean(initialValue);
  const form = useForm<FormShape>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
    defaultValues: {
      name: "",
      account: "",
      password: "",
      role: "viewer",
      viewSystemIds: [],
      editSystemIds: [],
    },
  });

  useEffect(() => {
    form.reset({
      name: initialValue?.name ?? "",
      account: initialValue?.account ?? "",
      password: "",
      role: initialValue?.role ?? "viewer",
      viewSystemIds: initialValue?.viewSystemIds ?? [],
      editSystemIds: initialValue?.editSystemIds ?? [],
    });
  }, [form, initialValue]);

  const systemChoices = systems.filter((item) => item.id !== "all");
  const values = form.watch();

  async function handleSave(data: FormShape) {
    const viewSystemIds = Array.from(new Set(data.viewSystemIds));
    const editSystemIds =
      data.role === "viewer"
        ? []
        : Array.from(new Set(data.editSystemIds.filter((id) => viewSystemIds.includes(id))));

    await onSubmit({
      isNew: !isEditing,
      password: data.password.trim() || undefined,
      record: {
        id: initialValue?.id ?? `user-${Date.now()}`,
        account: data.account.trim(),
        email: initialValue?.email ?? "",
        name: data.name.trim(),
        role: data.role,
        viewSystemIds,
        editSystemIds,
        status: initialValue?.status ?? "active",
        updatedAt: new Intl.DateTimeFormat("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
      },
    });
  }

  return (
    <Drawer
      open={open}
      title={isEditing ? "编辑账号权限" : "新增账号"}
      subtitle="在网页内直接配置账号、密码和系统权限"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button onClick={form.handleSubmit(handleSave)} disabled={submitting}>
            {submitting ? "保存中..." : "保存账号"}
          </Button>
        </div>
      }
    >
      <form className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="姓名" error={form.formState.errors.name?.message}>
            <input className="field-input" {...form.register("name")} />
          </FormField>
          <FormField label="账号" error={form.formState.errors.account?.message}>
            <input className="field-input" {...form.register("account")} disabled={isEditing} />
          </FormField>
        </div>

        <FormField
          label={isEditing ? "重置密码" : "初始密码"}
          error={form.formState.errors.password?.message}
          hint={isEditing ? "留空则不修改密码" : "用户首次登录时使用这个密码"}
        >
          <input className="field-input" type="password" {...form.register("password")} />
        </FormField>

        <FormField label="角色" error={form.formState.errors.role?.message}>
          <select
            className="field-input"
            {...form.register("role")}
            onChange={(event) => {
              const nextRole = event.target.value as UserAccount["role"];
              form.setValue("role", nextRole, { shouldValidate: true });
              if (nextRole === "viewer") {
                form.setValue("editSystemIds", []);
              }
            }}
          >
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
        </FormField>

        <FormField label="查看权限" error={form.formState.errors.viewSystemIds?.message as string | undefined}>
          <div className="grid gap-2">
            {systemChoices.map((system) => (
              <label key={system.id} className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={values.viewSystemIds.includes(system.id)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...values.viewSystemIds, system.id]
                      : values.viewSystemIds.filter((id) => id !== system.id);
                    form.setValue("viewSystemIds", next, { shouldValidate: true });
                    form.setValue(
                      "editSystemIds",
                      values.editSystemIds.filter((id) => next.includes(id)),
                    );
                  }}
                />
                {system.label}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="编辑权限" hint="viewer 默认只读；只有已分配查看权限的系统才可设置编辑权限">
          <div className="grid gap-2">
            {systemChoices.map((system) => (
              <label key={system.id} className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  disabled={values.role === "viewer" || !values.viewSystemIds.includes(system.id)}
                  checked={values.editSystemIds.includes(system.id)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...values.editSystemIds, system.id]
                      : values.editSystemIds.filter((id) => id !== system.id);
                    form.setValue("editSystemIds", next);
                  }}
                />
                {system.label}
              </label>
            ))}
          </div>
        </FormField>

        {submitError ? <p className="text-sm text-critical">{submitError}</p> : null}
      </form>
    </Drawer>
  );
}
