import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { bloodRequests } from "@/lib/db/schema";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { hasRecentAuthentication } from "@/lib/security/recent-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const bodySchema = z.object({ confirmation: z.literal("DELETE") });
const DOCUMENT_BUCKET = "blood-request-documents";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });
  const limit = await consumeRateLimit(request, user.id, "account-delete", { limit: 2, windowSeconds: 24 * 60 * 60 });
  if (!limit.allowed) return NextResponse.json({ error: "Deletion attempts are temporarily limited. Try again tomorrow." }, { status: 429 });
  if (!await hasRecentAuthentication(supabase)) {
    return NextResponse.json({ error: "Sign in again before deleting your account." }, { status: 403 });
  }
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Type DELETE to confirm account removal." }, { status: 400 });
  const requests = await db.select({ id: bloodRequests.id, documentPath: bloodRequests.supportingDocumentPath })
    .from(bloodRequests).where(eq(bloodRequests.requesterId, user.id));
  const paths = requests.map((row) => row.documentPath).filter((path): path is string => Boolean(path));
  const admin = createAdminClient();
  for (let i = 0; i < paths.length; i += 100) {
    const { error: storageError } = await admin.storage.from(DOCUMENT_BUCKET).remove(paths.slice(i, i + 100));
    if (storageError) return NextResponse.json({ error: "Private documents could not be removed. Your account is still active; contact support for help." }, { status: 503 });
  }

  const { error: deletionError } = await admin.auth.admin.deleteUser(user.id);
  if (deletionError) return NextResponse.json({ error: "Account deletion could not be completed. Contact support; private documents have already been removed." }, { status: 503 });
  await supabase.auth.signOut();
  return NextResponse.json({ success: true, message: "Your account and account-linked data have been deleted." });
}
