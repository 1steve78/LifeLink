import { and, count, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { bloodRequests, donorNotifications, donorPledges, profiles, requestTrackerEvents, moderationAuditEvents, requesterInformationResponses } from "@/lib/db/schema";
import { isAuthorizedModerator } from "@/lib/verification/moderator-auth";

const requestIdSchema = z.string().uuid();
const actionSchema = z.object({ action: z.enum(["fulfilled", "cancelled"]) });

async function authorize(requestId: string) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { response: NextResponse.json({ error: "Sign in to view this tracker." }, { status: 401 }) };
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (!profile) return { response: NextResponse.json({ error: "Profile not found." }, { status: 403 }) };
  const [bloodRequest] = await db.select().from(bloodRequests).where(eq(bloodRequests.id, requestId)).limit(1);
  if (!bloodRequest) return { response: NextResponse.json({ error: "Request not found." }, { status: 404 }) };
  const allowlistedIds = (process.env.MODERATOR_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  const isModerator = isAuthorizedModerator(user.id, profile.role, allowlistedIds);
  if (bloodRequest.requesterId !== user.id && !isModerator) {
    return { response: NextResponse.json({ error: "You cannot view this request tracker." }, { status: 403 }) };
  }
  return { user, profile, bloodRequest, isModerator };
}

export async function GET(_request: Request, context: { params: { requestId: string } }) {
  if (!requestIdSchema.safeParse(context.params.requestId).success) {
    return NextResponse.json({ error: "Invalid request ID." }, { status: 400 });
  }
  const access = await authorize(context.params.requestId);
  if ("response" in access) return access.response;
  const requestId = access.bloodRequest.id;

  const [[counts], [matchedCount], events, [informationRequest], [informationResponse]] = await Promise.all([
    db.select({
      pledgeCount: sql<number>`count(*) filter (where ${donorPledges.status} in ('pledged', 'confirmed'))::int`,
      confirmedCount: sql<number>`count(*) filter (where ${donorPledges.status} = 'confirmed')::int`,
    }).from(donorPledges).where(eq(donorPledges.requestId, requestId)),
    db.select({ value: count() }).from(donorNotifications).where(eq(donorNotifications.requestId, requestId)),
    db.select({
      id: requestTrackerEvents.id,
      eventType: requestTrackerEvents.eventType,
      requestStatus: requestTrackerEvents.requestStatus,
      pledgeCount: requestTrackerEvents.pledgeCount,
      confirmedCount: requestTrackerEvents.confirmedCount,
      createdAt: requestTrackerEvents.createdAt,
    }).from(requestTrackerEvents).where(eq(requestTrackerEvents.requestId, requestId))
      .orderBy(desc(requestTrackerEvents.createdAt)).limit(50),
    db.select({ reason: moderationAuditEvents.reason, createdAt: moderationAuditEvents.createdAt })
      .from(moderationAuditEvents).where(and(eq(moderationAuditEvents.requestId, requestId), eq(moderationAuditEvents.action, "request_information")))
      .orderBy(desc(moderationAuditEvents.createdAt)).limit(1),
    db.select({ message: requesterInformationResponses.message, createdAt: requesterInformationResponses.createdAt })
      .from(requesterInformationResponses).where(eq(requesterInformationResponses.requestId, requestId))
      .orderBy(desc(requesterInformationResponses.createdAt)).limit(1),
  ]);

  return NextResponse.json({
    request: {
      id: requestId,
      bloodGroup: access.bloodRequest.bloodGroup,
      unitsNeeded: access.bloodRequest.unitsNeeded,
      hospitalName: access.bloodRequest.hospitalName,
      hospitalAddress: access.bloodRequest.hospitalAddress,
      urgency: access.bloodRequest.urgency,
      requiredBy: access.bloodRequest.requiredBy,
      status: access.bloodRequest.status,
      reviewState: access.bloodRequest.reviewState,
      createdAt: access.bloodRequest.createdAt,
    },
    progress: {
      matchedCount: matchedCount.value,
      pledgeCount: counts.pledgeCount,
      confirmedCount: counts.confirmedCount,
    },
    events: events.reverse(),
    informationRequest: access.bloodRequest.requesterId === access.user.id && access.bloodRequest.reviewState === "needs_information"
      ? {
          reason: informationRequest?.reason ?? "Please contact the moderator for additional details.",
          response: informationResponse ?? null,
          canRespond: !informationResponse || !informationRequest || informationResponse.createdAt <= informationRequest.createdAt,
        }
      : null,
    canManageRequest: access.bloodRequest.requesterId === access.user.id || access.isModerator,
  });
}

export async function PATCH(request: Request, context: { params: { requestId: string } }) {
  if (!requestIdSchema.safeParse(context.params.requestId).success) {
    return NextResponse.json({ error: "Invalid request ID." }, { status: 400 });
  }
  const body = actionSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Action must be fulfilled or cancelled." }, { status: 400 });
  const access = await authorize(context.params.requestId);
  if ("response" in access) return access.response;
  const isRequesterOwner = access.bloodRequest.requesterId === access.user.id;
  if (!isRequesterOwner && !access.isModerator) {
    return NextResponse.json({ error: "Only the requester or an authorized moderator can close this request." }, { status: 403 });
  }
  if (access.bloodRequest.status !== "active") {
    return NextResponse.json({ error: "Only an active request can be fulfilled or cancelled." }, { status: 409 });
  }
  const [updated] = await db.update(bloodRequests).set({
        status: body.data.action,
        reviewState: "open",
    updatedAt: new Date(),
  }).where(and(eq(bloodRequests.id, access.bloodRequest.id), eq(bloodRequests.status, "active")))
    .returning({ id: bloodRequests.id });
  if (!updated) return NextResponse.json({ error: "Request status changed; refresh the tracker." }, { status: 409 });
  return NextResponse.json({ success: true, status: body.data.action });
}
