import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      // Check if profile exists, if not create from user metadata
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!profile) {
        const metadata = (data.user.user_metadata as Record<string, string>) || {};
        await (
          supabase.from("profiles") as unknown as {
            insert: (values: Record<string, unknown>) => Promise<unknown>;
          }
        ).insert({
          id: data.user.id,
          full_name: metadata.full_name || data.user.email?.split("@")[0] || "User",
          role: metadata.role || "requester",
          blood_group: metadata.blood_group || null,
          phone: metadata.phone || null,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
