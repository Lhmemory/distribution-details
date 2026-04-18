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
- mock data 跑通全页面
- API 层预留为 `src/app/services/api`

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

## 后续接真实后端

当前所有页面都先走 mock data，本地状态已经通了。后续真实对接时，优先替换这些位置：

- `src/app/services/api/client.ts`
- `src/app/services/api/products.ts`
- `src/app/services/api/stores.ts`
- `src/app/services/api/sales.ts`
- `src/app/services/api/users.ts`
- `src/app/context/AppContext.tsx`

建议下一步真实接入顺序：

1. 登录与账号接口
2. 产品信息 CRUD
3. 门店信息查询
4. 销售数据版本保存
5. 变更日志持久化
