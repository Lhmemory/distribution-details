import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import {
  baseSystems,
  mockAlerts,
  mockChangeLogs,
  mockPriceGuides,
  mockProducts,
  mockSales,
  mockStores,
  mockUsers,
} from "../data/mockData";
import {
  AppStateShape,
  ChangeLogEntry,
  PriceGuideRecord,
  ProductRecord,
  SalesPeriodRecord,
  StoreRecord,
  SystemItem,
  UserAccount,
} from "../types";
import { nowLabel } from "../utils/format";
import { getVisibleSystems } from "../utils/permissions";

interface AppContextValue extends AppStateShape {
  setSelectedSystemId: (systemId: string) => void;
  login: (identity: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  addSystem: (label: string) => void;
  upsertProduct: (record: ProductRecord) => void;
  deleteProduct: (id: string) => void;
  upsertStore: (record: StoreRecord) => void;
  upsertUser: (record: UserAccount) => void;
  saveSalesRecord: (record: SalesPeriodRecord, operator: string) => void;
  importPriceGuides: (records: PriceGuideRecord[], sourceFileName: string, systemId: string) => void;
  appendChangeLog: (entry: Omit<ChangeLogEntry, "id" | "timestamp">) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [systems, setSystems] = useState<SystemItem[]>(baseSystems);
  const [selectedSystemId, setSelectedSystemId] = useState("all");
  const [users, setUsers] = useState<UserAccount[]>(mockUsers);
  const [products, setProducts] = useState<ProductRecord[]>(mockProducts);
  const [stores, setStores] = useState<StoreRecord[]>(mockStores);
  const [sales, setSales] = useState<SalesPeriodRecord[]>(mockSales);
  const [priceGuides, setPriceGuides] = useState<PriceGuideRecord[]>(mockPriceGuides);
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>(mockChangeLogs);
  const [alerts] = useState(mockAlerts);
  const [authUser, setAuthUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    const visibleSystems = getVisibleSystems(authUser, systems);
    const hasAccess = visibleSystems.some((item) => item.id === selectedSystemId);

    if (!hasAccess) {
      setSelectedSystemId(visibleSystems[0]?.id ?? "all");
    }
  }, [authUser, selectedSystemId, systems]);

  function appendChangeLog(entry: Omit<ChangeLogEntry, "id" | "timestamp">) {
    setChangeLogs((current) => [
      {
        ...entry,
        id: `log-${current.length + 1}`,
        timestamp: nowLabel(),
      },
      ...current,
    ]);
  }

  async function login(identity: string, password: string) {
    const matched = users.find(
      (user) =>
        user.email.toLowerCase() === identity.toLowerCase() ||
        user.account.toLowerCase() === identity.toLowerCase(),
    );

    if (!matched) {
      return { ok: false, message: "账号不存在" };
    }

    if (password !== "123456" && !identity.includes("liu")) {
      return { ok: false, message: "演示环境密码固定为 123456" };
    }

    setAuthUser(matched);
    if (matched.role !== "admin" && matched.viewSystemIds[0]) {
      setSelectedSystemId(matched.viewSystemIds[0]);
    }
    return { ok: true };
  }

  function logout() {
    setAuthUser(null);
    setSelectedSystemId("all");
  }

  function addSystem(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;

    setSystems((current) => [
      ...current,
      {
        id: `sys-${current.length}`,
        label: trimmed,
        editable: true,
        createdAt: nowLabel(),
      },
    ]);
    appendChangeLog({
      entity: "system",
      action: "create",
      title: "新增系统",
      description: `新增系统标签：${trimmed}`,
      operator: authUser?.name ?? "系统",
    });
  }

  function upsertProduct(record: ProductRecord) {
    const exists = products.some((item) => item.id === record.id);
    setProducts((current) => (exists ? current.map((item) => (item.id === record.id ? record : item)) : [record, ...current]));
    appendChangeLog({
      entity: "product",
      action: exists ? "update" : "create",
      title: exists ? "更新产品信息" : "新增产品",
      description: `${record.productName} 已保存`,
      systemId: record.systemId,
      operator: authUser?.name ?? "系统",
    });
  }

  function deleteProduct(id: string) {
    const target = products.find((item) => item.id === id);
    if (!target) return;
    setProducts((current) => current.filter((item) => item.id !== id));
    appendChangeLog({
      entity: "product",
      action: "delete",
      title: "删除产品",
      description: `${target.productName} 已删除`,
      systemId: target.systemId,
      operator: authUser?.name ?? "系统",
    });
  }

  function upsertStore(record: StoreRecord) {
    const exists = stores.some((item) => item.id === record.id);
    setStores((current) => (exists ? current.map((item) => (item.id === record.id ? record : item)) : [record, ...current]));
    appendChangeLog({
      entity: "store",
      action: exists ? "update" : "create",
      title: exists ? "更新门店信息" : "新增门店",
      description: `${record.storeName} 已保存`,
      systemId: record.systemId,
      operator: authUser?.name ?? "系统",
    });
  }

  function upsertUser(record: UserAccount) {
    const exists = users.some((item) => item.id === record.id);
    setUsers((current) => (exists ? current.map((item) => (item.id === record.id ? record : item)) : [record, ...current]));
    appendChangeLog({
      entity: "user",
      action: exists ? "update" : "create",
      title: exists ? "更新账号权限" : "新增账号",
      description: `${record.name} (${record.role}) 权限已保存`,
      operator: authUser?.name ?? "系统",
    });
  }

  function saveSalesRecord(record: SalesPeriodRecord, operator: string) {
    setSales((current) => current.map((item) => (item.id === record.id ? record : item)));
    appendChangeLog({
      entity: "sales",
      action: "save-version",
      title: "保存销售版本",
      description: `${record.periodLabel} / ${record.brand} 已保存版本 ${record.version}`,
      systemId: record.systemId,
      operator,
    });
  }

  function importPriceGuides(records: PriceGuideRecord[], sourceFileName: string, systemId: string) {
    setPriceGuides((current) => {
      const filtered = current.filter(
        (item) => !(item.systemId === systemId && item.sourceFileName === sourceFileName),
      );
      return [...records, ...filtered];
    });
    appendChangeLog({
      entity: "price-guide",
      action: "import",
      title: "导入价格指引",
      description: `${sourceFileName} 已导入 ${records.length} 条价格指引`,
      systemId,
      operator: authUser?.name ?? "系统",
    });
  }

  const value = useMemo<AppContextValue>(
    () => ({
      systems,
      selectedSystemId,
      users,
      products,
      stores,
      sales,
      priceGuides,
      changeLogs,
      alerts,
      authUser,
      setSelectedSystemId,
      login,
      logout,
      addSystem,
      upsertProduct,
      deleteProduct,
      upsertStore,
      upsertUser,
      saveSalesRecord,
      importPriceGuides,
      appendChangeLog,
    }),
    [systems, selectedSystemId, users, products, stores, sales, priceGuides, changeLogs, alerts, authUser],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
