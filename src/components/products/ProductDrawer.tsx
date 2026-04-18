import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductRecord, SystemItem } from "../../app/types";
import bridgeProducts from "../../app/data/o2oBridgeProducts.json";
import { Button } from "../common/Button";
import { Drawer } from "../common/Drawer";
import { FormField } from "../common/FormField";

const marketingCategories = ["战略", "盈利", "渠道", "行情", "精品调味"] as const;

const schema = z.object({
  systemId: z.string().min(1, "请选择系统"),
  barcode: z.string().min(6, "请输入条码"),
  productCode: z.string().optional(),
  productName: z.string().min(2, "请输入商品名称"),
  archiveSupplyPrice: z.coerce.number().min(0, "金额不能小于 0"),
  archiveSalePrice: z.coerce.number().min(0, "金额不能小于 0"),
  promoSupplyPrice: z.coerce.number().min(0, "金额不能小于 0"),
  promoSalePrice: z.coerce.number().min(0, "金额不能小于 0"),
  category: z.string().optional(),
});

type FormShape = z.infer<typeof schema>;

export function ProductDrawer({
  open,
  systems,
  initialValue,
  onClose,
  onSubmit,
}: {
  open: boolean;
  systems: SystemItem[];
  initialValue?: ProductRecord | null;
  onClose: () => void;
  onSubmit: (record: ProductRecord) => void;
}) {
  const [bridgeKeyword, setBridgeKeyword] = useState("");
  const form = useForm<FormShape>({
    resolver: zodResolver(schema),
    defaultValues: {
      systemId: "",
      barcode: "",
      productCode: "",
      productName: "",
      archiveSupplyPrice: 0,
      archiveSalePrice: 0,
      promoSupplyPrice: 0,
      promoSalePrice: 0,
      category: "",
    },
  });

  useEffect(() => {
    if (!initialValue) {
      setBridgeKeyword("");
      form.reset({
        systemId: systems.find((item) => item.id !== "all")?.id ?? "",
        barcode: "",
        productCode: "",
        productName: "",
        archiveSupplyPrice: 0,
        archiveSalePrice: 0,
        promoSupplyPrice: 0,
        promoSalePrice: 0,
        category: "",
      });
      return;
    }

    setBridgeKeyword(initialValue.productName);
    form.reset({
      systemId: initialValue.systemId,
      barcode: initialValue.barcode,
      productCode: initialValue.productCode,
      productName: initialValue.productName,
      archiveSupplyPrice: initialValue.archiveSupplyPrice,
      archiveSalePrice: initialValue.archiveSalePrice,
      promoSupplyPrice: initialValue.promoSupplyPrice,
      promoSalePrice: initialValue.promoSalePrice,
      category: initialValue.category ?? "",
    });
  }, [form, initialValue, systems]);

  const bridgeMatches = useMemo(() => {
    const keyword = bridgeKeyword.trim().toLowerCase();
    if (!keyword) return [];

    const tokens = keyword.split(/\s+/).filter(Boolean);
    return bridgeProducts
      .map((item) => {
        const haystack = [
          item.productName,
          item.spec,
          item.shortName,
          item.level3Category,
          item.barcode,
        ]
          .join(" ")
          .toLowerCase();

        const exactIncludes = haystack.includes(keyword);
        const tokenMatched = tokens.every((token) => haystack.includes(token));
        const fuzzyMatched = isSubsequence(keyword, haystack);

        if (!exactIncludes && !tokenMatched && !fuzzyMatched) {
          return null;
        }

        const score = exactIncludes ? 3 : tokenMatched ? 2 : 1;
        return { ...item, score };
      })
      .filter((item): item is (typeof bridgeProducts)[number] & { score: number } => Boolean(item))
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return left.productName.localeCompare(right.productName, "zh-CN");
      })
      .slice(0, 12);
  }, [bridgeKeyword]);

  return (
    <Drawer
      open={open}
      title={initialValue ? "编辑产品信息" : "新增产品"}
      subtitle="使用右侧抽屉维护产品档案和价格"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={form.handleSubmit((values) =>
              onSubmit({
                id: initialValue?.id ?? `prd-${Date.now()}`,
                systemId: values.systemId,
                barcode: values.barcode,
                productCode: values.productCode ?? "",
                productName: values.productName,
                archiveSupplyPrice: values.archiveSupplyPrice,
                archiveSalePrice: values.archiveSalePrice,
                promoSupplyPrice: values.promoSupplyPrice,
                promoSalePrice: values.promoSalePrice,
                brand: "福临门",
                category: values.category,
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
            保存产品
          </Button>
        </div>
      }
    >
      <form className="grid gap-4">
        <FormField label="桥表商品搜索">
          <div className="space-y-3">
            <input
              className="field-input"
              placeholder="例如：浓香 / 浓香花生 / 花生油 5L / 条码"
              value={bridgeKeyword}
              onChange={(event) => setBridgeKeyword(event.target.value)}
            />
            {bridgeKeyword.trim() ? (
              <div className="max-h-72 overflow-y-auto rounded-mono bg-surface-base shadow-ambient">
                {bridgeMatches.length ? (
                  <div className="divide-y divide-black/5">
                    {bridgeMatches.map((item) => (
                      <button
                        key={`${item.barcode}-${item.spec}`}
                        className="block w-full px-4 py-3 text-left transition hover:bg-surface-low"
                        type="button"
                        onClick={() => {
                          form.setValue("barcode", item.barcode, { shouldValidate: true, shouldDirty: true });
                          form.setValue("productName", item.productName, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                          form.setValue("category", item.category, { shouldDirty: true });
                          setBridgeKeyword(`${item.productName} ${item.spec}`.trim());
                        }}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-text">{item.productName}</span>
                          {item.spec ? (
                            <span className="rounded-mono bg-surface-low px-2 py-1 text-xs text-muted">
                              {item.spec}
                            </span>
                          ) : null}
                          <span className="text-xs text-primary">{item.category || "未归类"}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                          <span className="tabular">条码：{item.barcode}</span>
                          {item.shortName ? <span>简称：{item.shortName}</span> : null}
                          {item.level3Category ? <span>三级品类：{item.level3Category}</span> : null}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-muted">
                    在 O2O BI 桥里没有找到匹配商品，可以换个关键词再试。
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                从 O2O BI 桥匹配商品名称、规格、三级品类和条码，选中后自动带出条码与行销品类。
              </p>
            )}
          </div>
        </FormField>
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
          <FormField label="条码" error={form.formState.errors.barcode?.message}>
            <input className="field-input tabular" {...form.register("barcode")} />
          </FormField>
          <FormField label="商品编码" error={form.formState.errors.productCode?.message}>
            <input className="field-input tabular" {...form.register("productCode")} />
          </FormField>
        </div>
        <FormField label="商品名称" error={form.formState.errors.productName?.message}>
          <input className="field-input" {...form.register("productName")} />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="建档供价" error={form.formState.errors.archiveSupplyPrice?.message}>
            <input className="field-input tabular" type="number" step="0.01" {...form.register("archiveSupplyPrice")} />
          </FormField>
          <FormField label="建档售价" error={form.formState.errors.archiveSalePrice?.message}>
            <input className="field-input tabular" type="number" step="0.01" {...form.register("archiveSalePrice")} />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="促销供价" error={form.formState.errors.promoSupplyPrice?.message}>
            <input className="field-input tabular" type="number" step="0.01" {...form.register("promoSupplyPrice")} />
          </FormField>
          <FormField label="促销售价" error={form.formState.errors.promoSalePrice?.message}>
            <input className="field-input tabular" type="number" step="0.01" {...form.register("promoSalePrice")} />
          </FormField>
        </div>
        <FormField label="行销品类">
          <select className="field-input" {...form.register("category")}>
            <option value="">请选择行销品类</option>
            {marketingCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </FormField>
      </form>
    </Drawer>
  );
}

function isSubsequence(query: string, target: string) {
  let pointer = 0;
  for (const char of target) {
    if (char === query[pointer]) {
      pointer += 1;
      if (pointer >= query.length) return true;
    }
  }
  return false;
}
