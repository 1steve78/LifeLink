export type ModerationAction = "approve" | "reject" | "request_information";
export type ReviewableStatus = "pending_verification" | "under_review";

export function getDecisionStatus(action: ModerationAction): ReviewableStatus | "active" | "rejected" {
  if (action === "approve") return "active";
  if (action === "reject") return "rejected";
  return "under_review";
}

export function isReviewableStatus(status: string): status is ReviewableStatus {
  return status === "pending_verification" || status === "under_review";
}

export function canApproveWithScreening(input: {
  hasHospitalLocation: boolean;
  basicValidation: string | undefined;
  documentAnalysis: string | undefined;
  riskScreening: string | undefined;
  reason: string;
}): { allowed: true; verificationPassed: boolean; overridesFlag: boolean } | { allowed: false; message: string } {
  if (!input.hasHospitalLocation) return { allowed: false, message: "Add the hospital map location before approval so nearby donors can be matched." };
  if (input.basicValidation !== "passed") return { allowed: false, message: "Basic validation must pass before approval." };
  if (!["passed", "flagged"].includes(input.documentAnalysis ?? "") || !["passed", "flagged"].includes(input.riskScreening ?? "")) {
    return { allowed: false, message: "Document analysis and risk screening must finish before approval. An unavailable check is not a pass." };
  }
  const overridesFlag = input.documentAnalysis === "flagged" || input.riskScreening === "flagged";
  if (overridesFlag && input.reason.trim().length < 5) return { allowed: false, message: "A reason of at least 5 characters is required to approve a flagged request." };
  return { allowed: true, verificationPassed: input.documentAnalysis === "passed" && input.riskScreening === "passed", overridesFlag };
}

export function hasResponseAfterInformationRequest(responseAt: Date | undefined, requestAt: Date | undefined) {
  return Boolean(responseAt && requestAt && responseAt.getTime() > requestAt.getTime());
}
