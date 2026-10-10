"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  Zap,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Droplet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Loader2,
  Heart,
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { UserRole, BloodGroup } from "@/types/database.types";

export default function AuthPage() {
  const supabase = createClient();

  const [tab, setTab] = useState<"signin" | "create">("signin");
  const [selectedRole, setSelectedRole] = useState<UserRole>("requester");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">("O+");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);

  // Check current session on load
  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("Signed in successfully! Welcome back.");
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Create Account (direct sign-in, no email confirmation)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const roleToSave = selectedRole;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim() || email.split("@")[0],
            role: roleToSave,
            blood_group: bloodGroup || null,
            phone: phone.trim() || null,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        // Automatically ensure session is signed in directly
        if (!data?.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInErr) {
            setSuccessMsg("Account created successfully! You can now sign in.");
            setTab("signin");
            return;
          }
        }
        setSuccessMsg(
          "Account created and signed in successfully! Welcome to LifeLink."
        );
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSuccessMsg(null);
    setErrorMsg(null);
    setLoading(false);
  };

  // Switch to Create Account with a chosen role
  const selectRoleAndSwitch = (role: UserRole) => {
    setSelectedRole(role);
    setTab("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#FDF9F8] text-slate-800 flex flex-col justify-between selection:bg-red-100 selection:text-red-700">
      {/* Top Notification if User is Logged In */}
      {currentUser && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>
              Signed in as <strong>{currentUser.email}</strong> (ID:{" "}
              <span className="font-mono text-xs">{currentUser.id.slice(0, 8)}...</span>)
            </span>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-emerald-800 hover:bg-emerald-100 transition-colors font-medium text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
          {/* ============================================================== */}
          {/* LEFT COLUMN: BRANDING & COMMUNITY SHOWCASE                     */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <div className="relative">
                  <Droplet className="w-6 h-6 text-white fill-white" />
                  <div className="absolute top-2 left-2.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                  Life<span className="text-red-600">Link</span>
                </h1>
                <p className="text-xs font-medium text-slate-500 tracking-wide mt-1">
                  Verified Community Donation Platform
                </p>
              </div>
            </div>

            {/* Hero Heading */}
            <div className="space-y-3">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Join a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
                  Lifesaving
                </span>{" "}
                <br />
                Community
              </h2>
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                Create an account to request help, donate blood, and be part of a
                trusted, verified network.
              </p>
            </div>

            {/* 3 Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1 */}
              <div className="bg-white/80 backdrop-blur-sm border border-red-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2.5">
                  <ShieldCheck className="w-5 h-5 text-red-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Verified Requests
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  3-step verification
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white/80 backdrop-blur-sm border border-red-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2.5">
                  <Users className="w-5 h-5 text-red-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Real Donors Near You
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Location based</p>
              </div>

              {/* Card 3 */}
              <div className="bg-white/80 backdrop-blur-sm border border-red-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2.5">
                  <Zap className="w-5 h-5 text-red-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Faster Emergency Help
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Push + SMS alerts</p>
              </div>
            </div>

            {/* Hero Heart Graphic with Ribbon */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-rose-100/60 to-red-50/40 p-6 sm:p-8 flex items-center justify-center border border-red-100/60 shadow-inner min-h-[220px]">
              {/* Decorative background blobs */}
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-rose-200/50 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-red-200/40 rounded-full blur-3xl pointer-events-none" />

              {/* Heart Illustration in Hands */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full scale-125" />
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-red-500 shadow-2xl shadow-red-600/40 flex items-center justify-center transform transition-transform group-hover:scale-105 duration-300">
                    <Heart className="w-16 h-16 sm:w-18 sm:h-18 text-white fill-white drop-shadow-md" />
                    <div className="absolute w-6 h-6 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Droplet className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-wide text-red-700 bg-red-100/80 px-3 py-1 rounded-full border border-red-200">
                    Every drop makes a difference ♡
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Stats Pill */}
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-lg shadow-slate-200/40 grid grid-cols-3 divide-x divide-slate-100">
              <div className="flex items-center gap-3 px-2 sm:px-4">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    50K+
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Potential Donors
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-2 sm:px-4">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    200+
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Partner Hospitals
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 px-2 sm:px-4">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    100%
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Verified Requests
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: AUTHENTICATION CARD                              */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-2xl shadow-red-950/5 p-6 sm:p-10 w-full max-w-lg">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 mb-8">
                <button
                  type="button"
                  onClick={() => {
                    setTab("signin");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 pb-3 text-center text-base font-bold transition-all relative ${
                    tab === "signin"
                      ? "text-red-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sign In
                  {tab === "signin" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("create");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`flex-1 pb-3 text-center text-base font-bold transition-all relative ${
                    tab === "create"
                      ? "text-red-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Create Account
                  {tab === "create" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
                  )}
                </button>
              </div>

              {/* Header Text */}
              <div className="mb-6">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {tab === "signin" ? "Welcome Back" : "Create Account"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {tab === "signin"
                    ? "Sign in to continue and make a difference."
                    : "Join our verified donor and requester network."}
                </p>
              </div>

              {/* Status / Alert Messages */}
              {errorMsg && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* FORM */}
              <form
                onSubmit={tab === "signin" ? handleSignIn : handleSignUp}
                className="space-y-4"
              >
                {/* Additional fields for Create Account */}
                {tab === "create" && (
                  <>
                    {/* Full Name */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full name"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-5 h-5" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Phone number (for emergency alerts)"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Blood Group Selection */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Droplet className="w-5 h-5" />
                        </div>
                        <select
                          value={bloodGroup}
                          onChange={(e) =>
                            setBloodGroup(e.target.value as BloodGroup)
                          }
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="A+">Blood Group: A+</option>
                          <option value="A-">Blood Group: A-</option>
                          <option value="B+">Blood Group: B+</option>
                          <option value="B-">Blood Group: B-</option>
                          <option value="AB+">Blood Group: AB+</option>
                          <option value="AB-">Blood Group: AB-</option>
                          <option value="O+">Blood Group: O+</option>
                          <option value="O-">Blood Group: O-</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Email Address */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password (Sign In Mode) */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span>Remember me</span>
                  </label>
                  {tab === "signin" && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!email) {
                          setErrorMsg("Enter your email address first.");
                          return;
                        }
                        const { error } =
                          await supabase.auth.resetPasswordForEmail(email);
                        if (error) setErrorMsg(error.message);
                        else setSuccessMsg("Password reset email sent!");
                      }}
                      className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{tab === "signin" ? "Sign In" : "Create Account"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* NEW TO LIFELINK / ROLE SELECTION CARD */}
              <div className="bg-red-50/70 border border-red-100 rounded-2xl p-4 sm:p-5 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-tight">
                      New to LifeLink?
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Create an account and join our trusted community.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-slate-700 mb-2">
                  I am a:
                </div>

                {/* 3 Role Options */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {/* Requester */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("requester")}
                    className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all ${
                      selectedRole === "requester"
                        ? "bg-white border-red-500 shadow-sm ring-1 ring-red-500"
                        : "bg-white/70 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <User
                      className={`w-4 h-4 mb-1.5 ${
                        selectedRole === "requester"
                          ? "text-red-600"
                          : "text-slate-500"
                      }`}
                    />
                    <span className="text-[11px] font-bold text-slate-900 leading-tight">
                      Requester
                    </span>
                    <span className="text-[9px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                      Create verified medical requests
                    </span>
                  </button>

                  {/* Donor */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("donor")}
                    className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all ${
                      selectedRole === "donor"
                        ? "bg-white border-red-500 shadow-sm ring-1 ring-red-500"
                        : "bg-white/70 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <Droplet
                      className={`w-4 h-4 mb-1.5 ${
                        selectedRole === "donor"
                          ? "text-red-600"
                          : "text-slate-500"
                      }`}
                    />
                    <span className="text-[11px] font-bold text-slate-900 leading-tight">
                      Donor
                    </span>
                    <span className="text-[9px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                      Donate blood and save lives
                    </span>
                  </button>

                  {/* Hospital */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole("moderator")}
                    className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all ${
                      selectedRole === "moderator"
                        ? "bg-white border-red-500 shadow-sm ring-1 ring-red-500"
                        : "bg-white/70 border-slate-200 hover:bg-white"
                    }`}
                  >
                    <Building2
                      className={`w-4 h-4 mb-1.5 ${
                        selectedRole === "moderator"
                          ? "text-red-600"
                          : "text-slate-500"
                      }`}
                    />
                    <span className="text-[11px] font-bold text-slate-900 leading-tight">
                      Hospital
                    </span>
                    <span className="text-[9px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                      Verify requests and collaborate
                    </span>
                  </button>
                </div>

                {/* Switch to Create Account Button */}
                {tab === "signin" && (
                  <button
                    type="button"
                    onClick={() => selectRoleAndSwitch(selectedRole)}
                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Create Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Terms of Service & Privacy Policy */}
              <p className="text-center text-[11px] text-slate-400">
                By continuing, you agree to our{" "}
                <a href="#" className="font-semibold text-slate-700 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-semibold text-slate-700 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
