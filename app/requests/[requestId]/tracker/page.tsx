"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, BellRing, CheckCircle2, HeartHandshake, Loader2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type TrackerData = {
  request: {
    id: string;
    bloodGroup: string;
    unitsNeeded: number;
    hospitalName: string;
    hospitalAddress: string | null;
    urgency: string;
    requiredBy: string | null;
    status: string;
    reviewState: string;
    createdAt: string;
  };
  progress: { matchedCount: number; pledgeCount: number; acceptedCount: number; confirmedCount: number; reportedDonationUnits: number; confirmedDonationUnits: number };
  donations: { id: string; unitsDonated: number; status: "reported" | "confirmed"; reportedAt: string; confirmedAt: string | null }[];
  events: { id: string; eventType: string; requestStatus: string; pledgeCount: number; confirmedCount: number; createdAt: string }[];
  canManageRequest: boolean;
  informationRequest: { reason: string; response: { message: string; createdAt: string } | null; canRespond: boolean } | null;
};

const eventLabels: Record<string, string> = {
  request_submitted: "Request submitted for verification",
  request_under_review: "Request moved to moderator review",
  request_activated: "Request approved; compatible donors notified",
  request_rejected: "Request rejected by a moderator",
  request_cancelled: "Request cancelled",
  request_expired: "Request expired after its required-by time",
  request_fulfilled: "Need marked as fulfilled",
  donor_pledged: "A donor pledged to help",
  donor_accepted: "A donor accepted the request",
  donor_confirmed: "A donor confirmed coordination",
  donor_donation_reported: "A donor reported a donation",
  donor_donation_confirmed: "Donation receipt confirmed",
  donor_withdrew: "A donor withdrew their pledge",
  request_information_needed: "The moderator requested more information",
};

export default function RequestTrackerPage({ params }: { params: { requestId: string } }) {
  const router = useRouter();
  const [data, setData] = useState<TrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [informationMessage, setInformationMessage] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/requests/${params.requestId}/tracker`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load this request tracker.");
      setData(result);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this request tracker.");
    } finally {
      setLoading(false);
    }
  }, [params.requestId]);

  useEffect(() => {
    void refresh();
    const supabase = createClient();
    const channel = supabase.channel(`request-tracker-${params.requestId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "request_tracker_events",
        filter: `request_id=eq.${params.requestId}`,
      }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [params.requestId, refresh]);

  const closeRequest = async (action: "cancelled") => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/requests/${params.requestId}/tracker`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update request status.");
      await refresh();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update request status.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDonation = async (donationId: string) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/requests/${params.requestId}/donations/${donationId}`, { method: "PATCH" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not confirm the donation receipt.");
      await refresh();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not confirm the donation receipt.");
    } finally { setSaving(false); }
  };

  const sendInformation = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/requests/${params.requestId}/information`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: informationMessage }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send your response.");
      setInformationMessage("");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send your response."); }
    finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-[#fdf9f8] px-4 py-8 text-neutral-900 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-red-700"><ArrowLeft className="h-4 w-4" />LifeLink home</Link>
        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
        {loading && !data ? <div className="flex items-center gap-2 rounded-2xl bg-white p-8 text-neutral-600"><Loader2 className="h-5 w-5 animate-spin" />Loading tracker…</div> : data && <>
          <header className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-wider text-red-700">LifeLink request tracker</p><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{data.request.bloodGroup} · {data.request.unitsNeeded} {data.request.unitsNeeded === 1 ? "unit" : "units"}</h1><p className="mt-2 font-semibold">{data.request.hospitalName}</p>{data.request.hospitalAddress && <p className="mt-1 text-sm text-neutral-500">{data.request.hospitalAddress}</p>}</div>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold capitalize text-blue-800">{data.request.status.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-4 text-sm text-neutral-600">{data.request.urgency} request{data.request.requiredBy ? ` · Needed by ${new Date(data.request.requiredBy).toLocaleString()}` : ""}</p>
            <p className="mt-2 text-xs text-neutral-400">Live updates are limited to this request. Donor identities and contact details are not shown.</p>
          </header>

          {data.informationRequest && <section className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
            <div><h2 className="font-bold">The moderator needs more information</h2><p className="mt-1 whitespace-pre-wrap text-sm">{data.informationRequest.reason}</p></div>
            {data.informationRequest.response && <div className="rounded-xl bg-white/80 p-3"><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Your latest response · {new Date(data.informationRequest.response.createdAt).toLocaleString()}</p><p className="mt-1 whitespace-pre-wrap text-sm">{data.informationRequest.response.message}</p></div>}
            {data.informationRequest.canRespond ? <div className="space-y-2"><label htmlFor="information-response" className="text-sm font-semibold">Send a clarification to the moderator</label><textarea id="information-response" value={informationMessage} onChange={(event) => setInformationMessage(event.target.value)} maxLength={2000} rows={3} className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-amber-500" placeholder="Describe the correction or additional information requested" /><button disabled={saving || informationMessage.trim().length < 5} onClick={() => void sendInformation()} className="rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-900 disabled:opacity-50">Send clarification</button></div> : <p className="text-sm font-semibold">Your clarification was sent. The request remains hidden from donors until a moderator reviews it.</p>}
          </section>}

          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="flex items-center gap-2 text-sm font-semibold text-neutral-500"><Users className="h-4 w-4" />Matched</div><p className="mt-2 text-3xl font-extrabold">{data.progress.matchedCount}</p><p className="mt-1 text-xs text-neutral-500">Donors notified after approval</p></div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="flex items-center gap-2 text-sm font-semibold text-neutral-500"><HeartHandshake className="h-4 w-4" />Pledged</div><p className="mt-2 text-3xl font-extrabold">{data.progress.pledgeCount}</p><p className="mt-1 text-xs text-neutral-500">Unique current pledges</p></div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="flex items-center gap-2 text-sm font-semibold text-neutral-500"><CheckCircle2 className="h-4 w-4" />Donation units</div><p className="mt-2 text-3xl font-extrabold">{data.progress.confirmedDonationUnits}<span className="text-base text-neutral-500"> / {data.request.unitsNeeded}</span></p><p className="mt-1 text-xs text-neutral-500">{data.progress.reportedDonationUnits} reported · {data.progress.acceptedCount} accepted · {data.progress.confirmedCount} coordinated</p></div>
          </section>

          {data.canManageRequest && data.donations.length > 0 && <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Donation reports</h2>
            <p className="mt-1 text-sm text-neutral-600">Confirm only the units you received. This records receipt; it does not assess medical eligibility.</p>
            <ul className="mt-4 space-y-3">{data.donations.map((donation) => <li key={donation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 p-4">
              <div><p className="font-semibold">{donation.unitsDonated} {donation.unitsDonated === 1 ? "unit" : "units"} · {donation.status === "confirmed" ? "Receipt confirmed" : "Awaiting your confirmation"}</p><p className="text-xs text-neutral-500">Reported {new Date(donation.reportedAt).toLocaleString()}</p></div>
              {donation.status === "reported" && data.request.status === "active" && <button disabled={saving} onClick={() => void confirmDonation(donation.id)} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">Confirm received</button>}
            </li>)}</ul>
          </section>}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold"><BellRing className="h-5 w-5 text-red-600" />Progress timeline</h2>
            <ol className="mt-5 space-y-4">
              {data.events.map((event) => <li key={event.id} className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-600" /><div className="min-w-0"><p className="text-sm font-semibold">{eventLabels[event.eventType] ?? "Request updated"}</p><p className="mt-0.5 text-xs text-neutral-500">{new Date(event.createdAt).toLocaleString()} · {event.pledgeCount} pledged · {event.confirmedCount} confirmed</p></div></li>)}
              {data.events.length === 0 && <li className="text-sm text-neutral-500">Progress updates will appear here.</li>}
            </ol>
          </section>

          {data.canManageRequest && data.request.status === "active" && <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 sm:flex-row sm:justify-end">
            <button disabled={saving} onClick={() => void closeRequest("cancelled")} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60">Cancel request</button>
          </section>}
          <p className="px-1 text-xs leading-relaxed text-neutral-500">Requests stop matching donors after the required-by time and are automatically closed by the scheduled expiry job. Confirmed donation receipts close fully met requests sooner.</p>
        </>}
      </div>
    </main>
  );
}
