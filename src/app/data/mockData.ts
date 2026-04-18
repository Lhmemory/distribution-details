import {
  ChangeLogEntry,
  DashboardAlert,
  PriceGuideRecord,
  ProductRecord,
  SalesPeriodRecord,
  StoreRecord,
  SystemItem,
  UserAccount,
} from "../types";
import importedProductsData from "./importedProducts.json";
import importedStoresData from "./importedStores.json";

export const baseSystems: SystemItem[] = [
  "全部",
  "大润发",
  "广东永辉",
  "广西永辉",
  "易初",
  "沃尔玛",
  "山姆",
  "天虹",
  "华润",
  "麦德龙",
].map((label, index) => ({
  id: index === 0 ? "all" : `sys-${index}`,
  label,
  editable: index === 0,
  createdAt: "2026-04-17 09:00",
}));

export const mockUsers: UserAccount[] = [
  {
    id: "user-admin",
    account: "liuliheng",
    email: "liuliheng1993@gmail.com",
    name: "刘立恒",
    role: "admin",
    viewSystemIds: baseSystems.filter((item) => item.id !== "all").map((item) => item.id),
    editSystemIds: baseSystems.filter((item) => item.id !== "all").map((item) => item.id),
    status: "active",
    updatedAt: "2026-04-17 10:00",
  },
  {
    id: "user-editor",
    account: "editor.th",
    email: "editor.th@example.com",
    name: "天虹编辑",
    role: "editor",
    viewSystemIds: ["sys-7"],
    editSystemIds: ["sys-7"],
    status: "active",
    updatedAt: "2026-04-16 18:20",
  },
  {
    id: "user-viewer",
    account: "viewer.cr",
    email: "viewer.cr@example.com",
    name: "华润查看",
    role: "viewer",
    viewSystemIds: ["sys-8"],
    editSystemIds: [],
    status: "active",
    updatedAt: "2026-04-16 09:12",
  },
];

export const mockProducts: ProductRecord[] = importedProductsData as ProductRecord[];

export const mockStores: StoreRecord[] = importedStoresData as StoreRecord[];

export const mockSales: SalesPeriodRecord[] = [
  {
    id: "sales-rtm-2026-q1",
    systemId: "sys-1",
    brand: "福临门",
    periodLabel: "2026 Q1",
    granularity: "quarter",
    values: { "1月": 142500, "2月": 138200, "3月": 156900, 合计: 437600 },
    version: 3,
    updatedAt: "2026-04-17 08:20",
    updatedBy: "刘立恒",
  },
  {
    id: "sales-th-2026-q1",
    systemId: "sys-7",
    brand: "福临门",
    periodLabel: "2026 Q1",
    granularity: "quarter",
    values: { "1月": 98400, "2月": 102200, "3月": 108500, 合计: 309100 },
    version: 2,
    updatedAt: "2026-04-16 17:40",
    updatedBy: "天虹编辑",
  },
  {
    id: "sales-cr-2026-year",
    systemId: "sys-8",
    brand: "福临门",
    periodLabel: "2026 年度",
    granularity: "year",
    values: { "2026": 1250000, 预算: 1320000, 达成率: 94.7 },
    version: 1,
    updatedAt: "2026-04-15 09:10",
    updatedBy: "刘立恒",
  },
];

export const mockPriceGuides: PriceGuideRecord[] = [];

export const mockChangeLogs: ChangeLogEntry[] = [
  {
    id: "log-001",
    entity: "sales",
    action: "save-version",
    title: "销售版本已保存",
    description: "大润发 2026 Q1 销售数据提交版本 3",
    systemId: "sys-1",
    operator: "刘立恒",
    timestamp: "2026-04-17 08:20",
  },
  {
    id: "log-002",
    entity: "product",
    action: "update",
    title: "产品价格更新",
    description: "天虹系统更新商品建档售价",
    systemId: "sys-7",
    operator: "天虹编辑",
    timestamp: "2026-04-16 14:22",
  },
  {
    id: "log-003",
    entity: "user",
    action: "create",
    title: "新增账号",
    description: "创建 viewer 账号并分配华润查看权限",
    operator: "刘立恒",
    timestamp: "2026-04-15 10:05",
  },
  {
    id: "log-004",
    entity: "store",
    action: "update",
    title: "门店状态变更",
    description: "华润佛山南海店状态更新为筹备",
    systemId: "sys-8",
    operator: "刘立恒",
    timestamp: "2026-04-14 10:30",
  },
];

export const mockAlerts: DashboardAlert[] = [
  {
    id: "alert-001",
    title: "数据异常提醒",
    description: "沃尔玛系统 17 个商品缺少商品编码，请尽快补齐。",
    level: "critical",
    systemId: "sys-5",
  },
  {
    id: "alert-002",
    title: "销量波动提醒",
    description: "天虹系统 3 月销量较 2 月上升 18%，建议复核促销归因。",
    level: "warning",
    systemId: "sys-7",
  },
  {
    id: "alert-003",
    title: "版本未提交",
    description: "麦德龙 2026 Q1 销售维护存在 4 条未保存编辑。",
    level: "info",
    systemId: "sys-8",
  },
];
