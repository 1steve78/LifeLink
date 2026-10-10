import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { bloodRequests, donorPledges, profiles } from "@/lib/db/schema";
import { nextPledgeStatus, type DonorPledgeAction } from "@/lib/pulse/coordination";

const updateSchema = z.object({ action: z.enum(["accept", "confirm", "withdraw"]) });

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

  const [existing] = await db.select({ status: donorPledges.status }).from(donorPledges).where(and(
    eq(donorPledges.id, context.params.pledgeId),
    eq(donorPledges.donorId, user.id),
  )).limit(1);
  if (!existing) return NextResponse.json({ error: "Pledge not found." }, { status: 404 });
  const nextStatus = nextPledgeStatus(
    existing.status as "pledged" | "accepted" | "confirmed" | "completed" | "withdrawn",
    body.data.action as DonorPledgeAction,
  );
  if (!nextStatus) {
    const alreadyApplied = (body.data.action === "accept" && existing.status === "accepted")
      || (body.data.action === "confirm" && existing.status === "confirmed")
      || (body.data.action === "withdraw" && existing.status === "withdrawn");
    if (alreadyApplied) {
      return NextResponse.json({ success: true, status: existing.status, unchanged: true });
    }
    return NextResponse.json({ error: "Complete the prior coordination step before this action." }, { status: 409 });
  }
  const updatedRows = await db.execute(sql`
    update public.donor_pledges p
    set status = ${nextStatus}, updated_at = now()
    from public.blood_requests r
    where p.id = ${context.params.pledgeId}::uuid
      and p.donor_id = ${user.id}::uuid
      and p.request_id = r.id
      and r.status = 'active'
      and coalesce(r.required_by, r.created_at + interval '48 hours') > now()
      and p.status = ${existing.status}
      and (${body.data.action} <> 'withdraw' or not exists (
        select 1 from public.donation_reports d where d.pledge_id = p.id
      ))
    returning p.id
  `);
  if (Array.from(updatedRows as unknown as { id: string }[]).length) {
    return NextResponse.json({ success: true, status: nextStatus });
  }

  const [latest] = await db.select({ status: donorPledges.status, requestStatus: bloodRequests.status }).from(donorPledges)
    .innerJoin(bloodRequests, eq(donorPledges.requestId, bloodRequests.id))
    .where(and(eq(donorPledges.id, context.params.pledgeId), eq(donorPledges.donorId, user.id))).limit(1);
  if (latest?.status === nextStatus) return NextResponse.json({ success: true, status: nextStatus, unchanged: true });
  if (latest?.requestStatus !== "active") return NextResponse.json({ error: "This request is closed." }, { status: 409 });
  if (body.data.action === "withdraw") return NextResponse.json({ error: "A pledge with a donation report cannot be withdrawn." }, { status: 409 });
  return NextResponse.json({ error: "Only a current pledge can be updated." }, { status: 409 });
}
