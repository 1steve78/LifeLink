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
  const parsed = RequestSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten().fieldErrors };
  }

  const patientName = parsed.data.patientName?.trim() || null;
  const patientReference = parsed.data.patientReference?.trim() || null;
  if (!patientName && !patientReference) {
    return { success: false as const, errors: { patientName: ["Enter the patient's name or a reference ID."] } };
  }
  if ((parsed.data.latitude === undefined) !== (parsed.data.longitude === undefined)) {
    return { success: false as const, errors: { latitude: ["Provide both map coordinates."] } };
  }
  if (parsed.data.latitude == null || parsed.data.longitude == null) {
    return { success: false as const, errors: { latitude: ["Hospital map coordinates are required for nearby donor matching."] } };
  }

  const requiredByDate = new Date(parsed.data.requiredBy);
  const now = Date.now();
  if (!Number.isFinite(requiredByDate.getTime()) || requiredByDate.getTime() <= now) {
    return {
      success: false as const,
      errors: { requiredBy: ["Required-by time must be in the future."] },
    };
  }
  if (requiredByDate.getTime() > now + 366 * 24 * 60 * 60 * 1000) {
    return {
      success: false as const,
      errors: { requiredBy: ["Required-by time must be within the next year."] },
    };
  }

  const hoursUntilNeeded = (requiredByDate.getTime() - now) / (60 * 60 * 1000);
  if (parsed.data.urgency === "critical" && hoursUntilNeeded > 2) {
    return {
      success: false as const,
      errors: { urgency: ["Critical requests must be needed within 2 hours."] },
    };
  }
  if (parsed.data.urgency === "urgent" && hoursUntilNeeded > 6) {
    return {
      success: false as const,
      errors: { urgency: ["Urgent requests must be needed within 6 hours."] },
    };
  }

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
  if (file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("The supporting document must be between 1 byte and 10 MB.");
  }

  const specification = allowedDocuments[file.type as keyof typeof allowedDocuments];
  if (!specification) {
    throw new Error("Upload a JPG or PNG photo of the hospital document. PDFs are not supported.");
  }

  const fileName = file.name.toLowerCase();
  const extensionMatches = specification.extension === ".jpg"
    ? fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")
    : fileName.endsWith(specification.extension);
  if (!extensionMatches) {
    throw new Error("The file extension must match the document type.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
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

  if (!isPng && !isJpeg) {
    throw new Error("The file contents do not match a supported JPG or PNG image signature.");
  }

  return { ...specification, bytes };
}
