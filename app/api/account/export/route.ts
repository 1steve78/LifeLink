import { eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { abuseReports, bloodRequests, donationReports, donorNotifications, donorPledges, moderationAuditEvents, profiles, requesterInformationResponses, requestTrackerEvents, requestVerificationEvents } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { hasRecentAuthentication } from "@/lib/security/recent-auth";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to export your data." }, { status: 401 });
  if (!await hasRecentAuthentication(supabase)) {
    return NextResponse.json({ error: "Sign in again to confirm your identity before exporting data." }, { status: 403 });
  }
  const limit = await consumeRateLimit(request, user.id, "account-export", { limit: 5, windowSeconds: 24 * 60 * 60 });
  if (!limit.allowed) return NextResponse.json({ error: "Too many export requests. Try again tomorrow." }, { status: 429 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  const requests = await db.select().from(bloodRequests).where(eq(bloodRequests.requesterId, user.id));
  const requestIds = requests.map((row) => row.id);
  const pledges = await db.select().from(donorPledges).where(eq(donorPledges.donorId, user.id));
  const pledgeIds = pledges.map((row) => row.id);
  const [notifications, reports] = await Promise.all([
    db.select().from(donorNotifications).where(eq(donorNotifications.donorId, user.id)),
    db.select().from(abuseReports).where(eq(abuseReports.reporterId, user.id)),
  ]);
  const [donations, responses, trackerEvents, verificationEvents, requestModerationHistory, moderationHistory] = await Promise.all([
    pledgeIds.length || requestIds.length ? db.select().from(donationReports)
      .innerJoin(donorPledges, eq(donationReports.pledgeId, donorPledges.id))
      .where(pledgeIds.length && requestIds.length
        ? or(
            inArray(donationReports.pledgeId, pledgeIds),
            inArray(donorPledges.requestId, requestIds),
          )
        : pledgeIds.length
          ? inArray(donationReports.pledgeId, pledgeIds)
          : inArray(donorPledges.requestId, requestIds)) : [],
    db.select().from(requesterInformationResponses).where(eq(requesterInformationResponses.requesterId, user.id)),
    requestIds.length ? db.select().from(requestTrackerEvents).where(inArray(requestTrackerEvents.requestId, requestIds)) : [],
    requestIds.length ? db.select().from(requestVerificationEvents).where(inArray(requestVerificationEvents.requestId, requestIds)) : [],
    requestIds.length ? db.select().from(moderationAuditEvents).where(inArray(moderationAuditEvents.requestId, requestIds)) : [],
    db.select().from(moderationAuditEvents).where(eq(moderationAuditEvents.moderatorId, user.id)),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, createdAt: user.created_at },
    profile,
    requests,
    donorPledges: pledges,
    donationReports: donations,
    notifications,
    submittedReports: reports,
    requesterResponses: responses,
    requestTrackerEvents: trackerEvents,
    verificationEvents: verificationEvents.map(({ details, ...event }) => ({ ...event, details })),
    requestModerationHistory,
    moderationHistory,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="lifelink-data-${user.id}.json"`,
      "cache-control": "private, no-store",
    },
  });
}
