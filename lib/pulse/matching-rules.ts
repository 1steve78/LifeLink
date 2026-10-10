type RequestUrgency = "critical" | "urgent" | "planned";

/** Red-cell donor compatibility used only to shortlist donors; hospitals confirm clinically. */
const DONORS_BY_RECIPIENT: Record<string, readonly string[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

export function compatibleDonorGroups(recipientGroup: string): readonly string[] {
  return DONORS_BY_RECIPIENT[recipientGroup] ?? [];
}

export function radiusMetersForUrgency(urgency: RequestUrgency): number {
  return urgency === "critical" ? 15_000 : urgency === "urgent" ? 8_000 : 5_000;
}

/** Initial product screening rule only; it does not determine medical eligibility. */
export function passesDonationInterval(lastDonationDate: string | null, today = new Date()): boolean {
  if (!lastDonationDate) return true;
  const lastDonation = new Date(`${lastDonationDate}T00:00:00Z`);
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return Number.isFinite(lastDonation.getTime())
    && todayUtc.getTime() - lastDonation.getTime() >= 90 * 24 * 60 * 60 * 1000;
}
