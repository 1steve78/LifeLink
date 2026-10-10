import { describe, expect, it } from "vitest";
import { compatibleDonorGroups, passesDonationInterval, radiusMetersForUrgency } from "../lib/pulse/matching-rules";

describe("Emergency Pulse matching rules", () => {
  it("uses explicit red-cell donor compatibility groups", () => {
    expect(compatibleDonorGroups("A+")).toEqual(["A+", "A-", "O+", "O-"]);
    expect(compatibleDonorGroups("AB-")).toEqual(["A-", "B-", "AB-", "O-"]);
    expect(compatibleDonorGroups("unknown")).toEqual([]);
  });

  it("uses the configured urgency radii", () => {
    expect(radiusMetersForUrgency("critical")).toBe(15_000);
    expect(radiusMetersForUrgency("urgent")).toBe(8_000);
    expect(radiusMetersForUrgency("planned")).toBe(5_000);
  });

  it("accepts first-time donors and enforces the 90-day screening boundary", () => {
    const today = new Date("2026-10-10T12:00:00Z");
    expect(passesDonationInterval(null, today)).toBe(true);
    expect(passesDonationInterval("2026-07-12", today)).toBe(true);
    expect(passesDonationInterval("2026-07-13", today)).toBe(false);
    expect(passesDonationInterval("not-a-date", today)).toBe(false);
  });
});
