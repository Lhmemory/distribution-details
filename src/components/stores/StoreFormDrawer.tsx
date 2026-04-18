import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { StoreRecord, SystemItem } from "../../app/types";
import { Button } from "../common/Button";
import { Drawer } from "../common/Drawer";
import { FormField } from "../common/FormField";

const businessStatusOptions = ["营业", "已闭店", "计划闭店", "计划开业", "店改"] as const;

const schema = z
  .object({
    systemId: z.string().min(1, "请选择系统"),
    storeCode: z.string().optional(),
    storeName: z.string().min(2, "请输入门店名称"),
    city: z.string().min(2, "请输入城市"),
    region: z.string().min(2, "请输入区域"),
    format: z.string().min(2, "请输入业态"),
    businessStatus: z.enum(businessStatusOptions),
    plannedCloseDate: z.string().optional(),
    plannedOpenDate: z.string().optional(),
    renovationOpenDate: z.string().optional(),
    salesVolume: z.coerce.number().min(0, "销量不能小于 0"),
  })
  .superRefine((value, ctx) => {
    if (value.businessStatus === "计划闭店" && !value.plannedCloseDate) {
      ctx.addIssue({
        code: "custom",
        path: ["plannedCloseDate"],
        message: "请填写计划闭店时间",
      });
    }

    if (value.businessStatus === "计划开业" && !value.plannedOpenDate) {
      ctx.addIssue({
        code: "custom",
        path: ["plannedOpenDate"],
        message: "请填写计划开业时间",
      });
    }

    if (value.businessStatus === "店改" && !value.renovationOpenDate) {
      ctx.addIssue({
        code: "custom",
        path: ["renovationOpenDate"],
        message: "请填写店改开业时间",
      });
    }
  });

type FormShape = z.infer<typeof schema>;

export function StoreFormDrawer({
  open,
  systems,
  initialValue,
  onClose,
  onSubmit,
}: {
  open: boolean;
  systems: SystemItem[];
  initialValue?: StoreRecord | null;
  onClose: () => void;
  onSubmit: (record: StoreRecord) => void;
}) {
  const form = useForm<FormShape>({
    resolver: zodResolver(schema),
    defaultValues: {
      systemId: "",
      storeCode: "",
      storeName: "",
      city: "",
      region: "",
      format: "",
      businessStatus: "营业",
      plannedCloseDate: "",
      plannedOpenDate: "",
      renovationOpenDate: "",
      salesVolume: 0,
    },
  });

  const currentStatus = form.watch("businessStatus");

  useEffect(() => {
    if (!initialValue) {
      form.reset({
        systemId: systems.find((item) => item.id !== "all")?.id ?? "",
        storeCode: "",
        storeName: "",
        city: "",
        region: "",
        format: "",
        businessStatus: "营业",
        plannedCloseDate: "",
        plannedOpenDate: "",
        renovationOpenDate: "",
        salesVolume: 0,
      });
      return;
    }

    form.reset({
      systemId: initialValue.systemId,
      storeCode: initialValue.storeCode,
      storeName: initialValue.storeName,
      city: initialValue.city,
      region: initialValue.region,
      format: initialValue.format,
      businessStatus: initialValue.businessStatus,
      plannedCloseDate: initialValue.plannedCloseDate ?? "",
      plannedOpenDate: initialValue.plannedOpenDate ?? "",
      renovationOpenDate: initialValue.renovationOpenDate ?? "",
      salesVolume: initialValue.salesVolume,
    });
  }, [form, initialValue, systems]);

  return (
    <Drawer
      open={open}
      title={initialValue ? "编辑门店" : "新增门店"}
      subtitle="维护门店编码、状态、计划时间与基础档案"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={form.handleSubmit((values) =>
              onSubmit({
                id: initialValue?.id ?? `sto-${Date.now()}`,
                systemId: values.systemId,
                storeCode: values.storeCode ?? "",
                storeName: values.storeName,
                city: values.city,
                region: values.region,
                format: values.format,
                businessStatus: values.businessStatus,
                plannedCloseDate: values.businessStatus === "计划闭店" ? values.plannedCloseDate : undefined,
                plannedOpenDate: values.businessStatus === "计划开业" ? values.plannedOpenDate : undefined,
                renovationOpenDate: values.businessStatus === "店改" ? values.renovationOpenDate : undefined,
                salesVolume: values.salesVolume,
                updatedAt: new Intl.DateTimeFormat("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date()),
              }),
            )}
          >
            保存门店
          </Button>
        </div>
      }
    >
      <form className="grid gap-4">
        <FormField label="系统" error={form.formState.errors.systemId?.message}>
          <select className="field-input" {...form.register("systemId")}>
            {systems
              .filter((item) => item.id !== "all")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
          </select>
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="门店编码" error={form.formState.errors.storeCode?.message}>
            <input className="field-input tabular" {...form.register("storeCode")} />
          </FormField>
          <FormField label="门店名称" error={form.formState.errors.storeName?.message}>
            <input className="field-input" {...form.register("storeName")} />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="城市" error={form.formState.errors.city?.message}>
            <input className="field-input" {...form.register("city")} />
          </FormField>
          <FormField label="区域" error={form.formState.errors.region?.message}>
            <input className="field-input" {...form.register("region")} />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="业态" error={form.formState.errors.format?.message}>
            <input className="field-input" {...form.register("format")} />
          </FormField>
          <FormField label="门店状态" error={form.formState.errors.businessStatus?.message}>
            <select className="field-input" {...form.register("businessStatus")}>
              {businessStatusOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {currentStatus === "计划闭店" ? (
          <FormField label="计划闭店时间" error={form.formState.errors.plannedCloseDate?.message}>
            <input className="field-input" type="date" {...form.register("plannedCloseDate")} />
          </FormField>
        ) : null}

        {currentStatus === "计划开业" ? (
          <FormField label="计划开业时间" error={form.formState.errors.plannedOpenDate?.message}>
            <input className="field-input" type="date" {...form.register("plannedOpenDate")} />
          </FormField>
        ) : null}

        {currentStatus === "店改" ? (
          <FormField label="店改开业时间" error={form.formState.errors.renovationOpenDate?.message}>
            <input className="field-input" type="date" {...form.register("renovationOpenDate")} />
          </FormField>
        ) : null}

        <FormField label="销量" error={form.formState.errors.salesVolume?.message}>
          <input className="field-input tabular" type="number" step="1" {...form.register("salesVolume")} />
        </FormField>
      </form>
    </Drawer>
  );
}
