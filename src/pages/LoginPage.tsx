import { Building2, LockKeyhole, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../app/context/AppContext";
import { Button } from "../components/common/Button";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAppContext();
  const [identity, setIdentity] = useState("liuliheng1993@gmail.com");
  const [password, setPassword] = useState("123456");
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
              <p className="text-sm text-muted">企业内部管理系统</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="tonal-panel p-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">设计来源</p>
              <h2 className="text-2xl font-semibold text-text">Precise Monolith</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                保留 Stitch 的冷静秩序和后台密度，用真实业务结构替换英文占位内容，适合产品、门店、销售与权限联动维护。
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                "产品信息：抽屉编辑、列管理、导入导出",
                "销售数据：按期间维护、支持版本记录",
                "系统切换：全局同步，跨页面共享",
                "账号权限：角色 + 系统查看/编辑权限",
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
            <p className="mt-2 text-sm text-muted">邮箱/账号 + 密码登录，登录后进入总览页</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="field-label">邮箱 / 账号</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className="field-input pl-10"
                  value={identity}
                  onChange={(event) => setIdentity(event.target.value)}
                  placeholder="name@company.com"
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

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? "登录中..." : "登录并进入总览"}
            </Button>
          </form>

          <div className="mt-6 rounded-mono bg-surface-low p-4 text-sm text-muted">
            演示环境说明：管理员账号可直接使用当前默认值；其他 mock 账号密码统一为 <span className="font-semibold text-text">123456</span>。
          </div>
        </section>
      </div>
    </main>
  );
}
