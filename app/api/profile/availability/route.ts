import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ available: z.boolean() });
const AVAILABILITY_HOURS = 72;

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to update donor availability." }, { status: 401 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Availability must be true or false." }, { status: 400 });

  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (profile?.role !== "donor") return NextResponse.json({ error: "Donor account required." }, { status: 403 });
  const expiresAt = body.data.available ? new Date(Date.now() + AVAILABILITY_HOURS * 60 * 60 * 1000) : null;
  const [updated] = await db.update(profiles).set({
    availableToDonate: body.data.available,
    availabilityExpiresAt: expiresAt,
    updatedAt: new Date(),
  }).where(eq(profiles.id, user.id)).returning({ availableToDonate: profiles.availableToDonate, availabilityExpiresAt: profiles.availabilityExpiresAt });
  return NextResponse.json({ success: true, ...updated, availabilityHours: AVAILABILITY_HOURS });
}
