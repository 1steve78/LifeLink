import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { donorPledges, profiles } from "@/lib/db/schema";

const bodySchema = z.object({ requestId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to pledge." }, { status: 401 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "A valid requestId is required." }, { status: 400 });
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "donor") return NextResponse.json({ error: "Donor account required." }, { status: 403 });

  const inserted = await db.execute(sql`
    insert into public.donor_pledges (request_id, donor_id)
    select r.id, ${user.id}::uuid
    from public.blood_requests r
    where r.id = ${body.data.requestId}::uuid
      and r.status = 'active'
      and exists (
        select 1 from public.find_eligible_donors(r.id) matched
        where matched.donor_id = ${user.id}::uuid
      )
    on conflict (request_id, donor_id) do update
      set status = 'pledged', updated_at = now()
      where donor_pledges.status = 'withdrawn'
    returning id
  `);
  if (Array.from(inserted as unknown as { id: string }[]).length) {
    return NextResponse.json({ success: true, alreadyPledged: false });
  }

  const [existing] = await db.select({ id: donorPledges.id }).from(donorPledges).where(and(
    eq(donorPledges.requestId, body.data.requestId),
    eq(donorPledges.donorId, user.id),
  )).limit(1);
  if (existing) return NextResponse.json({ success: true, alreadyPledged: true });
  return NextResponse.json({ error: "This request is no longer open or does not match your donor profile." }, { status: 409 });
}
