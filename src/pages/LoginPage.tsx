import { Building2, LockKeyhole, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../app/context/AppContext";
import { Button } from "../components/common/Button";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authMode, bootstrapMessage } = useAppContext();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await login(identity, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "登录失败");
      return;
    }
    const target = (location.state as { from?: string } | null)?.from ?? "/overview";
    navigate(target, { replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-mono bg-surface-low p-10 lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-mono bg-primary text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-text">重客基础资料后台</p>
              <p className="text-sm text-muted">企业内部资料管理系统</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="tonal-panel p-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Access Model</p>
              <h2 className="text-2xl font-semibold text-text">Code Public, Data Private</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                页面代码可以公开托管，但商品、门店、价格、销量这些业务数据不再默认写在前端里，而是登录后再从云端读取。
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "登录后才加载商品、门店、价格指引和销量数据",
                "支持 GitHub 发布前端，Supabase 托管账号与数据库",
                "默认关闭演示数据，避免真实业务数据被打包公开",
                "后续可继续加账号权限、编辑保存和操作日志",
              ].map((item) => (
                <div key={item} className="rounded-mono bg-surface-base p-4 shadow-ambient">
                  <p className="text-sm text-text">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="tonal-panel p-8 lg:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-mono bg-primary-soft text-primary">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-text">登录系统</h1>
            <p className="mt-2 text-sm text-muted">
              {authMode === "supabase"
                ? "使用已开通的邮箱账号登录，登录成功后再从云端读取业务数据。"
                : authMode === "demo"
                  ? "当前是演示模式，仅用于本地体验页面。"
                  : "当前站点未完成云端配置，已关闭演示登录。"}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="field-label">{authMode === "supabase" ? "邮箱" : "邮箱 / 账号"}</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className="field-input pl-10"
                  value={identity}
                  onChange={(event) => setIdentity(event.target.value)}
                  placeholder={authMode === "supabase" ? "name@company.com" : "邮箱或账号"}
                />
              </div>
            </label>

            <label className="block">
              <span className="field-label">密码</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className="field-input pl-10"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入密码"
                />
              </div>
            </label>

            {error ? <p className="text-sm text-critical">{error}</p> : null}
            {!error && bootstrapMessage ? <p className="text-sm text-muted">{bootstrapMessage}</p> : null}

            <Button className="w-full" type="submit" disabled={submitting || authMode === "setup"}>
              {submitting ? "登录中..." : authMode === "setup" ? "等待云端配置" : "登录并进入总览"}
            </Button>
          </form>

          <div className="mt-6 rounded-mono bg-surface-low p-4 text-sm text-muted">
            {authMode === "supabase" ? (
              <>上线建议：登录账号从 Supabase Auth 创建，业务数据只放数据库，不再写进前端源码。</>
            ) : authMode === "demo" ? (
              <>
                演示环境说明：管理员账号可直接使用当前默认值；其他演示账号密码统一为
                <span className="font-semibold text-text"> 123456</span>。
              </>
            ) : (
              <>请先在项目根目录配置 `.env`，填入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。</>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
