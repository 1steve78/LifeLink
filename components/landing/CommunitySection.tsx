"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";

interface CommunitySectionProps {
  onOpenRequestModal?: () => void;
  onOpenDonorModal?: () => void;
}

export const CommunitySection: React.FC<CommunitySectionProps> = ({
  onOpenRequestModal,
  onOpenDonorModal,
}) => {
  return (
    <section id="community" className="py-14 sm:py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Part: Exact Image 1 Bottom layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pb-16 sm:pb-20 border-b border-neutral-100">
          {/* Left Column: 01 and Connecting text */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
              COMMUNITY &nbsp;/&nbsp; TRUST &nbsp;/&nbsp; FASTER HELP
            </p>

            <div className="font-serif text-7xl sm:text-8xl text-rose-300/80 font-light tracking-tight my-4">
              01
            </div>

            <p className="text-base sm:text-lg text-neutral-700 leading-relaxed max-w-sm">
              Connecting donors and patients through a verified, community-driven platform.
            </p>
          </div>

          {/* Right Column: Title + Bridge Photo Card */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#111827] tracking-tight leading-tight">
              From Urgent Needs to
              <br />
              <span className="italic text-[#E23B42] font-normal">Brighter Tomorrows.</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-[#FAF6F5] p-5 sm:p-6 rounded-3xl border border-[#F2E8E5]">
              {/* Bridge Image */}
              <div className="sm:col-span-6 relative h-40 sm:h-44 rounded-2xl overflow-hidden shadow-xs">
                <Image
                  src="/images/bridge-sunset.jpg"
                  alt="City Bridge at Sunset"
                  fill
                  sizes="(max-width: 768px) 100vw, 30vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Text & Learn More Link */}
              <div className="sm:col-span-6 flex flex-col justify-between h-full py-1">
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  LifeLink brings people together to make help faster, simpler and more accessible — because everyone deserves a second chance.
                </p>

                <div className="mt-4">
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E23B42] hover:underline"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Part: 3-Card Grid from Image 2 */}
        <div className="pt-14 sm:pt-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-stretch">
            {/* Card 1: 01 A Stronger Community Saves Lives */}
            <div className="md:col-span-5 bg-[#FDF7F6] border border-[#F5E6E4] rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
                  COMMUNITY &nbsp;/&nbsp; VERIFIED &nbsp;/&nbsp; FASTER HELP
                </p>

                <div className="font-serif text-7xl sm:text-8xl text-rose-300/80 font-light tracking-tighter my-4">
                  01
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#111827] leading-snug">
                  A Stronger
                  <br />
                  Community{" "}
                  <span className="italic text-[#E23B42] font-normal">Saves Lives</span>
                </h3>

                <p className="mt-4 text-sm text-neutral-600 leading-relaxed max-w-sm">
                  LifeLink connects people in need with verified donors — quickly,
                  safely and near you.
                </p>
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={onOpenRequestModal}
                  className="group px-6 py-3 text-xs font-medium text-white bg-[#18181B] hover:bg-[#27272A] active:scale-95 rounded-full shadow-sm transition-all duration-200 flex items-center gap-2.5"
                >
                  <span>Create a Request</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Card 2: Young Man Photo Card */}
            <div
              onClick={onOpenDonorModal}
              className="md:col-span-3.5 lg:col-span-4 relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group min-h-[360px] sm:min-h-[440px]"
            >
              <Image
                src="/images/card-man.jpg"
                alt="Find Donors Near You"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Top-Left Floating Circle Arrow */}
              <div className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[#E23B42] group-hover:scale-110 group-hover:rotate-45 transition-transform duration-300">
                <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
              </div>

              {/* Bottom Floating Dark Pill Badge */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[85%] text-center">
                <div className="bg-neutral-900/75 backdrop-blur-md text-white text-xs py-2 px-4 rounded-full border border-white/10 font-medium shadow-md">
                  Find Donors Near You
                </div>
              </div>
            </div>

            {/* Card 3: Young Woman Photo Card */}
            <div
              onClick={onOpenDonorModal}
              className="md:col-span-3.5 lg:col-span-3 relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group min-h-[360px] sm:min-h-[440px]"
            >
              <Image
                src="/images/card-woman.jpg"
                alt="Real Stories, Real Impact"
                fill
                sizes="(max-width: 768px) 100vw, 30vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Bottom Floating Dark Pill Badge */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[85%] text-center">
                <div className="bg-neutral-900/75 backdrop-blur-md text-white text-xs py-2 px-4 rounded-full border border-white/10 font-medium shadow-md">
                  Real Stories, Real Impact
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
