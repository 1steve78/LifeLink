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
    <section id="how-it-works" className="relative py-12 sm:py-20 bg-[#07050e]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.35)] min-h-[580px] lg:min-h-[640px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,104,104,0.35),transparent_28%),radial-gradient(circle_at_75%_30%,rgba(169,85,247,0.25),transparent_24%),radial-gradient(circle_at_55%_100%,rgba(249,115,22,0.3),transparent_30%),linear-gradient(120deg,#07050e_0%,#110d12_35%,#1a1016_100%)]" />

          <Image
            src="/images/how-it-works-glitch.jpg"
            alt="How LifeLink Works Cinematic Background"
            fill
            sizes="100vw"
            className="object-cover object-center opacity-55 mix-blend-screen"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#05050a]/90 via-[#181018]/60 to-[#09090d]/85" />

          <div className="relative z-10 grid w-full grid-cols-1 gap-10 p-8 sm:p-12 lg:grid-cols-12 lg:gap-12 lg:p-16 lg:items-center">
            <div className="lg:col-span-5 text-white">
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-[5rem] lg:leading-[0.94] font-normal tracking-[-0.05em]">
                How <span className="italic text-[#E23B42]">LifeLink</span>
                <br />
                Works
              </h2>

              <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/75 sm:text-base">
                From creating a request to connecting with verified donors, LifeLink makes the process simple,
                transparent and community-driven.
              </p>

              <div className="mt-8">
                <a
                  href="#services"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-neutral-900 shadow-[0_10px_25px_rgba(255,255,255,0.15)] transition-all hover:bg-neutral-100 active:scale-95"
                >
                  <span>Learn More</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-3.5">
              {steps.map((step) => {
                const isOpen = activeStep === step.id;

                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStep(isOpen ? "" : step.id)}
                    className={`cursor-pointer rounded-[1.4rem] border backdrop-blur-md transition-all duration-300 ${
                      isOpen
                        ? "border-white/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
                        : "border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))]"
                    } p-5 sm:p-6`}
                  >
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold tracking-[0.18em] text-[#F6C1C9]">
                          {step.num}
                        </span>
                        <h3 className="text-lg font-semibold tracking-[-0.04em] text-white sm:text-xl">
                          {step.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-all hover:bg-white/10 hover:text-white"
                        aria-label={isOpen ? "Collapse step" : "Expand step"}
                      >
                        {isOpen ? <X className="h-4 w-4 stroke-[2.2]" /> : <Plus className="h-4 w-4 stroke-[2.2]" />}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="mt-3 pl-9 text-sm leading-relaxed text-white/80 sm:pl-10 sm:text-[0.95rem]">
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
