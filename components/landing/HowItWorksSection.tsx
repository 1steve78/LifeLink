"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, X, ArrowRight } from "lucide-react";

interface Step {
  id: string;
  num: string;
  title: string;
  description: string;
}

export const HowItWorksSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<string>("01");

  const steps: Step[] = [
    {
      id: "01",
      num: "01",
      title: "Create a Request",
      description:
        "Share the essential details so verified donors in your area can be notified quickly.",
    },
    {
      id: "02",
      num: "02",
      title: "Get Verified",
      description:
        "Our team and AI screening help ensure requests are genuine and safe.",
    },
    {
      id: "03",
      num: "03",
      title: "Connect with Donors",
      description:
        "Nearby verified donors can view your request and pledge to help.",
    },
    {
      id: "04",
      num: "04",
      title: "Track & Get Support",
      description:
        "Stay updated in real time, from donor pledges to final confirmation.",
    },
  ];

  return (
    <section id="how-it-works" className="py-12 sm:py-20 bg-neutral-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cinematic Rounded Container with Image Background */}
        <div className="relative rounded-3xl overflow-hidden min-h-[580px] lg:min-h-[640px] shadow-2xl border border-white/10 flex items-center">
          {/* Background Image: Artistic Chromatic Motion Glitch Portrait */}
          <Image
            src="/images/how-it-works-glitch.jpg"
            alt="How LifeLink Works Cinematic Background"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />

          {/* Dark Cinematic Vignette & Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-neutral-950/80 pointer-events-none" />
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          {/* Content Grid */}
          <div className="relative z-10 w-full p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Title & Explanation */}
            <div className="lg:col-span-5 text-white">
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.1] tracking-tight">
                How{" "}
                <span className="text-[#E23B42] italic font-normal">LifeLink</span>
                <br />
                Works
              </h2>

              <p className="mt-6 text-sm sm:text-base text-neutral-300 font-normal leading-relaxed max-w-sm">
                From creating a request to connecting with verified donors,
                LifeLink makes the process simple, transparent and community-driven.
              </p>

              <div className="mt-8">
                <a
                  href="#community"
                  className="inline-flex items-center gap-2 bg-white text-neutral-900 hover:bg-neutral-100 px-6 py-2.5 rounded-full text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Right Interactive Glass Steps Accordion */}
            <div className="lg:col-span-7 flex flex-col gap-3.5">
              {steps.map((step) => {
                const isOpen = activeStep === step.id;
                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStep(isOpen ? "" : step.id)}
                    className={`backdrop-blur-md rounded-2xl p-5 sm:p-6 transition-all duration-300 cursor-pointer border ${
                      isOpen
                        ? "bg-white/20 border-white/30 shadow-xl shadow-black/20"
                        : "bg-white/10 hover:bg-white/15 border-white/15"
                    }`}
                  >
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold tracking-wider text-rose-200">
                          {step.num}
                        </span>
                        <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                          {step.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                        aria-label={isOpen ? "Collapse step" : "Expand step"}
                      >
                        {isOpen ? (
                          <X className="w-4 h-4 stroke-[2]" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[2]" />
                        )}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="mt-3 pl-9 sm:pl-10 text-xs sm:text-sm text-neutral-200 font-normal leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                        {step.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
