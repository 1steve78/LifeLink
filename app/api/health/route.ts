import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { status: "error", checks: { database: "not_configured", supabaseAuth: authConfigured ? "configured" : "not_configured" } },
      { status: 503 },
    );
  }

  try {
    const { db } = await import("@/lib/db");
    await db.execute(sql`select 1`);
    return NextResponse.json({
      status: "ok",
      app: "LifeLink",
      checks: { database: "connected", supabaseAuth: authConfigured ? "configured" : "not_configured" },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "error", checks: { database: "unavailable", supabaseAuth: authConfigured ? "configured" : "not_configured" } },
      { status: 503 },
    );
  }
}
