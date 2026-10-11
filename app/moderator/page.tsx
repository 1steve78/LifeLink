"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ExternalLink, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import ReportsQueue from "@/components/moderator/ReportsQueue";

type Verification = { gate: string; status: string; details: Record<string, unknown>; model: string | null; createdAt: string };
type ReviewRequest = {
  id: string; requesterId: string; patientName: string | null; patientReference: string | null;
  patientAge: number | null; contactPersonName: string | null; contactPhone: string | null;
  bloodGroup: string; unitsNeeded: number; hospitalName: string; hospitalAddress: string | null;
  urgency: string; requiredBy: string | null; status: string; reviewState: string; createdAt: string;
  verification: Verification[];
  informationResponses?: { message: string; createdAt: string }[];
  moderationHistory?: { moderatorId: string; action: string; previousStatus: string; newStatus: string; reason: string; createdAt: string }[];
};

const labels: Record<string, string> = {
  basic_validation: "Required fields and upload checks",
  document_analysis: "Document analysis",
  risk_screening: "Risk screening",
  moderator_review: "Previous moderator decision",
};

export default function ModeratorDashboardPage() {
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/requests", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load the review queue.");
      if (!result.isModerator) throw new Error("This account is not authorized to use the moderator dashboard.");
      setRequests(result.requests);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the review queue.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const openDocument = async (requestId: string) => {
    setError("");
    const documentTab = window.open("about:blank", "_blank");
    if (!documentTab) { setError("Allow pop-ups to open the private document."); return; }
    documentTab.opener = null;
    try {
      const response = await fetch(`/api/requests/${requestId}/document`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not open the document.");
      documentTab.location.href = result.url;
    } catch (cause) { documentTab.close(); setError(cause instanceof Error ? cause.message : "Could not open the document."); }
  };

  const decide = async (requestId: string, action: "approve" | "reject" | "request_information") => {
    setSaving(requestId);
    setError("");
    try {
      const response = await fetch(`/api/requests/${requestId}/review`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason: reasons[requestId] ?? "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not record the decision.");
      if (action === "request_information") {
        await refresh();
      } else setRequests((current) => current.filter((item) => item.id !== requestId));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not record the decision."); }
    finally { setSaving(null); }
  };

  return <main className="min-h-screen bg-gradient-to-br from-violet-50 via-[#fdf9f8] to-rose-50 px-4 pb-16 pt-8 text-neutral-900 sm:px-6 sm:pt-10">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="relative isolate flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#241044] via-[#4c1d75] to-[#7e22ce] p-6 text-white shadow-xl shadow-violet-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-20 -z-10 h-64 w-64 rounded-full bg-fuchsia-300/15 blur-3xl" />
        <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-200"><ShieldCheck className="h-4 w-4" />Human safety checkpoint</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Moderator review</h1><p className="mt-2 max-w-2xl text-sm text-violet-100 sm:text-base">Review evidence and screening signals. AI findings are leads for review, not proof of fraud or document authenticity.</p></div>
        <button onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh queue</button>
      </header>
      <section aria-label="Review queue summary" className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white bg-white p-5 shadow-sm"><p className="text-sm font-medium text-neutral-500">In review queue</p><p className="mt-2 text-3xl font-extrabold tracking-tight">{loading ? "—" : requests.length}</p><p className="mt-1 text-xs text-neutral-500">Requests awaiting a decision</p></div>
        <div className="rounded-2xl border border-white bg-white p-5 shadow-sm"><p className="text-sm font-medium text-neutral-500">Flagged for review</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-amber-700">{loading ? "—" : requests.filter((item) => item.verification.some((event) => event.status === "flagged")).length}</p><p className="mt-1 text-xs text-neutral-500">Screening signals need careful review</p></div>
        <div className="rounded-2xl border border-white bg-white p-5 shadow-sm"><p className="text-sm font-medium text-neutral-500">Needs information</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-violet-700">{loading ? "—" : requests.filter((item) => item.reviewState === "needs_information").length}</p><p className="mt-1 text-xs text-neutral-500">Requests with requester follow-up</p></div>
      </section>
      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      <ReportsQueue />
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-neutral-200/80 pb-3">
        <div><h2 className="text-xl font-extrabold tracking-tight">Blood request review</h2><p className="mt-1 text-sm text-neutral-500">Review documentation, screening results, and requester details.</p></div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">{loading ? "Loading" : `${requests.length} pending`}</span>
      </div>
      {loading && requests.length === 0 ? <div className="flex items-center gap-2 rounded-2xl bg-white p-8 text-neutral-600"><Loader2 className="h-5 w-5 animate-spin" />Loading pending requests…</div> : requests.length === 0 ? <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-600">No pending requests require review.</div> : <div className="space-y-5">
        {requests.map((item) => {
          const flagged = item.verification.some((event) => event.status === "flagged");
          return <article key={item.id} className="space-y-5 rounded-3xl border border-white bg-white p-5 shadow-lg shadow-neutral-900/5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-extrabold">{item.bloodGroup} · {item.unitsNeeded} {item.unitsNeeded === 1 ? "unit" : "units"}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${flagged || item.reviewState === "needs_information" ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"}`}>{item.reviewState === "needs_information" ? "Needs information" : flagged ? "Flagged for review" : item.status.replaceAll("_", " ")}</span></div><p className="mt-2 font-semibold">{item.hospitalName} · {item.urgency}</p><p className="text-sm text-neutral-500">{item.hospitalAddress || "No hospital address provided"}{item.requiredBy ? ` · Needed by ${new Date(item.requiredBy).toLocaleString()}` : ""}</p></div>
              <button onClick={() => void openDocument(item.id)} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"><ExternalLink className="h-4 w-4" />Open private document</button>
            </div>
            <details className="rounded-2xl bg-neutral-50 p-4">
              <summary className="cursor-pointer text-sm font-bold">Requester and patient details</summary>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div><dt className="text-neutral-500">Patient</dt><dd className="font-semibold">{item.patientName || "Not provided"}</dd></div>
                <div><dt className="text-neutral-500">Reference</dt><dd className="font-semibold">{item.patientReference || "Not provided"}</dd></div>
                <div><dt className="text-neutral-500">Patient age</dt><dd className="font-semibold">{item.patientAge ?? "Not provided"}</dd></div>
                <div><dt className="text-neutral-500">Contact person</dt><dd className="font-semibold">{item.contactPersonName || "Not provided"}</dd></div>
                <div><dt className="text-neutral-500">Contact phone</dt><dd className="font-semibold">{item.contactPhone || "Not provided"}</dd></div>
                <div><dt className="text-neutral-500">Submitted</dt><dd className="font-semibold">{new Date(item.createdAt).toLocaleString()}</dd></div>
              </dl>
            </details>
            <section><h3 className="text-sm font-bold">Screening results and history</h3><div className="mt-3 grid gap-3 md:grid-cols-2">
              {item.verification.map((event, index) => <div key={`${event.gate}-${event.createdAt}-${index}`} className="rounded-2xl border border-neutral-200 p-4">
                <div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-bold">{labels[event.gate] ?? event.gate.replaceAll("_", " ")}</p><span className="text-xs font-bold uppercase text-neutral-500">{event.status}</span></div>
                <p className="mt-1 text-xs text-neutral-500">{new Date(event.createdAt).toLocaleString()}{event.model ? ` · ${event.model}` : ""}</p>
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-neutral-700">{JSON.stringify(event.details, null, 2)}</pre>
              </div>)}
              {item.verification.length === 0 && <p className="text-sm text-neutral-500">No screening results are recorded yet. Do not approve until all required checks have completed.</p>}
            </div></section>
            {!!item.informationResponses?.length && <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><h3 className="text-sm font-bold text-blue-950">Requester clarifications</h3><div className="mt-3 space-y-3">{item.informationResponses.map((response, index) => <div key={`${response.createdAt}-${index}`} className="rounded-xl bg-white p-3"><p className="text-xs text-neutral-500">{new Date(response.createdAt).toLocaleString()}</p><p className="mt-1 whitespace-pre-wrap text-sm">{response.message}</p></div>)}</div></section>}
            {!!item.moderationHistory?.length && <section className="rounded-2xl border border-neutral-200 p-4"><h3 className="text-sm font-bold">Append-only decision history</h3><div className="mt-3 space-y-3">{item.moderationHistory.map((event, index) => <div key={`${event.createdAt}-${index}`} className="border-l-2 border-neutral-200 pl-3"><p className="text-sm font-bold capitalize">{event.action.replaceAll("_", " ")} · {event.previousStatus.replaceAll("_", " ")} → {event.newStatus.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-neutral-500">Moderator {event.moderatorId} · {new Date(event.createdAt).toLocaleString()}</p><p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{event.reason}</p></div>)}</div></section>}
            <div className="space-y-3 border-t border-neutral-100 pt-5">
              <label className="block text-sm font-semibold">Decision reason (required for the audit record){flagged ? "; flagged approvals must explain the evidence reviewed" : ""}<textarea value={reasons[item.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={1000} rows={2} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-red-500" placeholder="Summarize the evidence reviewed or information needed" /></label>
              <div className="flex flex-wrap justify-end gap-2">
                <button disabled={saving === item.id} onClick={() => void decide(item.id, "request_information")} className="rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-bold text-amber-900 hover:bg-amber-50 disabled:opacity-50">Request more information</button>
                <button disabled={saving === item.id} onClick={() => void decide(item.id, "reject")} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Reject</button>
                <button disabled={saving === item.id} onClick={() => void decide(item.id, "approve")} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">Approve and notify donors</button>
              </div>
            </div>
          </article>;
        })}
      </div>}
    </div>
  </main>;
}
