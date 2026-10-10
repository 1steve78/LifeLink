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
  console.log("\n[POST /api/requests] ════════════ REQUEST RECEIVED ════════════");

  // ── Step 1: Auth ──────────────────────────────────────────────────────────
  console.log("[POST /api/requests] [1/11] Authenticating user...");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("[POST /api/requests] [1/11] ❌ 401 — auth failed:", authError?.message ?? "no user session");
    return NextResponse.json({ error: "Sign in before submitting a blood request." }, { status: 401 });
  }
  console.log("[POST /api/requests] [1/11] ✅ userId:", user.id, "| email:", user.email);

  // ── Step 2: Profile / Role ────────────────────────────────────────────────
  console.log("[POST /api/requests] [2/11] Loading profile from DB...");
  const [profile] = await db.select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  console.log("[POST /api/requests] [2/11] profile found:", JSON.stringify(profile ?? null));
  if (!profile || profile.role !== "requester") {
    console.error("[POST /api/requests] [2/11] ❌ 403 — profile check failed. role:", profile?.role ?? "NO PROFILE");
    return NextResponse.json({ error: "A requester account is required to submit this form." }, { status: 403 });
  }
  console.log("[POST /api/requests] [2/11] ✅ role:", profile.role);

  // ── Step 3: Rate limit ────────────────────────────────────────────────────
  console.log("[POST /api/requests] [3/11] Checking rate limit...");
  const limit = await consumeRateLimit(request, user.id, "blood-request-create", { limit: 50, windowSeconds: 60 * 60 });
  console.log("[POST /api/requests] [3/11] rate limit result:", JSON.stringify(limit));
  if (!limit.allowed) {
    console.error("[POST /api/requests] [3/11] ❌ 429 — rate limit exceeded");
    return NextResponse.json({ error: "You have reached the request limit. Try again in 24 hours." }, { status: 429 });
  }
  console.log("[POST /api/requests] [3/11] ✅ rate limit OK");

  // ── Step 4: Parse form data ───────────────────────────────────────────────
  console.log("[POST /api/requests] [4/11] Parsing multipart form data...");
  let formData: FormData;
  try {
    formData = await request.formData();
    const allKeys = [...formData.keys()];
    console.log("[POST /api/requests] [4/11] ✅ form keys present:", JSON.stringify(allKeys));
  } catch (err) {
    console.error("[POST /api/requests] [4/11] ❌ 400 — formData parse threw:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Send the request as multipart form data." }, { status: 400 });
  }

  // ── Step 5: Extract & log every individual field ──────────────────────────
  console.log("[POST /api/requests] [5/11] Extracting individual fields...");
  const rawLatitude  = formData.get("latitude");
  const rawLongitude = formData.get("longitude");
  const rawPatientAge = formData.get("patientAge");
  console.log("[POST /api/requests] [5/11] patientName      :", JSON.stringify(formData.get("patientName")));
  console.log("[POST /api/requests] [5/11] patientReference :", JSON.stringify(formData.get("patientReference")));
  console.log("[POST /api/requests] [5/11] patientAge (raw) :", JSON.stringify(rawPatientAge), "→ coerced to:", rawPatientAge ? Number(rawPatientAge) : "(falsy → undefined)");
  console.log("[POST /api/requests] [5/11] contactPersonName:", JSON.stringify(formData.get("contactPersonName")));
  console.log("[POST /api/requests] [5/11] contactPhone     :", JSON.stringify(formData.get("contactPhone")));
  console.log("[POST /api/requests] [5/11] bloodGroup       :", JSON.stringify(formData.get("bloodGroup")));
  console.log("[POST /api/requests] [5/11] unitsNeeded      :", JSON.stringify(formData.get("unitsNeeded")));
  console.log("[POST /api/requests] [5/11] hospitalName     :", JSON.stringify(formData.get("hospitalName")));
  console.log("[POST /api/requests] [5/11] hospitalAddress  :", JSON.stringify(formData.get("hospitalAddress")));
  console.log("[POST /api/requests] [5/11] latitude  (raw)  :", JSON.stringify(rawLatitude), "→ passed as:", rawLatitude || undefined);
  console.log("[POST /api/requests] [5/11] longitude (raw)  :", JSON.stringify(rawLongitude), "→ passed as:", rawLongitude || undefined);
  console.log("[POST /api/requests] [5/11] urgency          :", JSON.stringify(formData.get("urgency")));
  console.log("[POST /api/requests] [5/11] requiredBy       :", JSON.stringify(formData.get("requiredBy")));
  console.log("[POST /api/requests] [5/11] documentAiConsent:", JSON.stringify(formData.get("documentAiConsent")));
  const docField = formData.get("document");
  console.log("[POST /api/requests] [5/11] document field   :", docField instanceof File
    ? `File { name="${docField.name}", type="${docField.type}", size=${docField.size} }`
    : `${typeof docField} = ${JSON.stringify(docField)}`);

  // ── Step 6: Field validation ──────────────────────────────────────────────
  console.log("[POST /api/requests] [6/11] Running validateRequestSubmission...");
  const rawFields = {
    patientName: formData.get("patientName") ?? undefined,
    patientReference: formData.get("patientReference") ?? undefined,
    patientAge: formData.get("patientAge") || undefined,
    contactPersonName: formData.get("contactPersonName") ?? undefined,
    contactPhone: formData.get("contactPhone") ?? undefined,
    bloodGroup: formData.get("bloodGroup"),
    unitsNeeded: formData.get("unitsNeeded"),
    hospitalName: formData.get("hospitalName"),
    hospitalAddress: formData.get("hospitalAddress") ?? undefined,
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    urgency: formData.get("urgency"),
    requiredBy: formData.get("requiredBy"),
  };
  const submission = validateRequestSubmission(rawFields);
  if (!submission.success) {
    console.error("[POST /api/requests] [6/11] ❌ 422 — field validation FAILED");
    console.error("[POST /api/requests] [6/11]    errors:", JSON.stringify(submission.errors, null, 2));
    return NextResponse.json({ error: "Some request details need attention.", fields: submission.errors }, { status: 422 });
  }
  console.log("[POST /api/requests] [6/11] ✅ validation passed");
  console.log("[POST /api/requests] [6/11]    patientName    :", submission.data.patientName);
  console.log("[POST /api/requests] [6/11]    patientRef     :", submission.data.patientReference);
  console.log("[POST /api/requests] [6/11]    latitude       :", submission.data.latitude);
  console.log("[POST /api/requests] [6/11]    longitude      :", submission.data.longitude);
  console.log("[POST /api/requests] [6/11]    urgency        :", submission.data.urgency);
  console.log("[POST /api/requests] [6/11]    requiredByDate :", submission.data.requiredByDate.toISOString());
  console.log("[POST /api/requests] [6/11]    hoursUntilNeeded:", ((submission.data.requiredByDate.getTime() - Date.now()) / 3_600_000).toFixed(2), "h");

  // ── Step 7: Document presence ─────────────────────────────────────────────
  console.log("[POST /api/requests] [7/11] Checking document field is a File...");
  const document = formData.get("document");
  if (!(document instanceof File)) {
    console.error("[POST /api/requests] [7/11] ❌ 422 — document is NOT a File. Got:", typeof document, JSON.stringify(document));
    return NextResponse.json({ error: "Attach a hospital requisition or other supporting document." }, { status: 422 });
  }
  console.log("[POST /api/requests] [7/11] ✅ document is a File:", document.name, "|", document.type, "|", document.size, "bytes");

  // ── Step 8: AI consent ────────────────────────────────────────────────────
  console.log("[POST /api/requests] [8/11] Checking documentAiConsent...");
  const consentValue = formData.get("documentAiConsent");
  console.log("[POST /api/requests] [8/11] consentValue raw:", JSON.stringify(consentValue), "| strictly === 'true':", consentValue === "true");
  if (consentValue !== "true") {
    console.error("[POST /api/requests] [8/11] ❌ 422 — AI consent not 'true'");
    return NextResponse.json({ error: "Consent is required to analyze the supporting document." }, { status: 422 });
  }
  console.log("[POST /api/requests] [8/11] ✅ consent granted");

  // ── Step 9: Document byte validation ─────────────────────────────────────
  console.log("[POST /api/requests] [9/11] Running validateSupportingDocument...");
  console.log("[POST /api/requests] [9/11]   file.name:", document.name);
  console.log("[POST /api/requests] [9/11]   file.type:", document.type);
  console.log("[POST /api/requests] [9/11]   file.size:", document.size, "bytes (max 10485760)");
  let validatedDocument;
  try {
    validatedDocument = await validateSupportingDocument(document);
    console.log("[POST /api/requests] [9/11] ✅ document valid — mimeType:", validatedDocument.mimeType, "| extension:", validatedDocument.extension, "| byteLength:", validatedDocument.bytes.byteLength);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "The document could not be validated.";
    console.error("[POST /api/requests] [9/11] ❌ 422 — validateSupportingDocument threw:", msg);
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  // ── Step 10: Storage upload ───────────────────────────────────────────────
  const requestId = randomUUID();
  const objectPath = `${user.id}/${requestId}/supporting-document${validatedDocument.extension}`;
  console.log("[POST /api/requests] [10/11] Uploading document to storage...");
  console.log("[POST /api/requests] [10/11]   bucket:", DOCUMENT_BUCKET);
  console.log("[POST /api/requests] [10/11]   path  :", objectPath);
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(objectPath, validatedDocument.bytes, {
      contentType: validatedDocument.mimeType,
      cacheControl: "0",
      upsert: false,
    });
  if (uploadError) {
    console.error("[POST /api/requests] [10/11] ❌ 503 — storage upload failed:", uploadError.message);
    return NextResponse.json({ error: "Secure document storage is unavailable. The request was not submitted." }, { status: 503 });
  }
  console.log("[POST /api/requests] [10/11] ✅ document uploaded");

  // ── Step 11: DB transaction ───────────────────────────────────────────────
  const documentSha256 = createHash("sha256").update(validatedDocument.bytes).digest("hex");
  console.log("[POST /api/requests] [11/11] Starting DB transaction...");
  console.log("[POST /api/requests] [11/11]   requestId    :", requestId);
  console.log("[POST /api/requests] [11/11]   documentSha256:", documentSha256);
  try {
    await db.transaction(async (tx) => {
      console.log("[POST /api/requests] [11/11]   inserting bloodRequests row...");
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
      console.log("[POST /api/requests] [11/11]   ✅ bloodRequests row inserted");

      console.log("[POST /api/requests] [11/11]   inserting 3 verification events...");
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
      console.log("[POST /api/requests] [11/11]   ✅ verification events inserted");
    });
  } catch (err) {
    console.error("[POST /api/requests] [11/11] ❌ 500 — DB transaction threw:", err instanceof Error ? err.message : err);
    console.error("[POST /api/requests] [11/11]   rolling back — removing uploaded document from storage");
    await supabase.storage.from(DOCUMENT_BUCKET).remove([objectPath]);
    return NextResponse.json({ error: "The request could not be saved. No donor notification was sent." }, { status: 500 });
  }

  console.log("[POST /api/requests] ════════════ SUCCESS 201 — requestId:", requestId, "════════════\n");
  return NextResponse.json({
    requestId,
    status: "pending_verification",
    message: "Request saved for verification. It is not visible to donors yet.",
  }, { status: 201 });
}
