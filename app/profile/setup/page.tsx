"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Droplet,
  Heart,
  Users,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Info,
  Sparkles,
} from "lucide-react";
import {
  BLOOD_GROUPS,
  BloodGroupOption,
  AccountTypeOption,
  profileOnboardingSchema,
} from "@/lib/validations/profile";

export default function ProfileSetupPage() {
  const router = useRouter();

  // Loading states
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  // User auth info
  const [userEmail, setUserEmail] = useState<string>("");

  // Form fields
  const [accountType, setAccountType] = useState<AccountTypeOption>("requester");
  const [fullName, setFullName] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroupOption>("unknown");
  const [phone, setPhone] = useState("");
  const [locality, setLocality] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);
  const [availableToDonate, setAvailableToDonate] = useState(true);
  const [isFirstTimeDonor, setIsFirstTimeDonor] = useState(false);
  const [lastDonationDate, setLastDonationDate] = useState("");

  // Status & Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Today's date in YYYY-MM-DD for max date picker
  const todayFormatted = new Date().toISOString().split("T")[0];

  // Fetch initial profile / auth status
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.status === 401) {
          setAuthRequired(true);
          setInitializing(false);
          return;
        }

        const data = await res.json();
        if (data.user?.email) {
          setUserEmail(data.user.email);
        }

        const role = data.profile?.role ?? data.user?.role;
        if (role === "moderator") {
          setIsModerator(true);
          setAccountType("requester");
        } else if (role === "donor" || role === "requester") {
          setAccountType(role);
        }

        if (data.profile) {
          const p = data.profile;
          if (p.fullName) setFullName(p.fullName);
          if (p.bloodGroup) {
            setBloodGroup(p.bloodGroup as BloodGroupOption);
          }
          if (p.phone) setPhone(p.phone);
          if (p.locality) setLocality(p.locality);
          if (typeof p.location === "string") {
            const point = p.location.match(/POINT\((-?[\d.]+)\s+(-?[\d.]+)\)/);
            if (point) {
              setLongitude(point[1]);
              setLatitude(point[2]);
            }
          }
          if (typeof p.availableToDonate === "boolean") {
            setAvailableToDonate(p.availableToDonate);
          }
          if (p.lastDonationDate) {
            setLastDonationDate(p.lastDonationDate);
            setIsFirstTimeDonor(false);
          } else if (p.role === "donor" && p.completedAt) {
            setIsFirstTimeDonor(true);
          }
        } else {
          if (data.user?.fullName) {
            setFullName(data.user.fullName);
          } else if (data.user?.email) {
            const nameGuess = data.user.email.split("@")[0].replace(/[._]/g, " ");
            setFullName(nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1));
          }
          if (data.user?.phone) setPhone(data.user.phone);
          if (data.user?.bloodGroup && BLOOD_GROUPS.includes(data.user.bloodGroup)) {
            setBloodGroup(data.user.bloodGroup);
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setInitializing(false);
      }
    }

    loadProfile();
  }, []);

  const handleFirstTimeDonorToggle = (checked: boolean) => {
    setIsFirstTimeDonor(checked);
    if (checked) {
      setLastDonationDate("");
      if (errors.lastDonationDate) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.lastDonationDate;
          return next;
        });
      }
    }
  };

  const useApproximateLocation = () => {
    if (!navigator.geolocation) {
      setServerError("Location is unavailable in this browser. Enter approximate coordinates manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLatitude((Math.round(coords.latitude * 100) / 100).toFixed(2));
        setLongitude((Math.round(coords.longitude * 100) / 100).toFixed(2));
        setLocating(false);
      },
      () => {
        setServerError("Location permission was not granted. Enter approximate coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);
    setErrors({});

    const payload = {
      fullName: fullName.trim(),
      accountType,
      bloodGroup,
      phone: phone.trim() || null,
      locality: locality.trim() || null,
      latitude: latitude.trim() ? Number(latitude) : null,
      longitude: longitude.trim() ? Number(longitude) : null,
      availableToDonate: accountType === "donor" ? availableToDonate : false,
      lastDonationDate:
        accountType === "donor" && !isFirstTimeDonor && lastDonationDate
          ? lastDonationDate
          : null,
    };

    // Client-side validation using shared Zod schema
    const validation = profileOnboardingSchema.safeParse(payload);
    if (!validation.success) {
      const fieldIssues: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]?.toString();
        if (fieldName && !fieldIssues[fieldName]) {
          fieldIssues[fieldName] = issue.message;
        }
      });
      setErrors(fieldIssues);
      // Scroll to first error
      const firstErrorKey = Object.keys(fieldIssues)[0];
      const element = document.getElementById(`field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.fieldErrors) {
          const formatted: Record<string, string> = {};
          Object.entries(result.fieldErrors).forEach(([k, v]) => {
            if (Array.isArray(v) && v.length > 0) {
              formatted[k] = v[0] as string;
            }
          });
          setErrors(formatted);
        }
        setServerError(result.error || "Failed to save profile. Please try again.");
        return;
      }

      const savedRole = result.profile?.role;
      setSuccessMessage(
        savedRole === "moderator"
          ? "🎉 Profile complete! Your moderator dashboard is ready."
          : savedRole === "donor"
            ? "🎉 Profile complete! If available, you will be listed for matching for 72 hours."
            : "🎉 Profile complete! You are ready to create and manage blood requests."
      );

      // Smooth transition to homepage / dashboard
      const destination = result.profile?.role === "donor"
        ? "/donor/pulse"
        : result.profile?.role === "moderator"
          ? "/moderator"
          : "/requests";
      setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 1400);
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Network error occurred while saving profile."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-neutral-600">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="text-sm font-medium">Loading your LifeLink profile...</p>
        </div>
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <Droplet className="w-7 h-7 fill-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-neutral-900">
              Sign In Required
            </h2>
            <p className="text-sm text-neutral-600">
              Please sign in or create an account to configure your LifeLink profile and save your donation preferences.
            </p>
          </div>
          <Link
            href="/login?next=/profile/setup"
            className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow-lg shadow-red-600/20"
          >
            Go to Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F8] text-neutral-900 py-10 px-4 sm:px-6 lg:px-8 selection:bg-red-100 selection:text-red-700">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header with Step Indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 group text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
                <Droplet className="w-4 h-4 fill-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-neutral-900">
                LifeLink
              </span>
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-red-100/70 text-red-700 border border-red-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1: Profile Onboarding</span>
            </div>
          </div>

          <div className="pt-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              Complete your profile 🩸
            </h1>
            <p className="text-sm text-neutral-600 mt-1.5">
              Tell us how you would like to use LifeLink. Your information is securely stored in Supabase PostgreSQL via Drizzle ORM.
            </p>
          </div>
        </div>

        {/* Global Notifications */}
        {serverError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{serverError}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{successMessage}</div>
          </div>
        )}

        {/* Onboarding Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xl shadow-neutral-200/40 space-y-8"
        >
          {/* 1. Account Type */}
          {isModerator ? (
            <div className="space-y-2 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <h2 className="font-bold text-blue-900">Moderator account</h2>
              <p className="text-sm text-blue-800">
                Your moderator role is managed by LifeLink. Complete your basic profile to continue.
              </p>
            </div>
          ) : (
          <div className="space-y-3" id="field-accountType">
            <label className="block text-sm font-bold text-neutral-800">
              1. Choose your account type <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-neutral-500">
              Select whether you want to donate blood or request it for a patient. You can update this later.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Donor Option */}
              <button
                type="button"
                onClick={() => setAccountType("donor")}
                className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all ${
                  accountType === "donor"
                    ? "border-red-600 bg-red-50/40 shadow-sm"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      accountType === "donor"
                        ? "bg-red-600 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </div>
                  {accountType === "donor" && (
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="font-bold text-neutral-900 text-base">
                    Blood Donor
                  </h4>
                  <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                    Receive verified emergency requests in your area and help save lives when it matters most.
                  </p>
                </div>
              </button>

              {/* Requester Option */}
              <button
                type="button"
                onClick={() => setAccountType("requester")}
                className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all ${
                  accountType === "requester"
                    ? "border-red-600 bg-red-50/40 shadow-sm"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      accountType === "requester"
                        ? "bg-red-600 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  {accountType === "requester" && (
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="font-bold text-neutral-900 text-base">
                    Blood Requester
                  </h4>
                  <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                    Create emergency blood requests for patients in hospitals and connect with verified donors.
                  </p>
                </div>
              </button>
            </div>
            {errors.accountType && (
              <p className="text-xs font-medium text-red-600 mt-1">
                {errors.accountType}
              </p>
            )}
          </div>
          )}

          <hr className="border-neutral-100" />

          {/* 2. Common Profile Details */}
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                2. Basic Profile Information
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Personalized details to identify you across the LifeLink community.
              </p>
            </div>

            {/* Full Name */}
            <div id="field-fullName" className="space-y-1.5">
              <label
                htmlFor="input-fullName"
                className="block text-xs font-semibold text-neutral-700"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Ananya Roy"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 ${
                    errors.fullName
                      ? "border-red-400 bg-red-50/20"
                      : "border-neutral-300 focus:border-red-500"
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs font-medium text-red-600">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email (Read-only from Supabase Auth) & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Registered Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700 flex items-center justify-between">
                  <span>Registered Email</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Auth Verified
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={userEmail}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-100/70 text-neutral-600 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone (Optional) */}
              <div id="field-phone" className="space-y-1.5">
                <label
                  htmlFor="input-phone"
                  className="block text-xs font-semibold text-neutral-700"
                >
                  Phone Number{" "}
                  <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="input-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 ${
                      errors.phone
                        ? "border-red-400 bg-red-50/20"
                        : "border-neutral-300 focus:border-red-500"
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs font-medium text-red-600">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Blood Group Selector */}
            <div id="field-bloodGroup" className="space-y-1.5">
              <label
                htmlFor="select-bloodGroup"
                className="block text-xs font-semibold text-neutral-700"
              >
                Blood Group <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500">
                  <Droplet className="w-4 h-4 fill-current" />
                </div>
                <select
                  id="select-bloodGroup"
                  value={bloodGroup}
                  onChange={(e) =>
                    setBloodGroup(e.target.value as BloodGroupOption)
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                >
                  <option value="unknown">
                    Unknown / Not sure (Clinical screening required)
                  </option>
                  {BLOOD_GROUPS.filter((bg) => bg !== "unknown").map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-1.5 pt-0.5">
                <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>
                  Select &quot;Unknown&quot; if you are not 100% sure. LifeLink never guesses—blood type is clinically confirmed before any donation.
                </span>
              </p>
              {errors.bloodGroup && (
                <p className="text-xs font-medium text-red-600">
                  {errors.bloodGroup}
                </p>
              )}
            </div>
          </div>

          <hr className="border-neutral-100" />

          {/* 3. Role-Specific Details */}
          {accountType === "donor" ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                  <Heart className="w-5 h-5 fill-current" />
                  <span>3. Donor Matching Details</span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Helps our matching system calculate proximity and screen for safe donation intervals.
                </p>
              </div>

              {/* Approximate Location / Locality */}
              <div id="field-locality" className="space-y-1.5">
                <label
                  htmlFor="input-locality"
                  className="block text-xs font-semibold text-neutral-700"
                >
                  Approximate Locality / City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <MapPin className="w-4 h-4 text-red-500" />
                  </div>
                  <input
                    id="input-locality"
                    type="text"
                    required
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Salt Lake, Sector V, Kolkata or Kankinara"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 ${
                      errors.locality
                        ? "border-red-400 bg-red-50/20"
                        : "border-neutral-300 focus:border-red-500"
                    }`}
                  />
                </div>
                <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Privacy protected: We only need your neighborhood/locality to find nearby requests. Your exact street address is never requested or publicized.
                  </span>
                </p>
                {errors.locality && (
                  <p className="text-xs font-medium text-red-600">
                    {errors.locality}
                  </p>
                )}
              </div>

              <div id="field-latitude" className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-neutral-700">Approximate map location</label>
                  <button type="button" onClick={useApproximateLocation} disabled={locating} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
                    {locating ? "Finding location…" : "Use my approximate location"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input aria-label="Approximate latitude" type="number" min="-90" max="90" step="0.01" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
                  <input aria-label="Approximate longitude" type="number" min="-180" max="180" step="0.01" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
                </div>
                <p className="text-xs text-neutral-500">We round device coordinates to about 1 km before storing them. Donor home locations are never shown to requesters.</p>
                {errors.latitude && <p className="text-xs font-medium text-red-600">{errors.latitude}</p>}
              </div>

              {/* Availability Preference */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label
                    htmlFor="toggle-available"
                    className="text-sm font-bold text-neutral-900 cursor-pointer"
                  >
                    Available for Emergency Donation
                  </label>
                  <p className="text-xs text-neutral-500">
                    If switched on, your profile is matched for 72 hours. You can extend or pause availability at any time from Emergency Pulse.
                  </p>
                </div>
                <button
                  type="button"
                  id="toggle-available"
                  role="switch"
                  aria-checked={availableToDonate}
                  onClick={() => setAvailableToDonate(!availableToDonate)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    availableToDonate ? "bg-red-600" : "bg-neutral-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      availableToDonate ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Last Donation Date */}
              <div id="field-lastDonationDate" className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="input-lastDonationDate"
                    className="block text-xs font-semibold text-neutral-700"
                  >
                    Last Donation Date
                  </label>
                  <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={isFirstTimeDonor}
                      onChange={(e) =>
                        handleFirstTimeDonorToggle(e.target.checked)
                      }
                      className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5"
                    />
                    <span>I am a first-time donor</span>
                  </label>
                </div>

                {!isFirstTimeDonor ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      id="input-lastDonationDate"
                      type="date"
                      max={todayFormatted}
                      value={lastDonationDate}
                      onChange={(e) => setLastDonationDate(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 ${
                        errors.lastDonationDate
                          ? "border-red-400 bg-red-50/20"
                          : "border-neutral-300 focus:border-red-500"
                      }`}
                    />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Welcome! As a first-time donor, no previous donation date is needed.
                    </span>
                  </div>
                )}

                {errors.lastDonationDate && (
                  <p className="text-xs font-medium text-red-600">
                    {errors.lastDonationDate}
                  </p>
                )}

                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold">
                      Clinical Screening Guidance
                    </span>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      LifeLink uses donation intervals as a safety screening signal (standard 90-day interval between donations). Note that final medical eligibility is determined in person by qualified clinical staff.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Requester Guidance Section */
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-neutral-900 font-bold text-base">
                <Users className="w-5 h-5 text-red-600" />
                <span>3. Requester Account Configuration</span>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2 text-neutral-800 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Profile ready for blood requests</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  As a Blood Requester, you do not need to provide donor availability. Your account profile persists across all your requests. Whenever an emergency arises, you will be able to launch requests with patient details, hospital location, and prescription uploads.
                </p>

                {/* Optional Locality for Requester */}
                <div className="pt-2">
                  <label
                    htmlFor="input-requester-locality"
                    className="block text-xs font-semibold text-neutral-700 mb-1.5"
                  >
                    Your Default City / Locality{" "}
                    <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <MapPin className="w-4 h-4 text-neutral-400" />
                    </div>
                    <input
                      id="input-requester-locality"
                      type="text"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Kolkata or Mumbai"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/"
              className="text-xs font-medium text-neutral-500 hover:text-neutral-800 transition"
            >
              Skip for now (Limited access)
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/25 transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving profile...</span>
                </>
              ) : (
                <>
                  <span>Complete Onboarding</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
