"use client";

import { useState } from "react";

const reasonLabels = {
  fraud: "Possible fraud",
  inaccurate: "Inaccurate or outdated",
  harassment: "Harassment or unsafe behavior",
  other: "Other safety concern",
} as const;

export default function ReportRequestButton({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<keyof typeof reasonLabels>("inaccurate");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetType: "request", targetId: requestId, reason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not submit report.");
      setMessage("Report sent to the moderator team.");
      setOpen(false);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not submit report.");
    } finally { setBusy(false); }
  };

  return <div className="mt-3">
    {!open ? <button type="button" onClick={() => { setOpen(true); setMessage(""); }} className="w-full rounded-xl border border-neutral-200 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50">Report a problem</button> : <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <label className="block text-xs font-semibold text-neutral-700" htmlFor={`report-reason-${requestId}`}>What is the concern?</label>
      <select id={`report-reason-${requestId}`} value={reason} onChange={(event) => setReason(event.target.value as keyof typeof reasonLabels)} className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm">
        {Object.entries(reasonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void submit()} className="flex-1 rounded-lg bg-amber-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "Sending…" : "Send report"}</button><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold">Cancel</button></div>
    </div>}
    {message && <p role="status" className="mt-2 text-xs text-neutral-600">{message}</p>}
  </div>;
}
