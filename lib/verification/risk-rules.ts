export interface RiskSignalsInput {
  recentRequestCount: number;
  conflictingSamePatientAndHospital: boolean;
  repeatedDocumentAcrossAccounts: boolean;
  previouslyFlagged: boolean;
}

export function calculateRiskSignals(input: RiskSignalsInput) {
  const signals: string[] = [];
  let score = 0;

  if (input.recentRequestCount >= 3) {
    score += 25;
    signals.push("Multiple requests from this account in the last 24 hours.");
  }
  if (input.conflictingSamePatientAndHospital) {
    score += 35;
    signals.push("Recent requests for the same patient and hospital contain conflicting details.");
  }
  if (input.repeatedDocumentAcrossAccounts) {
    score += 50;
    signals.push("The same document hash appears on a recent request from another account.");
  }
  if (input.previouslyFlagged) {
    score += 20;
    signals.push("A recent request from this account was flagged for moderator review.");
  }

  return { score: Math.min(100, score), signals };
}
