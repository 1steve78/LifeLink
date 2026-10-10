"use client";

import { useCallback, useEffect, useState } from "react";

type AbuseReport = { id: string; targetType: string; targetId: string; reason: string; status: string; createdAt: string };

export default function ReportsQueue() {
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/reports", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load abuse reports.");
    setReports(result.reports ?? []);
  }, []);

  useEffect(() => { void refresh().catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load reports.")); }, [refresh]);

  const update = async (reportId: string, status: "reviewed" | "dismissed") => {
    setSaving(reportId); setError("");
    try {
      const response = await fetch("/api/reports", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportId, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update report.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update report."); }
    finally { setSaving(null); }
  };

  return <section className="space-y-3 rounded-2xl border border-amber-200 bg-white p-5">
    <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Abuse reports</h2><p className="text-xs text-neutral-500">Review new reports during each moderator rota check.</p></div><button onClick={() => void refresh().catch((cause) => setError(cause instanceof Error ? cause.message : "Could not refresh reports."))} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold">Refresh</button></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {reports.filter((report) => report.status === "open").length === 0 ? <p className="text-sm text-neutral-500">No open reports.</p> : <ul className="space-y-2">{reports.filter((report) => report.status === "open").map((report) => <li key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 p-3">
      <div><p className="text-sm font-semibold capitalize">{report.reason.replaceAll("_", " ")} · {report.targetType}</p><p className="text-xs text-neutral-500">Item {report.targetId} · {new Date(report.createdAt).toLocaleString()}</p></div>
      <div className="flex gap-2"><button disabled={saving === report.id} onClick={() => void update(report.id, "dismissed")} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold disabled:opacity-50">Dismiss</button><button disabled={saving === report.id} onClick={() => void update(report.id, "reviewed")} className="rounded-lg bg-amber-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Mark reviewed</button></div>
    </li>)}</ul>}
  </section>;
}
