"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { CommunitySection } from "@/components/landing/CommunitySection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ImpactSection } from "@/components/landing/ImpactSection";
import { AiCompanionSection } from "@/components/landing/AiCompanionSection";
import { LiveRequestsFeed } from "@/components/landing/LiveRequestsFeed";
import { BloodCompatibilityMatrix } from "@/components/landing/BloodCompatibilityMatrix";
import { Footer } from "@/components/landing/Footer";
import { RequestModal } from "@/components/landing/RequestModal";
import { FindDonorModal } from "@/components/landing/FindDonorModal";

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
      {/* Navigation Bar (Image 1 Header) */}
      <Navbar
        onOpenRequestModal={() => setIsRequestModalOpen(true)}
        onOpenDonorModal={() => setIsDonorModalOpen(true)}
      />

      <main className="flex-1">
        {/* Section 1: Hero Section with Sunset Visual & Donor Impact Card (Image 1) */}
        <HeroSection
          onOpenRequestModal={() => setIsRequestModalOpen(true)}
          onOpenDonorModal={() => setIsDonorModalOpen(true)}
        />

        {/* Section 2: "From Urgent Needs to Brighter Tomorrows" (Image 1 Bottom & Image 2) */}
        <CommunitySection
          onOpenRequestModal={() => setIsRequestModalOpen(true)}
          onOpenDonorModal={() => setIsDonorModalOpen(true)}
        />

        {/* Section 3: "How LifeLink Works" with Cinematic Glitch Background & 4 Glass Steps (Image 2 Bottom & Image 3) */}
        <HowItWorksSection />

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
