"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Bell, Droplet, MapPin, RefreshCw, ShieldCheck } from "lucide-react";
import type { DonorMatch } from "@/lib/pulse/eligible-requests";
import ReportRequestButton from "@/components/reports/ReportRequestButton";

const RequestMap = dynamic(() => import("@/components/pulse/RequestMap"), { ssr: false });
type Notification = {
  id: string;
  requestId: string;
  createdAt: string;
  readAt: string | null;
  bloodGroup: string;
  unitsNeeded: number;
  hospitalName: string;
  hospitalAddress: string | null;
  urgency: string;
  requiredBy: string | null;
};

function readMapPoint(value: unknown): [number, number] | null {
  if (typeof value !== "string") return null;
  const point = value.match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
  if (!point) return null;
  const longitude = Number(point[1]);
  const latitude = Number(point[2]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
  return [latitude, longitude];
}

export default function DonorPulsePage() {
  const [matches, setMatches] = useState<DonorMatch[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingPledge, setUpdatingPledge] = useState<string | null>(null);
  const [donationUnits, setDonationUnits] = useState<Record<string, string>>({});
  const [available, setAvailable] = useState(false);
  const [availabilityExpiresAt, setAvailabilityExpiresAt] = useState<string | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [donorCenter, setDonorCenter] = useState<[number, number] | null>(null);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [matchResponse, notificationResponse, profileResponse] = await Promise.all([
        fetch("/api/pulse/matches", { cache: "no-store" }),
        fetch("/api/notifications", { cache: "no-store" }),
        fetch("/api/profile", { cache: "no-store" }),
      ]);
      const matchData = await matchResponse.json();
      const notificationData = await notificationResponse.json();
      const profileData = await profileResponse.json();
      if (!matchResponse.ok) throw new Error(matchData.error || "Could not load nearby requests.");
      if (!notificationResponse.ok) throw new Error(notificationData.error || "Could not load notifications.");
      setMatches(matchData.matches ?? []);
      setNotifications(notificationData.notifications ?? []);
      setAvailable(Boolean(profileData.profile?.availableToDonate && profileData.profile?.availabilityExpiresAt && new Date(profileData.profile.availabilityExpiresAt) > new Date()));
      setAvailabilityExpiresAt(profileData.profile?.availabilityExpiresAt ?? null);
      setDonorCenter(readMapPoint(profileData.profile?.location));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Emergency Pulse.");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAvailability = async (nextAvailable: boolean) => {
    setSavingAvailability(true);
    setError("");
    try {
      const response = await fetch("/api/profile/availability", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ available: nextAvailable }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update availability.");
      setAvailable(result.availableToDonate);
      setAvailabilityExpiresAt(result.availabilityExpiresAt);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update availability.");
    } finally { setSavingAvailability(false); }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const pledge = async (requestId: string, notificationId?: string) => {
    setError("");
    const response = await fetch("/api/pulse/pledges", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Your pledge could not be saved.");
      await refresh();
      return;
    }
    if (notificationId) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
    }
    await refresh();
  };

  const updatePledge = async (pledgeId: string, action: "accept" | "confirm" | "withdraw") => {
    setUpdatingPledge(pledgeId);
    setError("");
    try {
      const response = await fetch(`/api/pulse/pledges/${pledgeId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update pledge status.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update pledge status.");
    } finally {
      setUpdatingPledge(null);
    }
  };

  const reportDonation = async (pledgeId: string) => {
    setUpdatingPledge(pledgeId);
    setError("");
    try {
      const response = await fetch(`/api/pulse/pledges/${pledgeId}/donations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ unitsDonated: Number(donationUnits[pledgeId] || 1) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not report the donation.");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not report the donation.");
    } finally {
      setUpdatingPledge(null);
    }
  };

  const notificationByRequest = new Map(notifications.map((notification) => [notification.requestId, notification]));

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-[#fdf9f8] to-orange-50 px-4 pb-16 pt-8 text-neutral-900 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="relative isolate flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#e23b42] p-6 text-white shadow-xl shadow-red-900/10 sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-20 -z-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">Donor dashboard</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-extrabold tracking-tight sm:text-4xl"><Droplet className="h-7 w-7 fill-white text-white" />Emergency Pulse</h1>
            <p className="mt-2 max-w-xl text-sm text-red-50 sm:text-base">Approved nearby requests that match your donor profile.</p>
          </div>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"><RefreshCw className="h-4 w-4" />Refresh</button>
        </header>

        <section aria-label="Donor activity summary" className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white bg-white p-5 shadow-sm"><p className="text-sm font-medium text-neutral-500">Nearby matches</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900">{loading ? "—" : matches.length}</p><p className="mt-1 text-xs text-neutral-500">Requests matching your profile</p></div>
          <div className="rounded-2xl border border-white bg-white p-5 shadow-sm"><p className="text-sm font-medium text-neutral-500">Unread alerts</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900">{loading ? "—" : notifications.filter((item) => !item.readAt).length}</p><p className="mt-1 text-xs text-neutral-500">New request notifications</p></div>
          <div className="rounded-2xl border border-white bg-white p-5 shadow-sm"><p className="text-sm font-medium text-neutral-500">Availability</p><p className={`mt-2 text-3xl font-extrabold tracking-tight ${loading ? "text-neutral-400" : available ? "text-emerald-700" : "text-neutral-400"}`}>{loading ? "—" : available ? "On" : "Off"}</p><p className="mt-1 text-xs text-neutral-500">{loading ? "Checking availability" : available ? "You can receive matching requests" : "Turn on availability to be matched"}</p></div>
        </section>

        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</div>}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-900/5 sm:p-6">
          <div><p className="font-bold">Donor availability: <span className={available ? "text-emerald-700" : "text-neutral-500"}>{available ? "On" : "Off"}</span></p><p className="mt-1 text-xs text-neutral-500">Availability expires after 72 hours. {available && availabilityExpiresAt ? `Current window ends ${new Date(availabilityExpiresAt).toLocaleString()}.` : "Turn it on when you can be contacted about a matched request."}</p></div>
          <div className="flex gap-2"><button disabled={savingAvailability} onClick={() => void updateAvailability(true)} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{savingAvailability ? "Saving…" : available ? "I'm still available · 72h" : "I'm available for 72 hours"}</button>{available && <button disabled={savingAvailability} onClick={() => void updateAvailability(false)} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50">Pause</button>}</div>
        </section>
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Compatibility and the 90-day interval are preliminary matching filters only. A notification or pledge does not confirm medical eligibility; the hospital or blood bank must confirm compatibility and eligibility.</p></div>

        <section className="overflow-hidden rounded-3xl border border-white bg-white p-2 shadow-lg shadow-neutral-900/5 sm:p-3">
          <RequestMap matches={matches} donorCenter={donorCenter} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-red-600" /><h2 className="text-xl font-bold">Nearby matches</h2><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">{matches.length}</span></div>
          {loading ? <p className="rounded-2xl bg-white p-6 text-sm text-neutral-500">Loading matches…</p> : matches.length === 0 ? <div className="rounded-2xl border border-neutral-200 bg-white p-7 text-center"><MapPin className="mx-auto h-7 w-7 text-neutral-400" /><p className="mt-2 font-semibold">No active matches nearby</p><p className="mt-1 text-sm text-neutral-500">We’ll refresh automatically as verified requests become available.</p></div> : (
            <div className="grid gap-3 md:grid-cols-2">
              {matches.map((match) => {
                const notification = notificationByRequest.get(match.requestId);
                const pledgeStatus = match.pledgeStatus;
                return <article key={match.requestId} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-lg font-extrabold text-red-700">{match.bloodGroup} <span className="text-sm font-semibold text-neutral-700">· {match.unitsNeeded} {match.unitsNeeded === 1 ? "unit" : "units"}</span></p><p className="mt-1 font-semibold">{match.hospitalName}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${match.urgency === "critical" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{match.urgency}</span></div>
                  {match.hospitalAddress && <p className="mt-2 text-sm text-neutral-600">{match.hospitalAddress}</p>}
                  <p className="mt-3 text-sm text-neutral-600">{match.distanceKm.toFixed(1)} km away{match.requiredBy ? ` · Needed by ${new Date(match.requiredBy).toLocaleString()}` : ""}</p>
                  {!pledgeStatus || pledgeStatus === "withdrawn" ? <button disabled={updatingPledge === match.requestId} onClick={() => void pledge(match.requestId, notification?.id)} className="mt-4 w-full rounded-xl bg-[#c81e1e] py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">{pledgeStatus === "withdrawn" ? "Pledge again" : "I may be able to help"}</button> : <div className="mt-4 space-y-2">
                    <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-800">
                      {match.donationStatus === "confirmed" ? "Requester confirmed receipt" : match.donationStatus === "reported" ? "Donation reported · awaiting requester confirmation" : pledgeStatus === "completed" ? "Donation confirmed" : pledgeStatus === "confirmed" ? "Hospital coordination confirmed" : pledgeStatus === "accepted" ? "You accepted this request" : "Interest recorded"}
                    </p>
                    {pledgeStatus === "pledged" && match.pledgeId && <button disabled={updatingPledge === match.pledgeId} onClick={() => void updatePledge(match.pledgeId!, "accept")} className="w-full rounded-xl bg-emerald-700 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">Accept this request</button>}
                    {pledgeStatus === "accepted" && match.pledgeId && <button disabled={updatingPledge === match.pledgeId} onClick={() => void updatePledge(match.pledgeId!, "confirm")} className="w-full rounded-xl border border-emerald-200 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60">Confirm hospital coordination</button>}
                    {pledgeStatus === "confirmed" && match.pledgeId && !match.donationStatus && <div className="flex gap-2">
                      <label className="sr-only" htmlFor={`donation-units-${match.pledgeId}`}>Units donated</label>
                      <input id={`donation-units-${match.pledgeId}`} type="number" min={1} max={match.unitsNeeded} value={donationUnits[match.pledgeId] ?? "1"} onChange={(event) => setDonationUnits((current) => ({ ...current, [match.pledgeId!]: event.target.value }))} className="w-20 rounded-lg border border-neutral-200 px-2 text-sm" />
                      <button disabled={updatingPledge === match.pledgeId} onClick={() => void reportDonation(match.pledgeId!)} className="flex-1 rounded-xl border border-emerald-200 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60">Report donation</button>
                    </div>}
                    {match.pledgeId && !match.donationStatus && ["pledged", "accepted", "confirmed"].includes(pledgeStatus) && <button disabled={updatingPledge === match.pledgeId} onClick={() => void updatePledge(match.pledgeId!, "withdraw")} className="w-full rounded-xl border border-neutral-200 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60">Withdraw</button>}
                  </div>}
                  <p className="mt-2 text-center text-xs text-neutral-500">The hospital will confirm details directly. Your pledge is not a medical commitment.</p>
                  <ReportRequestButton requestId={match.requestId} />
                </article>;
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
