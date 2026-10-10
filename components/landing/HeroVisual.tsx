"use client";

import React from "react";
import Image from "next/image";
import { Navigation, MapPin, Clock, Building2, Droplet } from "lucide-react";

interface HeroVisualProps {
  onOpenDonorModal?: () => void;
  onOpenRequestModal?: () => void;
}

export const HeroVisual: React.FC<HeroVisualProps> = ({
  onOpenDonorModal,
  onOpenRequestModal,
}) => {
  return (
    <div className="relative w-full max-w-[560px] lg:max-w-[590px] mx-auto select-none lg:translate-x-5 lg:scale-[.94] xl:scale-100">
      {/* Background Organic Rose/Blush Glow Shapes */}
      <div
        className="absolute -top-12 -right-8 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-[#ffe4e6] to-[#fee2e2] opacity-70 blur-2xl -z-10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-20 -left-12 w-64 h-64 rounded-full bg-gradient-to-tr from-[#fecdd3] to-[#ffe4e6] opacity-50 blur-3xl -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Decorative Cursive Callout: "Donate Blood Save Lives" */}
      <div className="absolute -top-4 right-2 sm:right-6 z-20 pointer-events-none transform rotate-3 flex flex-col items-center">
        <span
          className="text-2xl sm:text-3xl lg:text-[32px] font-serif text-[#C81E1E] tracking-wide drop-shadow-xs font-bold italic"
          style={{
            fontFamily: "Georgia, 'Playfair Display', cursive",
          }}
        >
          Donate Blood
        </span>
        <span
          className="text-2xl sm:text-3xl lg:text-[32px] font-serif text-[#C81E1E] tracking-wide drop-shadow-xs font-bold italic -mt-1"
          style={{
            fontFamily: "Georgia, 'Playfair Display', cursive",
          }}
        >
          Save Lives
        </span>
        {/* Hand-drawn SVG heart */}
        <svg
          viewBox="0 0 40 32"
          fill="none"
          stroke="#C81E1E"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-7 h-6 mt-1 text-[#C81E1E] opacity-90 animate-pulse"
        >
          <path d="M20 28C20 28 4 19 4 10C4 5 7.5 2 12 2C15.5 2 18.5 4.5 20 6.5C21.5 4.5 24.5 2 28 2C32.5 2 36 5 36 10C36 19 20 28 20 28Z" />
        </svg>
      </div>

      {/* Connecting Dotted Trail Line from Rahul Card to Radar (SVG) */}
      <svg
        className="absolute top-28 left-16 sm:left-24 w-44 h-48 z-20 pointer-events-none hidden sm:block opacity-70"
        viewBox="0 0 160 180"
        fill="none"
      >
        <path
          d="M 20 10 C -20 80, 70 120, 110 160"
          stroke="#C81E1E"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Main Donor Photo Frame */}
      <div className="relative mx-auto rounded-[48%] overflow-hidden shadow-xl shadow-rose-950/10 border-4 border-white aspect-[.92/1] w-[76%] ml-auto mr-0 max-w-[390px] lg:max-w-[410px] bg-neutral-100">
        <Image
          src="/images/donor-hero.jpg"
          alt="LifeLink verified blood donor smiling comfortably in donation chair"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 520px"
          className="object-cover object-center transform hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* FLOATING CARD 1: Available Donor (Rahul S.) */}
      <div
        onClick={onOpenDonorModal}
        className="absolute -top-3 sm:-top-5 left-0 sm:-left-6 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-xl shadow-neutral-900/10 border border-white/80 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-[200px] sm:w-[220px]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-neutral-200 shrink-0">
              <Image
                src="/images/rahul-avatar.jpg"
                alt="Rahul S. - Verified Blood Donor"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight">
                Rahul S.
              </h5>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-medium text-emerald-700">
                  Available Donor
                </span>
              </div>
            </div>
          </div>

          {/* Blood Group Pill */}
          <div className="flex items-center gap-1 bg-red-50 text-[#C81E1E] border border-red-200/80 rounded-full px-2 py-0.5 font-bold text-xs shrink-0 shadow-2xs">
            <Droplet className="w-3 h-3 fill-[#C81E1E]" />
            <span>O+</span>
          </div>
        </div>

        {/* Footer Meta Row */}
        <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-neutral-500 text-[11px]">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-neutral-400" />
            <span>2.4 km away</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors">
            <Navigation className="w-2.5 h-2.5 rotate-45 fill-current" />
          </div>
        </div>
      </div>

      {/* FLOATING CARD 2: Live Radar Map Pulse Card */}
      <div
        onClick={onOpenDonorModal}
        className="absolute bottom-8 sm:bottom-12 -left-3 sm:-left-12 z-30 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl shadow-neutral-900/12 border border-white/80 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-[190px] sm:w-[230px]"
      >
        {/* Radar Map Graphic Container */}
        <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 overflow-hidden border border-blue-100/60 p-2">
          {/* Faint Map Grid Lines */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #93c5fd 1px, transparent 1px), linear-gradient(to bottom, #93c5fd 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />

          {/* Concentric Radar Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full border border-blue-300/60" />
            <div className="absolute w-24 h-24 rounded-full border border-blue-200/50" />
            <div className="absolute w-36 h-36 rounded-full border border-blue-100/40" />

            {/* Radar Sweep Effect */}
            <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-transparent via-blue-400/10 to-blue-500/20 animate-spin origin-center" />
          </div>

          {/* Center User Location Beacon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-xs" />
            </span>
          </div>

          {/* Donor Droplets Pinned Around Radar */}
          {/* Pin 1: Top Right */}
          <div className="absolute top-5 right-7 z-10 transition-transform hover:scale-125">
            <div className="w-5 h-5 rounded-full bg-white shadow-md border border-red-200 flex items-center justify-center text-[#C81E1E]">
              <Droplet className="w-3 h-3 fill-[#C81E1E]" />
            </div>
          </div>

          {/* Pin 2: Mid Left */}
          <div className="absolute top-14 left-4 z-10 transition-transform hover:scale-125">
            <div className="w-5 h-5 rounded-full bg-white shadow-md border border-red-200 flex items-center justify-center text-[#C81E1E]">
              <Droplet className="w-3 h-3 fill-[#C81E1E]" />
            </div>
          </div>

          {/* Pin 3: Bottom Right */}
          <div className="absolute bottom-6 right-8 z-10 transition-transform hover:scale-125">
            <div className="w-5 h-5 rounded-full bg-white shadow-md border border-red-200 flex items-center justify-center text-[#C81E1E]">
              <Droplet className="w-3 h-3 fill-[#C81E1E]" />
            </div>
          </div>

          {/* Pin 4: Bottom Center-Left */}
          <div className="absolute bottom-4 left-10 z-10 transition-transform hover:scale-125">
            <div className="w-5 h-5 rounded-full bg-white shadow-md border border-red-200 flex items-center justify-center text-[#C81E1E]">
              <Droplet className="w-3 h-3 fill-[#C81E1E]" />
            </div>
          </div>

          {/* Pin 5: Top Left */}
          <div className="absolute top-8 left-8 z-10 transition-transform hover:scale-125">
            <div className="w-5 h-5 rounded-full bg-white shadow-md border border-red-200 flex items-center justify-center text-[#C81E1E]">
              <Droplet className="w-3 h-3 fill-[#C81E1E]" />
            </div>
          </div>

          {/* Floating Pill on top of map */}
          <div className="absolute top-2.5 right-2 z-20 bg-white/95 backdrop-blur-xs rounded-full px-2.5 py-1 shadow-md border border-neutral-100 flex items-center gap-1.5">
            <Droplet className="w-2.5 h-2.5 text-[#C81E1E] fill-[#C81E1E]" />
            <div className="text-[10px] font-bold text-neutral-800 whitespace-nowrap leading-tight">
              12 donors nearby
              <span className="block text-[8px] font-medium text-neutral-400">within 5 km</span>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING CARD 3: Urgent Hospital Request Card */}
      <div
        onClick={onOpenRequestModal}
        className="absolute -bottom-6 sm:-bottom-8 right-0 sm:-right-6 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-xl shadow-neutral-900/10 border border-white/80 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-[230px] sm:w-[260px]"
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight">
                City Care Hospital
              </h5>
              <p className="text-[11px] font-medium text-neutral-500 mt-0.5">
                Blood Request • <span className="font-bold text-neutral-700">B+</span>
              </p>
            </div>
          </div>

          {/* Urgent Status Pill */}
          <span className="bg-red-50 text-[#C81E1E] border border-red-200 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 animate-pulse">
            Urgent
          </span>
        </div>

        {/* Bottom Distance & Time Info */}
        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-neutral-500 text-[11px]">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-neutral-400" />
            <span>3 km away</span>
          </div>
          <div className="flex items-center gap-1 text-neutral-400">
            <Clock className="w-3 h-3" />
            <span>Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroVisual;
