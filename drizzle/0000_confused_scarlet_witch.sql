CREATE TYPE "public"."request_status" AS ENUM('pending_verification', 'under_review', 'active', 'fulfilled', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."request_urgency" AS ENUM('critical', 'urgent', 'planned');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('requester', 'donor', 'moderator');--> statement-breakpoint
CREATE TYPE "public"."verification_gate" AS ENUM('basic_validation', 'document_analysis', 'risk_screening', 'moderator_review');--> statement-breakpoint
CREATE TYPE "public"."verification_result_status" AS ENUM('pending', 'passed', 'flagged', 'failed', 'error', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "blood_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"patient_name" text NOT NULL,
	"blood_group" text NOT NULL,
	"units_needed" integer DEFAULT 1 NOT NULL,
	"hospital_name" text NOT NULL,
	"hospital_location" "geography(point, 4326)",
	"required_by" timestamp with time zone,
	"supporting_document_path" text,
	"document_sha256" text,
	"urgency" "request_urgency" DEFAULT 'urgent' NOT NULL,
	"status" "request_status" DEFAULT 'pending_verification' NOT NULL,
	"verification_passed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blood_requests_units_needed_check" CHECK ("blood_requests"."units_needed" > 0),
	CONSTRAINT "valid_request_blood_group" CHECK ("blood_requests"."blood_group" in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
);
--> statement-breakpoint
ALTER TABLE "blood_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "donor_pledges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"donor_id" uuid NOT NULL,
	"status" text DEFAULT 'pledged' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donor_pledges_request_id_donor_id_key" UNIQUE("request_id","donor_id"),
	CONSTRAINT "donor_pledges_status_check" CHECK ("donor_pledges"."status" in ('pledged', 'confirmed', 'completed', 'withdrawn'))
);
--> statement-breakpoint
ALTER TABLE "donor_pledges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"role" "user_role" DEFAULT 'requester' NOT NULL,
	"blood_group" text,
	"locality" text,
	"last_donation_date" date,
	"available_to_donate" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "valid_blood_group" CHECK ("profiles"."blood_group" is null or "profiles"."blood_group" in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'))
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "request_verification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"gate" "verification_gate" NOT NULL,
	"status" "verification_result_status" NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"model" text,
	"performed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "request_verification_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blood_requests" ADD CONSTRAINT "blood_requests_requester_id_profiles_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor_pledges" ADD CONSTRAINT "donor_pledges_request_id_blood_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."blood_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor_pledges" ADD CONSTRAINT "donor_pledges_donor_id_profiles_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_verification_events" ADD CONSTRAINT "request_verification_events_request_id_blood_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."blood_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_verification_events" ADD CONSTRAINT "request_verification_events_performed_by_profiles_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blood_requests_status_idx" ON "blood_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blood_requests_location_idx" ON "blood_requests" USING gist ("hospital_location");--> statement-breakpoint
CREATE INDEX "donor_pledges_request_idx" ON "donor_pledges" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "request_verification_events_request_idx" ON "request_verification_events" USING btree ("request_id","created_at");--> statement-breakpoint
CREATE INDEX "request_verification_events_gate_status_idx" ON "request_verification_events" USING btree ("gate","status");