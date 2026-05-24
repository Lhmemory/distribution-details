import { SystemCooperationStatus, SystemItem } from "../types";

export const SYSTEM_TYPE_OPTIONS = ["客户/渠道系统", "NKA系统", "LKA系统", "O2O平台", "会员店", "其他"] as const;

export const SYSTEM_STATUS_OPTIONS: SystemCooperationStatus[] = [
  "合作中",
  "待开发",
  "暂停合作",
  "已终止",
  "资料待补",
];

const COMPLETENESS_FIELDS: Array<keyof Pick<
  SystemItem,
  | "label"
  | "systemType"
  | "region"
  | "cooperationStatus"
  | "businessScope"
  | "keyCategories"
  | "settlementNotes"
  | "updatedAt"
  | "nextReviewDate"
>> = [
  "label",
  "systemType",
  "region",
  "cooperationStatus",
  "businessScope",
  "keyCategories",
  "settlementNotes",
  "updatedAt",
  "nextReviewDate",
];

export function normalizeSystemLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function calculateSystemCompleteness(record: SystemItem) {
  const filledCount = COMPLETENESS_FIELDS.filter((field) => {
    const value = record[field];
    return typeof value === "number" ? Number.isFinite(value) : Boolean(String(value ?? "").trim());
  }).length;

  return Math.round((filledCount / COMPLETENESS_FIELDS.length) * 100);
}

export function normalizeSystemRecord(record: SystemItem): SystemItem {
  const next: SystemItem = {
    ...record,
    label: record.label.trim(),
    systemType: record.systemType?.trim() || undefined,
    region: record.region?.trim() || undefined,
    cooperationStatus: record.cooperationStatus || "资料待补",
    businessScope: record.businessScope?.trim() || undefined,
    keyCategories: record.keyCategories?.trim() || undefined,
    settlementNotes: record.settlementNotes?.trim() || undefined,
    updatedAt: record.updatedAt?.trim() || undefined,
    nextReviewDate: record.nextReviewDate?.trim() || undefined,
    notes: record.notes?.trim() || undefined,
  };

  return {
    ...next,
    completeness: calculateSystemCompleteness(next),
  };
}
