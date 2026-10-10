"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Bot, MapPin, Upload, Bell, CheckCircle2 } from "lucide-react";

export const AiCompanionSection: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(1); // 0 = Find Nearby, 1 = Instant Guidance, 2 = Real-time Updates

  const slides = [
    {
      id: 0,
      tag: "Find Nearby Support",
      bgImage: "/images/companion-card-1.jpg",
      subtext: "Navigate directly to nearby accredited blood donation centers and camps with turn-by-turn routing.",
      widget: (
        <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-white shadow-2xl w-full max-w-[260px]">
          {/* Stylized Map View */}
          <div className="relative h-28 rounded-xl bg-neutral-800/80 border border-neutral-700/60 overflow-hidden p-2 flex items-center justify-center">
            {/* SVG Path Route */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
              <path
                d="M 30 30 Q 80 50, 110 75 T 160 80"
                fill="none"
                stroke="#E23B42"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Starting Pin */}
            <div className="absolute top-4 left-6 flex items-center justify-center">
              <div className="w-7 h-7 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-lg">
                <MapPin className="w-4 h-4 text-[#E23B42] fill-[#E23B42]" />
              </div>
            </div>

            {/* Destination Dot */}
            <div className="absolute bottom-3 right-8 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[#E23B42] border-2 border-white shadow-md animate-ping absolute" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#E23B42] border-2 border-white shadow-md relative" />
            </div>

            {/* Floating Distance Badge */}
            <div className="absolute top-8 right-6 bg-neutral-900/90 text-[11px] font-semibold text-white px-2.5 py-1 rounded-full border border-white/10 shadow-md">
              2.4 km away
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      tag: "Instant Guidance",
      bgImage: "/images/companion-card-2.jpg",
      subtext: "Get step-by-step guidance for donation processes, eligibility, and nearby facilities.",
      widget: (
        <div className="bg-neutral-900/85 backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-5 text-white shadow-2xl w-full max-w-[320px]">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-3.5">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white tracking-wide">LifeLink AI</span>
          </div>

          {/* User message */}
          <div className="flex justify-end mb-2.5">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl rounded-tr-xs px-3.5 py-2 text-[11px] text-white border border-white/10 max-w-[210px]">
              Am I eligible to donate?
            </div>
          </div>

          {/* AI Response message */}
          <div className="flex justify-start">
            <div className="bg-neutral-800/80 backdrop-blur-md rounded-2xl rounded-tl-xs p-3 text-[11px] text-neutral-200 border border-white/10 leading-relaxed max-w-[260px]">
              Based on the information you provided, you look eligible to donate. Make sure you are well-rested and had a meal before donating.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      tag: "Real-time Updates",
      bgImage: "/images/companion-card-3.jpg",
      subtext: "Live milestone tracking from request verification to donor arrival and unit cross-matching.",
      widget: (
        <div className="bg-neutral-900/85 backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-5 text-white shadow-2xl w-full max-w-[280px]">
          <div className="space-y-3.5 relative">
            {/* Connecting Vertical Line */}
            <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-neutral-700/80" />

            {/* Step 1 */}
            <div className="flex items-center gap-3 relative">
              <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Request Submitted</div>
                <div className="text-[10px] text-neutral-400">2 min ago</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-3 relative">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Donors Notified</div>
                <div className="text-[10px] text-neutral-400">8 min ago</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-3 relative">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Pledge Received</div>
                <div className="text-[10px] text-neutral-400">12 min ago</div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="companion" className="py-20 sm:py-28 bg-[#F4F6F9]/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
            AI-POWERED SUPPORT
          </p>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#111827] tracking-tight">
            Meet Your LifeLink
            <br />
            <span className="italic text-[#E23B42] font-normal">Support Companion</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-neutral-600 leading-relaxed">
            Get real-time guidance, information and support throughout your donation
            journey — available 24/7.
          </p>
        </div>

        {/* Carousel Viewport */}
        <div className="relative">
          {/* Desktop/Tablet 3-Card Carousel Display */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
            {slides.map((slide, index) => {
              const isCenter = index === activeSlide;

              return (
                <div
                  key={slide.id}
                  onClick={() => setActiveSlide(index)}
                  className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 shadow-xl ${
                    isCenter
                      ? "md:col-span-6 ring-2 ring-neutral-900/10 scale-100 z-20 min-h-[460px] sm:min-h-[500px]"
                      : "md:col-span-3 opacity-75 hover:opacity-100 scale-95 z-10 min-h-[380px] sm:min-h-[440px]"
                  }`}
                >
                  {/* Photo Background */}
                  <Image
                    src={slide.bgImage}
                    alt={slide.tag}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-900/30 to-black/20 pointer-events-none" />

                  {/* Top Floating Tag Pill */}
                  <div className="absolute top-5 left-5 z-20">
                    <span className="bg-white/20 backdrop-blur-md text-white text-xs font-medium px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
                      {slide.tag}
                    </span>
                  </div>

                  {/* Center/Bottom Widget Overlay */}
                  <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end z-20">
                    {/* Widget Component */}
                    <div className="mb-4 flex justify-center sm:justify-end">
                      {slide.widget}
                    </div>

                    {/* Explanatory Caption (Shown prominently on center active slide) */}
                    {isCenter && (
                      <p className="text-xs sm:text-sm text-neutral-200/90 leading-relaxed max-w-sm drop-shadow-sm animate-in fade-in duration-300">
                        {slide.subtext}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Controls Bottom Row */}
          <div className="mt-10 flex items-center justify-center gap-4">
            {/* Prev Button */}
            <button
              onClick={prevSlide}
              className="w-10 h-10 rounded-full bg-white border border-neutral-200/80 shadow-xs flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all"
              aria-label="Previous slide"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Indicators */}
            <div className="flex items-center gap-1.5 px-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === activeSlide
                      ? "w-6 h-2 bg-[#18181B]"
                      : "w-2 h-2 bg-neutral-300 hover:bg-neutral-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={nextSlide}
              className="w-10 h-10 rounded-full bg-white border border-neutral-200/80 shadow-xs flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all"
              aria-label="Next slide"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AiCompanionSection;
