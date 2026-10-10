"use client";

import React from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { HeroBadges } from "./HeroBadges";
import { HeroVisual } from "./HeroVisual";

interface HeroSectionProps {
  onOpenRequestModal?: () => void;
  onOpenDonorModal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenRequestModal,
  onOpenDonorModal,
}) => {
  return (
    <section id="hero" className="relative pt-8 sm:pt-9 pb-8 sm:pb-10 overflow-hidden bg-[radial-gradient(ellipse_at_80%_45%,rgba(254,226,226,.42),transparent_48%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-3 items-center">
          {/* Left Content Column */}
          <div className="lg:col-span-6 flex flex-col justify-center text-left">
            {/* Top Badge Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50/90 border border-red-100 text-[#C81E1E] w-fit mb-4">
              <span className="w-2 h-2 rounded-full bg-[#C81E1E]" />
              <span className="text-xs sm:text-[13px] font-semibold tracking-normal">
                Emergency Blood Support Network
              </span>
            </div>

            {/* Main Hero Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[52px] xl:text-[56px] font-extrabold text-slate-900 tracking-tight leading-[1.02]">
              A Safer Tomorrow
              <br />
              Starts with <span className="text-[#C81E1E]">You</span>
            </h1>

            {/* Sub-headline / Copy */}
            <p className="mt-4 text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-xl">
              LifeLink connects blood requesters with verified donors in real-time,
              making emergency help faster, safer, and smarter using AI and
              location-based technology.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Primary CTA */}
              <button
                onClick={onOpenRequestModal}
                className="group px-5 py-3 text-sm font-semibold text-white bg-[#C81E1E] hover:bg-[#B01A1A] active:scale-95 rounded-xl shadow-md shadow-red-600/20 transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <span>Create a Blood Request</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              {/* Secondary CTA */}
              <button
                onClick={onOpenDonorModal}
                className="group px-5 py-3 text-sm font-semibold text-neutral-800 bg-white hover:bg-neutral-50 active:scale-95 rounded-xl border border-neutral-200 shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <MapPin className="w-5 h-5 text-[#C81E1E] transition-transform duration-200 group-hover:scale-110" />
                <span>Find Donors Near You</span>
              </button>
            </div>

            {/* Bottom 4 Feature Value Props */}
            <HeroBadges />
          </div>

          {/* Right Hero Visual Column */}
          <div className="lg:col-span-6 relative mt-8 lg:mt-0">
            <HeroVisual
              onOpenDonorModal={onOpenDonorModal}
              onOpenRequestModal={onOpenRequestModal}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
