"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, CheckCircle2, HeartHandshake, MapPin, ShieldCheck } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface HowItWorksSectionProps {
  onOpenRequestModal?: () => void;
  onOpenDonorModal?: () => void;
}

const requesterSteps = [
  {
    title: "Share the need",
    description: "Enter the blood group, units, hospital and required timing, with the supporting details for review.",
    icon: HeartHandshake,
  },
  {
    title: "Get a verified search",
    description: "A request is reviewed before it is shared with compatible donors nearby, helping people focus on genuine needs.",
    icon: ShieldCheck,
  },
  {
    title: "Follow progress",
    description: "See donor pledges and donation reports in one place. Confirmed donations update the request’s fulfillment progress.",
    icon: CheckCircle2,
  },
];

const donorSteps = [
  {
    title: "Set your availability",
    description: "Create a donor profile and turn availability on when you are ready to be considered for a request.",
    icon: CheckCircle2,
  },
  {
    title: "See relevant requests",
    description: "LifeLink uses blood-group compatibility, approximate distance and availability to surface requests that may fit.",
    icon: MapPin,
  },
  {
    title: "Choose how to help",
    description: "Review the request and pledge if you can help. The requester can track updates as donations are reported and confirmed.",
    icon: HeartHandshake,
  },
];

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  onOpenRequestModal,
  onOpenDonorModal,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".how-it-works-header",
        { opacity: 0, y: 32 },
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
        ".how-it-works-card",
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
          },
        }
      );

      gsap.fromTo(
        ".how-it-works-step",
        { opacity: 0, x: -18 },
        {
          opacity: 1,
          x: 0,
          duration: 0.55,
          stagger: 0.09,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="relative overflow-hidden border-t border-neutral-100 bg-[#FBF9F8] py-20 sm:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-rose-100/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-100/40 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="how-it-works-header mx-auto mb-12 max-w-2xl text-center sm:mb-14">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#C81E1E]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E23B42]" />
            A clearer path to help
          </p>
          <h2 className="font-serif text-3xl font-normal tracking-tight text-[#111827] sm:text-4xl lg:text-5xl">
            One network, <span className="italic text-[#E23B42]">two ways to help</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-base">
            LifeLink guides requesters from a verified need to clear progress, while helping donors find requests they may be able to support.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {[
            { title: "I need blood", audience: "For requesters", steps: requesterSteps, action: onOpenRequestModal, actionLabel: "Create a request" },
            { title: "I can donate", audience: "For donors", steps: donorSteps, action: onOpenDonorModal, actionLabel: "Find requests" },
          ].map((journey) => (
            <article key={journey.title} className="how-it-works-card rounded-3xl border border-neutral-200/80 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
              <div className="mb-6 flex items-end justify-between gap-3 border-b border-neutral-100 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">{journey.audience}</p>
                  <h3 className="mt-1 font-serif text-2xl text-neutral-900 sm:text-3xl">{journey.title}</h3>
                </div>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-[#C81E1E]">3 steps</span>
              </div>

              <ol className="space-y-5">
                {journey.steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title} className="how-it-works-step relative flex gap-4">
                      {index < journey.steps.length - 1 && <span aria-hidden="true" className="absolute bottom-[-1.4rem] left-5 top-11 w-px bg-rose-100" />}
                      <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-[#E23B42]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="pt-0.5">
                        <p className="text-sm font-semibold text-neutral-900">{String(index + 1).padStart(2, "0")} · {step.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-neutral-600">{step.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {journey.action && (
                <button type="button" onClick={journey.action} className="group mt-7 inline-flex items-center gap-2 rounded-full bg-[#18181B] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#27272A]">
                  {journey.actionLabel}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
