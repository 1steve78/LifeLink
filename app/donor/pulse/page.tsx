"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Bell, Droplet, MapPin, RefreshCw, ShieldCheck } from "lucide-react";
import type { DonorMatch } from "@/lib/pulse/eligible-requests";

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

export default function DonorPulsePage() {
  const [matches, setMatches] = useState<DonorMatch[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingPledge, setUpdatingPledge] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const [matchResponse, notificationResponse] = await Promise.all([
        fetch("/api/pulse/matches", { cache: "no-store" }),
        fetch("/api/notifications", { cache: "no-store" }),
      ]);
      const matchData = await matchResponse.json();
      const notificationData = await notificationResponse.json();
      if (!matchResponse.ok) throw new Error(matchData.error || "Could not load nearby requests.");
      if (!notificationResponse.ok) throw new Error(notificationData.error || "Could not load notifications.");
      setMatches(matchData.matches ?? []);
      setNotifications(notificationData.notifications ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load Emergency Pulse.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const updatePledge = async (pledgeId: string, action: "confirm" | "withdraw") => {
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

  const notificationByRequest = new Map(notifications.map((notification) => [notification.requestId, notification]));

  return (
    <main className="min-h-screen bg-[#fdf9f8] px-4 py-8 text-neutral-900 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm font-semibold text-neutral-500 hover:text-red-700">← LifeLink home</Link>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-extrabold"><Droplet className="h-7 w-7 fill-red-600 text-red-600" />Emergency Pulse</h1>
            <p className="mt-1 text-sm text-neutral-600">Approved nearby requests that match your donor profile.</p>
          </div>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50"><RefreshCw className="h-4 w-4" />Refresh</button>
        </header>

        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</div>}
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Compatibility and the 90-day interval are preliminary matching filters only. A notification or pledge does not confirm medical eligibility; the hospital or blood bank must confirm compatibility and eligibility.</p></div>

        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white p-3 shadow-sm">
          <RequestMap matches={matches} />
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
                    <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm font-semibold capitalize text-emerald-800">{pledgeStatus === "confirmed" ? "Coordination confirmed" : "Pledge recorded"}</p>
                    {pledgeStatus === "pledged" && match.pledgeId && <button disabled={updatingPledge === match.pledgeId} onClick={() => void updatePledge(match.pledgeId!, "confirm")} className="w-full rounded-xl border border-emerald-200 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60">Confirm I contacted the hospital</button>}
                    {pledgeStatus !== "completed" && match.pledgeId && <button disabled={updatingPledge === match.pledgeId} onClick={() => void updatePledge(match.pledgeId!, "withdraw")} className="w-full rounded-xl border border-neutral-200 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-60">Withdraw pledge</button>}
                  </div>}
                  <p className="mt-2 text-center text-xs text-neutral-500">The hospital will confirm details directly. Your pledge is not a medical commitment.</p>
                </article>;
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
