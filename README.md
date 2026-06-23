# 重客基础资料后台

这是把 Google Stitch 设计交付包重构为 React + Tailwind 企业后台系统后的项目骨架。

## 当前实现

- React + Tailwind + TypeScript + Vite
- 左侧导航与顶部全局系统标签
- 登录页、总览页、产品信息页、门店信息页、销售数据页、系统管理页、账号权限页
- 产品信息右侧抽屉编辑
- 门店详情抽屉
- 销售数据表格内编辑、保存、撤销、版本记录
- viewer / editor / admin 角色权限
- 全局系统切换状态同步
- 可选演示数据跑通全页面，生产环境默认关闭演示数据
- Supabase Auth / REST / Edge Function 接入在 `src/app/services/cloud.ts`
- Supabase RLS 按系统权限隔离，账号权限页仅管理员可见
- 已按 OpenDesign 方案 1 重做为安静数据后台风格
- 商品、门店、系统资料和价格指引支持 `.xlsx / .csv` 导入；导出和模板下载为 `.xlsx`

## 设计映射

Stitch 页面到最终 React 页面的映射如下：

- `login_page`
  映射为 `src/pages/LoginPage.tsx`
  保留居中登录卡片、企业系统气质和克制配色。

- `overview_dashboard`
  映射为 `src/pages/OverviewPage.tsx`
  保留统计卡、最近修改记录、异常提醒的布局层级。

- `product_information_1` + `product_information_2`
  合并为 `src/pages/ProductPage.tsx`
  列表态和编辑抽屉态统一为一个产品信息页。

- `store_information`
  映射为 `src/pages/StorePage.tsx`
  保留高密度表格与详情抽屉交互。

- `sales_data_maintenance`
  映射为 `src/pages/SalesPage.tsx`
  保留顶部期间切换、核心数据表和右侧版本记录区。

- `account_permissions`
  映射为 `src/pages/AccountPermissionsPage.tsx`
  改造成真实业务角色与系统权限分配页。

- `bulk_data_import`
  没有单独做一级导航
  已吸收到产品信息页的“导入”动作，并为后续销售导入预留接口。

## 设计系统落地方式

Stitch 的 `DESIGN.md` 被转成以下工程规则：

- 色板和层级写入 `tailwind.config.ts`
- “No-Line Rule” 用 tonal plane 与低对比边界处理
- 表格、抽屉、状态 badge、侧栏激活态都做成通用组件
- 保留企业后台风格，不做营销官网化处理

## 项目结构

```text
.
├─ .github/workflows/deploy-pages.yml
├─ index.html
├─ package.json
├─ postcss.config.js
├─ tailwind.config.ts
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ stitch_ui.zip
└─ src
   ├─ App.tsx
   ├─ index.css
   ├─ main.tsx
   ├─ app
   │  ├─ context/AppContext.tsx
   │  ├─ data/mockData.ts
   │  ├─ router/ProtectedRoute.tsx
   │  ├─ services/api
   │  │  ├─ client.ts
   │  │  ├─ products.ts
   │  │  ├─ sales.ts
   │  │  ├─ stores.ts
   │  │  └─ users.ts
   │  ├─ types.ts
   │  └─ utils
   │     ├─ format.ts
   │     ├─ permissions.ts
   │     └─ systemFilters.ts
   ├─ components
   │  ├─ common
   │  │  ├─ Badge.tsx
   │  │  ├─ Button.tsx
   │  │  ├─ DataTable.tsx
   │  │  ├─ Drawer.tsx
   │  │  ├─ EmptyState.tsx
   │  │  ├─ ErrorState.tsx
   │  │  ├─ FormField.tsx
   │  │  ├─ LoadingState.tsx
   │  │  ├─ Pagination.tsx
   │  │  └─ StatCard.tsx
   │  ├─ layout
   │  │  ├─ AppShell.tsx
   │  │  ├─ Sidebar.tsx
   │  │  └─ SystemTabs.tsx
   │  ├─ permissions/UserDrawer.tsx
   │  ├─ products/ProductDrawer.tsx
   │  ├─ sales/VersionHistoryPanel.tsx
   │  └─ stores/StoreDrawer.tsx
   └─ pages
      ├─ AccountPermissionsPage.tsx
      ├─ LoginPage.tsx
      ├─ OverviewPage.tsx
      ├─ ProductPage.tsx
      ├─ SalesPage.tsx
      ├─ StorePage.tsx
      └─ SystemManagementPage.tsx
```

## 运行方式

```bash
npm install
npm run dev
```

构建：

```bash
npm run build
```

## 生产上线配置

完整上线检查清单见 `DEPLOYMENT.md`。

生产环境沿用 GitHub Pages + Supabase。前端只允许配置公开变量：

```bash
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase anon/publishable key
VITE_ALLOW_DEMO_LOGIN=false
VITE_ENABLE_DEMO_DATA=false
```

不要把 `SUPABASE_SERVICE_ROLE_KEY` 写入前端 `.env.production`，它只能用于本地迁移脚本、CI secret 或 Supabase Edge Function secret。

## Supabase 初始化

1. 在 Supabase SQL Editor 执行 `supabase/setup.sql`。
2. 在 Supabase Edge Functions 中部署 `supabase/admin-create-user.js`，并配置 `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY`。
3. 在本地临时设置 service role key，迁入现有 JSON 数据：

```bash
SUPABASE_URL="https://你的项目.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="你的 service role key" \
SCKA_ADMIN_ACCOUNT="首个管理员账号" \
SCKA_ADMIN_PASSWORD="首个管理员密码" \
SCKA_ADMIN_NAME="首个管理员姓名" \
npm run seed:supabase
```

如果不设置 `SCKA_ADMIN_ACCOUNT` / `SCKA_ADMIN_PASSWORD`，脚本只迁入系统、商品和门店数据，不创建首个管理员。

## 导入导出边界

- 浏览器端上传支持 `.xlsx` 和 `.csv`。
- 旧版二进制 `.xls` 不再在浏览器端直接解析；如有历史文件，请先用 Excel/WPS 另存为 `.xlsx` 或 `.csv`。
- 导出、商品模板、门店模板和系统基本信息模板均生成 `.xlsx`。

## 权限模型

- `admin`：查看和维护所有系统、账号、价格指引、告警和日志。
- `editor`：查看并编辑被分配编辑权限的系统数据。
- `viewer`：只查看被分配查看权限的系统数据。
- 价格指引是全局共享资料：所有登录用户可读，仅管理员可导入覆盖。
- 账号列表和账号权限配置仅管理员可见。

RLS 已在 `supabase/setup.sql` 中开启并按系统权限收口。前端权限判断只负责交互体验，数据库才是最终边界。

## 已知交付边界

- 当前仓库处于 Git rebase 未完成状态，正式合并/发布前必须先处理 Git 状态。
- `npm run build` 已通过，`npm audit --omit=dev` 已通过；构建仍有单包体积较大的 Vite 提示，后续可通过路由级代码拆分优化。
- 本地已验证 demo 登录、总览/商品/门店页面、商品模板下载、商品导出和商品 `.xlsx` 导入。
- 发布包已包含 `dist/404.html`，用于 GitHub Pages 子路径回退。
- 真正生产上线前仍需在 Supabase 项目中执行 `supabase/setup.sql`、部署 Edge Function、配置生产环境变量并运行数据迁移脚本。
