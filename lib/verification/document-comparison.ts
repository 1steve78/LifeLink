import type { DocumentReport } from "./nvidia-nim";
import type { RequestSubmission } from "./validate-request";

function normalizeBloodGroup(value: string | null) {
  return value?.trim().toUpperCase().replace(/[−–—]/g, "-") ?? null;
}

function normalizeText(value: string | null) {
  return value?.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

export function compareHospitalDocument(report: DocumentReport, request: RequestSubmission) {
  const bloodGroupMatches = normalizeBloodGroup(report.extracted.blood_group) === request.bloodGroup;
  const unitsMatch = report.extracted.units === request.unitsNeeded;
  const submittedHospital = normalizeText(request.hospitalName);
  const extractedHospital = normalizeText(report.extracted.hospital);
  const hospitalMatches = Boolean(extractedHospital)
    && (submittedHospital.includes(extractedHospital) || extractedHospital.includes(submittedHospital));
  const submittedDate = request.requiredByDate.toISOString().slice(0, 10);
  const extractedDate = report.extracted.required_by?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
  const requiredByMatches = Boolean(extractedDate) && extractedDate === submittedDate;

  const reasons = [...report.reasons];
  if (report.document_type !== "blood_requisition" && report.document_type !== "medical_document") reasons.push("Document type is not a recognized medical document.");
  if (report.readability !== "clear") reasons.push("Document is not clearly readable.");
  if (!bloodGroupMatches) reasons.push("Blood group could not be read or does not match the request.");
  if (!unitsMatch) reasons.push("Units could not be read or do not match the request.");
  if (!hospitalMatches) reasons.push("Hospital could not be read or does not match the request.");
  if (!requiredByMatches) reasons.push("Required-by date could not be read or does not match the request.");

  return {
    status: report.requires_review || reasons.length > 0 ? "flagged" as const : "passed" as const,
    reasons: Array.from(new Set(reasons)),
    details: {
      documentType: report.document_type,
      readability: report.readability,
      extracted: report.extracted,
      fieldMatches: {
        bloodGroup: bloodGroupMatches,
        units: unitsMatch,
        hospital: hospitalMatches,
        requiredBy: requiredByMatches,
      },
      requiresReview: report.requires_review,
    },
  };
}
