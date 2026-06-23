import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const SYSTEMS = [
  { id: "sys-1", label: "大润发", editable: true },
  { id: "sys-2", label: "广东永辉", editable: true },
  { id: "sys-3", label: "广西永辉", editable: true },
  { id: "sys-4", label: "易初", editable: true },
  { id: "sys-5", label: "沃尔玛", editable: true },
  { id: "sys-6", label: "山姆", editable: true },
  { id: "sys-7", label: "天虹", editable: true },
  { id: "sys-8", label: "华润", editable: true },
  { id: "sys-9", label: "麦德龙", editable: true },
];

const SYSTEM_ID_BY_LABEL = new Map(SYSTEMS.map((item) => [item.label, item.id]));

function headers(extra = {}) {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function request(path, init = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: headers(init.headers),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${init.method ?? "GET"} ${path} failed (${response.status}): ${text}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(path), "utf8"));
}

async function upsertRows(table, rows) {
  if (!rows.length) return;

  const batchSize = 500;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    await request(`/rest/v1/${table}?on_conflict=id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(batch),
    });
  }

  console.log(`upserted ${rows.length} rows into ${table}`);
}

function toSystemRow(record) {
  return {
    id: record.id,
    label: record.label,
    editable: record.editable,
    created_at: record.created_at ?? new Date().toISOString(),
    cooperation_status: "资料待补",
    completeness_score: 0,
  };
}

function toProductRow(record) {
  return {
    id: record.id,
    system_id: record.systemId,
    barcode: record.barcode ?? "",
    product_code: record.productCode ?? "",
    product_name: record.productName,
    archive_supply_price: Number(record.archiveSupplyPrice ?? 0),
    archive_sale_price: Number(record.archiveSalePrice ?? 0),
    promo_supply_price: Number(record.promoSupplyPrice ?? 0),
    promo_sale_price: Number(record.promoSalePrice ?? 0),
    category: record.category ?? null,
    brand: record.brand ?? null,
    updated_at: record.updatedAt ?? new Date().toISOString(),
  };
}

function toStoreRow(record) {
  return {
    id: record.id,
    system_id: record.systemId,
    store_code: record.storeCode ?? "",
    store_name: record.storeName,
    city: record.city ?? "",
    region: record.region ?? "",
    format: record.format ?? "",
    business_status: record.businessStatus ?? "营业",
    planned_close_date: record.plannedCloseDate ?? null,
    planned_open_date: record.plannedOpenDate ?? null,
    renovation_open_date: record.renovationOpenDate ?? null,
    sales_volume: Number(record.salesVolume ?? 0),
    updated_at: record.updatedAt ?? new Date().toISOString(),
  };
}

function distributionRecordToProduct(record) {
  const systemId = SYSTEM_ID_BY_LABEL.get(record.system);
  if (!systemId || !record.productName) return null;

  return toProductRow({
    id: record.id,
    systemId,
    barcode: record.barcode,
    productName: record.productName,
    archiveSupplyPrice: record.archiveSupplyPrice,
    archiveSalePrice: record.archiveSalePrice,
    promoSupplyPrice: record.promoSupplyPrice,
    promoSalePrice: record.promoSalePrice,
    brand: "福临门",
    category: "分销资料",
    updatedAt: record.updatedAt,
  });
}

function buildInternalLoginEmail(account) {
  const bytes = new TextEncoder().encode(account.trim().toLowerCase());
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `acct-${hex}@scka-login.invalid`;
}

async function createInitialAdmin() {
  const account = process.env.SCKA_ADMIN_ACCOUNT?.trim();
  const password = process.env.SCKA_ADMIN_PASSWORD?.trim();
  const name = process.env.SCKA_ADMIN_NAME?.trim() || account;

  if (!account || !password) {
    console.log("skipped initial admin: SCKA_ADMIN_ACCOUNT or SCKA_ADMIN_PASSWORD is not set");
    return;
  }

  const email = buildInternalLoginEmail(account);
  let userId;

  try {
    const created = await request("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    userId = created?.id ?? created?.user?.id;
  } catch (error) {
    if (!String(error.message).includes("already")) throw error;
    const listed = await request(`/auth/v1/admin/users?per_page=1000`, { method: "GET" });
    userId = listed?.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id;
  }

  if (!userId) {
    throw new Error(`Failed to resolve admin user id for ${account}.`);
  }

  const systemIds = SYSTEMS.map((item) => item.id);
  await upsertRows("profiles", [
    {
      id: userId,
      account,
      email,
      display_name: name,
      role: "admin",
      view_system_ids: systemIds,
      edit_system_ids: systemIds,
      allowed_systems: [...systemIds.map((id) => `v:${id}`), ...systemIds.map((id) => `e:${id}`)],
      status: "active",
      updated_at: new Date().toISOString(),
    },
  ]);

  console.log(`initial admin ready: ${account}`);
}

const importedProducts = await readJson("src/app/data/importedProducts.json");
const importedStores = await readJson("src/app/data/importedStores.json");
const distributionData = await readJson("data/distribution-data.json");
const distributionProducts = (distributionData.records ?? [])
  .map(distributionRecordToProduct)
  .filter(Boolean);

await upsertRows("systems", SYSTEMS.map(toSystemRow));
await upsertRows("products", [...importedProducts.map(toProductRow), ...distributionProducts]);
await upsertRows("stores", importedStores.map(toStoreRow));
await createInitialAdmin();

console.log("seed complete");
