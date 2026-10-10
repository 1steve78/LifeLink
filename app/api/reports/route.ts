import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { abuseReports, bloodRequests, donorPledges, profiles } from "@/lib/db/schema";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { isAuthorizedModerator } from "@/lib/verification/moderator-auth";

const createSchema = z.object({
  targetType: z.enum(["request", "pledge"]),
  targetId: z.string().uuid(),
  reason: z.enum(["fraud", "inaccurate", "harassment", "other"]),
});
const updateSchema = z.object({ reportId: z.string().uuid(), status: z.enum(["reviewed", "dismissed"]) });

async function currentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }) };
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  return { supabase, user, role: profile?.role };
}

export async function POST(request: Request) {
  const auth = await currentUser();
  if ("response" in auth) return auth.response;
  const limit = await consumeRateLimit(request, auth.user.id, "abuse-report", { limit: 10, windowSeconds: 24 * 60 * 60 });
  if (!limit.allowed) return NextResponse.json({ error: "You have reached the report limit. Try again later." }, { status: 429 });
  const body = createSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Choose a valid item and report reason." }, { status: 400 });

  if (body.data.targetType === "request") {
    const [target] = await db.select({ requesterId: bloodRequests.requesterId, status: bloodRequests.status }).from(bloodRequests)
      .where(eq(bloodRequests.id, body.data.targetId)).limit(1);
    if (!target) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    if (target.status !== "active") return NextResponse.json({ error: "Only active requests can be reported." }, { status: 409 });
    if (target.requesterId === auth.user.id) return NextResponse.json({ error: "You cannot report your own request." }, { status: 400 });
  } else {
    const [target] = await db.select({ donorId: donorPledges.donorId, requesterId: bloodRequests.requesterId, requestStatus: bloodRequests.status })
      .from(donorPledges).innerJoin(bloodRequests, eq(donorPledges.requestId, bloodRequests.id))
      .where(eq(donorPledges.id, body.data.targetId)).limit(1);
    if (!target) return NextResponse.json({ error: "Pledge not found." }, { status: 404 });
    if (target.requestStatus !== "active") return NextResponse.json({ error: "Only pledges on active requests can be reported." }, { status: 409 });
    if (target.donorId === auth.user.id || target.requesterId === auth.user.id) {
      return NextResponse.json({ error: "You cannot report your own pledge." }, { status: 400 });
    }
  }

  const [recentDuplicate] = await db.select({ id: abuseReports.id }).from(abuseReports).where(and(
    eq(abuseReports.reporterId, auth.user.id),
    eq(abuseReports.targetType, body.data.targetType),
    eq(abuseReports.targetId, body.data.targetId),
    eq(abuseReports.status, "open"),
  )).orderBy(desc(abuseReports.createdAt)).limit(1);
  if (recentDuplicate) return NextResponse.json({ error: "You already reported this item; moderators will review it." }, { status: 409 });

  const inserted = await db.insert(abuseReports).values({
    reporterId: auth.user.id,
    targetType: body.data.targetType,
    targetId: body.data.targetId,
    reason: body.data.reason,
  }).onConflictDoNothing().returning({ id: abuseReports.id });
  if (!inserted.length) return NextResponse.json({ error: "You already reported this item; moderators will review it." }, { status: 409 });
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function GET() {
  const auth = await currentUser();
  if ("response" in auth) return auth.response;
  const allowlistedIds = (process.env.MODERATOR_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!isAuthorizedModerator(auth.user.id, auth.role, allowlistedIds)) {
    return NextResponse.json({ error: "Moderator access required." }, { status: 403 });
  }
  const reports = await db.select({
    id: abuseReports.id,
    targetType: abuseReports.targetType,
    targetId: abuseReports.targetId,
    reason: abuseReports.reason,
    status: abuseReports.status,
    createdAt: abuseReports.createdAt,
  }).from(abuseReports).orderBy(desc(abuseReports.createdAt)).limit(100);
  return NextResponse.json({ reports });
}

export async function PATCH(request: Request) {
  const auth = await currentUser();
  if ("response" in auth) return auth.response;
  const allowlistedIds = (process.env.MODERATOR_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!isAuthorizedModerator(auth.user.id, auth.role, allowlistedIds)) {
    return NextResponse.json({ error: "Moderator access required." }, { status: 403 });
  }
  const body = updateSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Choose a valid report and status." }, { status: 400 });
  const [updated] = await db.update(abuseReports).set({
    status: body.data.status,
    reviewedBy: auth.user.id,
    reviewedAt: new Date(),
  }).where(and(eq(abuseReports.id, body.data.reportId), eq(abuseReports.status, "open")))
    .returning({ id: abuseReports.id });
  if (!updated) return NextResponse.json({ error: "Open report not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
