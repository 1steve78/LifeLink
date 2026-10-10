import { describe, it, expect } from "vitest";
import { profileOnboardingSchema } from "../lib/validations/profile";

describe("Profile Onboarding Validation Schema", () => {
  it("successfully validates a valid requester profile", () => {
    const data = {
      fullName: "Priya Sharma",
      accountType: "requester",
      bloodGroup: "B+",
      phone: "+91 9876543210",
    };
    const result = profileOnboardingSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Priya Sharma");
      expect(result.data.accountType).toBe("requester");
      expect(result.data.bloodGroup).toBe("B+");
      expect(result.data.availableToDonate).toBe(false);
      expect(result.data.locality).toBeNull();
    }
  });

  it("successfully validates a valid donor profile with locality and donation date", () => {
    const data = {
      fullName: "Rahul Sen",
      accountType: "donor",
      bloodGroup: "O+",
      locality: "Salt Lake, Kolkata",
      latitude: 22.58,
      longitude: 88.42,
      availableToDonate: true,
      lastDonationDate: "2026-05-15",
    };
    const result = profileOnboardingSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locality).toBe("Salt Lake, Kolkata");
      expect(result.data.availableToDonate).toBe(true);
      expect(result.data.lastDonationDate).toBe("2026-05-15");
    }
  });

  it("allows bloodGroup 'unknown' for users who don't know their blood group", () => {
    const data = {
      fullName: "Amit Patel",
      accountType: "requester",
      bloodGroup: "unknown",
    };
    const result = profileOnboardingSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bloodGroup).toBe("unknown");
    }
  });

  it("fails if fullName is missing or too short", () => {
    const data = {
      fullName: "A",
      accountType: "requester",
    };
    const result = profileOnboardingSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.format();
      expect(errors.fullName?._errors.length).toBeGreaterThan(0);
    }
  });

  it("fails if donor does not provide approximate locality", () => {
    const data = {
      fullName: "Deepak Verma",
      accountType: "donor",
      bloodGroup: "A+",
      locality: "",
    };
    const result = profileOnboardingSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.format();
      expect(errors.locality?._errors.length).toBeGreaterThan(0);
    }
  });

  it("fails if last donation date is in the future", () => {
    const futureDate = "2099-01-01";
    const data = {
      fullName: "Deepak Verma",
      accountType: "donor",
      bloodGroup: "A+",
      locality: "Kankinara",
      lastDonationDate: futureDate,
    };
    const result = profileOnboardingSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.format();
      expect(errors.lastDonationDate?._errors.length).toBeGreaterThan(0);
    }
  });

  it("strictly rejects moderator account type", () => {
    const data = {
      fullName: "Sneha Roy",
      accountType: "moderator",
      bloodGroup: "O-",
    };
    const result = profileOnboardingSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
