export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  allowDemoLogin: boolean;
  enableDemoData: boolean;
}

function readFlag(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const appConfig: AppConfig = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL ?? "").trim(),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim(),
  allowDemoLogin: readFlag(import.meta.env.VITE_ALLOW_DEMO_LOGIN, false),
  enableDemoData: readFlag(import.meta.env.VITE_ENABLE_DEMO_DATA, false),
};

export function isSupabaseConfigured() {
  return Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
}

export function getAuthMode(): "supabase" | "demo" | "setup" {
  if (isSupabaseConfigured()) return "supabase";
  if (appConfig.allowDemoLogin) return "demo";
  return "setup";
}
