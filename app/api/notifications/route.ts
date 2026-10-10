import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { bloodRequests, donorNotifications, profiles } from "@/lib/db/schema";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to view notifications." }, { status: 401 });
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "donor") return NextResponse.json({ error: "Donor account required." }, { status: 403 });

  const notifications = await db.select({
    id: donorNotifications.id,
    requestId: bloodRequests.id,
    createdAt: donorNotifications.createdAt,
    readAt: donorNotifications.readAt,
    bloodGroup: bloodRequests.bloodGroup,
    unitsNeeded: bloodRequests.unitsNeeded,
    hospitalName: bloodRequests.hospitalName,
    hospitalAddress: bloodRequests.hospitalAddress,
    urgency: bloodRequests.urgency,
    requiredBy: bloodRequests.requiredBy,
  }).from(donorNotifications)
    .innerJoin(bloodRequests, eq(donorNotifications.requestId, bloodRequests.id))
    .where(and(
      eq(donorNotifications.donorId, user.id),
      eq(bloodRequests.status, "active"),
      or(isNull(bloodRequests.requiredBy), gt(bloodRequests.requiredBy, new Date())),
    ))
    .orderBy(desc(donorNotifications.createdAt)).limit(100);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to update notifications." }, { status: 401 });
  const body = await request.json().catch(() => null) as { notificationId?: unknown } | null;
  if (typeof body?.notificationId !== "string") return NextResponse.json({ error: "A notificationId is required." }, { status: 400 });
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "donor") return NextResponse.json({ error: "Donor account required." }, { status: 403 });
  const [updated] = await db.update(donorNotifications).set({ readAt: new Date() }).where(and(
    eq(donorNotifications.id, body.notificationId),
    eq(donorNotifications.donorId, user.id),
  )).returning({ id: donorNotifications.id });
  if (!updated) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
