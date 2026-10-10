import { and, desc, eq, gte, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { bloodRequests, requestVerificationEvents } from "@/lib/db/schema";
import { documentModelName, screenRequestRisk } from "@/lib/verification/nvidia-nim";
import { calculateRiskSignals } from "@/lib/verification/risk-rules";

export const runtime = "nodejs";

const requestBodySchema = z.object({ requestId: z.string().uuid() });

function normalize(value: string | null) {
  return value?.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to continue verification." }, { status: 401 });

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

  const [latestDocumentCheck] = await db.select({ status: requestVerificationEvents.status })
    .from(requestVerificationEvents)
    .where(and(
      eq(requestVerificationEvents.requestId, bloodRequest.id),
      eq(requestVerificationEvents.gate, "document_analysis"),
    ))
    .orderBy(desc(requestVerificationEvents.createdAt))
    .limit(1);
  if (latestDocumentCheck?.status !== "passed") {
    return NextResponse.json({ error: "Document analysis must pass before risk screening." }, { status: 409 });
  }
  const [latestRiskCheck] = await db.select({ status: requestVerificationEvents.status })
    .from(requestVerificationEvents)
    .where(and(
      eq(requestVerificationEvents.requestId, bloodRequest.id),
      eq(requestVerificationEvents.gate, "risk_screening"),
    ))
    .orderBy(desc(requestVerificationEvents.createdAt))
    .limit(1);
  if (latestRiskCheck?.status === "passed") {
    return NextResponse.json({
      status: "passed",
      requestStatus: "pending_verification",
      verificationPassed: true,
      requiresReview: false,
      message: "Automated checks passed. Moderator approval is still required before donor matching.",
    });
  }

  const now = new Date();
  const historySince = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const previousSince = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [recentRequests, repeatedDocument, previousFlag] = await Promise.all([
    db.select({
      id: bloodRequests.id,
      patientName: bloodRequests.patientName,
      bloodGroup: bloodRequests.bloodGroup,
      unitsNeeded: bloodRequests.unitsNeeded,
      hospitalName: bloodRequests.hospitalName,
    }).from(bloodRequests).where(and(
      eq(bloodRequests.requesterId, user.id),
      ne(bloodRequests.id, bloodRequest.id),
      gte(bloodRequests.createdAt, historySince),
    )).limit(50),
    bloodRequest.documentSha256
      ? db.select({ id: bloodRequests.id }).from(bloodRequests).where(and(
          eq(bloodRequests.documentSha256, bloodRequest.documentSha256),
          ne(bloodRequests.requesterId, user.id),
          ne(bloodRequests.id, bloodRequest.id),
          gte(bloodRequests.createdAt, previousSince),
        )).limit(1)
      : Promise.resolve([]),
    db.select({ id: requestVerificationEvents.id })
      .from(requestVerificationEvents)
      .innerJoin(bloodRequests, eq(requestVerificationEvents.requestId, bloodRequests.id))
      .where(and(
        eq(bloodRequests.requesterId, user.id),
        eq(requestVerificationEvents.status, "flagged"),
        gte(requestVerificationEvents.createdAt, previousSince),
      ))
      .limit(1),
  ]);

  const conflictingSamePatientAndHospital = recentRequests.some((previous) =>
    Boolean(bloodRequest.patientName && previous.patientName)
    && normalize(previous.patientName) === normalize(bloodRequest.patientName)
    && normalize(previous.hospitalName) === normalize(bloodRequest.hospitalName)
    && (previous.bloodGroup !== bloodRequest.bloodGroup || previous.unitsNeeded !== bloodRequest.unitsNeeded),
  );
  const repeatedDocumentAcrossAccounts = repeatedDocument.length > 0;
  const previouslyFlagged = previousFlag.length > 0;
  const rules = calculateRiskSignals({
    recentRequestCount: recentRequests.length,
    conflictingSamePatientAndHospital,
    repeatedDocumentAcrossAccounts,
    previouslyFlagged,
  });
  const deterministicSignals = rules.signals;

  try {
    const riskReport = await screenRequestRisk({
      request: {
        bloodGroup: bloodRequest.bloodGroup as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-",
        unitsNeeded: bloodRequest.unitsNeeded,
        hospitalName: bloodRequest.hospitalName,
        urgency: bloodRequest.urgency,
        requiredByDate: bloodRequest.requiredBy ?? now,
      },
      recentRequestCount: recentRequests.length,
      conflictingSamePatientAndHospital,
      repeatedDocumentAcrossAccounts,
      previouslyFlagged,
      deterministicSignals,
    });

    const ruleScore = rules.score;
    const combinedSignals = Array.from(new Set([...deterministicSignals, ...riskReport.signals]));
    const requiresReview = ruleScore >= 30 || riskReport.requires_review || riskReport.risk_level !== "low";
    const status = requiresReview ? "flagged" : "passed";
    await db.transaction(async (tx) => {
      await tx.insert(requestVerificationEvents).values({
        requestId: bloodRequest.id,
        gate: "risk_screening",
        status,
        details: {
          ruleScore,
          scoreType: "heuristic_points_not_probability",
          deterministicSignals,
          modelRisk: riskReport,
          combinedSignals,
          requiresReview,
        },
        model: documentModelName(),
      });
      await tx.update(bloodRequests).set({
        status: requiresReview ? "under_review" : "pending_verification",
        verificationPassed: !requiresReview,
        updatedAt: new Date(),
      }).where(eq(bloodRequests.id, bloodRequest.id));
    });

    return NextResponse.json({
      status,
      requestStatus: requiresReview ? "under_review" : "pending_verification",
      verificationPassed: !requiresReview,
      requiresReview,
      score: ruleScore,
      scoreType: "heuristic points, not a fraud probability",
      signals: combinedSignals,
      message: requiresReview
        ? "This request needs moderator review. It has not been sent to donors."
        : "Automated checks passed. Moderator approval is still required before donor matching.",
    });
  } catch {
    await db.insert(requestVerificationEvents).values({
      requestId: bloodRequest.id,
      gate: "risk_screening",
      status: "error",
      details: { reason: "Risk analysis failed; the request remains pending for retry." },
      model: documentModelName(),
    });
    return NextResponse.json({
      error: "Risk screening could not be completed. The request remains pending and has not been sent to donors.",
      requestId: bloodRequest.id,
      status: "pending_verification",
    }, { status: 503 });
  }
}
