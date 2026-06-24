import { ArrowRight, BarChart3, CheckCircle2, Database, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
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
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-mono border border-line bg-surface-base shadow-panel lg:grid-cols-[0.92fr_1.08fr]">
          <section className="border-b border-line bg-[#fbfdff] p-6 lg:border-b-0 lg:border-r lg:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-mono bg-primary-soft text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-text">华南重客基础资料后台</p>
                <p className="mt-0.5 text-xs text-muted">生产访问入口</p>
              </div>
            </div>

            <div className="mt-8 grid gap-3">
              {[
                { icon: ShieldCheck, title: "按系统隔离", desc: "账号只看到被分配的系统资料" },
                { icon: Database, title: "云端业务数据", desc: "商品、门店、价格和销售数据从数据库读取" },
                { icon: CheckCircle2, title: "操作留痕", desc: "维护动作进入变更记录，便于追踪" },
              ].map((item) => (
                <div key={item.title} className="rounded-mono border border-line bg-surface-base p-4 shadow-subtle">
                  <div className="flex gap-3">
                    <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-text">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-mono border border-line bg-surface-low p-4 text-xs leading-6 text-muted">
              前端页面已发布，业务资料和权限由云端加载。请使用管理员分配的账号登录。
            </div>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-md">
              <div className="mb-7">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-mono bg-primary-soft text-primary">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-semibold text-text">登录系统</h1>
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

                <Button className="w-full gap-2" type="submit" disabled={submitting || authMode === "setup"}>
                  {submitting ? "登录中..." : authMode === "setup" ? "等待云端配置" : "登录并进入总览"}
                  <ArrowRight className="h-4 w-4" />
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
      </div>
    </main>
  );
}
