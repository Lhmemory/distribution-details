import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header." }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: authData } = await userClient.auth.getUser();
    const callerId = authData?.user?.id;
    if (!callerId) {
      return json({ error: "Unauthorized." }, 401);
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", callerId)
      .maybeSingle();

    if (callerProfile?.role !== "admin") {
      return json({ error: "Only admin can create accounts." }, 403);
    }

    const payload = await req.json();
    const account = String(payload.account ?? "").trim();
    const displayName = String(payload.name ?? "").trim();
    const password = typeof payload.password === "string" ? payload.password.trim() : "";
    const role = ["viewer", "editor", "admin"].includes(payload.role) ? payload.role : "viewer";
    const viewSystemIds = Array.isArray(payload.viewSystemIds) ? payload.viewSystemIds : [];
    const editSystemIds = Array.isArray(payload.editSystemIds) ? payload.editSystemIds : [];
    const userId = typeof payload.userId === "string" ? payload.userId : "";

    if (!account || !displayName) {
      return json({ error: "account and name are required." }, 400);
    }

    if (!userId && !password) {
      return json({ error: "password is required when creating a new account." }, 400);
    }

    const loginEmail = buildInternalLoginEmail(account);
    let targetUserId = userId;

    if (!userId) {
      const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
        email: loginEmail,
        password,
        email_confirm: true
      });

      if (createError) {
        return json({ error: createError.message }, 400);
      }

      targetUserId = createdUser.user.id;
    } else if (password) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
        password
      });

      if (authUpdateError) {
        return json({ error: authUpdateError.message }, 400);
      }
    }

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: targetUserId,
      account,
      email: loginEmail,
      display_name: displayName,
      role,
      view_system_ids: viewSystemIds,
      edit_system_ids: role === "viewer" ? [] : editSystemIds,
      status: "active",
      updated_at: new Date().toISOString()
    });

    if (profileError) {
      return json({ error: profileError.message }, 400);
    }

    return json({ message: `账号 ${displayName} 已保存。`, id: targetUserId, email: loginEmail }, 200);
  } catch (error) {
    return json({ error: error.message || "Unexpected error." }, 500);
  }
});

function buildInternalLoginEmail(account) {
  const lower = account.trim().toLowerCase();
  const bytes = new TextEncoder().encode(lower);
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `acct-${hex}@scka-login.invalid`;
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
