import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const locationSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Sign in to update your location." }, { status: 401 });
  }

  const body = locationSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Enter valid latitude and longitude coordinates." }, { status: 400 });
  }

  const [profile] = await db.select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (profile?.role !== "donor") {
    return NextResponse.json({ error: "A donor account is required to save matching coordinates." }, { status: 403 });
  }

  await db.update(profiles).set({
    location: `SRID=4326;POINT(${body.data.longitude} ${body.data.latitude})`,
    updatedAt: new Date(),
  }).where(eq(profiles.id, user.id));

  return NextResponse.json({ success: true });
}
