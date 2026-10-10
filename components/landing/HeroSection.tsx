"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Users, MapPin, ChevronDown } from "lucide-react";

interface HeroSectionProps {
  onOpenRequestModal?: () => void;
  onOpenDonorModal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenRequestModal,
  onOpenDonorModal,
}) => {
  return (
    <section id="hero" className="relative w-full bg-white overflow-hidden pb-4">
      {/* Desktop & Tablet View (Exact Pixel-Perfect Panoramic Mockup with Interactive Triggers) */}
      <div className="hidden md:block relative w-full max-w-[1440px] mx-auto">
        <div className="relative w-full aspect-[1024/415] min-h-[460px] lg:min-h-[520px]">
          <Image
            src="/images/hero-full-mockup.jpg"
            alt="Real People Save Real Lives - LifeLink Community"
            fill
            priority
            sizes="(max-width: 1440px) 100vw, 1440px"
            className="object-cover object-center"
          />

          {/* Interactive Clickable Hotspot: 'Create a Blood Request' button */}
          <button
            onClick={onOpenRequestModal}
            className="absolute left-[10.5%] top-[65.5%] w-[18.2%] h-[11%] rounded-full cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-rose-400/50 hover:bg-white/5 active:scale-95"
            title="Create a Blood Request"
            aria-label="Create a Blood Request"
          />

          {/* Interactive Clickable Hotspot: 'Rahul Sharma' Donor Card */}
          <div
            onClick={onOpenDonorModal}
            className="absolute left-[66%] top-[20%] w-[24%] h-[66%] rounded-3xl cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-rose-400/50 hover:bg-white/5"
            title="View Donor Impact Profile"
            role="button"
            aria-label="View Donor Impact Profile"
          />
        </div>
      </div>

      {/* Mobile Responsive Fallback (Screens under 768px) */}
      <div className="md:hidden px-5 py-8 flex flex-col gap-8 bg-gradient-to-b from-white via-rose-50/20 to-white">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#111827] tracking-tight leading-tight">
            Real People
            <br />
            <span className="italic text-[#E23B42] font-normal">Save Real Lives</span>
          </h1>

          <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
            A trusted community platform to connect blood donors with people in need — quickly, safely and responsibly.
          </p>

          <div className="mt-6">
            <button
              onClick={onOpenRequestModal}
              className="px-6 py-3.5 text-xs font-semibold text-white bg-[#18181B] hover:bg-neutral-800 rounded-full shadow-lg flex items-center gap-2"
            >
              <span>Create a Blood Request</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Character Image */}
        <div className="relative w-full h-64 rounded-3xl overflow-hidden shadow-lg">
          <Image
            src="/images/hero-man-silhouette.jpg"
            alt="LifeLink Community"
            fill
            className="object-cover object-center"
          />
        </div>

        {/* Mobile Donor Card */}
        <div
          onClick={onOpenDonorModal}
          className="bg-white/95 rounded-3xl p-5 shadow-xl border border-neutral-100"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 font-bold">
                RS
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">Rahul Sharma</h4>
                <p className="text-xs text-neutral-500">A+ Donor</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-600 text-xs px-2.5 py-1 rounded-full font-medium">
              Available
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 py-3 border-b border-neutral-100 text-xs">
            <div className="bg-[#FAF7F6] p-2 rounded-xl flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E23B42]" />
              <div>
                <div className="font-bold text-neutral-900">3</div>
                <div className="text-[10px] text-neutral-500">People Helped</div>
              </div>
            </div>
            <div className="bg-[#FAF7F6] p-2 rounded-xl flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#E23B42]" />
              <div>
                <div className="font-bold text-neutral-900">12 km</div>
                <div className="text-[10px] text-neutral-500">Nearby Requests</div>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-900">Your Impact</span>
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                This Year <ChevronDown className="w-3 h-3" />
              </span>
            </div>
            <div className="flex items-end justify-between gap-1 h-14">
              {[25, 38, 48, 60, 75, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-rose-200 to-rose-400 rounded-full"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
