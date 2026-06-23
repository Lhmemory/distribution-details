import { BarChart3, CheckCircle2, Database, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
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
    <main className="min-h-screen bg-canvas px-4 py-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-mono border border-line bg-surface-base shadow-ambient lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden border-r border-line bg-[#fbfdff] p-10 lg:block">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-mono bg-primary-soft text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-bold text-text">华南重客基础资料后台</p>
              <p className="mt-1 text-sm text-muted">商品、门店、价格、销售和权限统一维护</p>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-3 text-sm font-semibold text-primary">Code Public, Data Private</p>
            <h1 className="text-[2.15rem] font-semibold leading-tight text-text">
              登录后加载业务数据，按系统权限隔离访问范围
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted">
              前端可发布到 GitHub Pages，商品、门店、价格指引和销售数据只存放在 Supabase。账号角色和系统权限由管理员统一分配。
            </p>
          </div>

          <div className="mt-10 grid gap-3">
            {[
              { icon: ShieldCheck, title: "数据库 RLS", desc: "viewer / editor / admin 在数据库层按系统隔离" },
              { icon: Database, title: "真实资料入库", desc: "上线后从 Supabase 读取，不把业务 JSON 打包进前端" },
              { icon: CheckCircle2, title: "操作留痕", desc: "商品、门店、价格、销售和账号操作统一进入变更日志" },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 border-t border-line py-4">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-text">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-mono bg-primary-soft text-primary">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold text-text">登录系统</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {authMode === "supabase"
                  ? "输入账号或邮箱登录，系统会按权限加载可访问的数据。"
                  : authMode === "demo"
                    ? "当前是演示模式，仅用于本地体验页面。"
                    : "当前站点未完成云端配置，已关闭演示登录。"}
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="field-label">{authMode === "supabase" ? "账号 / 邮箱" : "邮箱 / 账号"}</span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    className="field-input pl-10"
                    autoComplete="username"
                    value={identity}
                    onChange={(event) => setIdentity(event.target.value)}
                    placeholder={authMode === "supabase" ? "输入账号或邮箱" : "邮箱或账号"}
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="请输入密码"
                  />
                </div>
              </label>

              {error ? <p className="rounded-mono bg-critical-bg px-3 py-2 text-sm text-critical">{error}</p> : null}
              {!error && bootstrapMessage ? <p className="rounded-mono bg-primary-soft px-3 py-2 text-sm text-primary-dim">{bootstrapMessage}</p> : null}

              <Button className="w-full" type="submit" disabled={submitting || authMode === "setup"}>
                {submitting ? "登录中..." : authMode === "setup" ? "等待云端配置" : "登录并进入总览"}
              </Button>
            </form>

            <div className="mt-6 rounded-mono border border-line bg-surface-low p-4 text-sm leading-6 text-muted">
              {authMode === "supabase" ? (
                <>上线模式下可由管理员在网页内创建账号，业务数据只放数据库，不写进前端源码。</>
              ) : authMode === "demo" ? (
                <>
                  演示环境说明：管理员账号可直接使用当前默认值；其他演示账号密码统一为
                  <span className="font-semibold text-text"> 123456</span>。
                </>
              ) : (
                <>请先在项目根目录配置 `.env`，填入 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。</>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
