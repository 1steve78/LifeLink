import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { bloodRequests, profiles } from "@/lib/db/schema";
import { isAuthorizedModerator } from "@/lib/verification/moderator-auth";

export const runtime = "nodejs";
const DOCUMENT_BUCKET = "blood-request-documents";

export async function GET(_request: Request, context: { params: { requestId: string } }) {
  if (!z.string().uuid().safeParse(context.params.requestId).success) {
    return NextResponse.json({ error: "Invalid request ID." }, { status: 400 });
  }
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to view this document." }, { status: 401 });
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  const allowlistedIds = (process.env.MODERATOR_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!isAuthorizedModerator(user.id, profile?.role, allowlistedIds)) {
    return NextResponse.json({ error: "Moderator access required." }, { status: 403 });
  }
  const [bloodRequest] = await db.select({ path: bloodRequests.supportingDocumentPath })
    .from(bloodRequests).where(eq(bloodRequests.id, context.params.requestId)).limit(1);
  if (!bloodRequest?.path) return NextResponse.json({ error: "Supporting document not found." }, { status: 404 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Private document access is not configured on the server." }, { status: 503 });
  }
  const admin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error: signingError } = await admin.storage.from(DOCUMENT_BUCKET).createSignedUrl(bloodRequest.path, 300);
  if (signingError || !data?.signedUrl) return NextResponse.json({ error: "Could not open the private document." }, { status: 503 });
  return NextResponse.json({ url: data.signedUrl, expiresIn: 300 });
}
