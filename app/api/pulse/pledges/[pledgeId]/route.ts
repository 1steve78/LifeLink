import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { bloodRequests, donorPledges, profiles } from "@/lib/db/schema";

const updateSchema = z.object({ action: z.enum(["confirm", "withdraw"]) });

export async function PATCH(request: Request, context: { params: { pledgeId: string } }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to update your pledge." }, { status: 401 });
  if (!z.string().uuid().safeParse(context.params.pledgeId).success) {
    return NextResponse.json({ error: "Invalid pledge ID." }, { status: 400 });
  }
  const body = updateSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Action must be confirm or withdraw." }, { status: 400 });
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "donor") return NextResponse.json({ error: "Donor account required." }, { status: 403 });

  const nextStatus = body.data.action === "confirm" ? "confirmed" : "withdrawn";
  const updatedRows = await db.execute(sql`
    update public.donor_pledges p
    set status = ${nextStatus}, updated_at = now()
    from public.blood_requests r
    where p.id = ${context.params.pledgeId}::uuid
      and p.donor_id = ${user.id}::uuid
      and p.request_id = r.id
      and r.status = 'active'
      and p.status = 'pledged'
    returning p.id
  `);
  if (Array.from(updatedRows as unknown as { id: string }[]).length) {
    return NextResponse.json({ success: true, status: nextStatus });
  }

  const [existing] = await db.select({ status: donorPledges.status, requestStatus: bloodRequests.status }).from(donorPledges)
    .innerJoin(bloodRequests, eq(donorPledges.requestId, bloodRequests.id))
    .where(and(eq(donorPledges.id, context.params.pledgeId), eq(donorPledges.donorId, user.id))).limit(1);
  if (existing?.status === nextStatus) return NextResponse.json({ success: true, status: nextStatus, unchanged: true });
  if (!existing) return NextResponse.json({ error: "Pledge not found." }, { status: 404 });
  if (existing.requestStatus !== "active") return NextResponse.json({ error: "This request is closed." }, { status: 409 });
  return NextResponse.json({ error: "Only a current pledge can be updated." }, { status: 409 });
}
