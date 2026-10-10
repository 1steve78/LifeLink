import { z } from "zod";

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "unknown",
] as const;

export type BloodGroupOption = (typeof BLOOD_GROUPS)[number];

export const ACCOUNT_TYPES = ["requester", "donor"] as const;
export type AccountTypeOption = (typeof ACCOUNT_TYPES)[number];

export const profileOnboardingSchema = z
  .object({
    fullName: z
      .string({ error: "Full name is required" })
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(120, "Full name cannot exceed 120 characters"),
    accountType: z.enum(ACCOUNT_TYPES, {
      error: "Please select a valid account type",
    }),
    bloodGroup: z
      .enum(BLOOD_GROUPS, {
        error: "Please select a valid blood group or choose 'unknown'",
      })
      .default("unknown"),
    phone: z
      .string()
      .trim()
      .max(20, "Phone number is too long")
      .optional()
      .nullable()
      .transform((val) => (val === "" || val === undefined ? null : val)),
    locality: z
      .string()
      .trim()
      .max(160, "Locality name is too long")
      .optional()
      .nullable()
      .transform((val) => (val === "" || val === undefined ? null : val)),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    availableToDonate: z.boolean().default(false),
    lastDonationDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val === "" || val === undefined ? null : val)),
  })
  .superRefine((data, ctx) => {
    // 1. Donor requires approximate locality
    if (data.accountType === "donor") {
      if (!data.locality || data.locality.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["locality"],
          message:
            "Approximate location (locality or city) is required for donors so nearby requests can be matched",
        });
      }
      if (data.latitude == null || data.longitude == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["latitude"],
          message: "Set an approximate map location so we can find nearby requests.",
        });
      }
    }

    // 2. Validate last donation date if provided
    if (data.lastDonationDate) {
      const parsedDate = new Date(data.lastDonationDate);
      if (isNaN(parsedDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lastDonationDate"],
          message: "Please enter a valid donation date (YYYY-MM-DD)",
        });
      } else {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (parsedDate > today) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["lastDonationDate"],
            message: "Last donation date cannot be in the future",
          });
        }
      }
    }
  });

export type ProfileOnboardingInput = z.infer<typeof profileOnboardingSchema>;
