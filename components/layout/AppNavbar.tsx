"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/landing/BrandLogo";
import { Menu, X, LogOut, User, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Role = "requester" | "donor" | "moderator" | null;

const NAV_LINKS: Record<NonNullable<Role>, { label: string; href: string }[]> = {
  requester: [
    { label: "My Requests", href: "/requests" },
    { label: "Account", href: "/account" },
  ],
  donor: [
    { label: "Emergency Pulse", href: "/donor/pulse" },
    { label: "Account", href: "/account" },
  ],
  moderator: [
    { label: "Review Queue", href: "/moderator" },
    { label: "Account", href: "/account" },
  ],
};

// Pages where the landing-style nav links (Home, About, etc.) show
const LANDING_PATHS = new Set(["/"]);

const LANDING_NAV = [
  { label: "Home", href: "#hero" },
  { label: "About", href: "#community" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Find Donors", href: "#services" },
];

export default function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isLanding = LANDING_PATHS.has(pathname);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) { setLoading(false); return; }
      setEmail(user.email ?? null);
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setRole((data.profile?.role as Role) ?? null);
            setFullName(data.profile?.fullName ?? null);
          }
        }
      } catch { /* ignore */ }
      if (mounted) setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [supabase, pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navLinks = role ? NAV_LINKS[role] : [];
  const displayLinks = isLanding ? LANDING_NAV : navLinks;

  // On landing page, the immersive Hero section renders its own floating pill navbar
  if (isLanding) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Brand */}
        <BrandLogo />

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 flex-1 justify-center">
          {displayLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-[#E23B42] ${
                pathname === link.href ? "text-[#E23B42] font-semibold" : "text-neutral-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-24 rounded-full bg-neutral-100 animate-pulse" />
          ) : role ? (
            /* Logged-in: role badge + profile dropdown */
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                  {(fullName ?? email ?? "?")[0].toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate">{fullName ?? email}</span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-neutral-200 bg-white py-2 shadow-xl z-50">
                  {/* Role pill */}
                  <div className="px-4 pb-2 pt-1 border-b border-neutral-100">
                    <p className="text-xs text-neutral-400">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-neutral-800">{email}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      role === "moderator" ? "bg-violet-100 text-violet-700" :
                      role === "donor" ? "bg-emerald-100 text-emerald-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {role}
                    </span>
                  </div>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <User className="h-3.5 w-3.5 text-neutral-400" />
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t border-neutral-100 mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out: sign in button */
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-[#DC2626] to-[#E23B42] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-red-500/20 hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-5 py-5 space-y-4 shadow-lg animate-in slide-in-from-top-4 duration-200">
          {displayLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block py-2 text-sm font-medium ${
                pathname === link.href ? "text-[#E23B42]" : "text-neutral-700"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {role && (
            <>
              <div className="border-t border-neutral-100 pt-3 space-y-1">
                <p className="text-xs text-neutral-400 px-1">{email}</p>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                  role === "moderator" ? "bg-violet-100 text-violet-700" :
                  role === "donor" ? "bg-emerald-100 text-emerald-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {role}
                </span>
              </div>
              <button
                onClick={() => { setMobileOpen(false); void handleSignOut(); }}
                className="flex w-full items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </>
          )}

          {!role && !loading && (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block w-full rounded-full bg-[#E23B42] py-3 text-center text-sm font-semibold text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      )}

      {/* Close dropdown on outside click */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}
    </header>
  );
}
