export type Role = "viewer" | "editor" | "admin";
export type PermissionLevel = "view" | "edit";
export type TrendDirection = "up" | "down" | "flat";
export type TimeGranularity = "month" | "quarter" | "year" | "custom";
export type AsyncStatus = "idle" | "loading" | "error" | "ready";

export interface SystemItem {
  id: string;
  label: string;
  editable: boolean;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  account: string;
  email: string;
  name: string;
  role: Role;
  viewSystemIds: string[];
  editSystemIds: string[];
  status: "active" | "invited";
  updatedAt: string;
}

export interface ProductRecord {
  id: string;
  systemId: string;
  barcode: string;
  productCode: string;
  productName: string;
  archiveSupplyPrice: number;
  archiveSalePrice: number;
  promoSupplyPrice: number;
  promoSalePrice: number;
  category?: string;
  brand?: string;
  updatedAt: string;
}

export interface StoreRecord {
  id: string;
  systemId: string;
  storeCode: string;
  storeName: string;
  city: string;
  region: string;
  format: string;
  businessStatus: "营业" | "已闭店" | "计划闭店" | "计划开业" | "店改";
  plannedCloseDate?: string;
  plannedOpenDate?: string;
  renovationOpenDate?: string;
  salesVolume: number;
  updatedAt: string;
}

export interface SalesPeriodRecord {
  id: string;
  systemId: string;
  brand: string;
  periodLabel: string;
  granularity: TimeGranularity;
  values: Record<string, number>;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface PriceGuideRecord {
  id: string;
  systemId: string;
  sourceFileName: string;
  importedAt: string;
  sheetName: string;
  executionPeriod?: string;
  category?: string;
  publishDate?: string;
  mailTitle?: string;
  materialCode: string;
  subCategory?: string;
  productCategory?: string;
  productName: string;
  spec?: string;
  cartonSize?: string;
  scope?: string;
  policyNote?: string;
  distributorSettlementPrice?: number;
  keyAccountPromoSupplyPrice?: number;
}

export interface ChangeLogEntry {
  id: string;
  entity: "product" | "store" | "sales" | "user" | "system" | "price-guide";
  action: "create" | "update" | "delete" | "import" | "save-version";
  title: string;
  description: string;
  systemId?: string;
  operator: string;
  timestamp: string;
}

export interface DashboardAlert {
  id: string;
  title: string;
  description: string;
  level: "critical" | "warning" | "info";
  systemId?: string;
}

export interface StatCardItem {
  id: string;
  label: string;
  value: string;
  helper: string;
  trend: TrendDirection;
}

export interface ColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
}

export interface AppStateShape {
  systems: SystemItem[];
  selectedSystemId: string;
  users: UserAccount[];
  products: ProductRecord[];
  stores: StoreRecord[];
  sales: SalesPeriodRecord[];
  priceGuides: PriceGuideRecord[];
  changeLogs: ChangeLogEntry[];
  alerts: DashboardAlert[];
  authUser: UserAccount | null;
}
