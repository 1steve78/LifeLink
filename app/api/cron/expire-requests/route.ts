import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await db.execute(sql`select public.expire_blood_requests() as expired_count`);
    const [row] = Array.from(result as unknown as { expired_count: number }[]);
    const availabilityResult = await db.execute(sql`select public.expire_donor_availability() as expired_donor_count`);
    const [availabilityRow] = Array.from(availabilityResult as unknown as { expired_donor_count: number }[]);
    await db.execute(sql`delete from public.rate_limit_buckets where expires_at < now()`);
    return NextResponse.json({
      success: true,
      expiredCount: Number(row?.expired_count ?? 0),
      donorsSetUnavailable: Number(availabilityRow?.expired_donor_count ?? 0),
    });
  } catch {
    return NextResponse.json({ error: "Could not expire requests." }, { status: 500 });
  }
}
