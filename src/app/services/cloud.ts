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
import { appConfig, isSupabaseConfigured } from "../config/env";

const SESSION_STORAGE_KEY = "distribution-details.supabase-session";

interface SupabaseUser {
  id: string;
  email?: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user: SupabaseUser;
}

interface ProfileRow {
  id: string;
  account?: string | null;
  email?: string | null;
  display_name?: string | null;
  role?: string | null;
  view_system_ids?: string[] | null;
  edit_system_ids?: string[] | null;
  status?: string | null;
  updated_at?: string | null;
}

interface SystemRow {
  id: string;
  label: string;
  editable?: boolean | null;
  created_at?: string | null;
}

interface ProductRow {
  id: string;
  system_id: string;
  barcode?: string | null;
  product_code?: string | null;
  product_name: string;
  archive_supply_price?: number | null;
  archive_sale_price?: number | null;
  promo_supply_price?: number | null;
  promo_sale_price?: number | null;
  category?: string | null;
  brand?: string | null;
  updated_at?: string | null;
}

interface StoreRow {
  id: string;
  system_id: string;
  store_code?: string | null;
  store_name: string;
  city?: string | null;
  region?: string | null;
  format?: string | null;
  business_status?: string | null;
  planned_close_date?: string | null;
  planned_open_date?: string | null;
  renovation_open_date?: string | null;
  sales_volume?: number | null;
  updated_at?: string | null;
}

interface SalesRow {
  id: string;
  system_id: string;
  brand: string;
  period_label: string;
  granularity: SalesPeriodRecord["granularity"];
  values_json?: Record<string, number> | null;
  version?: number | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

interface PriceGuideRow {
  id: string;
  system_id: string;
  source_file_name?: string | null;
  imported_at?: string | null;
  sheet_name?: string | null;
  execution_period?: string | null;
  category?: string | null;
  publish_date?: string | null;
  mail_title?: string | null;
  material_code?: string | null;
  sub_category?: string | null;
  product_category?: string | null;
  product_name: string;
  spec?: string | null;
  carton_size?: string | null;
  scope?: string | null;
  policy_note?: string | null;
  distributor_settlement_price?: number | null;
  key_account_promo_supply_price?: number | null;
}

interface ChangeLogRow {
  id: string;
  entity: ChangeLogEntry["entity"];
  action: ChangeLogEntry["action"];
  title: string;
  description: string;
  system_id?: string | null;
  operator: string;
  timestamp?: string | null;
}

interface AlertRow {
  id: string;
  title: string;
  description: string;
  level: DashboardAlert["level"];
  system_id?: string | null;
}

export interface CloudWorkspace {
  systems: SystemItem[];
  users: UserAccount[];
  products: ProductRecord[];
  stores: StoreRecord[];
  sales: SalesPeriodRecord[];
  priceGuides: PriceGuideRecord[];
  changeLogs: ChangeLogEntry[];
  alerts: DashboardAlert[];
}

export interface ManagedUserPayload {
  userId?: string;
  account: string;
  name: string;
  role: UserAccount["role"];
  viewSystemIds: string[];
  editSystemIds: string[];
  password?: string;
}

function nowIso() {
  return new Date().toISOString();
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function buildInternalLoginEmail(account: string) {
  const normalized = account.trim();
  if (!normalized) {
    throw new Error("账号不能为空");
  }

  return `acct-${toHex(new TextEncoder().encode(normalized.toLowerCase()))}@scka-login.invalid`;
}

function createHeaders(accessToken?: string, extra?: Record<string, string>) {
  const headers: Record<string, string> = {
    apikey: appConfig.supabaseAnonKey,
    "Content-Type": "application/json",
    ...extra,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function readJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchSupabase(path: string, init?: RequestInit, accessToken?: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase 未配置");
  }

  const response = await fetch(`${appConfig.supabaseUrl}${path}`, {
    ...init,
    headers: createHeaders(accessToken, init?.headers as Record<string, string> | undefined),
  });

  if (!response.ok) {
    const payload = await readJsonSafe(response);
    const message =
      typeof payload === "object" && payload && "msg" in payload
        ? String((payload as { msg: string }).msg)
        : typeof payload === "object" && payload && "message" in payload
          ? String((payload as { message: string }).message)
          : `请求失败 (${response.status})`;
    throw new Error(message);
  }

  return readJsonSafe(response);
}

function mapProfileRow(row: ProfileRow): UserAccount {
  const email = row.email ?? "";
  return {
    id: row.id,
    account: row.account ?? email.split("@")[0] ?? row.id,
    email,
    name: row.display_name ?? email.split("@")[0] ?? "未命名账号",
    role: row.role === "admin" || row.role === "editor" ? row.role : "viewer",
    viewSystemIds: row.view_system_ids ?? [],
    editSystemIds: row.edit_system_ids ?? [],
    status: row.status === "invited" ? "invited" : "active",
    updatedAt: row.updated_at ?? nowIso(),
  };
}

function mapSystemRow(row: SystemRow): SystemItem {
  return {
    id: row.id,
    label: row.label,
    editable: Boolean(row.editable ?? true),
    createdAt: row.created_at ?? nowIso(),
  };
}

function mapProductRow(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    systemId: row.system_id,
    barcode: row.barcode ?? "",
    productCode: row.product_code ?? "",
    productName: row.product_name,
    archiveSupplyPrice: Number(row.archive_supply_price ?? 0),
    archiveSalePrice: Number(row.archive_sale_price ?? 0),
    promoSupplyPrice: Number(row.promo_supply_price ?? 0),
    promoSalePrice: Number(row.promo_sale_price ?? 0),
    category: row.category ?? undefined,
    brand: row.brand ?? undefined,
    updatedAt: row.updated_at ?? nowIso(),
  };
}

function mapStoreRow(row: StoreRow): StoreRecord {
  const businessStatus = row.business_status;
  return {
    id: row.id,
    systemId: row.system_id,
    storeCode: row.store_code ?? "",
    storeName: row.store_name,
    city: row.city ?? "",
    region: row.region ?? "",
    format: row.format ?? "",
    businessStatus:
      businessStatus === "营业" ||
      businessStatus === "已闭店" ||
      businessStatus === "计划闭店" ||
      businessStatus === "计划开业" ||
      businessStatus === "店改"
        ? businessStatus
        : "营业",
    plannedCloseDate: row.planned_close_date ?? undefined,
    plannedOpenDate: row.planned_open_date ?? undefined,
    renovationOpenDate: row.renovation_open_date ?? undefined,
    salesVolume: Number(row.sales_volume ?? 0),
    updatedAt: row.updated_at ?? nowIso(),
  };
}

function mapSalesRow(row: SalesRow): SalesPeriodRecord {
  return {
    id: row.id,
    systemId: row.system_id,
    brand: row.brand,
    periodLabel: row.period_label,
    granularity: row.granularity,
    values: row.values_json ?? {},
    version: Number(row.version ?? 1),
    updatedAt: row.updated_at ?? nowIso(),
    updatedBy: row.updated_by ?? "系统",
  };
}

function mapPriceGuideRow(row: PriceGuideRow): PriceGuideRecord {
  return {
    id: row.id,
    systemId: row.system_id,
    sourceFileName: row.source_file_name ?? "",
    importedAt: row.imported_at ?? nowIso(),
    sheetName: row.sheet_name ?? "",
    executionPeriod: row.execution_period ?? undefined,
    category: row.category ?? undefined,
    publishDate: row.publish_date ?? undefined,
    mailTitle: row.mail_title ?? undefined,
    materialCode: row.material_code ?? "",
    subCategory: row.sub_category ?? undefined,
    productCategory: row.product_category ?? undefined,
    productName: row.product_name,
    spec: row.spec ?? undefined,
    cartonSize: row.carton_size ?? undefined,
    scope: row.scope ?? undefined,
    policyNote: row.policy_note ?? undefined,
    distributorSettlementPrice: row.distributor_settlement_price ?? undefined,
    keyAccountPromoSupplyPrice: row.key_account_promo_supply_price ?? undefined,
  };
}

function mapChangeLogRow(row: ChangeLogRow): ChangeLogEntry {
  return {
    id: row.id,
    entity: row.entity,
    action: row.action,
    title: row.title,
    description: row.description,
    systemId: row.system_id ?? undefined,
    operator: row.operator,
    timestamp: row.timestamp ?? nowIso(),
  };
}

function mapAlertRow(row: AlertRow): DashboardAlert {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    level: row.level,
    systemId: row.system_id ?? undefined,
  };
}

function toSystemRow(record: SystemItem): SystemRow {
  return {
    id: record.id,
    label: record.label,
    editable: record.editable,
    created_at: record.createdAt,
  };
}

function toProductRow(record: ProductRecord): ProductRow {
  return {
    id: record.id,
    system_id: record.systemId,
    barcode: record.barcode,
    product_code: record.productCode,
    product_name: record.productName,
    archive_supply_price: record.archiveSupplyPrice,
    archive_sale_price: record.archiveSalePrice,
    promo_supply_price: record.promoSupplyPrice,
    promo_sale_price: record.promoSalePrice,
    category: record.category ?? null,
    brand: record.brand ?? null,
    updated_at: record.updatedAt,
  };
}

function toStoreRow(record: StoreRecord): StoreRow {
  return {
    id: record.id,
    system_id: record.systemId,
    store_code: record.storeCode,
    store_name: record.storeName,
    city: record.city,
    region: record.region,
    format: record.format,
    business_status: record.businessStatus,
    planned_close_date: record.plannedCloseDate ?? null,
    planned_open_date: record.plannedOpenDate ?? null,
    renovation_open_date: record.renovationOpenDate ?? null,
    sales_volume: record.salesVolume,
    updated_at: record.updatedAt,
  };
}

function toSalesRow(record: SalesPeriodRecord): SalesRow {
  return {
    id: record.id,
    system_id: record.systemId,
    brand: record.brand,
    period_label: record.periodLabel,
    granularity: record.granularity,
    values_json: record.values,
    version: record.version,
    updated_at: record.updatedAt,
    updated_by: record.updatedBy,
  };
}

function toPriceGuideRow(record: PriceGuideRecord): PriceGuideRow {
  return {
    id: record.id,
    system_id: record.systemId,
    source_file_name: record.sourceFileName,
    imported_at: record.importedAt,
    sheet_name: record.sheetName,
    execution_period: record.executionPeriod ?? null,
    category: record.category ?? null,
    publish_date: record.publishDate ?? null,
    mail_title: record.mailTitle ?? null,
    material_code: record.materialCode,
    sub_category: record.subCategory ?? null,
    product_category: record.productCategory ?? null,
    product_name: record.productName,
    spec: record.spec ?? null,
    carton_size: record.cartonSize ?? null,
    scope: record.scope ?? null,
    policy_note: record.policyNote ?? null,
    distributor_settlement_price: record.distributorSettlementPrice ?? null,
    key_account_promo_supply_price: record.keyAccountPromoSupplyPrice ?? null,
  };
}

function toChangeLogRow(record: ChangeLogEntry): ChangeLogRow {
  return {
    id: record.id,
    entity: record.entity,
    action: record.action,
    title: record.title,
    description: record.description,
    system_id: record.systemId ?? null,
    operator: record.operator,
    timestamp: record.timestamp,
  };
}

async function fetchTable<T>(table: string, accessToken: string): Promise<T[]> {
  const payload = await fetchSupabase(`/rest/v1/${table}?select=*`, { method: "GET" }, accessToken);
  return Array.isArray(payload) ? (payload as T[]) : [];
}

async function upsertTable<T>(table: string, rows: T[], accessToken: string) {
  await fetchSupabase(
    `/rest/v1/${table}?on_conflict=id`,
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    },
    accessToken,
  );
}

async function deleteTableRow(table: string, id: string, accessToken: string) {
  await fetchSupabase(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" }, accessToken);
}

export function saveSession(session: SupabaseSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getSavedSession() {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SupabaseSession;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearSavedSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function signInWithPassword(email: string, password: string) {
  const identity = email.includes("@") ? email.trim() : buildInternalLoginEmail(email);
  const payload = (await fetchSupabase(
    "/auth/v1/token?grant_type=password",
    {
      method: "POST",
      body: JSON.stringify({ email: identity, password }),
    },
  )) as SupabaseSession;

  saveSession(payload);
  return payload;
}

export async function fetchCurrentUserProfile(accessToken: string, userId: string) {
  const payload = await fetchSupabase(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*`,
    { method: "GET" },
    accessToken,
  );
  const row = Array.isArray(payload) ? (payload[0] as ProfileRow | undefined) : undefined;
  if (!row) {
    throw new Error("当前账号未配置资料档案，请先在 Supabase profiles 表中补充账号信息");
  }
  return mapProfileRow(row);
}

export async function loadCloudWorkspace(accessToken: string): Promise<CloudWorkspace> {
  const [systems, users, products, stores, sales, priceGuides, changeLogs, alerts] = await Promise.all([
    fetchTable<SystemRow>("systems", accessToken),
    fetchTable<ProfileRow>("profiles", accessToken),
    fetchTable<ProductRow>("products", accessToken),
    fetchTable<StoreRow>("stores", accessToken),
    fetchTable<SalesRow>("sales_records", accessToken),
    fetchTable<PriceGuideRow>("price_guides", accessToken),
    fetchTable<ChangeLogRow>("change_logs", accessToken),
    fetchTable<AlertRow>("alerts", accessToken),
  ]);

  return {
    systems: [{ id: "all", label: "全部", editable: true, createdAt: nowIso() }, ...systems.map(mapSystemRow)],
    users: users.map(mapProfileRow),
    products: products.map(mapProductRow),
    stores: stores.map(mapStoreRow),
    sales: sales.map(mapSalesRow),
    priceGuides: priceGuides.map(mapPriceGuideRow),
    changeLogs: changeLogs.map(mapChangeLogRow),
    alerts: alerts.map(mapAlertRow),
  };
}

export async function persistSystem(record: SystemItem, accessToken: string) {
  await upsertTable("systems", [toSystemRow(record)], accessToken);
}

export async function persistProduct(record: ProductRecord, accessToken: string) {
  await upsertTable("products", [toProductRow(record)], accessToken);
}

export async function removeProduct(id: string, accessToken: string) {
  await deleteTableRow("products", id, accessToken);
}

export async function persistStore(record: StoreRecord, accessToken: string) {
  await upsertTable("stores", [toStoreRow(record)], accessToken);
}

export async function persistSalesRecord(record: SalesPeriodRecord, accessToken: string) {
  await upsertTable("sales_records", [toSalesRow(record)], accessToken);
}

export async function persistPriceGuides(records: PriceGuideRecord[], accessToken: string) {
  await upsertTable("price_guides", records.map(toPriceGuideRow), accessToken);
}

export async function persistChangeLog(record: ChangeLogEntry, accessToken: string) {
  await upsertTable("change_logs", [toChangeLogRow(record)], accessToken);
}

export async function manageUserAccount(payload: ManagedUserPayload, accessToken: string) {
  const response = await fetch(`${appConfig.supabaseUrl}/functions/v1/admin-create-user`, {
    method: "POST",
    headers: createHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = await readJsonSafe(response);
    const message =
      typeof result === "object" && result && "error" in result
        ? String((result as { error: string }).error)
        : `账号保存失败 (${response.status})`;
    throw new Error(message);
  }

  return readJsonSafe(response);
}
