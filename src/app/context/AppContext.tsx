import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { appConfig, getAuthMode, isSupabaseConfigured } from "../config/env";
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
  clearSavedSession,
  fetchCurrentUserProfile,
  getSavedSession,
  loadCloudWorkspace,
  manageUserAccount,
  persistChangeLog,
  persistPriceGuides,
  persistProduct,
  persistSalesRecord,
  persistStore,
  persistSystem,
  removeProduct,
  saveSession,
  signInWithPassword,
  SupabaseSession,
} from "../services/cloud";
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
  refreshCloudData: () => Promise<void>;
  addSystem: (label: string) => void;
  upsertProduct: (record: ProductRecord) => void;
  deleteProduct: (id: string) => void;
  upsertStore: (record: StoreRecord) => void;
  upsertUser: (
    record: UserAccount,
    options?: { password?: string; isNew?: boolean },
  ) => Promise<{ ok: boolean; message?: string }>;
  saveSalesRecord: (record: SalesPeriodRecord, operator: string) => void;
  importPriceGuides: (records: PriceGuideRecord[], sourceFileName: string, systemId: string) => void;
  appendChangeLog: (entry: Omit<ChangeLogEntry, "id" | "timestamp">) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function createEmptyBusinessState() {
  return {
    products: appConfig.enableDemoData ? mockProducts : [],
    stores: appConfig.enableDemoData ? mockStores : [],
    sales: appConfig.enableDemoData ? mockSales : [],
    priceGuides: appConfig.enableDemoData ? mockPriceGuides : [],
    changeLogs: appConfig.enableDemoData ? mockChangeLogs : [],
    alerts: appConfig.enableDemoData ? mockAlerts : [],
  };
}

export function AppProvider({ children }: PropsWithChildren) {
  const authMode = getAuthMode();
  const initialBusinessState = createEmptyBusinessState();
  const [systems, setSystems] = useState<SystemItem[]>(baseSystems);
  const [selectedSystemId, setSelectedSystemId] = useState("all");
  const [users, setUsers] = useState<UserAccount[]>(appConfig.allowDemoLogin ? mockUsers : []);
  const [products, setProducts] = useState<ProductRecord[]>(initialBusinessState.products);
  const [stores, setStores] = useState<StoreRecord[]>(initialBusinessState.stores);
  const [sales, setSales] = useState<SalesPeriodRecord[]>(initialBusinessState.sales);
  const [priceGuides, setPriceGuides] = useState<PriceGuideRecord[]>(initialBusinessState.priceGuides);
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>(initialBusinessState.changeLogs);
  const [alerts, setAlerts] = useState(initialBusinessState.alerts);
  const [authUser, setAuthUser] = useState<UserAccount | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<AppStateShape["bootstrapStatus"]>(
    isSupabaseConfigured() ? "loading" : "idle",
  );
  const [bootstrapMessage, setBootstrapMessage] = useState<string | undefined>(
    authMode === "setup" ? "当前站点已关闭演示数据，请先配置 Supabase 才能登录和查看业务数据。" : undefined,
  );
  const [session, setSession] = useState<SupabaseSession | null>(null);

  useEffect(() => {
    const visibleSystems = getVisibleSystems(authUser, systems);
    const hasAccess = visibleSystems.some((item) => item.id === selectedSystemId);

    if (!hasAccess) {
      setSelectedSystemId(visibleSystems[0]?.id ?? "all");
    }
  }, [authUser, selectedSystemId, systems]);

  async function refreshCloudData(currentSession = session) {
    if (!currentSession || !isSupabaseConfigured()) return;

    setBootstrapStatus("loading");
    setBootstrapMessage(undefined);

    try {
      const workspace = await loadCloudWorkspace(currentSession.access_token);
      setSystems(workspace.systems.length ? workspace.systems : baseSystems);
      setUsers(workspace.users);
      setProducts(workspace.products);
      setStores(workspace.stores);
      setSales(workspace.sales);
      setPriceGuides(workspace.priceGuides);
      setChangeLogs(workspace.changeLogs);
      setAlerts(workspace.alerts);
      setBootstrapStatus("ready");
    } catch (error) {
      setBootstrapStatus("error");
      setBootstrapMessage(error instanceof Error ? error.message : "云端数据加载失败");
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const cached = getSavedSession();
    if (!cached) {
      setBootstrapStatus("idle");
      return;
    }
    const restoredSession: SupabaseSession = cached;

    let cancelled = false;

    async function restore() {
      try {
        const profile = await fetchCurrentUserProfile(restoredSession.access_token, restoredSession.user.id);
        if (cancelled) return;
        setSession(restoredSession);
        setAuthUser(profile);
        await refreshCloudData(restoredSession);
      } catch (error) {
        if (cancelled) return;
        clearSavedSession();
        setSession(null);
        setAuthUser(null);
        setBootstrapStatus("error");
        setBootstrapMessage(error instanceof Error ? error.message : "登录状态恢复失败");
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);

  function appendChangeLog(entry: Omit<ChangeLogEntry, "id" | "timestamp">) {
    const record: ChangeLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: nowLabel(),
    };

    setChangeLogs((current) => [record, ...current]);

    if (session) {
      void persistChangeLog(record, session.access_token).catch((error) => {
        setBootstrapMessage(error instanceof Error ? error.message : "变更日志写入失败");
      });
    }
  }

  async function login(identity: string, password: string) {
    if (isSupabaseConfigured()) {
      try {
        const nextSession = await signInWithPassword(identity.trim(), password);
        const profile = await fetchCurrentUserProfile(nextSession.access_token, nextSession.user.id);
        saveSession(nextSession);
        setSession(nextSession);
        setAuthUser(profile);

        if (profile.role !== "admin" && profile.viewSystemIds[0]) {
          setSelectedSystemId(profile.viewSystemIds[0]);
        }

        await refreshCloudData(nextSession);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          message: error instanceof Error ? error.message : "登录失败，请检查邮箱、密码和 Supabase 配置",
        };
      }
    }

    if (authMode === "setup") {
      return { ok: false, message: "当前网站未完成云端配置，已关闭演示账号。" };
    }

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
    clearSavedSession();
    setSession(null);
    setAuthUser(null);
    setSelectedSystemId("all");

    if (isSupabaseConfigured()) {
      const emptyState = createEmptyBusinessState();
      setUsers([]);
      setProducts(emptyState.products);
      setStores(emptyState.stores);
      setSales(emptyState.sales);
      setPriceGuides(emptyState.priceGuides);
      setChangeLogs(emptyState.changeLogs);
      setAlerts(emptyState.alerts);
      setSystems(baseSystems);
    }
  }

  function addSystem(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;

    const record: SystemItem = {
      id: `sys-${Date.now()}`,
      label: trimmed,
      editable: true,
      createdAt: nowLabel(),
    };

    setSystems((current) => [...current, record]);
    if (session) {
      void persistSystem(record, session.access_token).catch((error) => {
        setBootstrapMessage(error instanceof Error ? error.message : "系统写入失败");
      });
    }

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
    if (session) {
      void persistProduct(record, session.access_token).catch((error) => {
        setBootstrapMessage(error instanceof Error ? error.message : "商品保存失败");
      });
    }

    appendChangeLog({
      entity: "product",
      action: exists ? "update" : "create",
      title: exists ? "更新商品信息" : "新增商品",
      description: `${record.productName} 已保存`,
      systemId: record.systemId,
      operator: authUser?.name ?? "系统",
    });
  }

  function deleteProduct(id: string) {
    const target = products.find((item) => item.id === id);
    if (!target) return;

    setProducts((current) => current.filter((item) => item.id !== id));
    if (session) {
      void removeProduct(id, session.access_token).catch((error) => {
        setBootstrapMessage(error instanceof Error ? error.message : "商品删除失败");
      });
    }

    appendChangeLog({
      entity: "product",
      action: "delete",
      title: "删除商品",
      description: `${target.productName} 已删除`,
      systemId: target.systemId,
      operator: authUser?.name ?? "系统",
    });
  }

  function upsertStore(record: StoreRecord) {
    const exists = stores.some((item) => item.id === record.id);
    setStores((current) => (exists ? current.map((item) => (item.id === record.id ? record : item)) : [record, ...current]));
    if (session) {
      void persistStore(record, session.access_token).catch((error) => {
        setBootstrapMessage(error instanceof Error ? error.message : "门店保存失败");
      });
    }

    appendChangeLog({
      entity: "store",
      action: exists ? "update" : "create",
      title: exists ? "更新门店信息" : "新增门店",
      description: `${record.storeName} 已保存`,
      systemId: record.systemId,
      operator: authUser?.name ?? "系统",
    });
  }

  async function upsertUser(record: UserAccount, options?: { password?: string; isNew?: boolean }) {
    const exists = users.some((item) => item.id === record.id);
    if (session) {
      try {
        await manageUserAccount(
          {
            userId: options?.isNew ? undefined : record.id,
            account: record.account,
            name: record.name,
            role: record.role,
            viewSystemIds: record.viewSystemIds,
            editSystemIds: record.editSystemIds,
            password: options?.password,
          },
          session.access_token,
        );

        await refreshCloudData(session);
      } catch (error) {
        const message = error instanceof Error ? error.message : "账号保存失败";
        setBootstrapMessage(message);
        return { ok: false, message };
      }
    } else {
      setUsers((current) =>
        exists ? current.map((item) => (item.id === record.id ? record : item)) : [record, ...current],
      );
    }

    appendChangeLog({
      entity: "user",
      action: exists ? "update" : "create",
      title: exists ? "更新账号权限" : "新增账号",
      description: `${record.name} (${record.role}) 权限已保存`,
      operator: authUser?.name ?? "系统",
    });

    return { ok: true };
  }

  function saveSalesRecord(record: SalesPeriodRecord, operator: string) {
    setSales((current) => current.map((item) => (item.id === record.id ? record : item)));
    if (session) {
      void persistSalesRecord(record, session.access_token).catch((error) => {
        setBootstrapMessage(error instanceof Error ? error.message : "销售数据保存失败");
      });
    }

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

    if (session) {
      void persistPriceGuides(records, session.access_token).catch((error) => {
        setBootstrapMessage(error instanceof Error ? error.message : "价格指引导入失败");
      });
    }

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
      authMode,
      bootstrapStatus,
      bootstrapMessage,
      setSelectedSystemId,
      login,
      logout,
      refreshCloudData,
      addSystem,
      upsertProduct,
      deleteProduct,
      upsertStore,
      upsertUser,
      saveSalesRecord,
      importPriceGuides,
      appendChangeLog,
    }),
    [
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
      authMode,
      bootstrapStatus,
      bootstrapMessage,
      session,
    ],
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
