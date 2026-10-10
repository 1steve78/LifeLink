"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Building2, CheckCircle2, Cpu, Droplet, FileCheck, Loader2, MapPin, ShieldCheck, UploadCloud, X } from "lucide-react";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function localDateAfterHours(hours: number) {
  const date = new Date(Date.now() + hours * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

async function readResponse(response: Response) {
  return response.json().catch(() => ({})) as Promise<{ error?: string; requestId?: string; status?: string; requestStatus?: string; message?: string; reasons?: string[] }>;
}

export const RequestModal: React.FC<RequestModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [bloodGroup, setBloodGroup] = useState("B+");
  const [patientName, setPatientName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);
  const [units, setUnits] = useState(2);
  const [urgency, setUrgency] = useState<"critical" | "urgent" | "planned">("urgent");
  const [requiredBy, setRequiredBy] = useState(() => localDateAfterHours(4));
  const [document, setDocument] = useState<File | null>(null);
  const [documentAiConsent, setDocumentAiConsent] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ title: string; message: string; status: "pending" | "review" | "approved" } | null>(null);

  if (!isOpen) return null;

  const resetAndClose = () => {
    if (loading) return;
    setStep(1);
    setBloodGroup("B+");
    setPatientName("");
    setHospitalName("");
    setHospitalAddress("");
    setLatitude("");
    setLongitude("");
    setUnits(2);
    setUrgency("urgent");
    setRequiredBy(localDateAfterHours(4));
    setDocument(null);
    setDocumentAiConsent(false);
    setRequestId(null);
    setError(null);
    setResult(null);
    onClose();
  };

  const runVerification = async () => {
    setError(null);
    setLoading(true);
    try {
      let activeRequestId = requestId;
      if (!activeRequestId) {
        if (!document) {
          setError("Attach a hospital document before submitting.");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.set("patientName", patientName);
        formData.set("bloodGroup", bloodGroup);
        formData.set("unitsNeeded", String(units));
        formData.set("hospitalName", hospitalName);
        formData.set("hospitalAddress", hospitalAddress);
        formData.set("latitude", latitude);
        formData.set("longitude", longitude);
        formData.set("urgency", urgency);
        formData.set("requiredBy", new Date(requiredBy).toISOString());
        formData.set("document", document);
        formData.set("documentAiConsent", String(documentAiConsent));

        const createResponse = await fetch("/api/requests", { method: "POST", body: formData });
        const created = await readResponse(createResponse);
        if (!createResponse.ok || !created.requestId) {
          throw new Error(created.error ?? "The request could not be submitted.");
        }
        activeRequestId = created.requestId;
        setRequestId(activeRequestId);
      }

      const documentResponse = await fetch("/api/verify/document", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: activeRequestId }),
      });
      const documentResult = await readResponse(documentResponse);
      if (!documentResponse.ok) {
        setResult({
          title: "Request saved and still pending",
          message: documentResult.error ?? "Document analysis did not finish. The request was not sent to donors; retry when the service is available.",
          status: "pending",
        });
        setStep(4);
        return;
      }
      if (documentResult.status === "flagged") {
        setResult({
          title: "Request sent for moderator review",
          message: documentResult.reasons?.join(" ") || "The document could not be matched with enough confidence. It has not been sent to donors.",
          status: "review",
        });
        setStep(4);
        return;
      }

      const riskResponse = await fetch("/api/verify/ai-screen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: activeRequestId }),
      });
      const riskResult = await readResponse(riskResponse);
      if (!riskResponse.ok || !riskResult.status) {
        setResult({
          title: "Request saved and still pending",
          message: riskResult.error ?? "Risk screening could not finish. No donor notification was sent; retry when the service is available.",
          status: "pending",
        });
      } else if (riskResult.status === "flagged") {
        setResult({
          title: "Request sent for moderator review",
          message: riskResult.message ?? "Risk screening found signals for a human review. No donor notification was sent.",
          status: "review",
        });
      } else {
        setResult({
          title: "Automated checks passed",
          message: "A moderator must approve the request before it becomes eligible for donor matching. It has not been sent to donors.",
          status: "approved",
        });
      }
      setStep(4);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-[#C81E1E] focus:ring-2 focus:ring-red-500/20";

  const useHospitalLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Location is unavailable in this browser. Enter the hospital coordinates manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude((Math.round(coords.latitude * 10000) / 10000).toFixed(4));
        setLongitude((Math.round(coords.longitude * 10000) / 10000).toFixed(4));
        setLocating(false);
      },
      () => {
        setError("Location permission was not granted. Enter the hospital coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="request-title">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[#C81E1E]"><Droplet className="h-4 w-4 fill-current" /></div>
            <div>
              <h3 id="request-title" className="text-base font-bold text-neutral-900">Create a blood request</h3>
              <p className="text-xs text-neutral-500">{step < 4 ? `Step ${step} of 3 · Verification workflow` : "Request status"}</p>
            </div>
          </div>
          <button type="button" onClick={resetAndClose} disabled={loading} aria-label="Close" className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-y-auto p-6 sm:p-8">
          {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {step === 1 && <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-neutral-700">Blood group needed</label>
              <div className="grid grid-cols-4 gap-2">{bloodGroups.map((group) => <button key={group} type="button" onClick={() => setBloodGroup(group)} className={`rounded-xl border py-2.5 text-sm font-bold transition ${bloodGroup === group ? "border-[#C81E1E] bg-[#C81E1E] text-white" : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"}`}>{group}</button>)}</div>
            </div>
            <div><label htmlFor="patient-name" className="mb-2 block text-xs font-bold uppercase tracking-wide text-neutral-700">Patient name</label><input id="patient-name" required maxLength={120} value={patientName} onChange={(event) => setPatientName(event.target.value)} className={fieldClass} placeholder="Patient full name" /></div>
            <div><label htmlFor="hospital-name" className="mb-2 block text-xs font-bold uppercase tracking-wide text-neutral-700">Hospital name</label><div className="relative"><Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400" /><input id="hospital-name" required maxLength={200} value={hospitalName} onChange={(event) => setHospitalName(event.target.value)} className={`${fieldClass} pl-10`} placeholder="Hospital or medical facility" /></div></div>
            <div><label htmlFor="hospital-address" className="mb-2 block text-xs font-bold uppercase tracking-wide text-neutral-700">Hospital address</label><input id="hospital-address" maxLength={500} value={hospitalAddress} onChange={(event) => setHospitalAddress(event.target.value)} className={fieldClass} placeholder="Area, city, or street address" /></div>
            <div className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wide text-neutral-700">Hospital map location</p><button type="button" disabled={locating} onClick={useHospitalLocation} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"><MapPin className="h-3.5 w-3.5" />{locating ? "Finding…" : "Use device location at hospital"}</button></div>
              <div className="grid grid-cols-2 gap-2"><input aria-label="Hospital latitude" type="number" min="-90" max="90" step="0.0001" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="Latitude" className={fieldClass} /><input aria-label="Hospital longitude" type="number" min="-180" max="180" step="0.0001" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="Longitude" className={fieldClass} /></div>
              <p className="text-xs text-neutral-500">Enter the hospital location or use this button while at the hospital. Donor home locations are never shown.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="units-needed" className="mb-2 block text-xs font-bold uppercase tracking-wide text-neutral-700">Units needed</label><select id="units-needed" value={units} onChange={(event) => setUnits(Number(event.target.value))} className={fieldClass}>{Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value} {value === 1 ? "unit" : "units"}</option>)}</select></div>
              <div><label htmlFor="urgency" className="mb-2 block text-xs font-bold uppercase tracking-wide text-neutral-700">Urgency</label><select id="urgency" value={urgency} onChange={(event) => { const value = event.target.value as typeof urgency; setUrgency(value); setRequiredBy(localDateAfterHours(value === "critical" ? 1 : value === "urgent" ? 4 : 24)); }} className={fieldClass}><option value="critical">Critical · within 2 hours</option><option value="urgent">Urgent · within 6 hours</option><option value="planned">Planned</option></select></div>
            </div>
            <div><label htmlFor="required-by" className="mb-2 block text-xs font-bold uppercase tracking-wide text-neutral-700">Required by</label><input id="required-by" type="datetime-local" min={localDateAfterHours(0)} required value={requiredBy} onChange={(event) => setRequiredBy(event.target.value)} className={fieldClass} /></div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">If this is an emergency, contact the hospital or blood bank directly while your request is reviewed. Critical urgency does not skip verification.</div>
            <button type="button" disabled={!patientName.trim() || !hospitalName.trim() || !requiredBy || !latitude || !longitude} onClick={() => { setError(null); setStep(2); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C81E1E] py-3.5 text-sm font-bold text-white transition hover:bg-[#B01A1A] disabled:cursor-not-allowed disabled:opacity-50">Continue to document upload <ArrowRight className="h-4 w-4" /></button>
          </div>}

          {step === 2 && <div className="space-y-5">
            <div className="rounded-2xl border border-dashed border-red-200 bg-red-50/50 p-6 text-center">
              <UploadCloud className="mx-auto h-8 w-8 text-[#C81E1E]" />
              <label htmlFor="supporting-document" className="mt-3 block cursor-pointer text-sm font-bold text-neutral-900">Choose a hospital document</label>
              <p className="mt-1 text-xs text-neutral-500">Photo only: JPG or PNG · maximum 10 MB</p>
              <input id="supporting-document" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={(event) => setDocument(event.target.files?.[0] ?? null)} className="mx-auto mt-4 block max-w-full text-xs text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-neutral-700" />
              {document && <p className="mt-3 break-all text-xs font-medium text-emerald-700">Selected: {document.name}</p>}
            </div>
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" /><p>Documents are stored privately. Automated analysis checks readability and field consistency; it cannot prove that a hospital issued a document. Requests remain hidden from donors until moderator approval.</p></div>
              <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-neutral-600"><input type="checkbox" checked={documentAiConsent} onChange={(event) => setDocumentAiConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#C81E1E]" /><span>I consent to sending this supporting document to the configured AI provider for field extraction and review signals.</span></label>
            <div className="flex gap-3"><button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" disabled={!document || !documentAiConsent} onClick={() => { setError(null); setStep(3); }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C81E1E] py-3 text-sm font-bold text-white hover:bg-[#B01A1A] disabled:cursor-not-allowed disabled:opacity-50">Review and submit <ArrowRight className="h-4 w-4" /></button></div>
          </div>}

          {step === 3 && <div className="space-y-5">
            <h4 className="text-lg font-bold text-neutral-900">Three checks before moderator approval</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#C81E1E]" /><div><p className="text-sm font-bold text-neutral-900">Gate 1 · Required fields and file checks</p><p className="mt-1 text-xs text-neutral-500">Validates the submission, file size, MIME type, and actual file signature.</p></div></div>
              <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"><FileCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><div><p className="text-sm font-bold text-neutral-900">Gate 2 · Document analysis</p><p className="mt-1 text-xs text-neutral-500">Extracts supporting details and compares them with the request.</p></div></div>
              <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"><Cpu className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><div><p className="text-sm font-bold text-neutral-900">Gate 3 · Risk screening</p><p className="mt-1 text-xs text-neutral-500">Combines request history rules and AI review signals. Signals are not proof.</p></div></div>
            </div>
            <div className="flex gap-3"><button type="button" disabled={loading} onClick={() => setStep(2)} className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"><ArrowLeft className="h-4 w-4" /> Back</button><button type="button" disabled={loading} onClick={runVerification} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C81E1E] py-3.5 text-sm font-bold text-white hover:bg-[#B01A1A] disabled:cursor-wait disabled:opacity-70">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Running checks…</> : <><ShieldCheck className="h-4 w-4" /> Submit for verification</>}</button></div>
          </div>}

          {step === 4 && result && <div className="space-y-5 py-3 text-center">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${result.status === "review" ? "bg-amber-100 text-amber-700" : result.status === "pending" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
              {result.status === "review" ? <AlertTriangle className="h-8 w-8" /> : <CheckCircle2 className="h-9 w-9" />}
            </div>
            <div><h4 className="text-xl font-extrabold text-neutral-900">{result.title}</h4><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">{result.message}</p></div>
            {requestId && <div className="space-y-3 rounded-xl bg-neutral-50 px-4 py-3 text-left text-xs"><div><span className="text-neutral-500">Request ID </span><span className="break-all font-mono font-semibold text-neutral-800">{requestId}</span></div><Link href={`/requests/${requestId}/tracker`} onClick={resetAndClose} className="inline-flex rounded-lg bg-white px-3 py-2 font-semibold text-red-700 ring-1 ring-neutral-200 hover:bg-red-50">Open request tracker</Link></div>}
            {result.status === "pending" && requestId && <button type="button" disabled={loading} onClick={() => { setResult(null); setStep(3); void runVerification(); }} className="w-full rounded-xl border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">Retry pending checks</button>}
            <button type="button" onClick={resetAndClose} className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white transition hover:bg-black">Close</button>
          </div>}
        </div>
      </div>
    </div>
  );
};

export default RequestModal;
