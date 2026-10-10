"use client";

import React, { useState } from "react";
import { Smartphone, FileText, Cpu, CheckCircle2, ArrowRight } from "lucide-react";

interface StepItem {
  id: number;
  title: string;
  description: string;
  detail: string;
  icon: React.ReactNode;
}

export const HowItWorksSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps: StepItem[] = [
    {
      id: 1,
      title: "Verify Identity",
      description: "Aadhaar OTP verification ensures genuine requests.",
      detail:
        "Every patient relative or requester authenticates via Aadhaar OTP with UIDAI compliant hashing. Fake requests and spam are eliminated at the threshold.",
      icon: (
        <div className="relative w-16 h-16 rounded-2xl bg-red-50/80 border border-red-100 flex items-center justify-center text-neutral-800">
          {/* Smartphone with check icon */}
          <Smartphone className="w-8 h-8 stroke-[1.8] text-neutral-800" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#C81E1E] text-white flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-4 h-4 fill-white text-[#C81E1E]" />
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "Validate Documents",
      description: "Hospital documents verified using AI vision.",
      detail:
        "Upload hospital admission slip, doctor blood requisition form, or cross-matching report. Computer vision models verify hospital letterhead, stamp, and signature.",
      icon: (
        <div className="relative w-16 h-16 rounded-2xl bg-red-50/80 border border-red-100 flex items-center justify-center text-neutral-800">
          {/* Document with check icon */}
          <FileText className="w-8 h-8 stroke-[1.8] text-neutral-800" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#C81E1E] text-white flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-4 h-4 fill-white text-[#C81E1E]" />
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "AI Safety Screening",
      description: "Claude AI checks for trafficking risk and fraud.",
      detail:
        "Every request is evaluated against clinical thresholds and behavioral anomaly models to prevent illegal organ/blood trade, commercial coercion, or duplicate solicitations.",
      icon: (
        <div className="relative w-16 h-16 rounded-2xl bg-red-50/80 border border-red-100 flex items-center justify-center text-neutral-800">
          {/* AI Chip icon with AI text */}
          <div className="relative flex items-center justify-center">
            <Cpu className="w-9 h-9 stroke-[1.6] text-neutral-800" />
            <span className="absolute font-black text-[10px] text-neutral-900 tracking-tighter">
              AI
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#C81E1E] text-white flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-4 h-4 fill-white text-[#C81E1E]" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-8 sm:py-7 bg-[#FFF7F7] relative border-t border-rose-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[.16em] text-[#C81E1E]">
            HOW LIFELINK WORKS
          </p>
          <h2 className="mt-1 text-xl sm:text-2xl lg:text-[22px] font-extrabold text-neutral-900 tracking-tight leading-tight">
            From Request to Save —{" "}
            <span className="text-[#C81E1E]">In Three Verified Steps</span>
          </h2>
          <p className="hidden mt-4 text-base sm:text-lg text-neutral-600">
            Our multi-gate verification protects donors from scams while mobilizing
            genuine help in minutes when every heartbeat counts.
          </p>
        </div>

        {/* Steps Cards Grid */}
        <div className="mt-4 sm:mt-3 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative items-stretch">
          {steps.map((step, index) => (
            <div key={step.id} className="relative flex flex-col">
              {/* Step Card Container */}
              <div
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                className={`relative flex-1 bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 border ${
                  activeStep === step.id
                    ? "border-[#C81E1E] ring-2 ring-red-100"
                    : "border-neutral-200/70 hover:border-red-200"
                } cursor-pointer group flex flex-col justify-between`}
              >
                {/* Red Circular Step Number Badge (Positioned at Top-Left) */}
                <div className="absolute -top-4 left-6 sm:left-8 w-8 h-8 rounded-full bg-[#C81E1E] text-white font-bold text-sm flex items-center justify-center shadow-md shadow-red-500/20">
                  {step.id}
                </div>

                <div className="pt-2">
                  {/* Step Icon */}
                  <div className="mb-3">{step.icon}</div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-neutral-900 tracking-tight group-hover:text-[#C81E1E] transition-colors">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-neutral-600 font-normal leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Interactive Expandable Detail */}
                <div className="hidden mt-6 pt-4 border-t border-neutral-100">
                  {activeStep === step.id ? (
                    <p className="text-xs text-neutral-600 leading-relaxed bg-red-50/60 p-3 rounded-xl border border-red-100/50">
                      {step.detail}
                    </p>
                  ) : (
                    <span className="text-xs font-semibold text-[#C81E1E] inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View safety protocol
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Connecting Red Dashed Arrow (Rendered between Card 1 & 2, and 2 & 3) */}
              {index < steps.length - 1 && (
                <div
                  className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 z-20 items-center justify-center pointer-events-none text-[#C81E1E]"
                  aria-hidden="true"
                >
                  <svg
                    width="32"
                    height="16"
                    viewBox="0 0 32 16"
                    fill="none"
                    className="text-[#C81E1E]"
                  >
                    <path
                      d="M2 8H26M26 8L20 2M26 8L20 14"
                      stroke="#C81E1E"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Safety Guarantee Banner */}
        <div className="hidden mt-12 max-w-4xl mx-auto bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900">
                100% Zero-Commercialization Guarantee
              </h4>
              <p className="text-xs text-neutral-500">
                LifeLink complies strictly with the National Blood Transfusion Council (NBTC) guidelines. No monetary exchange is ever permitted.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#C81E1E] whitespace-nowrap bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
            NBTC & NOTTO Compliant
          </span>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
