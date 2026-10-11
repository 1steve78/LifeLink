"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Crosshair, Download, Loader2, MapPin, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

function readCoordinates(value: unknown): { latitude: string; longitude: string } | null {
  if (typeof value !== "string") return null;
  const point = value.match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i);
  if (!point) return null;
  return { longitude: Number(point[1]).toFixed(4), latitude: Number(point[2]).toFixed(4) };
}

export default function AccountControlsPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);
  const [usingGps, setUsingGps] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationNotice, setLocationNotice] = useState("");

  useEffect(() => {
    let mounted = true;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load your profile.");
        if (!mounted) return;
        setRole(result.profile?.role ?? null);
        const coordinates = readCoordinates(result.profile?.location);
        if (coordinates) {
          setLatitude(coordinates.latitude);
          setLongitude(coordinates.longitude);
        }
      })
      .catch((cause) => {
        if (mounted) setLocationError(cause instanceof Error ? cause.message : "Could not load your profile.");
      })
      .finally(() => { if (mounted) setLoadingLocation(false); });
    return () => { mounted = false; };
  }, []);

  const useCurrentLocation = () => {
    setLocationError("");
    setLocationNotice("");
    if (!navigator.geolocation) {
      setLocationError("Location services are not supported by this browser.");
      return;
    }
    setUsingGps(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude(coords.latitude.toFixed(4));
        setLongitude(coords.longitude.toFixed(4));
        setLocationNotice("Current GPS coordinates added. Save to update your donor location.");
        setUsingGps(false);
      },
      (cause) => {
        setLocationError(cause.code === 1
          ? "Location permission was denied. Allow location access in your browser, or enter coordinates manually."
          : cause.code === 3
            ? "Getting your location timed out. Try again or enter coordinates manually."
            : "Could not get your location. Enter coordinates manually or try again.");
        setUsingGps(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const saveLocation = async () => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setLocationError("Enter a latitude from -90 to 90 and a longitude from -180 to 180.");
      return;
    }
    setSavingLocation(true);
    setLocationError("");
    setLocationNotice("");
    try {
      const response = await fetch("/api/profile/location", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lon }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save your location.");
      setLatitude(lat.toFixed(4));
      setLongitude(lon.toFixed(4));
      setLocationNotice("Your donor location has been saved.");
    } catch (cause) {
      setLocationError(cause instanceof Error ? cause.message : "Could not save your location.");
    } finally {
      setSavingLocation(false);
    }
  };

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
      {role === "donor" && <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div><h2 className="flex items-center gap-2 text-lg font-bold"><MapPin className="h-5 w-5 text-red-700" />Donor location</h2><p className="mt-1 text-sm text-neutral-600">Set the approximate location used to match you with nearby requests. Coordinates are shown only to you here; requesters see broad availability areas, not your location.</p></div>
        {locationError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{locationError}</p>}
        {locationNotice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{locationNotice}</p>}
        {loadingLocation ? <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="h-4 w-4 animate-spin" />Loading saved coordinates…</p> : <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold">Latitude<input aria-label="Latitude" type="number" min="-90" max="90" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="e.g. 22.5726" className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label>
            <label className="space-y-1 text-sm font-semibold">Longitude<input aria-label="Longitude" type="number" min="-180" max="180" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="e.g. 88.3639" className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 font-normal outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={usingGps || savingLocation} onClick={useCurrentLocation} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-bold transition hover:bg-neutral-50 disabled:opacity-50">{usingGps ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}{usingGps ? "Getting location…" : "Use current GPS"}</button>
            <button type="button" disabled={savingLocation || usingGps} onClick={() => void saveLocation()} className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-50">{savingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{savingLocation ? "Saving…" : "Save location"}</button>
          </div>
        </>}
      </section>}
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
