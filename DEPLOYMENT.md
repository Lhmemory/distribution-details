# 上线检查清单

项目路径：

```text
/Users/lhmemory/Library/CloudStorage/OneDrive-共享的库-onedrive/Documents/重客基本资料-开发
```

## 1. 本地验证

安装依赖：

```bash
npm ci
```

开发预览：

```bash
npm run dev
```

本地地址：

```text
http://127.0.0.1:5173/distribution-details/
```

生产构建：

```bash
npm run build
```

生产预览：

```bash
npm run preview -- --host 127.0.0.1 --port 4173
```

生产预览地址：

```text
http://127.0.0.1:4173/distribution-details/
```

安全审计：

```bash
npm audit --omit=dev
```

## 2. Supabase 初始化

1. 在 Supabase SQL Editor 执行：

```text
supabase/setup.sql
```

2. 部署 Edge Function：

```text
supabase/admin-create-user.js
```

函数名必须是：

```text
admin-create-user
```

3. 给 Edge Function 配置 secret：

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

4. 本地或 CI 中临时设置 service role key，迁入初始数据并创建首个管理员：

```bash
SUPABASE_URL="https://你的项目.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="你的 service role key" \
SCKA_ADMIN_ACCOUNT="首个管理员账号" \
SCKA_ADMIN_PASSWORD="首个管理员密码" \
SCKA_ADMIN_NAME="首个管理员姓名" \
npm run seed:supabase
```

不要把 `SUPABASE_SERVICE_ROLE_KEY` 写入 `.env.production` 或前端代码。

## 3. 前端生产配置

`.env.production` 只允许保存公开变量：

```bash
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase anon/publishable key
VITE_ALLOW_DEMO_LOGIN=false
VITE_ENABLE_DEMO_DATA=false
```

生产模式关闭 demo 登录。只有 Supabase 中存在账号和 profile 后，用户才能登录。

## 4. GitHub Pages 发布

当前 workflow：

```text
.github/workflows/deploy-pages.yml
```

发布触发方式：

- 推送到 `main` 或 `master`
- 或在 GitHub Actions 手动运行 `Deploy GitHub Pages`

构建产物路径：

```text
dist
```

发布路径：

```text
/distribution-details/
```

`public/404.html` 会被打包到 `dist/404.html`，用于 GitHub Pages 直接访问子路径时回退到 Hash Router。

## 5. 上线前必须确认

- `npm run build` 通过。
- `npm audit --omit=dev` 通过。
- `dist/index.html`、`dist/404.html`、`dist/assets/*.js`、`dist/assets/*.css` 存在。
- 生产预览地址可以打开登录页。
- Supabase 已执行 `supabase/setup.sql`。
- 首个管理员账号可以登录。
- 管理员可以创建 viewer/editor/admin 账号。
- 非管理员看不到账号权限页。
- 商品、门店、系统基本信息、价格指引导入只接受 `.xlsx / .csv`。

## 6. 当前发布前置

当前本地 `main` 已完成上线改动提交，但还未推送到 GitHub。当前状态应显示为本地领先远端：

```bash
git status
```

如果这台 Mac 已完成 GitHub 登录，可以直接双击项目根目录下的发布入口：

```text
上线发布.command
```

它会依次执行依赖安装、生产依赖安全审计、生产构建、Git 状态检查和 `git push origin main`。

也可以手动执行：

```bash
git push origin main
```

如果出现 `could not read Username for 'https://github.com': Device not configured`，说明当前 Mac 没有可用 GitHub HTTPS 凭据。先在这台 Mac 上完成 GitHub 登录或配置可用的 Personal Access Token / SSH key，再重新运行 `上线发布.command` 或手动推送。

推送后 GitHub Actions 会运行 `.github/workflows/deploy-pages.yml` 并发布到 GitHub Pages。

真正多用户可用还需要先完成 Supabase 初始化和首个管理员账号创建；否则生产站点只能打开登录页，无法完成真实登录。
