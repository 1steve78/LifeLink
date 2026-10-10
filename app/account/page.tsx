"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, ArrowLeft, Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccountControlsPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const exportData = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/account/export", { cache: "no-store" });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Could not export account data.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "lifelink-data-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice("Your data export has downloaded.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not export account data."); }
    finally { setBusy(false); }
  };

  const deleteAccount = async () => {
    if (confirmation !== "DELETE") return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete the account.");
      router.replace("/");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete the account."); }
    finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-[#fdf9f8] px-4 py-8 text-neutral-900 sm:px-6">
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-red-700"><ArrowLeft className="h-4 w-4" />LifeLink home</Link>
      <header><h1 className="text-3xl font-extrabold">Account controls</h1><p className="mt-2 text-sm text-neutral-600">Export your LifeLink account data or permanently delete your account and private documents.</p></header>
      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</div>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-bold">Download your data</h2><p className="mt-1 text-sm text-neutral-600">Includes your profile, requests, donor pledges, notifications and related account history. Recent sign-in is required.</p>
        <button disabled={busy} onClick={() => void exportData()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold hover:bg-neutral-50 disabled:opacity-50"><Download className="h-4 w-4" />Download JSON export</button>
      </section>
      <section className="space-y-4 rounded-2xl border border-red-200 bg-white p-6">
        <div><h2 className="text-lg font-bold text-red-800">Delete account</h2><p className="mt-1 text-sm text-neutral-600">This permanently deletes your profile, requests, donor activity and private uploaded documents. Open reports retain only their category and target reference; your reporter identity is removed. Sign in again if your session is older than 15 minutes.</p></div>
        <label className="block text-sm font-semibold" htmlFor="delete-confirmation">Type DELETE to confirm</label>
        <input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="w-full max-w-sm rounded-xl border border-neutral-300 px-3 py-2.5 text-sm" />
        <button disabled={busy || confirmation !== "DELETE"} onClick={() => void deleteAccount()} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"><Trash2 className="h-4 w-4" />Permanently delete account</button>
      </section>
    </div>
  </main>;
}
