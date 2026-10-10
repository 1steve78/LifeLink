import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type DonorMatch = {
  requestId: string;
  bloodGroup: string;
  unitsNeeded: number;
  hospitalName: string;
  hospitalAddress: string | null;
  urgency: "critical" | "urgent" | "planned";
  requiredBy: string | null;
  distanceKm: number;
  pledgeId: string | null;
  pledgeStatus: "pledged" | "accepted" | "confirmed" | "completed" | "withdrawn" | null;
  donationStatus: "reported" | "confirmed" | null;
  longitude: number;
  latitude: number;
};

type EligibleDonorRow = { donor_id: string; distance_km: number };

/** The SQL function itself requires an active request and applies all matching rules. */
export async function findEligibleDonorsForRequest(requestId: string): Promise<EligibleDonorRow[]> {
  const result = await db.execute(sql`
    select donor_id, distance_km
    from public.find_eligible_donors(${requestId}::uuid)
  `);
  return Array.from(result as unknown as EligibleDonorRow[]);
}

/** Donor-facing match feed contains hospital details only, never patient or donor PII. */
export async function getEligibleRequestsForDonorMatching(donorId: string): Promise<DonorMatch[]> {
  const result = await db.execute(sql`
    select r.id as "requestId", r.blood_group as "bloodGroup",
           r.units_needed as "unitsNeeded", r.hospital_name as "hospitalName",
           r.hospital_address as "hospitalAddress", r.urgency,
           r.required_by as "requiredBy", m.distance_km as "distanceKm",
           pledge.id as "pledgeId",
           pledge.status as "pledgeStatus",
           donation.status as "donationStatus",
           st_x(r.hospital_location::geometry) as longitude,
           st_y(r.hospital_location::geometry) as latitude
    from public.blood_requests r
    cross join lateral public.find_eligible_donors(r.id) m
    left join public.donor_pledges pledge on pledge.request_id = r.id and pledge.donor_id = m.donor_id
    left join public.donation_reports donation on donation.pledge_id = pledge.id
    where r.status = 'active'
      and coalesce(r.required_by, r.created_at + interval '48 hours') > now()
      and m.donor_id = ${donorId}::uuid
    order by r.urgency = 'critical' desc, r.required_by asc nulls last, m.distance_km asc
    limit 100
  `);
  return Array.from(result as unknown as DonorMatch[]);
}
