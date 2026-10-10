import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
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
export const verificationGate = pgEnum("verification_gate", [
  "basic_validation",
  "document_analysis",
  "risk_screening",
  "moderator_review",
]);
export const verificationResultStatus = pgEnum("verification_result_status", [
  "pending",
  "passed",
  "flagged",
  "failed",
  "error",
  "approved",
  "rejected",
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
    locality: text("locality"),
    location: geographyPoint("location"),
    lastDonationDate: date("last_donation_date"),
    availableToDonate: boolean("available_to_donate").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "valid_blood_group",
      sql`${table.bloodGroup} is null or ${table.bloodGroup} in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')`,
    ),
    index("profiles_location_idx").using("gist", table.location),
  ],
).enableRLS();

export const bloodRequests = pgTable(
  "blood_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: uuid("requester_id").notNull().references(() => profiles.id),
    patientName: text("patient_name"),
    patientReference: text("patient_reference"),
    patientAge: integer("patient_age"),
    contactPersonName: text("contact_person_name"),
    contactPhone: text("contact_phone"),
    bloodGroup: text("blood_group").notNull(),
    unitsNeeded: integer("units_needed").notNull().default(1),
    hospitalName: text("hospital_name").notNull(),
    hospitalAddress: text("hospital_address"),
    hospitalLocation: geographyPoint("hospital_location"),
    requiredBy: timestamp("required_by", { withTimezone: true }),
    supportingDocumentPath: text("supporting_document_path"),
    documentSha256: text("document_sha256"),
    urgency: requestUrgency("urgency").notNull().default("urgent"),
    status: requestStatus("status").notNull().default("pending_verification"),
    reviewState: text("review_state").notNull().default("open"),
    reviewRevision: integer("review_revision").notNull().default(0),
    verificationPassed: boolean("verification_passed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("blood_requests_units_needed_check", sql`${table.unitsNeeded} > 0`),
    check("blood_requests_patient_age_check", sql`${table.patientAge} is null or ${table.patientAge} between 0 and 120`),
    check("blood_requests_review_state_check", sql`${table.reviewState} in ('open', 'needs_information')`),
    check("blood_requests_review_revision_check", sql`${table.reviewRevision} >= 0`),
    check(
      "valid_request_blood_group",
      sql`${table.bloodGroup} in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`,
    ),
    index("blood_requests_status_idx").on(table.status),
    index("blood_requests_location_idx").using("gist", table.hospitalLocation),
  ],
).enableRLS();

export const moderationAuditEvents = pgTable(
  "moderation_audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull().references(() => bloodRequests.id),
    moderatorId: uuid("moderator_id").notNull().references(() => profiles.id),
    action: text("action").notNull(),
    previousStatus: requestStatus("previous_status").notNull(),
    newStatus: requestStatus("new_status").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("moderation_audit_action_check", sql`${table.action} in ('approve', 'reject', 'request_information')`),
    check("moderation_audit_reason_check", sql`length(btrim(${table.reason})) >= 5`),
    index("moderation_audit_events_request_created_idx").on(table.requestId, table.createdAt),
  ],
).enableRLS();

export const requesterInformationResponses = pgTable(
  "requester_information_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull().references(() => bloodRequests.id),
    requesterId: uuid("requester_id").notNull().references(() => profiles.id),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("requester_information_response_message_check", sql`length(btrim(${table.message})) between 5 and 2000`),
    index("requester_information_responses_request_created_idx").on(table.requestId, table.createdAt),
  ],
).enableRLS();

export const requestVerificationEvents = pgTable(
  "request_verification_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull().references(() => bloodRequests.id, { onDelete: "cascade" }),
    gate: verificationGate("gate").notNull(),
    status: verificationResultStatus("status").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    model: text("model"),
    performedBy: uuid("performed_by").references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("request_verification_events_request_idx").on(table.requestId, table.createdAt),
    index("request_verification_events_gate_status_idx").on(table.gate, table.status),
  ],
).enableRLS();

export const donorPledges = pgTable(
  "donor_pledges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull().references(() => bloodRequests.id, { onDelete: "cascade" }),
    donorId: uuid("donor_id").notNull().references(() => profiles.id),
    status: text("status").notNull().default("pledged"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("donor_pledges_status_check", sql`${table.status} in ('pledged', 'confirmed', 'completed', 'withdrawn')`),
    unique("donor_pledges_request_id_donor_id_key").on(table.requestId, table.donorId),
    index("donor_pledges_request_idx").on(table.requestId),
  ],
).enableRLS();

export const requestTrackerEvents = pgTable(
  "request_tracker_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").notNull().references(() => bloodRequests.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    requestStatus: requestStatus("request_status").notNull(),
    pledgeCount: integer("pledge_count").notNull().default(0),
    confirmedCount: integer("confirmed_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("request_tracker_event_type_check", sql`${table.eventType} in ('request_submitted', 'request_under_review', 'request_activated', 'request_rejected', 'request_cancelled', 'request_fulfilled', 'request_information_needed', 'donor_pledged', 'donor_confirmed', 'donor_withdrew')`),
    check("request_tracker_counts_check", sql`${table.pledgeCount} >= 0 and ${table.confirmedCount} >= 0`),
    index("request_tracker_events_request_created_idx").on(table.requestId, table.createdAt),
  ],
).enableRLS();

export const donorNotifications = pgTable(
  "donor_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    donorId: uuid("donor_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    requestId: uuid("request_id").notNull().references(() => bloodRequests.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    unique("donor_notifications_donor_request_key").on(table.donorId, table.requestId),
    index("donor_notifications_donor_created_idx").on(table.donorId, table.createdAt),
  ],
).enableRLS();
