import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export const runtime = "nodejs";

/** Returns aggregate compatible donor counts for this requester's active requests only. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to view nearby donor availability." }, { status: 401 });
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "requester") return NextResponse.json({ error: "Requester account required." }, { status: 403 });

  const result = await db.execute(sql`
    select r.id as "requestId", r.blood_group as "bloodGroup", r.units_needed as "unitsNeeded",
           r.hospital_name as "hospitalName", r.urgency, r.status,
           st_x(r.hospital_location::geometry) as longitude,
           st_y(r.hospital_location::geometry) as latitude,
           coalesce(matches.donor_count, 0)::int as "nearbyDonorCount",
           matches.nearest_distance_km as "nearestDistanceKm"
    from public.blood_requests r
    left join lateral (
      select count(*)::int as donor_count, min(m.distance_km)::float8 as nearest_distance_km
      from public.find_eligible_donors(r.id) m
    ) matches on true
    where r.requester_id = ${user.id}::uuid
      and r.status = 'active'
      and r.hospital_location is not null
    order by r.created_at desc
  `);
  const requests = Array.from(result as unknown as {
    requestId: string; bloodGroup: string; unitsNeeded: number; hospitalName: string;
    urgency: string; status: string; longitude: number; latitude: number;
    nearbyDonorCount: number; nearestDistanceKm: number | null;
  }[]);
  return NextResponse.json({ requests });
}
