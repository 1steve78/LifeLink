import { describe, expect, it } from "vitest";
import { canApproveWithScreening, getDecisionStatus, hasResponseAfterInformationRequest, isReviewableStatus } from "../lib/verification/moderation-rules";

describe("moderator decision safeguards", () => {
  it("maps decisions to safe request states and only reviews open states", () => {
    expect(getDecisionStatus("approve")).toBe("active");
    expect(getDecisionStatus("reject")).toBe("rejected");
    expect(getDecisionStatus("request_information")).toBe("under_review");
    expect(isReviewableStatus("pending_verification")).toBe(true);
    expect(isReviewableStatus("under_review")).toBe(true);
    expect(isReviewableStatus("active")).toBe(false);
  });

  it("fails closed when the AI result is unavailable or basic checks failed", () => {
    expect(canApproveWithScreening({
      hasHospitalLocation: true,
      basicValidation: "passed",
      documentAnalysis: "passed",
      riskScreening: "error",
      reason: "Reviewed manually",
    })).toMatchObject({ allowed: false });
    expect(canApproveWithScreening({
      hasHospitalLocation: true,
      basicValidation: "failed",
      documentAnalysis: "passed",
      riskScreening: "passed",
      reason: "Reviewed manually",
    })).toMatchObject({ allowed: false });
  });

  it("requires a recorded explanation to override a screening flag", () => {
    expect(canApproveWithScreening({
      hasHospitalLocation: true,
      basicValidation: "passed",
      documentAnalysis: "flagged",
      riskScreening: "passed",
      reason: "",
    })).toMatchObject({ allowed: false });
    expect(canApproveWithScreening({
      hasHospitalLocation: true,
      basicValidation: "passed",
      documentAnalysis: "flagged",
      riskScreening: "passed",
      reason: "Checked directly with hospital",
    })).toMatchObject({ allowed: true, verificationPassed: false, overridesFlag: true });
  });

  it("requires a requester response newer than the information request", () => {
    const requestedAt = new Date("2026-10-10T12:00:00Z");
    expect(hasResponseAfterInformationRequest(undefined, requestedAt)).toBe(false);
    expect(hasResponseAfterInformationRequest(new Date("2026-10-10T11:59:00Z"), requestedAt)).toBe(false);
    expect(hasResponseAfterInformationRequest(new Date("2026-10-10T12:01:00Z"), requestedAt)).toBe(true);
  });
});
