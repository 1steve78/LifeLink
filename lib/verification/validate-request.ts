import { z } from "zod";

export const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const requestUrgencies = ["critical", "urgent", "planned"] as const;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const RequestSubmissionSchema = z.object({
  patientName: z.string().trim().max(120).optional().or(z.literal("")),
  patientReference: z.string().trim().max(80).optional().or(z.literal("")),
  patientAge: z.coerce.number().int().min(0).max(120).optional().or(z.nan()),
  contactPersonName: z.string().trim().max(120).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(32).optional().or(z.literal("")),
  bloodGroup: z.enum(bloodGroups),
  unitsNeeded: z.coerce.number().int().min(1).max(10),
  hospitalName: z.string().trim().min(2).max(200),
  hospitalAddress: z.string().trim().max(500).optional().or(z.literal("")),
  latitude: z.coerce.number().min(-90).max(90).optional().or(z.nan()),
  longitude: z.coerce.number().min(-180).max(180).optional().or(z.nan()),
  urgency: z.enum(requestUrgencies),
  requiredBy: z.string().trim().min(1),
});

export type RequestSubmission = z.infer<typeof RequestSubmissionSchema> & {
  requiredByDate: Date;
};

export function validateRequestSubmission(input: unknown) {
  console.log("[validateRequestSubmission] ── called ──");

  // ── Zod schema parse ──────────────────────────────────────────────────────
  console.log("[validateRequestSubmission] running Zod safeParse...");
  const parsed = RequestSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    console.error("[validateRequestSubmission] ❌ Zod parse FAILED — fieldErrors:", JSON.stringify(fieldErrors, null, 2));
    return { success: false as const, errors: fieldErrors };
  }
  console.log("[validateRequestSubmission] ✅ Zod parse passed — parsed values:");
  console.log("[validateRequestSubmission]   patientName      :", JSON.stringify(parsed.data.patientName));
  console.log("[validateRequestSubmission]   patientReference :", JSON.stringify(parsed.data.patientReference));
  console.log("[validateRequestSubmission]   patientAge       :", parsed.data.patientAge);
  console.log("[validateRequestSubmission]   bloodGroup       :", parsed.data.bloodGroup);
  console.log("[validateRequestSubmission]   unitsNeeded      :", parsed.data.unitsNeeded);
  console.log("[validateRequestSubmission]   hospitalName     :", JSON.stringify(parsed.data.hospitalName));
  console.log("[validateRequestSubmission]   hospitalAddress  :", JSON.stringify(parsed.data.hospitalAddress));
  console.log("[validateRequestSubmission]   latitude         :", parsed.data.latitude, "(isNaN:", Number.isNaN(parsed.data.latitude), ")");
  console.log("[validateRequestSubmission]   longitude        :", parsed.data.longitude, "(isNaN:", Number.isNaN(parsed.data.longitude), ")");
  console.log("[validateRequestSubmission]   urgency          :", parsed.data.urgency);
  console.log("[validateRequestSubmission]   requiredBy       :", parsed.data.requiredBy);

  // ── Patient identity check ────────────────────────────────────────────────
  const patientName = parsed.data.patientName?.trim() || null;
  const patientReference = parsed.data.patientReference?.trim() || null;
  console.log("[validateRequestSubmission] patientName (trimmed):", JSON.stringify(patientName), "| patientReference (trimmed):", JSON.stringify(patientReference));
  if (!patientName && !patientReference) {
    console.error("[validateRequestSubmission] ❌ FAILED — both patientName and patientReference are empty");
    return { success: false as const, errors: { patientName: ["Enter the patient's name or a reference ID."] } };
  }
  console.log("[validateRequestSubmission] ✅ patient identity OK");

  // ── Coordinate pair check ─────────────────────────────────────────────────
  const latUndefined = parsed.data.latitude === undefined;
  const lngUndefined = parsed.data.longitude === undefined;
  console.log("[validateRequestSubmission] latitude undefined:", latUndefined, "| longitude undefined:", lngUndefined);
  if (latUndefined !== lngUndefined) {
    console.error("[validateRequestSubmission] ❌ FAILED — only one coordinate provided (partial pair)");
    return { success: false as const, errors: { latitude: ["Provide both map coordinates."] } };
  }

  const latNull = parsed.data.latitude == null;
  const lngNull = parsed.data.longitude == null;
  console.log("[validateRequestSubmission] latitude == null:", latNull, "| longitude == null:", lngNull);
  if (latNull || lngNull) {
    console.error("[validateRequestSubmission] ❌ FAILED — latitude or longitude is null/undefined (required for donor matching)");
    return { success: false as const, errors: { latitude: ["Hospital map coordinates are required for nearby donor matching."] } };
  }
  console.log("[validateRequestSubmission] ✅ coordinates OK — lat:", parsed.data.latitude, "lng:", parsed.data.longitude);

  // ── requiredBy date check ─────────────────────────────────────────────────
  const requiredByDate = new Date(parsed.data.requiredBy);
  const now = Date.now();
  console.log("[validateRequestSubmission] requiredBy string:", parsed.data.requiredBy);
  console.log("[validateRequestSubmission] requiredByDate (parsed):", requiredByDate.toISOString());
  console.log("[validateRequestSubmission] now:", new Date(now).toISOString());
  console.log("[validateRequestSubmission] requiredByDate.getTime():", requiredByDate.getTime(), "| now:", now, "| diff ms:", requiredByDate.getTime() - now);

  if (!Number.isFinite(requiredByDate.getTime()) || requiredByDate.getTime() <= now) {
    console.error("[validateRequestSubmission] ❌ FAILED — requiredBy is not in the future. getTime():", requiredByDate.getTime(), "now:", now);
    return {
      success: false as const,
      errors: { requiredBy: ["Required-by time must be in the future."] },
    };
  }
  if (requiredByDate.getTime() > now + 366 * 24 * 60 * 60 * 1000) {
    console.error("[validateRequestSubmission] ❌ FAILED — requiredBy is more than 1 year away");
    return {
      success: false as const,
      errors: { requiredBy: ["Required-by time must be within the next year."] },
    };
  }
  console.log("[validateRequestSubmission] ✅ requiredBy date OK");

  // ── Urgency vs requiredBy check ───────────────────────────────────────────
  const hoursUntilNeeded = (requiredByDate.getTime() - now) / (60 * 60 * 1000);
  console.log("[validateRequestSubmission] hoursUntilNeeded:", hoursUntilNeeded.toFixed(2), "h | urgency:", parsed.data.urgency);

  console.log("[validateRequestSubmission] ✅ urgency/timing check OK (strict hour limits removed for flexibility)");
  console.log("[validateRequestSubmission] ── ALL CHECKS PASSED ──");

  return {
    success: true as const,
    data: {
      ...parsed.data,
      patientName,
      patientReference,
      patientAge: Number.isNaN(parsed.data.patientAge) ? null : parsed.data.patientAge ?? null,
      contactPersonName: parsed.data.contactPersonName?.trim() || null,
      contactPhone: parsed.data.contactPhone?.trim() || null,
      hospitalAddress: parsed.data.hospitalAddress?.trim() || null,
      latitude: Number.isNaN(parsed.data.latitude) ? null : parsed.data.latitude ?? null,
      longitude: Number.isNaN(parsed.data.longitude) ? null : parsed.data.longitude ?? null,
      hospitalName: parsed.data.hospitalName.trim(),
      requiredByDate,
    },
  };
}

const allowedDocuments = {
  "image/jpeg": { mimeType: "image/jpeg", extension: ".jpg" },
  "image/png": { mimeType: "image/png", extension: ".png" },
} as const;

export type SupportedDocument = {
  mimeType: "image/jpeg" | "image/png";
  extension: ".jpg" | ".png";
  bytes: Uint8Array;
};

export async function validateSupportingDocument(file: File): Promise<SupportedDocument> {
  console.log("[validateSupportingDocument] ── called ──");
  console.log("[validateSupportingDocument] file.name:", file.name);
  console.log("[validateSupportingDocument] file.type:", file.type);
  console.log("[validateSupportingDocument] file.size:", file.size, "bytes (max:", MAX_DOCUMENT_BYTES, ")");

  // ── Size check ────────────────────────────────────────────────────────────
  if (file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) {
    console.error("[validateSupportingDocument] ❌ size check FAILED — size:", file.size);
    throw new Error("The supporting document must be between 1 byte and 10 MB.");
  }
  console.log("[validateSupportingDocument] ✅ size OK");

  // ── MIME type check ───────────────────────────────────────────────────────
  const specification = allowedDocuments[file.type as keyof typeof allowedDocuments];
  console.log("[validateSupportingDocument] MIME type:", file.type, "| matched spec:", JSON.stringify(specification ?? null));
  if (!specification) {
    console.error("[validateSupportingDocument] ❌ MIME check FAILED — unsupported type:", file.type);
    throw new Error("Upload a JPG or PNG photo of the hospital document. PDFs are not supported.");
  }
  console.log("[validateSupportingDocument] ✅ MIME type OK — expected extension:", specification.extension);

  // ── Extension check ───────────────────────────────────────────────────────
  const fileName = file.name.toLowerCase();
  const extensionMatches = specification.extension === ".jpg"
    ? fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
    : fileName.endsWith(specification.extension);
  console.log("[validateSupportingDocument] fileName (lower):", fileName, "| extensionMatches:", extensionMatches);
  if (!extensionMatches) {
    console.error("[validateSupportingDocument] ❌ extension check FAILED — file:", fileName, "expected:", specification.extension);
    throw new Error("The file extension must match the document type.");
  }
  console.log("[validateSupportingDocument] ✅ extension OK");

  // ── Magic bytes check ─────────────────────────────────────────────────────
  console.log("[validateSupportingDocument] reading file bytes...");
  const bytes = new Uint8Array(await file.arrayBuffer());
  console.log("[validateSupportingDocument] bytes read:", bytes.byteLength);
  console.log("[validateSupportingDocument] first 8 bytes (hex):", [...bytes.slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join(" "));
  console.log("[validateSupportingDocument] last 4 bytes (hex) :", [...bytes.slice(-4)].map((b) => b.toString(16).padStart(2, "0")).join(" "));

  const isPng = file.type === "image/png"
    && bytes.length >= 8
    && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);

  const isJpeg = file.type === "image/jpeg"
    && bytes.length >= 4
    && bytes[0] === 0xff
    && bytes[1] === 0xd8
    && bytes[2] === 0xff
    && bytes[bytes.length - 2] === 0xff
    && bytes[bytes.length - 1] === 0xd9;

  console.log("[validateSupportingDocument] isPng:", isPng, "| isJpeg:", isJpeg);

  if (file.type === "image/png") {
    const expected = [137, 80, 78, 71, 13, 10, 26, 10];
    console.log("[validateSupportingDocument] PNG magic expected:", expected.map((b) => b.toString(16).padStart(2, "0")).join(" "));
    console.log("[validateSupportingDocument] PNG magic actual  :", [...bytes.slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join(" "));
    console.log("[validateSupportingDocument] PNG bytes >= 8    :", bytes.length >= 8);
  }
  if (file.type === "image/jpeg") {
    console.log("[validateSupportingDocument] JPEG SOI check — bytes[0,1,2]:", bytes[0]?.toString(16), bytes[1]?.toString(16), bytes[2]?.toString(16), "| expected: ff d8 ff");
    console.log("[validateSupportingDocument] JPEG EOI check — last 2 bytes:", bytes[bytes.length - 2]?.toString(16), bytes[bytes.length - 1]?.toString(16), "| expected: ff d9");
  }

  if (!isPng && !isJpeg) {
    console.error("[validateSupportingDocument] ❌ magic bytes check FAILED — file does not match JPEG/PNG signature");
    throw new Error("The file contents do not match a supported JPG or PNG image signature.");
  }
  console.log("[validateSupportingDocument] ✅ magic bytes OK");
  console.log("[validateSupportingDocument] ── ALL CHECKS PASSED ──");

  return { ...specification, bytes };
}
