import type { SupabaseClient } from "@supabase/supabase-js";

const RECENT_AUTH_SECONDS = 15 * 60;

export async function hasRecentAuthentication(client: SupabaseClient) {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) return false;
  try {
    const payload = data.session.access_token.split(".")[1];
    if (!payload) return false;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { auth_time?: unknown };
    return typeof claims.auth_time === "number"
      && claims.auth_time <= Math.floor(Date.now() / 1000)
      && Math.floor(Date.now() / 1000) - claims.auth_time <= RECENT_AUTH_SECONDS;
  } catch {
    return false;
  }
}
