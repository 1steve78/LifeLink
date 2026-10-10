import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { bloodRequests, requestVerificationEvents } from "@/lib/db/schema";
import { analyzeHospitalDocument, documentModelName } from "@/lib/verification/nvidia-nim";
import { compareHospitalDocument } from "@/lib/verification/document-comparison";
import { validateSupportingDocument } from "@/lib/verification/validate-request";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const DOCUMENT_BUCKET = "blood-request-documents";
const requestBodySchema = z.object({ requestId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to continue verification." }, { status: 401 });

  const limit = await consumeRateLimit(request, user.id, "ai-document-screen", { limit: 50, windowSeconds: 60 * 60 });
  if (!limit.allowed) return NextResponse.json({ error: "Too many document checks. Wait before trying again." }, { status: 429 });

  const body = requestBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "A valid requestId is required." }, { status: 400 });

  const [bloodRequest] = await db.select().from(bloodRequests).where(and(
    eq(bloodRequests.id, body.data.requestId),
    eq(bloodRequests.requesterId, user.id),
  )).limit(1);

  if (!bloodRequest) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  if (bloodRequest.status !== "pending_verification") {
    return NextResponse.json({ error: "This request is already routed for review." }, { status: 409 });
  }
  const [latestDocumentRun] = await db.select({ status: requestVerificationEvents.status })
    .from(requestVerificationEvents)
    .where(and(
      eq(requestVerificationEvents.requestId, bloodRequest.id),
      eq(requestVerificationEvents.gate, "document_analysis"),
    ))
    .orderBy(desc(requestVerificationEvents.createdAt))
    .limit(1);
  if (latestDocumentRun?.status === "passed") {
    return NextResponse.json({ status: "passed", reasons: [], requestStatus: "pending_verification" });
  }
  if (!bloodRequest.supportingDocumentPath || !bloodRequest.requiredBy) {
    return NextResponse.json({ error: "The request is missing its supporting document or required-by time." }, { status: 409 });
  }

  try {
    const { data: storedFile, error: downloadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .download(bloodRequest.supportingDocumentPath);
    if (downloadError || !storedFile) throw new Error("The private supporting document could not be retrieved.");

    const fileName = bloodRequest.supportingDocumentPath.split("/").pop() ?? "supporting-document";
    const file = new File([storedFile], fileName, { type: storedFile.type });
    const document = await validateSupportingDocument(file);
    const report = await analyzeHospitalDocument(document, {
      patientName: bloodRequest.patientName ?? undefined,
      bloodGroup: bloodRequest.bloodGroup as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-",
      unitsNeeded: bloodRequest.unitsNeeded,
      hospitalName: bloodRequest.hospitalName,
      urgency: bloodRequest.urgency,
      requiredBy: bloodRequest.requiredBy.toISOString(),
      requiredByDate: bloodRequest.requiredBy,
    });

    const comparison = compareHospitalDocument(report, {
      patientName: bloodRequest.patientName ?? undefined,
      bloodGroup: bloodRequest.bloodGroup as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-",
      unitsNeeded: bloodRequest.unitsNeeded,
      hospitalName: bloodRequest.hospitalName,
      urgency: bloodRequest.urgency,
      requiredBy: bloodRequest.requiredBy.toISOString(),
      requiredByDate: bloodRequest.requiredBy,
    });

    await db.transaction(async (tx) => {
      await tx.insert(requestVerificationEvents).values({
        requestId: bloodRequest.id,
        gate: "document_analysis",
        status: comparison.status,
        details: { ...comparison.details, reasons: comparison.reasons },
        model: documentModelName(),
      });
      if (comparison.status === "flagged") {
        await tx.update(bloodRequests).set({
          status: "under_review",
          updatedAt: new Date(),
        }).where(eq(bloodRequests.id, bloodRequest.id));
      }
    });

    return NextResponse.json({ status: comparison.status, reasons: comparison.reasons, requestStatus: comparison.status === "flagged" ? "under_review" : "pending_verification" });
  } catch {
    await db.insert(requestVerificationEvents).values({
      requestId: bloodRequest.id,
      gate: "document_analysis",
      status: "error",
      details: { reason: "Document analysis failed; the request remains pending for retry or moderator review." },
      model: documentModelName(),
    });
    return NextResponse.json({
      error: "Document analysis could not be completed. The request remains pending and has not been sent to donors.",
      requestId: bloodRequest.id,
      status: "pending_verification",
    }, { status: 503 });
  }
}
