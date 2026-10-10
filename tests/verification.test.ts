import { describe, expect, it, vi } from "vitest";
import { compareHospitalDocument } from "../lib/verification/document-comparison";
import { calculateRiskSignals } from "../lib/verification/risk-rules";
import { validateRequestSubmission, validateSupportingDocument } from "../lib/verification/validate-request";
import { isAuthorizedModerator } from "../lib/verification/moderator-auth";
import { analyzeHospitalDocument, screenRequestRisk } from "../lib/verification/nvidia-nim";
import type { DocumentReport } from "../lib/verification/nvidia-nim";

const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
const validRequest = {
  patientName: "Asha Kumar",
  bloodGroup: "O-",
  unitsNeeded: 2,
  hospitalName: "City Care Hospital",
  latitude: 22.57,
  longitude: 88.36,
  urgency: "planned",
  requiredBy: future.toISOString(),
};

const matchingReport: DocumentReport = {
  document_type: "blood_requisition",
  readability: "clear",
  extracted: {
    blood_group: "O−",
    units: 2,
    hospital: "City Care Hospital",
    required_by: future.toISOString(),
  },
  requires_review: false,
  reasons: [],
};

describe("verification gate 1", () => {
  it("accepts complete, consistent request details", () => {
    expect(validateRequestSubmission(validRequest).success).toBe(true);
  });

  it("rejects missing hospital and an urgency/deadline contradiction", () => {
    expect(validateRequestSubmission({ ...validRequest, hospitalName: " " }).success).toBe(false);
    expect(validateRequestSubmission({ ...validRequest, urgency: "critical" }).success).toBe(false);
  });

  it("accepts only photo uploads and rejects a file with a spoofed image signature", async () => {
    const spoofedImage = new File(["MZ executable"], "hospital.png", { type: "image/png" });
    await expect(validateSupportingDocument(spoofedImage)).rejects.toThrow(/signature/i);
    const pdf = new File(["%PDF-1.7"], "hospital.pdf", { type: "application/pdf" });
    await expect(validateSupportingDocument(pdf)).rejects.toThrow(/JPG or PNG photo/i);
  });

  it("rejects unsupported and oversized uploads", async () => {
    const unsupported = new File(["text"], "hospital.txt", { type: "text/plain" });
    await expect(validateSupportingDocument(unsupported)).rejects.toThrow(/JPG or PNG/i);
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "hospital.png", { type: "image/png" });
    await expect(validateSupportingDocument(oversized)).rejects.toThrow(/10 MB/i);
  });
});

describe("verification gate 2", () => {
  const submitted = {
    patientName: "Asha Kumar",
    bloodGroup: "O-" as const,
    unitsNeeded: 2,
    hospitalName: "City Care Hospital",
    urgency: "planned" as const,
    requiredBy: future.toISOString(),
    requiredByDate: future,
  };

  it("passes a clear document when all extracted fields match", () => {
    expect(compareHospitalDocument(matchingReport, submitted).status).toBe("passed");
  });

  it("flags a blood group mismatch instead of approving the request", () => {
    const result = compareHospitalDocument({
      ...matchingReport,
      extracted: { ...matchingReport.extracted, blood_group: "AB+" },
    }, submitted);
    expect(result.status).toBe("flagged");
    expect(result.details.fieldMatches.bloodGroup).toBe(false);
  });

  it("flags unreadable or uncertain documents even when extracted fields match", () => {
    expect(compareHospitalDocument({ ...matchingReport, readability: "partial" }, submitted).status).toBe("flagged");
    expect(compareHospitalDocument({ ...matchingReport, requires_review: true }, submitted).status).toBe("flagged");
  });
});

describe("verification gate 3", () => {
  it("scores duplicate and conflicting signals as review leads, capped at 100", () => {
    const result = calculateRiskSignals({
      recentRequestCount: 4,
      conflictingSamePatientAndHospital: true,
      repeatedDocumentAcrossAccounts: true,
      previouslyFlagged: true,
    });
    expect(result.score).toBe(100);
    expect(result.signals).toHaveLength(4);
  });

  it("does not flag a request with no deterministic risk signals", () => {
    expect(calculateRiskSignals({
      recentRequestCount: 0,
      conflictingSamePatientAndHospital: false,
      repeatedDocumentAcrossAccounts: false,
      previouslyFlagged: false,
    })).toEqual({ score: 0, signals: [] });
  });
});

describe("moderator authorization and AI failure handling", () => {
  it("requires both a moderator profile and an explicit user ID allowlist", () => {
    expect(isAuthorizedModerator("user-1", "requester", ["user-1"])).toBe(false);
    expect(isAuthorizedModerator("user-1", "moderator", [])).toBe(false);
    expect(isAuthorizedModerator("user-1", "moderator", ["user-1"])).toBe(true);
  });

  it("fails closed when the AI risk provider is unavailable", async () => {
    const previousKey = process.env.NVIDIA_NIM_API_KEY;
    process.env.NVIDIA_NIM_API_KEY = "test-key";
    const previousFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response("unavailable", { status: 503 })) as typeof fetch;
    try {
      await expect(screenRequestRisk({
        request: {
          bloodGroup: "O-",
          unitsNeeded: 2,
          hospitalName: "City Care Hospital",
          urgency: "planned",
          requiredByDate: future,
        },
        recentRequestCount: 0,
        conflictingSamePatientAndHospital: false,
        repeatedDocumentAcrossAccounts: false,
        previouslyFlagged: false,
        deterministicSignals: [],
      })).rejects.toThrow(/503/);
    } finally {
      globalThis.fetch = previousFetch;
      if (previousKey === undefined) delete process.env.NVIDIA_NIM_API_KEY;
      else process.env.NVIDIA_NIM_API_KEY = previousKey;
    }
  });

  it("sends risk screening to NVIDIA NIM and parses a structured completion", async () => {
    const previousKey = process.env.NVIDIA_NIM_API_KEY;
    process.env.NVIDIA_NIM_API_KEY = "test-key";
    const previousFetch = globalThis.fetch;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { model: string; messages: unknown[] };
      expect(body.model).toBe("meta/llama-3.2-90b-vision-instruct");
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0].role).toBe("user");
      return Response.json({ choices: [{ message: { content: `Result:\n{"risk_level":"low","requires_review":false,"signals":[],"rationale":"No additional signals."}` } }] });
    });
    globalThis.fetch = fetchMock as typeof fetch;
    try {
      const result = await screenRequestRisk({
        request: { bloodGroup: "O-", unitsNeeded: 2, hospitalName: "City Care Hospital", urgency: "planned", requiredByDate: future },
        recentRequestCount: 0,
        conflictingSamePatientAndHospital: false,
        repeatedDocumentAcrossAccounts: false,
        previouslyFlagged: false,
        deterministicSignals: [],
      });
      expect(result.risk_level).toBe("low");
      expect(fetchMock).toHaveBeenCalledOnce();
    } finally {
      globalThis.fetch = previousFetch;
      if (previousKey === undefined) delete process.env.NVIDIA_NIM_API_KEY;
      else process.env.NVIDIA_NIM_API_KEY = previousKey;
    }
  });

  it("sends supported image documents as NIM image_url content", async () => {
    const previousKey = process.env.NVIDIA_NIM_API_KEY;
    process.env.NVIDIA_NIM_API_KEY = "test-key";
    const previousFetch = globalThis.fetch;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { messages: Array<{ content: string | Array<{ type: string; image_url?: { url: string } }> }> };
      const userContent = body.messages[0].content;
      expect(Array.isArray(userContent)).toBe(true);
      const image = (userContent as Array<{ type: string; image_url?: { url: string } }>).find((part) => part.type === "image_url");
      expect(image?.image_url?.url).toMatch(/^data:image\/png;base64,/);
      return Response.json({ choices: [{ message: { content: JSON.stringify(matchingReport) } }] });
    });
    globalThis.fetch = fetchMock as typeof fetch;
    try {
      const report = await analyzeHospitalDocument({ mimeType: "image/png", extension: ".png", bytes: new Uint8Array([1, 2, 3]) }, {
        patientName: "Asha Kumar",
        bloodGroup: "O-",
        unitsNeeded: 2,
        hospitalName: "City Care Hospital",
        urgency: "planned",
        requiredBy: future.toISOString(),
        requiredByDate: future,
      });
      expect(report.document_type).toBe("blood_requisition");
    } finally {
      globalThis.fetch = previousFetch;
      if (previousKey === undefined) delete process.env.NVIDIA_NIM_API_KEY;
      else process.env.NVIDIA_NIM_API_KEY = previousKey;
    }
  });
});
