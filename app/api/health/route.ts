import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const responsePayload: Record<string, unknown> = {
    status: "ok",
    app: "LifeLink",
    timestamp: new Date().toISOString(),
    database: {
      configured: Boolean(supabaseUrl && supabaseAnonKey),
    },
  };

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

      // Verify connection to the 3 core tables created in Step 2
      const [profilesRes, requestsRes, pledgesRes] = await Promise.all([
        supabase.from("profiles").select("id").limit(1),
        supabase.from("blood_requests").select("id").limit(1),
        supabase.from("donor_pledges").select("id").limit(1),
      ]);

      const connected =
        !profilesRes.error && !requestsRes.error && !pledgesRes.error;

      responsePayload.database = {
        configured: true,
        connected,
        tables: {
          profiles: !profilesRes.error ? "ok" : profilesRes.error.message,
          blood_requests: !requestsRes.error ? "ok" : requestsRes.error.message,
          donor_pledges: !pledgesRes.error ? "ok" : pledgesRes.error.message,
        },
      };
    } catch (err: unknown) {
      responsePayload.database = {
        configured: true,
        connected: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  return NextResponse.json(responsePayload);
}
