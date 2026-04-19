import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const optionalProfileFields = [
  "account",
  "email",
  "view_system_ids",
  "edit_system_ids",
  "status",
  "updated_at",
  "allowed_systems",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing authorization header." }, 401);
    }

    const accessToken = authHeader.slice("Bearer ".length).trim();
    if (!accessToken) {
      return json({ error: "Invalid authorization header." }, 401);
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data: authData, error: authError } = await adminClient.auth.getUser(accessToken);
    const callerId = authData?.user?.id;
    if (authError || !callerId) {
      return json({ error: authError?.message || "Unauthorized." }, 401);
    }

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
        email_confirm: true,
      });

      if (createError) {
        const duplicateEmail =
          createError.message?.includes("already been registered") ||
          createError.message?.includes("already registered") ||
          createError.message?.includes("already exists");

        if (!duplicateEmail) {
          return json({ error: createError.message }, 400);
        }

        const { data: listed, error: listError } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (listError) {
          return json({ error: listError.message }, 400);
        }

        const existing = listed.users.find((item) => item.email?.toLowerCase() === loginEmail.toLowerCase());
        if (!existing?.id) {
          return json({ error: "账号已存在，但未找到对应用户，请联系管理员处理。" }, 400);
        }

        targetUserId = existing.id;
      }

      if (createdUser?.user?.id) {
        targetUserId = createdUser.user.id;
      }
    } else if (password) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
        password,
      });

      if (authUpdateError) {
        return json({ error: authUpdateError.message }, 400);
      }
    }

    const profilePayload = {
      id: targetUserId,
      account,
      email: loginEmail,
      display_name: displayName,
      role,
      view_system_ids: viewSystemIds,
      edit_system_ids: role === "viewer" ? [] : editSystemIds,
      allowed_systems: viewSystemIds,
      status: "active",
      updated_at: new Date().toISOString(),
    };

    const profileError = await upsertProfileWithFallback(adminClient, profilePayload);
    if (profileError) {
      return json({ error: profileError.message || String(profileError) }, 400);
    }

    return json({ message: `账号 ${displayName} 已保存。`, id: targetUserId, email: loginEmail }, 200);
  } catch (error) {
    return json({ error: error.message || "Unexpected error." }, 500);
  }
});

async function upsertProfileWithFallback(adminClient, row) {
  const payload = { ...row };
  for (let i = 0; i <= optionalProfileFields.length; i += 1) {
    const { error } = await adminClient.from("profiles").upsert(payload);
    if (!error) {
      return null;
    }

    const missingField = findMissingField(error.message);
    if (!missingField || !optionalProfileFields.includes(missingField)) {
      return error;
    }

    delete payload[missingField];
  }

  return new Error("Failed to upsert profile.");
}

function findMissingField(message) {
  if (!message) return null;
  const quote = message.match(/'([^']+)'/);
  if (!quote?.[1]) return null;
  if (message.includes("Could not find the") && message.includes("column")) {
    return quote[1];
  }
  return null;
}

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
      "Content-Type": "application/json",
    },
  });
}
