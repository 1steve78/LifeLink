import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;
if (!supabaseUrl || !serviceKey || !databaseUrl) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL.");
}

const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const sql = postgres(databaseUrl, { max: 1 });
const users = [
  ["requester-01", "Maya Demo Requester", "requester", "A+", "Central Bengaluru", 77.5946, 12.9716],
  ["requester-02", "Arjun Demo Requester", "requester", "O-", "Indiranagar", 77.6408, 12.9784],
  ["donor-01", "Asha Demo Donor", "donor", "O+", "MG Road", 77.6067, 12.9756],
  ["donor-02", "Ravi Demo Donor", "donor", "A-", "Indiranagar", 77.6401, 12.9781],
  ["donor-03", "Neha Demo Donor", "donor", "B+", "Koramangala", 77.6245, 12.9352],
  ["donor-04", "Kabir Demo Donor", "donor", "O-", "Jayanagar", 77.5833, 12.9250],
  ["donor-05", "Isha Demo Donor", "donor", "AB+", "Malleshwaram", 77.5713, 13.0035],
  ["donor-06", "Dev Demo Donor", "donor", "B-", "Ulsoor", 77.6197, 12.9817],
];

try {
  const profileRows = [];
  for (const [slug, name, role, group, locality, lon, lat] of users) {
    const email = `lifelink-demo+${slug}@example.com`;
    let user = null;
    const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;
    user = listed.users.find((candidate) => candidate.email === email) ?? null;
    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: randomBytes(32).toString("base64url"),
        email_confirm: true,
        user_metadata: { full_name: name, role, blood_group: group },
      });
      if (error) throw error;
      user = data.user;
    }
    profileRows.push({ id: user.id, name, role, group, locality, lon, lat });
  }

  await sql.begin(async (tx) => {
    for (const p of profileRows) {
      await tx`insert into public.profiles
        (id, full_name, role, blood_group, locality, location, available_to_donate, availability_expires_at)
        values (${p.id}, ${p.name}, ${p.role}::public.user_role, ${p.group}, ${p.locality},
          st_setsrid(st_makepoint(${p.lon}, ${p.lat}), 4326)::geography,
          ${p.role === "donor"}, ${p.role === "donor" ? new Date(Date.now() + 7 * 86400000).toISOString() : null})
        on conflict (id) do update set full_name = excluded.full_name, role = excluded.role,
          blood_group = excluded.blood_group, locality = excluded.locality, location = excluded.location,
          available_to_donate = excluded.available_to_donate,
          availability_expires_at = excluded.availability_expires_at`;
    }

    const requests = [
      { key: "central-a-pos", owner: "requester-01", patient: "Demo Patient A", group: "A+", units: 2, hospital: "Demo City Hospital", address: "Central Bengaluru", lon: 77.599, lat: 12.969, urgency: "critical", status: "active", hours: 18 },
      { key: "east-o-neg", owner: "requester-02", patient: "Demo Patient B", group: "O-", units: 1, hospital: "Demo East Medical Centre", address: "Indiranagar, Bengaluru", lon: 77.635, lat: 12.978, urgency: "urgent", status: "active", hours: 28 },
      { key: "south-b-pos", owner: "requester-01", patient: "Demo Patient C", group: "B+", units: 3, hospital: "Demo South Hospital", address: "Koramangala, Bengaluru", lon: 77.622, lat: 12.938, urgency: "urgent", status: "active", hours: 36 },
      { key: "west-ab-pos", owner: "requester-02", patient: "Demo Patient D", group: "AB+", units: 1, hospital: "Demo West Clinic", address: "Malleshwaram, Bengaluru", lon: 77.574, lat: 13.001, urgency: "planned", status: "pending_verification", hours: 72 },
      { key: "south-a-neg-done", owner: "requester-01", patient: "Demo Patient E", group: "A-", units: 1, hospital: "Demo South Hospital", address: "Jayanagar, Bengaluru", lon: 77.584, lat: 12.926, urgency: "planned", status: "fulfilled", hours: -24 },
    ];

    const ids = {};
    for (const r of requests) {
      const requesterId = profileRows.find((p) => p.name === users.find((u) => u[0] === r.owner)[1]).id;
      const [existing] = await tx`select id from public.blood_requests
        where requester_id = ${requesterId} and patient_name = ${r.patient} limit 1`;
      let row;
      if (existing) {
        [row] = await tx`update public.blood_requests set patient_reference = ${`DEMO-${r.key}`},
          patient_age = 34, contact_person_name = 'Demo Contact', contact_phone = '0000000000',
          blood_group = ${r.group}, units_needed = ${r.units}, hospital_name = ${r.hospital},
          hospital_address = ${r.address}, hospital_location = st_setsrid(st_makepoint(${r.lon}, ${r.lat}), 4326)::geography,
          required_by = now() + (${r.hours} * interval '1 hour'), urgency = ${r.urgency}::public.request_urgency,
          status = ${r.status}::public.request_status, verification_passed = ${r.status !== "pending_verification"}, updated_at = now()
          where id = ${existing.id} returning id`;
        await tx`delete from public.request_tracker_events where request_id = ${row.id}`;
      } else {
        [row] = await tx`insert into public.blood_requests
        (requester_id, patient_name, patient_reference, patient_age, contact_person_name, contact_phone, blood_group,
         units_needed, hospital_name, hospital_address, hospital_location, required_by, urgency,
         status, verification_passed, created_at, updated_at)
        values (${requesterId}, ${r.patient}, ${`DEMO-${r.key}`}, 34, 'Demo Contact', '0000000000', ${r.group}, ${r.units}, ${r.hospital}, ${r.address},
          st_setsrid(st_makepoint(${r.lon}, ${r.lat}), 4326)::geography,
          now() + (${r.hours} * interval '1 hour'), ${r.urgency}::public.request_urgency,
          ${r.status}::public.request_status, ${r.status !== "pending_verification"}, now() - interval '2 hours', now())
        returning id`;
      }
      ids[r.key] = row.id;
      await tx`insert into public.request_tracker_events
        (request_id, event_type, request_status, pledge_count, confirmed_count, created_at)
        values (${row.id}, 'request_submitted', 'pending_verification', 0, 0, now() - interval '2 hours')`;
      if (r.status === "active" || r.status === "fulfilled") {
        await tx`insert into public.request_tracker_events
          (request_id, event_type, request_status, pledge_count, confirmed_count, created_at)
          values (${row.id}, 'request_activated', 'active', ${r.key === "central-a-pos" ? 1 : r.key === "east-o-neg" ? 1 : 0},
            ${r.status === "fulfilled" ? 1 : 0}, now() - interval '90 minutes')`;
      }
      if (r.status === "fulfilled") await tx`insert into public.request_tracker_events
        (request_id, event_type, request_status, pledge_count, confirmed_count, created_at)
        values (${row.id}, 'request_fulfilled', 'fulfilled', 1, 1, now() - interval '30 minutes')`;
    }

    const donorId = (slug) => profileRows.find((p) => users.find((u) => u[0] === slug)?.[1] === p.name).id;
    const pledgeSeeds = [
      ["central-a-pos", "donor-02", "accepted"],
      ["east-o-neg", "donor-04", "confirmed"],
      ["south-a-neg-done", "donor-02", "completed"],
    ];
    for (const [requestKey, donorSlug, status] of pledgeSeeds) {
      const [pledge] = await tx`insert into public.donor_pledges (request_id, donor_id, status)
        values (${ids[requestKey]}, ${donorId(donorSlug)}, ${status})
        on conflict (request_id, donor_id) do update set status = excluded.status returning id`;
      if (status === "confirmed" || status === "completed") {
        await tx`insert into public.donation_reports (pledge_id, units_donated, status, reported_at, confirmed_at)
          values (${pledge.id}, 1, 'confirmed', now() - interval '30 minutes', now() - interval '20 minutes')
          on conflict (pledge_id) do nothing`;
      }
    }
  });
  console.log(`Seeded ${profileRows.length} demo profiles and 5 demo requests (repeatable; IDs retained).`);
} finally {
  await sql.end();
}
