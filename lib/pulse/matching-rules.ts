type RequestUrgency = "critical" | "urgent" | "planned";
export type DonorAvailabilityBand = "none" | "limited" | "several" | "many";

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

/** Coarsens counts before they are returned to requesters to reduce location inference. */
export function donorAvailabilityBand(count: number): DonorAvailabilityBand {
  if (count <= 0) return "none";
  if (count < 4) return "limited";
  if (count < 10) return "several";
  return "many";
}

/** Initial product screening rule only; it does not determine medical eligibility. */
export function passesDonationInterval(lastDonationDate: string | null, today = new Date()): boolean {
  if (!lastDonationDate) return true;
  const lastDonation = new Date(`${lastDonationDate}T00:00:00Z`);
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return Number.isFinite(lastDonation.getTime())
    && todayUtc.getTime() - lastDonation.getTime() >= 90 * 24 * 60 * 60 * 1000;
}
