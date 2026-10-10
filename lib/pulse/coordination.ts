export type DonorPledgeStatus = "pledged" | "accepted" | "confirmed" | "completed" | "withdrawn";
export type DonorPledgeAction = "accept" | "confirm" | "withdraw";

export function nextPledgeStatus(status: DonorPledgeStatus, action: DonorPledgeAction): DonorPledgeStatus | null {
  if (action === "accept" && status === "pledged") return "accepted";
  if (action === "confirm" && status === "accepted") return "confirmed";
  if (action === "withdraw" && ["pledged", "accepted", "confirmed"].includes(status)) return "withdrawn";
  return null;
}

export function canReportDonation(status: DonorPledgeStatus) {
  return status === "confirmed";
}
