import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const auth = pgSchema("auth");
const authUsers = auth.table("users", {
  id: uuid("id").primaryKey(),
});

export const userRole = pgEnum("user_role", ["requester", "donor", "moderator"]);
export const requestUrgency = pgEnum("request_urgency", ["critical", "urgent", "planned"]);
export const requestStatus = pgEnum("request_status", [
  "pending_verification",
  "under_review",
  "active",
  "fulfilled",
  "rejected",
  "cancelled",
]);

// PostGIS values are passed as EWKT strings, for example SRID=4326;POINT(-73.9 40.7).
const geographyPoint = customType<{ data: string; driverData: string }>({
  dataType: () => "geography(point, 4326)",
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    role: userRole("role").notNull().default("requester"),
    bloodGroup: text("blood_group"),
    lastDonationDate: date("last_donation_date"),
    availableToDonate: boolean("available_to_donate").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "valid_blood_group",
      sql`${table.bloodGroup} is null or ${table.bloodGroup} in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`,
    ),
  ],
);

export const bloodRequests = pgTable(
  "blood_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: uuid("requester_id").notNull().references(() => profiles.id),
    patientName: text("patient_name").notNull(),
    bloodGroup: text("blood_group").notNull(),
    unitsNeeded: integer("units_needed").notNull().default(1),
    hospitalName: text("hospital_name").notNull(),
    hospitalLocation: geographyPoint("hospital_location"),
    urgency: requestUrgency("urgency").notNull().default("urgent"),
    status: requestStatus("status").notNull().default("pending_verification"),
    verificationPassed: boolean("verification_passed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("blood_requests_units_needed_positive", sql`${table.unitsNeeded} > 0`),
    check(
      "valid_request_blood_group",
      sql`${table.bloodGroup} in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`,
    ),
    index("blood_requests_status_idx").on(table.status),
    index("blood_requests_location_idx").using("gist", table.hospitalLocation),
  ],
);

export const donorPledges = pgTable(
  "donor_pledges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull().references(() => bloodRequests.id, { onDelete: "cascade" }),
    donorId: uuid("donor_id").notNull().references(() => profiles.id),
    status: text("status").notNull().default("pledged"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("donor_pledges_valid_status", sql`${table.status} in ('pledged', 'confirmed', 'completed', 'withdrawn')`),
    unique("donor_pledges_request_id_donor_id_unique").on(table.requestId, table.donorId),
    index("donor_pledges_request_idx").on(table.requestId),
  ],
);
