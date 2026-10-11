"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, MapPin, Plus, RefreshCw } from "lucide-react";
import RequesterNearbyMap, { type NearbyRequest } from "@/components/requests/RequesterNearbyMap";
import { RequestModal } from "@/components/landing/RequestModal";

type RequestItem = {
  id: string;
  bloodGroup: string;
  unitsNeeded: number;
  hospitalName: string;
  hospitalAddress: string | null;
  urgency: string;
  requiredBy: string | null;
  status: string;
  reviewState: string;
};

const statusStyles: Record<string, string> = {
  pending_verification: "bg-blue-50 text-blue-800",
  under_review: "bg-amber-50 text-amber-900",
  active: "bg-emerald-50 text-emerald-800",
  fulfilled: "bg-neutral-100 text-neutral-700",
  rejected: "bg-red-50 text-red-800",
  cancelled: "bg-neutral-100 text-neutral-600",
  expired: "bg-orange-50 text-orange-800",
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [nearby, setNearby] = useState<NearbyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [requestResponse, nearbyResponse] = await Promise.all([
        fetch("/api/requests", { cache: "no-store" }),
        fetch("/api/requests/nearby", { cache: "no-store" }),
      ]);
      const [requestData, nearbyData] = await Promise.all([requestResponse.json(), nearbyResponse.json()]);
      if (!requestResponse.ok) throw new Error(requestData.error || "Could not load your requests.");
      setRequests(requestData.requests ?? []);
      setNearby(nearbyResponse.ok ? nearbyData.requests ?? [] : []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load your requests.");
    } finally { setLoading(false); }
  }, []);

  // Reload list when modal closes so a newly created request appears immediately
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    void load();
  }, [load]);

  useEffect(() => { void load(); }, [load]);
  const nearbyMatches = nearby.filter((item) => item.donorAvailability !== "none");

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-[#fdf9f8] to-orange-50 px-4 pb-16 pt-8 text-neutral-900 sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="relative isolate flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#e23b42] p-6 text-white shadow-xl shadow-red-900/10 sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-20 -z-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100">Requester dashboard</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Your blood requests</h1>
            <p className="mt-2 text-sm text-red-50 sm:text-base">Track verification, donor availability, and request progress.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-red-800 shadow-md transition hover:bg-red-50"
            >
              <Plus className="h-4 w-4" />
              New request
            </button>
          </div>
        </header>

        <section aria-label="Request activity summary" className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white bg-white p-5 shadow-sm"><p className="text-sm font-medium text-neutral-500">Total requests</p><p className="mt-2 text-3xl font-extrabold tracking-tight">{loading ? "—" : requests.length}</p><p className="mt-1 text-xs text-neutral-500">Requests in your history</p></div>
          <div className="rounded-2xl border border-white bg-white p-5 shadow-sm"><p className="text-sm font-medium text-neutral-500">Active requests</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-red-700">{loading ? "—" : requests.filter((item) => ["pending_verification", "under_review", "active"].includes(item.status)).length}</p><p className="mt-1 text-xs text-neutral-500">Being verified or matched</p></div>
          <div className="rounded-2xl border border-white bg-white p-5 shadow-sm"><p className="text-sm font-medium text-neutral-500">Nearby donor matches</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-700">{loading ? "—" : nearbyMatches.length}</p><p className="mt-1 text-xs text-neutral-500">Available for your requests</p></div>
        </section>

        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <span className="inline-flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</span>
            {error.toLowerCase().includes("sign in") && <Link href="/login" className="font-bold underline">Sign in</Link>}
          </div>
        )}

        <section className="space-y-4 rounded-3xl border border-white bg-white p-5 shadow-lg shadow-neutral-900/5 sm:p-7">
          <div>
            <h2 className="text-xl font-extrabold">Nearby compatible donors</h2>
            <p className="mt-1 text-sm text-neutral-500">Map pins show aggregate availability for your approved requests. Donor locations stay private.</p>
          </div>
          {loading && !nearby.length
            ? <div className="flex h-48 items-center justify-center gap-2 text-sm text-neutral-500"><Loader2 className="h-5 w-5 animate-spin" />Checking nearby availability…</div>
            : nearbyMatches.length
              ? <RequesterNearbyMap requests={nearbyMatches} />
              : <div className="flex items-start gap-3 rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-600"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-700" /><p>{nearby.length ? "There are no compatible available donors near your active requests right now. We will show the map here when a nearby match is found." : "Donor matching starts after a moderator approves a request. You will see the map here when an eligible nearby donor is found."}</p></div>
          }
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold">Request history</h2>
              <p className="mt-1 text-sm text-neutral-500">Only you can see the private details of your requests.</p>
            </div>
            <span className="text-sm font-semibold text-neutral-500">{requests.length} {requests.length === 1 ? "request" : "requests"}</span>
          </div>

          {loading && requests.length === 0 ? (
            <div className="flex items-center gap-2 rounded-2xl bg-white p-8 text-neutral-600"><Loader2 className="h-5 w-5 animate-spin" />Loading requests…</div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
              <p className="font-semibold">You have not submitted a blood request yet.</p>
              <p className="mt-1 text-sm text-neutral-500">Create one to start verification and donor matching.</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800"
              >
                Create a request <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests.map((item) => (
                <article key={item.id} className="rounded-3xl border border-white bg-white p-5 shadow-lg shadow-neutral-900/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-extrabold">{item.bloodGroup} · {item.unitsNeeded} {item.unitsNeeded === 1 ? "unit" : "units"}</h3>
                      <p className="mt-1 font-semibold">{item.hospitalName}</p>
                      <p className="text-sm text-neutral-500">{item.hospitalAddress || "Hospital address not provided"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[item.status] ?? "bg-neutral-100 text-neutral-700"}`}>
                      {item.reviewState === "needs_information" ? "Needs information" : item.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                    <span className="capitalize">{item.urgency}</span>
                    {item.requiredBy && <span>Needed by {new Date(item.requiredBy).toLocaleString()}</span>}
                  </div>
                  <Link href={`/requests/${item.id}/tracker`} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50">
                    Open request tracker <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Request creation modal — mounted here so it works regardless of landing page redirect */}
      <RequestModal isOpen={modalOpen} onClose={handleModalClose} />
    </main>
  );
}
