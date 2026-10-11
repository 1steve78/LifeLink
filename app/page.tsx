"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
// HeroSection is above-the-fold — eagerly imported for fastest LCP
import { HeroSection } from "@/components/landing/HeroSection";

// Below-the-fold sections are lazy-loaded to reduce initial JS bundle
const HowItWorksSection = dynamic(
  () => import("@/components/landing/HowItWorksSection").then((m) => ({ default: m.HowItWorksSection }))
);
const ImpactSection = dynamic(
  () => import("@/components/landing/ImpactSection").then((m) => ({ default: m.ImpactSection }))
);
const AiCompanionSection = dynamic(
  () => import("@/components/landing/AiCompanionSection").then((m) => ({ default: m.AiCompanionSection }))
);
const LiveRequestsFeed = dynamic(
  () => import("@/components/landing/LiveRequestsFeed").then((m) => ({ default: m.LiveRequestsFeed }))
);
const BloodCompatibilityMatrix = dynamic(
  () => import("@/components/landing/BloodCompatibilityMatrix").then((m) => ({ default: m.BloodCompatibilityMatrix }))
);
const Footer = dynamic(
  () => import("@/components/landing/Footer").then((m) => ({ default: m.Footer }))
);
const RequestModal = dynamic(
  () => import("@/components/landing/RequestModal").then((m) => ({ default: m.RequestModal })),
  { ssr: false }
);
const FindDonorModal = dynamic(
  () => import("@/components/landing/FindDonorModal").then((m) => ({ default: m.FindDonorModal })),
  { ssr: false }
);

export default function LandingPage() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("request") === "1") {
      setIsRequestModalOpen(true);
      url.searchParams.delete("request");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
   }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-[#E23B42] selection:text-white">
      <main className="flex-1">
        {/* Section 1: Hero Section with Sunset Visual & Donor Impact Card (Image 1) */}
        <HeroSection
          onOpenRequestModal={() => setIsRequestModalOpen(true)}
          onOpenDonorModal={() => setIsDonorModalOpen(true)}
        />

        {/* Section 2: "How LifeLink Works" */}
        <HowItWorksSection
          onOpenRequestModal={() => setIsRequestModalOpen(true)}
          onOpenDonorModal={() => setIsDonorModalOpen(true)}
        />

        {/* Section 4: "OUR SERVICES / How LifeLink Makes an Impact" (Image 4) */}
        <ImpactSection
          onOpenRequestModal={() => setIsRequestModalOpen(true)}
          onOpenDonorModal={() => setIsDonorModalOpen(true)}
        />

        {/* Section 5: "AI-POWERED SUPPORT / Meet Your LifeLink Support Companion" Carousel (Image 5) */}
        <AiCompanionSection />

        {/* Live Emergency Pulse Requests */}
        <LiveRequestsFeed />

        {/* Interactive Blood Compatibility Matrix Tool */}
        <BloodCompatibilityMatrix
          onOpenDonorModal={() => setIsDonorModalOpen(true)}
        />
      </main>

      {/* Comprehensive Footer */}
      <Footer />

      {/* Interactive Modals */}
      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      <FindDonorModal
        isOpen={isDonorModalOpen}
        onClose={() => setIsDonorModalOpen(false)}
      />
    </div>
  );
}
