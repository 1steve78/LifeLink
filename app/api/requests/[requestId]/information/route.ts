import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { bloodRequests, profiles, requesterInformationResponses } from "@/lib/db/schema";

const idSchema = z.string().uuid();
const bodySchema = z.object({ message: z.string().trim().min(5).max(2000) });

export async function POST(request: Request, context: { params: { requestId: string } }) {
  if (!idSchema.safeParse(context.params.requestId).success) return NextResponse.json({ error: "Invalid request ID." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to respond to the information request." }, { status: 401 });
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "requester") return NextResponse.json({ error: "Requester account required." }, { status: 403 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Provide a response between 5 and 2000 characters." }, { status: 422 });
  const [bloodRequest] = await db.select({ id: bloodRequests.id }).from(bloodRequests).where(and(
    eq(bloodRequests.id, context.params.requestId),
    eq(bloodRequests.requesterId, user.id),
    eq(bloodRequests.status, "under_review"),
    eq(bloodRequests.reviewState, "needs_information"),
  )).limit(1);
  if (!bloodRequest) return NextResponse.json({ error: "There is no open information request for this request." }, { status: 409 });
  await db.insert(requesterInformationResponses).values({ requestId: bloodRequest.id, requesterId: user.id, message: body.data.message });
  return NextResponse.json({ success: true, message: "Your response was sent to the moderator queue." }, { status: 201 });
}
