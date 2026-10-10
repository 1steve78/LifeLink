import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { bloodRequests, donationReports, donorPledges, profiles } from "@/lib/db/schema";

export async function PATCH(_request: Request, context: { params: { requestId: string; donationId: string } }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to confirm received donations." }, { status: 401 });
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "requester") return NextResponse.json({ error: "Requester account required." }, { status: 403 });

  const transactionResult = await db.transaction(async (tx) => {
    const lockedRequestResult = await tx.execute(sql`
      select id, requester_id as "requesterId", status, units_needed as "unitsNeeded"
           , required_by as "requiredBy"
      from public.blood_requests
      where id = ${context.params.requestId}::uuid
      for update
    `);
    const [bloodRequest] = Array.from(lockedRequestResult as unknown as {
      id: string; requesterId: string; status: string; unitsNeeded: number; requiredBy: Date | null;
    }[]);
    if (!bloodRequest || bloodRequest.requesterId !== user.id) return { error: "Request not found.", status: 404 };

    const [report] = await tx.select({
      id: donationReports.id,
      pledgeId: donationReports.pledgeId,
      unitsDonated: donationReports.unitsDonated,
      status: donationReports.status,
    }).from(donationReports)
      .innerJoin(donorPledges, eq(donationReports.pledgeId, donorPledges.id))
      .where(and(eq(donationReports.id, context.params.donationId), eq(donorPledges.requestId, bloodRequest.id)))
      .limit(1);
    if (!report) return { error: "Donation report not found.", status: 404 };
    if (report.status === "confirmed") {
      const [totals] = await tx.execute(sql`
        select coalesce(sum(d.units_donated) filter (where d.status = 'confirmed'), 0)::int as "confirmedUnits"
        from public.donation_reports d
        join public.donor_pledges p on p.id = d.pledge_id
        where p.request_id = ${bloodRequest.id}::uuid
      `) as unknown as [{ confirmedUnits: number }];
      return { success: true, unchanged: true, confirmedUnits: totals.confirmedUnits, requestStatus: bloodRequest.status };
    }
    if (bloodRequest.status !== "active") return { error: "This request is closed.", status: 409 };
    if (bloodRequest.requiredBy && bloodRequest.requiredBy <= new Date()) return { error: "This request has passed its required-by time.", status: 409 };

    const [updatedReport] = await tx.update(donationReports).set({
      status: "confirmed",
      confirmedAt: new Date(),
      confirmedBy: user.id,
    }).where(and(eq(donationReports.id, report.id), eq(donationReports.status, "reported"))).returning({ id: donationReports.id });
    if (!updatedReport) return { error: "Donation report changed; refresh and try again.", status: 409 };

    await tx.update(donorPledges).set({ status: "completed", updatedAt: new Date() })
      .where(and(eq(donorPledges.id, report.pledgeId), eq(donorPledges.status, "confirmed")));

    const [totals] = await tx.execute(sql`
      select coalesce(sum(d.units_donated) filter (where d.status = 'confirmed'), 0)::int as "confirmedUnits"
      from public.donation_reports d
      join public.donor_pledges p on p.id = d.pledge_id
      where p.request_id = ${bloodRequest.id}::uuid
    `) as unknown as [{ confirmedUnits: number }];

    let requestStatus = bloodRequest.status;
    if (totals.confirmedUnits >= bloodRequest.unitsNeeded) {
      const [fulfilled] = await tx.update(bloodRequests).set({ status: "fulfilled", updatedAt: new Date() })
        .where(and(eq(bloodRequests.id, bloodRequest.id), eq(bloodRequests.status, "active")))
        .returning({ status: bloodRequests.status });
      if (fulfilled) requestStatus = fulfilled.status;
    }
    return { success: true, confirmedUnits: totals.confirmedUnits, requestStatus };
  });

  if ("error" in transactionResult) {
    return NextResponse.json({ error: transactionResult.error }, { status: transactionResult.status });
  }
  return NextResponse.json(transactionResult);
}
