"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LiveRequestsFeed } from "@/components/landing/LiveRequestsFeed";
import { BloodCompatibilityMatrix } from "@/components/landing/BloodCompatibilityMatrix";
import { ImpactSection } from "@/components/landing/ImpactSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { Footer } from "@/components/landing/Footer";
import { RequestModal } from "@/components/landing/RequestModal";
import { FindDonorModal } from "@/components/landing/FindDonorModal";

export default function LandingPage() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        onOpenRequestModal={() => setIsRequestModalOpen(true)}
        onOpenDonorModal={() => setIsDonorModalOpen(true)}
      />

      <main className="flex-1">
        {/* Hero Section with exact layout & floating visual components */}
        <HeroSection
          onOpenRequestModal={() => setIsRequestModalOpen(true)}
          onOpenDonorModal={() => setIsDonorModalOpen(true)}
        />

        {/* How LifeLink Works: 3-Gate Verification Architecture */}
        <HowItWorksSection />

        {/* Live Emergency Pulse Requests */}
        <LiveRequestsFeed />

        {/* Interactive Blood Compatibility Matrix Tool */}
        <BloodCompatibilityMatrix
          onOpenDonorModal={() => setIsDonorModalOpen(true)}
        />

        {/* Measurable Impact & Comparison */}
        <ImpactSection />

        {/* Testimonials & Clinical Endorsements */}
        <TestimonialsSection />

        {/* Closing Call to Action Banner */}
        <CtaBanner
          onOpenRequestModal={() => setIsRequestModalOpen(true)}
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
