"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface ImpactSectionProps {
  onOpenRequestModal?: () => void;
  onOpenDonorModal?: () => void;
}

export const ImpactSection: React.FC<ImpactSectionProps> = ({
  onOpenRequestModal,
  onOpenDonorModal,
}) => {
  return (
    <section id="services" className="py-20 sm:py-28 bg-[#FBF9F8] relative border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
              OUR SERVICES
            </p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#111827] tracking-tight">
              How LifeLink{" "}
              <span className="italic text-[#E23B42] font-normal">Makes an Impact</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 max-w-md">
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              From urgent requests to connecting verified donors, we make the process
              simple, safe and community-driven.
            </p>
            <button
              onClick={onOpenDonorModal}
              className="group px-6 py-2.5 text-xs font-medium text-white bg-[#18181B] hover:bg-[#27272A] rounded-full shadow-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0 w-fit"
            >
              <span>Explore All Features</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* 3 Impact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: Create a Blood Request */}
          <div
            onClick={onOpenRequestModal}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-200/60 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-neutral-900 leading-tight">
                Create a Blood Request
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-neutral-500 leading-relaxed min-h-[40px]">
                Share verified medical details so nearby donors can be notified quickly.
              </p>

              {/* Photo */}
              <div className="mt-5 relative w-full h-44 rounded-2xl overflow-hidden shadow-xs">
                <Image
                  src="/images/impact-man.jpg"
                  alt="Create a Blood Request"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Floating Metric Card: Fulfilled & Response Time */}
            <div className="mt-4 bg-[#FAF7F6] rounded-2xl p-4 border border-[#F2EAE7]">
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1.5">
                  <span>Requests Fulfilled</span>
                  <span className="font-bold text-neutral-900">72%</span>
                </div>
                <div className="w-full bg-neutral-200/60 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-400 to-[#E23B42] h-full rounded-full w-[72%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1.5">
                  <span>Average Response Time</span>
                  <span className="font-bold text-neutral-900">1.8 hrs</span>
                </div>
                <div className="w-full bg-neutral-200/60 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-400 to-blue-500 h-full rounded-full w-[45%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Find Nearby Donors */}
          <div
            onClick={onOpenDonorModal}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-200/60 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-neutral-900 leading-tight">
                Find Nearby Donors
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-neutral-500 leading-relaxed min-h-[40px]">
                Connect with verified donors in your area based on location, blood group and availability.
              </p>

              {/* Photo */}
              <div className="mt-5 relative w-full h-44 rounded-2xl overflow-hidden shadow-xs">
                <Image
                  src="/images/impact-woman.jpg"
                  alt="Find Nearby Donors"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Floating Metric Card: Donors Nearby & Distance Distribution */}
            <div className="mt-4 bg-[#FAF7F6] rounded-2xl p-4 border border-[#F2EAE7]">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-2">
                <span>Donors Available Nearby</span>
                <span className="font-bold text-neutral-900 text-sm">120+</span>
              </div>

              {/* Multi-bucket Gradient Bars */}
              <div className="flex items-end justify-between gap-1 h-14 pt-2">
                {/* 0-5 km: sky blue */}
                <div className="flex-1 bg-gradient-to-t from-sky-200 to-sky-400 rounded-full h-[40%]" />
                <div className="flex-1 bg-gradient-to-t from-sky-200 to-sky-400 rounded-full h-[55%]" />
                <div className="flex-1 bg-gradient-to-t from-sky-200 to-sky-400 rounded-full h-[65%]" />
                {/* 5-10 km: peach */}
                <div className="flex-1 bg-gradient-to-t from-orange-200 to-rose-300 rounded-full h-[45%]" />
                <div className="flex-1 bg-gradient-to-t from-orange-200 to-rose-300 rounded-full h-[70%]" />
                <div className="flex-1 bg-gradient-to-t from-orange-200 to-rose-300 rounded-full h-[60%]" />
                <div className="flex-1 bg-gradient-to-t from-orange-200 to-rose-300 rounded-full h-[75%]" />
                {/* 10-20 km: coral */}
                <div className="flex-1 bg-gradient-to-t from-rose-300 to-[#E23B42] rounded-full h-[85%]" />
                <div className="flex-1 bg-gradient-to-t from-rose-300 to-[#E23B42] rounded-full h-[95%]" />
                <div className="flex-1 bg-gradient-to-t from-rose-300 to-[#E23B42] rounded-full h-[90%]" />
                <div className="flex-1 bg-gradient-to-t from-rose-300 to-[#E23B42] rounded-full h-[100%]" />
              </div>

              <div className="flex justify-between text-[10px] text-neutral-400 mt-2 font-medium">
                <span>0-5 km</span>
                <span>5-10 km</span>
                <span>10-20 km</span>
              </div>
            </div>
          </div>

          {/* Card 3: Track Your Request */}
          <div
            onClick={onOpenRequestModal}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-200/60 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-neutral-900 leading-tight">
                Track Your Request
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] text-neutral-500 leading-relaxed min-h-[40px]">
                Get real-time updates from donor pledges to final confirmation.
              </p>

              {/* Photo */}
              <div className="mt-5 relative w-full h-44 rounded-2xl overflow-hidden shadow-xs">
                <Image
                  src="/images/impact-man-back.jpg"
                  alt="Track Your Request"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Floating Metric Card: Radial Donut Gauge */}
            <div className="mt-4 bg-[#FAF7F6] rounded-2xl p-4 border border-[#F2EAE7]">
              <div className="text-xs font-semibold text-neutral-700 mb-1 text-center">
                Request Completion
              </div>

              <div className="relative flex items-center justify-center my-1">
                {/* SVG Radial Donut Progress */}
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  {/* Track */}
                  <path
                    className="text-neutral-200"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress 78% */}
                  <path
                    className="text-[#E23B42]"
                    strokeDasharray="78, 100"
                    strokeLinecap="round"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-extrabold text-sm text-neutral-900 leading-none">
                    78%
                  </span>
                  <span className="text-[8px] text-neutral-500 mt-0.5">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
