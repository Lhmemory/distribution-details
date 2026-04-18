import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SystemItem, UserAccount } from "../../app/types";
import { Button } from "../common/Button";
import { Drawer } from "../common/Drawer";
import { FormField } from "../common/FormField";

const schema = z.object({
  name: z.string().min(2, "请输入姓名"),
  account: z.string().min(2, "请输入账号"),
  email: z.string().email("请输入正确邮箱"),
  role: z.enum(["viewer", "editor", "admin"]),
  viewSystemIds: z.array(z.string()).min(1, "至少分配一个可查看系统"),
  editSystemIds: z.array(z.string()),
});

type FormShape = z.infer<typeof schema>;

export function UserDrawer({
  open,
  systems,
  initialValue,
  onClose,
  onSubmit,
}: {
  open: boolean;
  systems: SystemItem[];
  initialValue?: UserAccount | null;
  onClose: () => void;
  onSubmit: (record: UserAccount) => void;
}) {
  const form = useForm<FormShape>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      account: "",
      email: "",
      role: "viewer",
      viewSystemIds: [],
      editSystemIds: [],
    },
  });

  useEffect(() => {
    form.reset({
      name: initialValue?.name ?? "",
      account: initialValue?.account ?? "",
      email: initialValue?.email ?? "",
      role: initialValue?.role ?? "viewer",
      viewSystemIds: initialValue?.viewSystemIds ?? [],
      editSystemIds: initialValue?.editSystemIds ?? [],
    });
  }, [form, initialValue]);

  const systemChoices = systems.filter((item) => item.id !== "all");
  const values = form.watch();

  return (
    <Drawer
      open={open}
      title={initialValue ? "编辑账号权限" : "新增账号"}
      subtitle="管理员可分配角色、查看权限和编辑权限"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={form.handleSubmit((data) =>
              onSubmit({
                id: initialValue?.id ?? `user-${Date.now()}`,
                status: initialValue?.status ?? "invited",
                updatedAt: new Intl.DateTimeFormat("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date()),
                ...data,
              }),
            )}
          >
            保存账号
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
            <input className="field-input" {...form.register("account")} />
          </FormField>
        </div>
        <FormField label="邮箱" error={form.formState.errors.email?.message}>
          <input className="field-input" {...form.register("email")} />
        </FormField>
        <FormField label="角色" error={form.formState.errors.role?.message}>
          <select className="field-input" {...form.register("role")}>
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
        </FormField>
        <FormField label="可查看系统" error={form.formState.errors.viewSystemIds?.message as string | undefined}>
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
                  }}
                />
                {system.label}
              </label>
            ))}
          </div>
        </FormField>
        <FormField label="可编辑系统">
          <div className="grid gap-2">
            {systemChoices.map((system) => (
              <label key={system.id} className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
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
      </form>
    </Drawer>
  );
}
