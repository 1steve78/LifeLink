import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { donorPledges, profiles } from "@/lib/db/schema";
import { canReportDonation, type DonorPledgeStatus } from "@/lib/pulse/coordination";

const bodySchema = z.object({ unitsDonated: z.number().int().min(1).max(10) });

export async function POST(request: Request, context: { params: { pledgeId: string } }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to report a donation." }, { status: 401 });
  if (!z.string().uuid().safeParse(context.params.pledgeId).success) {
    return NextResponse.json({ error: "Invalid pledge ID." }, { status: 400 });
  }
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Enter the whole number of units you donated." }, { status: 400 });
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "donor") return NextResponse.json({ error: "Donor account required." }, { status: 403 });

  const result = await db.transaction(async (tx) => {
    const lockedRequest = await tx.execute(sql`
      select r.id, r.status, r.units_needed as "unitsNeeded", r.required_by as "requiredBy"
      from public.blood_requests r
      join public.donor_pledges p on p.request_id = r.id
      where p.id = ${context.params.pledgeId}::uuid and p.donor_id = ${user.id}::uuid
      for update of r
    `);
    const [bloodRequest] = Array.from(lockedRequest as unknown as { id: string; status: string; unitsNeeded: number; requiredBy: Date | null }[]);
    if (!bloodRequest) return { error: "Pledge not found.", status: 404 };
    if (bloodRequest.status !== "active") return { error: "This request is closed.", status: 409 };
    if (bloodRequest.requiredBy && bloodRequest.requiredBy <= new Date()) return { error: "This request has passed its required-by time.", status: 409 };

    const [pledge] = await tx.select({ id: donorPledges.id, requestId: donorPledges.requestId, status: donorPledges.status })
      .from(donorPledges).where(and(eq(donorPledges.id, context.params.pledgeId), eq(donorPledges.donorId, user.id))).limit(1);
    if (!pledge) return { error: "Pledge not found.", status: 404 };
    if (!canReportDonation(pledge.status as DonorPledgeStatus)) {
      return { error: "Accept the request and confirm hospital coordination before reporting a donation.", status: 409 };
    }
    const [existingReport] = await tx.execute(sql`
      select id from public.donation_reports where pledge_id = ${pledge.id}::uuid limit 1
    `) as unknown as [{ id: string }?];
    if (existingReport) return { error: "A donation report already exists for this pledge.", status: 409 };

    const [unitTotals] = await tx.execute(sql`
      select coalesce(sum(d.units_donated), 0)::int as total
      from public.donation_reports d
      join public.donor_pledges p on p.id = d.pledge_id
      where p.request_id = ${pledge.requestId}::uuid and d.status in ('reported', 'confirmed')
    `) as unknown as [{ total: number }];
    if (unitTotals.total + body.data.unitsDonated > bloodRequest.unitsNeeded) {
      return { error: "Those units exceed the request's remaining reported quantity.", status: 409 };
    }

    const [report] = await tx.execute(sql`
      insert into public.donation_reports (pledge_id, units_donated)
      values (${pledge.id}::uuid, ${body.data.unitsDonated})
      returning id, units_donated as "unitsDonated", status, reported_at as "reportedAt"
    `) as unknown as [{ id: string; unitsDonated: number; status: string; reportedAt: Date }];
    return { report };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ donation: result.report }, { status: 201 });
}
