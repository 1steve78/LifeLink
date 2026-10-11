"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BellRing,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export const AiCompanionSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".user-flow-heading",
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          },
        }
      );

      gsap.fromTo(
        ".user-flow-card",
        { opacity: 0, y: 42 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 72%",
          },
        }
      );

      gsap.fromTo(
        ".user-flow-highlight",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 68%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      title: "Create a request",
      subtitle: "REQUEST",
      description:
        "Share the patient details, urgency, and location so the right help can be surfaced fast.",
      accent: "bg-[#F9E7E7]",
      icon: Sparkles,
      step: "01",
    },
    {
      title: "Match with donors",
      subtitle: "MATCH",
      description:
        "LifeLink filters verified nearby donors and sends real-time alerts to the best possible matches.",
      accent: "bg-[#F0EAFB]",
      icon: Users,
      step: "02",
    },
    {
      title: "Confirm and travel",
      subtitle: "TRAVEL",
      description:
        "Donors receive clear instructions, timing, and support while the patient stays informed throughout.",
      accent: "bg-[#E9F5F1]",
      icon: MapPin,
      step: "03",
    },
    {
      title: "Receive care",
      subtitle: "CARE",
      description:
        "Once the donation is complete, both sides get updates and follow-up care coordination is tracked.",
      accent: "bg-[#FDEEEA]",
      icon: Heart,
      step: "04",
    },
  ];

  const highlights = [
    {
      icon: BellRing,
      text: "Live alerts and updates at every stage",
      tint: "bg-[#F9E5E5] text-[#E23B42]",
    },
    {
      icon: ShieldCheck,
      text: "Verified matches and transparent follow-through",
      tint: "bg-[#E5F7ED] text-[#1FB97A]",
    },
  ];

  return (
    <section ref={sectionRef} id="user-flow" className="relative overflow-hidden bg-[#F3F0EE] py-20 sm:py-28">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="user-flow-heading mx-auto mb-14 max-w-[760px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#495567]">
            USER FLOW
          </p>
          <h2 className="mt-5 font-serif text-[3rem] font-normal leading-[0.95] tracking-[-0.05em] text-[#1B2533] sm:text-[4rem] lg:text-[5.2rem]">
            From request to
            <span className="mt-2 block italic text-[#E23B42]">support in four steps</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[680px] text-[15px] leading-7 text-[#586274]">
            Every moment of the donation journey is designed to make urgent help feel clear, fast, and human.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className="user-flow-card group rounded-[30px] border border-[#E7E0DD] bg-white/60 p-4 shadow-[0_10px_30px_rgba(17,24,39,0.04)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(17,24,39,0.08)] sm:p-5"
              >
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-[18px] ${step.accent}`}>
                  <Icon className="h-7 w-7 text-[#1B2533]" strokeWidth={2.2} />
                </div>

                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5C6470]">
                    {step.subtitle}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E4E2E2] bg-[#F9FAFB] text-[10px] font-medium text-[#4A5565] shadow-sm">
                    {step.step}
                  </span>
                </div>

                <h3 className="text-[1.05rem] font-semibold leading-6 text-[#1B2533] sm:text-[1.2rem]">
                  {step.title}
                </h3>

                <p className="mt-3 text-[15px] leading-6 text-[#586274]">{step.description}</p>

                <div className="mt-7 flex items-center justify-end">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F2D7D7] bg-[#FFF3F3] text-[#E23B42] transition group-hover:translate-x-1">
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-[26px] border border-[#E2DCD7] bg-white/65 px-4 py-4 shadow-[0_14px_30px_rgba(17,24,39,0.04)] backdrop-blur-sm sm:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.text}
                  className="user-flow-highlight flex items-center gap-4 rounded-[18px] border border-[#F0ECE7] bg-[#F7F5F3] px-4 py-3 text-left"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.tint}`}>
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <p className="text-[15px] font-medium leading-6 text-[#1E2A38]">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AiCompanionSection;
