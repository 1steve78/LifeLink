import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { bloodRequests, donorNotifications, moderationAuditEvents, profiles, requestTrackerEvents, requestVerificationEvents, requesterInformationResponses } from "@/lib/db/schema";
import { isAuthorizedModerator } from "@/lib/verification/moderator-auth";
import { canApproveWithScreening, getDecisionStatus, hasResponseAfterInformationRequest, isReviewableStatus } from "@/lib/verification/moderation-rules";

export const runtime = "nodejs";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject", "request_information"]),
  reason: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request, context: { params: { requestId: string } }) {
  if (!z.string().uuid().safeParse(context.params.requestId).success) {
    return NextResponse.json({ error: "Invalid request ID." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to review requests." }, { status: 401 });

  const allowlistedIds = (process.env.MODERATOR_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (!isAuthorizedModerator(user.id, profile?.role, allowlistedIds)) {
    return NextResponse.json({ error: "This account is not authorized to moderate requests." }, { status: 403 });
  }

  await db.execute(sql`select public.expire_blood_requests()`);

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Action must be approve, reject, or request_information." }, { status: 400 });
  const reason = parsed.data.reason?.trim() ?? "";
  if (reason.length < 5) {
    return NextResponse.json({ error: "A reason of at least 5 characters is required for the audit record." }, { status: 422 });
  }

  const [bloodRequest] = await db.select().from(bloodRequests)
    .where(eq(bloodRequests.id, context.params.requestId)).limit(1);
  if (!bloodRequest) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  if (!isReviewableStatus(bloodRequest.status)) {
    return NextResponse.json({ error: "Only pending requests can be reviewed." }, { status: 409 });
  }
  if (bloodRequest.reviewState === "needs_information") {
    const [lastRequest] = await db.select({ createdAt: moderationAuditEvents.createdAt }).from(moderationAuditEvents)
      .where(and(eq(moderationAuditEvents.requestId, bloodRequest.id), eq(moderationAuditEvents.action, "request_information")))
      .orderBy(desc(moderationAuditEvents.createdAt)).limit(1);
    const [lastResponse] = await db.select({ createdAt: requesterInformationResponses.createdAt })
      .from(requesterInformationResponses).where(eq(requesterInformationResponses.requestId, bloodRequest.id))
      .orderBy(desc(requesterInformationResponses.createdAt)).limit(1);
    if (!hasResponseAfterInformationRequest(lastResponse?.createdAt, lastRequest?.createdAt)) {
      return NextResponse.json({ error: "Wait for the requester to respond before recording another decision." }, { status: 409 });
    }
  }

  const events = await db.select({ gate: requestVerificationEvents.gate, status: requestVerificationEvents.status })
    .from(requestVerificationEvents)
    .where(eq(requestVerificationEvents.requestId, bloodRequest.id))
    .orderBy(desc(requestVerificationEvents.createdAt));
  const latestByGate = new Map<string, string>();
  for (const event of events) if (!latestByGate.has(event.gate)) latestByGate.set(event.gate, event.status);

  const documentStatus = latestByGate.get("document_analysis");
  const riskStatus = latestByGate.get("risk_screening");
  const automatedFlag = documentStatus === "flagged" || riskStatus === "flagged";
  let verificationPassed = false;
  if (parsed.data.action === "approve") {
    const approval = canApproveWithScreening({
      hasHospitalLocation: Boolean(bloodRequest.hospitalLocation),
      basicValidation: latestByGate.get("basic_validation"),
      documentAnalysis: documentStatus,
      riskScreening: riskStatus,
      reason,
    });
    if (!approval.allowed) return NextResponse.json({ error: approval.message }, { status: 409 });
    verificationPassed = approval.verificationPassed;
  }

  const action = parsed.data.action;
  const nextStatus = getDecisionStatus(action);
  const eventStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "pending";

  try {
    await db.transaction(async (tx) => {
      const updated = await tx.update(bloodRequests).set({
        status: nextStatus,
        reviewState: action === "request_information" ? "needs_information" : "open",
        reviewRevision: sql`${bloodRequests.reviewRevision} + 1`,
        verificationPassed: action === "approve" && verificationPassed,
        updatedAt: new Date(),
      }).where(and(
        eq(bloodRequests.id, bloodRequest.id),
        inArray(bloodRequests.status, ["pending_verification", "under_review"]),
        eq(bloodRequests.reviewState, bloodRequest.reviewState),
        eq(bloodRequests.reviewRevision, bloodRequest.reviewRevision),
      )).returning({ id: bloodRequests.id });
      if (!updated.length) throw new Error("Request status changed during review.");

      await tx.insert(moderationAuditEvents).values({
        requestId: bloodRequest.id,
        moderatorId: user.id,
        action,
        previousStatus: bloodRequest.status,
        newStatus: nextStatus,
        reason,
      });
      await tx.insert(requestVerificationEvents).values({
        requestId: bloodRequest.id,
        gate: "moderator_review",
        status: eventStatus,
        performedBy: user.id,
        details: { decision: action, reason, overrodeAutomatedFlag: automatedFlag && action === "approve" },
      });
      if (action === "request_information") {
        await tx.insert(requestTrackerEvents).values({
          requestId: bloodRequest.id,
          eventType: "request_information_needed",
          requestStatus: nextStatus,
          pledgeCount: 0,
          confirmedCount: 0,
        });
      }
      if (nextStatus === "active") {
        const matches = await tx.execute(sql`select donor_id from public.find_eligible_donors(${bloodRequest.id}::uuid)`);
        const donors = Array.from(matches as unknown as { donor_id: string }[]);
        if (donors.length) {
          await tx.insert(donorNotifications).values(donors.map(({ donor_id }) => ({
            donorId: donor_id,
            requestId: bloodRequest.id,
          }))).onConflictDoNothing();
        }
      }
    });
  } catch {
    return NextResponse.json({ error: "The request was updated by another review or could not be saved." }, { status: 409 });
  }

  return NextResponse.json({
    requestId: bloodRequest.id,
    status: nextStatus,
    reviewState: action === "request_information" ? "needs_information" : "open",
    verificationPassed: action === "approve" && verificationPassed,
    message: action === "approve"
      ? "Approved. The request is now eligible for donor matching."
      : action === "reject"
        ? "Rejected. The decision and reason were recorded."
        : "More information was requested. The request remains hidden from donor matching.",
  });
}
