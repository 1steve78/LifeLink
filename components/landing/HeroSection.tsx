"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { registerLandingGradientSource } from "@/lib/landing-gradient";

interface HeroSectionProps {
  onOpenRequestModal?: () => void;
  onOpenDonorModal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenRequestModal,
  onOpenDonorModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const router = useRouter();
  const gradientCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleJoinNow = async () => {
    if (joining) return;
    setJoining(true);

    try {
      const response = await fetch("/api/profile", { cache: "no-store" });
      if (!response.ok) {
        router.push("/login");
        return;
      }

      const data = await response.json();
      const role = data?.profile?.role;
      const destination = role === "donor"
        ? "/donor/pulse"
        : role === "moderator"
          ? "/moderator"
          : role === "requester"
            ? "/requests"
            : "/profile/setup";
      router.push(destination);
    } catch {
      router.push("/login");
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    const canvas = gradientCanvasRef.current;
    if (!canvas) return;
    return registerLandingGradientSource(canvas);
  }, []);

  return (
    <section
      id="hero"
      className="relative w-full min-h-[100svh] bg-[#07050e] text-white flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* 1. Ambient Background Layer */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 25% 38%, rgba(255, 200, 88, 0.9), transparent 38%), radial-gradient(ellipse at 78% 28%, rgba(253, 17, 63, 0.78), transparent 42%), radial-gradient(ellipse at 68% 78%, rgba(144, 224, 255, 0.82), transparent 44%), radial-gradient(ellipse at 20% 82%, rgba(117, 59, 255, 0.72), transparent 38%), #07050e",
        }}
      >
        <canvas
          ref={gradientCanvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full pointer-events-none"
        />
        {/* Subtle Darkening Overlay to ensure contrast on all display scales */}
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />

        {/* Tactile Film Grain Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* 2. Floating Frosted Glass Pill Navbar */}
      <header className="relative z-30 w-full pt-6 sm:pt-8 md:pt-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between rounded-full border border-white/20 bg-white/[0.08] backdrop-blur-2xl px-5 py-2.5 sm:px-8 sm:py-3 shadow-2xl shadow-black/40">
            {/* Brand Logo */}
            <Link
              href="/"
              className="font-semibold text-lg sm:text-xl text-white tracking-tight hover:opacity-90 transition-opacity"
            >
              LifeLink
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-7 lg:gap-9 text-xs sm:text-sm font-normal text-white/80">
              <a
                href="#hero"
                className="hover:text-white transition-colors duration-200"
              >
                Home
              </a>
              <a
                href="#how-it-works"
                className="hover:text-white transition-colors duration-200"
              >
                How it works
              </a>
              <a
                href="#services"
                className="hover:text-white transition-colors duration-200"
              >
                Safety
              </a>
              <a
                href="#impact"
                className="hover:text-white transition-colors duration-200"
              >
                Effectiveness
              </a>
            </nav>

            {/* Right Action: 'Join Now' Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleJoinNow}
                disabled={joining}
                className="rounded-full bg-white text-neutral-950 font-semibold text-xs sm:text-sm px-5 py-2 sm:px-6 sm:py-2.5 hover:bg-neutral-100 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg shadow-black/20"
              >
                {joining ? "Loading…" : "Join Now"}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-white/80 hover:text-white transition-colors"
                aria-label="Toggle mobile navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 rounded-3xl border border-white/20 bg-[#0c0717]/90 backdrop-blur-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex flex-col gap-3.5 text-sm font-medium text-white/85">
                <a
                  href="#hero"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-white transition-colors"
                >
                  Home
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-white transition-colors"
                >
                  How it works
                </a>
                <a
                  href="#services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-white transition-colors"
                >
                  Safety
                </a>
                <a
                  href="#impact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-white transition-colors"
                >
                  Effectiveness
                </a>
                <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenRequestModal?.();
                    }}
                    className="w-full text-center py-2.5 rounded-full bg-white/10 border border-white/20 text-white font-medium text-xs"
                  >
                    Request Blood
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenDonorModal?.();
                    }}
                    className="w-full text-center py-2.5 rounded-full bg-white text-neutral-950 font-semibold text-xs"
                  >
                    Donate Blood
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 3. Hero Main Content Grid */}
      <div className="relative z-20 flex-1 flex flex-col justify-between max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-16 pt-8 pb-10">
        {/* Upper/Middle Right Pitch & CTA Block */}
        <div className="w-full flex justify-end mt-4 sm:mt-10 md:mt-12">
          <div className="max-w-md lg:max-w-lg text-left flex flex-col items-start">
            <p className="text-white/85 text-xs sm:text-sm md:text-[15px] leading-relaxed font-light tracking-wide">
              <span className="inline-block mr-1.5 text-white font-medium">↓</span>
              Rapid response, verified urgency, and real-time coordination connecting critical blood requests with nearby donors when seconds count. Safe. Private. Backed by science & verified by medical moderators.
            </p>

            <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenRequestModal}
                className="rounded-full border border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-md px-7 py-2.5 sm:px-8 sm:py-3 text-xs sm:text-sm font-medium text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Get Started
              </button>
              <button
                onClick={onOpenDonorModal}
                className="rounded-full border border-white/15 bg-black/25 hover:bg-black/40 backdrop-blur-md px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-medium text-white/90 hover:text-white active:scale-95 transition-all duration-200"
              >
                Donate Blood
              </button>
            </div>
          </div>
        </div>

        {/* Lower Content: Giant Headline (Left) & Scroll Indicator (Right) */}
        <div className="w-full mt-16 sm:mt-24 md:mt-28 flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-2">
          {/* Headline */}
          <div className="flex-1 -translate-y-8 sm:-translate-y-10 md:-translate-y-12">
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[96px] xl:text-[108px] font-normal tracking-[-0.035em] text-white leading-[0.93]">
              <span className="block drop-shadow-[0_4px_35px_rgba(255,255,255,0.2)]">
                AI-Powered
              </span>
              <span className="block drop-shadow-[0_4px_35px_rgba(255,255,255,0.2)]">
                Emergency Blood
              </span>
              <span className="block drop-shadow-[0_4px_35px_rgba(255,255,255,0.2)]">
                +Support
              </span>
            </h1>
          </div>

          {/* Scroll to Explore Link */}
          <div className="flex items-center justify-start lg:justify-end pb-3">
            <a
              href="#community"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-light text-white/70 hover:text-white transition-colors duration-200 tracking-wide"
            >
              <span>Scroll to Explore</span>
              <span className="text-sm">↓</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4. Delicate Bottom Divider */}
      <div className="relative z-20 w-full border-t border-white/10" />
    </section>
  );
};

export default HeroSection;
