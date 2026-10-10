import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      // Check if profile exists and whether onboarding is complete
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, completed_at, role")
        .eq("id", data.user.id)
        .single();
      const profile = profileData as { id: string; completed_at: string | null; role: string } | null;

      if (!profile) {
        const metadata = (data.user.user_metadata as Record<string, string>) || {};
        const requestedRole = metadata.role;
        const safeRole = requestedRole === "donor" ? "donor" : "requester";
        await (
          supabase.from("profiles") as unknown as {
            insert: (values: Record<string, unknown>) => Promise<unknown>;
          }
        ).insert({
          id: data.user.id,
          full_name: metadata.full_name || data.user.email?.split("@")[0] || "User",
          role: safeRole,
          blood_group: metadata.blood_group || null,
          phone: metadata.phone || null,
        });
        return NextResponse.redirect(`${origin}/profile/setup`);
      }

      if (!profile.completed_at) {
        return NextResponse.redirect(`${origin}/profile/setup`);
      }

      const destination = profile.role === "donor"
        ? "/donor/pulse"
        : profile.role === "moderator"
          ? "/moderator"
          : "/requests";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
