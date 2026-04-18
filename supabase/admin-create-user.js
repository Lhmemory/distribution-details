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
      Deno.env.get("SUPABASE_ANON_KEY"),
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

    const { email, password, displayName, allowedSystems } = await req.json();
    if (!email || !password || !displayName) {
      return json({ error: "email, password and displayName are required." }, 400);
    }

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      return json({ error: createError.message }, 400);
    }

    const { error: profileError } = await adminClient.from("profiles").insert({
      id: createdUser.user.id,
      display_name: displayName,
      role: "editor",
      allowed_systems: Array.isArray(allowedSystems) ? allowedSystems : []
    });

    if (profileError) {
      return json({ error: profileError.message }, 400);
    }

    return json({ message: `账号 ${displayName} 已创建。` }, 200);
  } catch (error) {
    return json({ error: error.message || "Unexpected error." }, 500);
  }
});

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
