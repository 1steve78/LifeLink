import { createHash, randomUUID } from "node:crypto";
import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { bloodRequests, moderationAuditEvents, profiles, requestVerificationEvents, requesterInformationResponses } from "@/lib/db/schema";
import { validateRequestSubmission, validateSupportingDocument } from "@/lib/verification/validate-request";
import { isAuthorizedModerator } from "@/lib/verification/moderator-auth";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const DOCUMENT_BUCKET = "blood-request-documents";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to view requests." }, { status: 401 });

  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (!profile) return NextResponse.json({ error: "Requester profile not found." }, { status: 403 });

  const allowlistedIds = (process.env.MODERATOR_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  const isAllowlistedModerator = isAuthorizedModerator(user.id, profile.role, allowlistedIds);
  const rows = isAllowlistedModerator
    ? await db.select({
        id: bloodRequests.id,
        requesterId: bloodRequests.requesterId,
        patientName: bloodRequests.patientName,
        patientReference: bloodRequests.patientReference,
        patientAge: bloodRequests.patientAge,
        contactPersonName: bloodRequests.contactPersonName,
        contactPhone: bloodRequests.contactPhone,
        bloodGroup: bloodRequests.bloodGroup,
        unitsNeeded: bloodRequests.unitsNeeded,
        hospitalName: bloodRequests.hospitalName,
        hospitalAddress: bloodRequests.hospitalAddress,
        urgency: bloodRequests.urgency,
        requiredBy: bloodRequests.requiredBy,
        status: bloodRequests.status,
        reviewState: bloodRequests.reviewState,
        createdAt: bloodRequests.createdAt,
      }).from(bloodRequests).where(inArray(bloodRequests.status, ["pending_verification", "under_review"]))
        .orderBy(desc(bloodRequests.createdAt)).limit(100)
    : profile.role === "requester"
      ? await db.select({
          id: bloodRequests.id,
          requesterId: bloodRequests.requesterId,
          bloodGroup: bloodRequests.bloodGroup,
          unitsNeeded: bloodRequests.unitsNeeded,
          hospitalName: bloodRequests.hospitalName,
          hospitalAddress: bloodRequests.hospitalAddress,
          urgency: bloodRequests.urgency,
          requiredBy: bloodRequests.requiredBy,
          status: bloodRequests.status,
        reviewState: bloodRequests.reviewState,
          createdAt: bloodRequests.createdAt,
        }).from(bloodRequests).where(eq(bloodRequests.requesterId, user.id))
          .orderBy(desc(bloodRequests.createdAt)).limit(50)
      : null;

  if (!rows) return NextResponse.json({ error: "This account cannot view blood requests." }, { status: 403 });
  const requestIds = rows.map((row) => row.id);
  const events = isAllowlistedModerator && requestIds.length
    ? await db.select({
        requestId: requestVerificationEvents.requestId,
        gate: requestVerificationEvents.gate,
        status: requestVerificationEvents.status,
        details: requestVerificationEvents.details,
        model: requestVerificationEvents.model,
        createdAt: requestVerificationEvents.createdAt,
      }).from(requestVerificationEvents).where(inArray(requestVerificationEvents.requestId, requestIds))
        .orderBy(desc(requestVerificationEvents.createdAt))
    : [];
  const informationResponses = isAllowlistedModerator && requestIds.length
    ? await db.select({ requestId: requesterInformationResponses.requestId, message: requesterInformationResponses.message, createdAt: requesterInformationResponses.createdAt })
      .from(requesterInformationResponses).where(inArray(requesterInformationResponses.requestId, requestIds))
      .orderBy(desc(requesterInformationResponses.createdAt))
    : [];
  const moderationHistory = isAllowlistedModerator && requestIds.length
    ? await db.select({
        requestId: moderationAuditEvents.requestId,
        moderatorId: moderationAuditEvents.moderatorId,
        action: moderationAuditEvents.action,
        previousStatus: moderationAuditEvents.previousStatus,
        newStatus: moderationAuditEvents.newStatus,
        reason: moderationAuditEvents.reason,
        createdAt: moderationAuditEvents.createdAt,
      }).from(moderationAuditEvents).where(inArray(moderationAuditEvents.requestId, requestIds))
      .orderBy(desc(moderationAuditEvents.createdAt))
    : [];

  return NextResponse.json({
    requests: rows.map((row) => ({
      ...row,
      verification: isAllowlistedModerator ? events.filter((event) => event.requestId === row.id) : undefined,
      informationResponses: isAllowlistedModerator ? informationResponses.filter((response) => response.requestId === row.id) : undefined,
      moderationHistory: isAllowlistedModerator ? moderationHistory.filter((event) => event.requestId === row.id) : undefined,
    })),
    isModerator: isAllowlistedModerator,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sign in before submitting a blood request." }, { status: 401 });
  }

  const [profile] = await db.select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!profile || profile.role !== "requester") {
    return NextResponse.json({ error: "A requester account is required to submit this form." }, { status: 403 });
  }

  const limit = await consumeRateLimit(request, user.id, "blood-request-create", { limit: 3, windowSeconds: 24 * 60 * 60 });
  if (!limit.allowed) return NextResponse.json({ error: "You have reached the request limit. Try again in 24 hours." }, { status: 429 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Send the request as multipart form data." }, { status: 400 });
  }

  const submission = validateRequestSubmission({
    patientName: formData.get("patientName"),
    patientReference: formData.get("patientReference"),
    patientAge: formData.get("patientAge") || undefined,
    contactPersonName: formData.get("contactPersonName"),
    contactPhone: formData.get("contactPhone"),
    bloodGroup: formData.get("bloodGroup"),
    unitsNeeded: formData.get("unitsNeeded"),
    hospitalName: formData.get("hospitalName"),
    hospitalAddress: formData.get("hospitalAddress"),
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    urgency: formData.get("urgency"),
    requiredBy: formData.get("requiredBy"),
  });
  if (!submission.success) {
    return NextResponse.json({ error: "Some request details need attention.", fields: submission.errors }, { status: 422 });
  }

  const document = formData.get("document");
  if (!(document instanceof File)) {
    return NextResponse.json({ error: "Attach a hospital requisition or other supporting document." }, { status: 422 });
  }
  if (formData.get("documentAiConsent") !== "true") {
    return NextResponse.json({ error: "Consent is required to analyze the supporting document." }, { status: 422 });
  }

  let validatedDocument;
  try {
    validatedDocument = await validateSupportingDocument(document);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The document could not be validated." }, { status: 422 });
  }

  const requestId = randomUUID();
  const objectPath = `${user.id}/${requestId}/supporting-document${validatedDocument.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(objectPath, validatedDocument.bytes, {
      contentType: validatedDocument.mimeType,
      cacheControl: "0",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Secure document storage is unavailable. The request was not submitted." }, { status: 503 });
  }

  const documentSha256 = createHash("sha256").update(validatedDocument.bytes).digest("hex");
  try {
    await db.transaction(async (tx) => {
      await tx.insert(bloodRequests).values({
        id: requestId,
        requesterId: user.id,
        patientName: submission.data.patientName,
        patientReference: submission.data.patientReference,
        patientAge: submission.data.patientAge,
        contactPersonName: submission.data.contactPersonName,
        contactPhone: submission.data.contactPhone,
        bloodGroup: submission.data.bloodGroup,
        unitsNeeded: submission.data.unitsNeeded,
        hospitalName: submission.data.hospitalName,
        hospitalAddress: submission.data.hospitalAddress,
        hospitalLocation: submission.data.latitude !== null && submission.data.longitude !== null
          ? `SRID=4326;POINT(${submission.data.longitude} ${submission.data.latitude})`
          : null,
        urgency: submission.data.urgency,
        requiredBy: submission.data.requiredByDate,
        supportingDocumentPath: objectPath,
        documentSha256,
        status: "pending_verification",
        verificationPassed: false,
      });
      await tx.insert(requestVerificationEvents).values([
        {
          requestId,
          gate: "basic_validation",
          status: "passed",
          performedBy: user.id,
          details: { fieldValidation: "passed", documentSignature: validatedDocument.mimeType, documentBytes: validatedDocument.bytes.byteLength },
        },
        {
          requestId,
          gate: "document_analysis",
          status: "pending",
          details: { reason: "Awaiting document analysis." },
        },
        {
          requestId,
          gate: "risk_screening",
          status: "pending",
          details: { reason: "Awaiting risk screening." },
        },
      ]);
    });
  } catch {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([objectPath]);
    return NextResponse.json({ error: "The request could not be saved. No donor notification was sent." }, { status: 500 });
  }

  return NextResponse.json({
    requestId,
    status: "pending_verification",
    message: "Request saved for verification. It is not visible to donors yet.",
  }, { status: 201 });
}
