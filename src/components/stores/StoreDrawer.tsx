import { StoreRecord } from "../../app/types";
import { Drawer } from "../common/Drawer";

export function StoreDrawer({
  open,
  store,
  onClose,
}: {
  open: boolean;
  store: StoreRecord | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={open}
      title={store?.storeName ?? "门店详情"}
      subtitle={store ? `${store.storeCode} · ${store.city}` : ""}
      onClose={onClose}
    >
      {store ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Info label="门店编码" value={store.storeCode} />
          <Info label="门店名称" value={store.storeName} />
          <Info label="城市" value={store.city} />
          <Info label="区域" value={store.region} />
          <Info label="业态" value={store.format} />
          <Info label="门店状态" value={store.businessStatus} />
          {store.plannedCloseDate ? <Info label="计划闭店时间" value={store.plannedCloseDate} /> : null}
          {store.plannedOpenDate ? <Info label="计划开业时间" value={store.plannedOpenDate} /> : null}
          {store.renovationOpenDate ? <Info label="店改开业时间" value={store.renovationOpenDate} /> : null}
          <Info label="销量" value={String(store.salesVolume)} />
          <Info label="最近更新时间" value={store.updatedAt} />
        </div>
      ) : null}
    </Drawer>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-mono bg-surface-base p-4">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="text-sm text-text">{value}</p>
    </div>
  );
}
