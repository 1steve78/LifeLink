"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { ImpactCardGradient } from "./ImpactCardGradient";

gsap.registerPlugin(ScrollTrigger);

interface ImpactSectionProps {
  onOpenRequestModal?: () => void;
  onOpenDonorModal?: () => void;
}

export const ImpactSection: React.FC<ImpactSectionProps> = ({
  onOpenRequestModal,
  onOpenDonorModal,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".impact-header",
        { opacity: 0, y: 30 },
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
        ".impact-card",
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.14,
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

  return (
    <section ref={sectionRef} id="services" className="py-20 sm:py-28 bg-[#FBF9F8] relative border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="impact-header flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div
            onClick={onOpenRequestModal}
            className="impact-card relative isolate overflow-hidden bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-200/60 cursor-pointer group"
          >
            <ImpactCardGradient palette={0} />
            <div className="relative z-10">
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-neutral-900 leading-tight">
                Create a Blood Request
              </h3>
              <p className="mt-3 text-sm text-neutral-600 leading-7">
                Share the blood group, units needed, hospital and timing, along with the details needed to review the request. After verification, it can reach eligible nearby donors so they can decide whether to respond.
              </p>
            </div>
          </div>

          <div
            onClick={onOpenDonorModal}
            className="impact-card relative isolate overflow-hidden bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-200/60 cursor-pointer group"
          >
            <ImpactCardGradient palette={1} />
            <div className="relative z-10">
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-neutral-900 leading-tight">
                Find Nearby Donors
              </h3>
              <p className="mt-3 text-sm text-neutral-600 leading-7">
                LifeLink matches requests with donors using blood-group compatibility, approximate distance and current availability. Donors see relevant requests and can pledge to help, while private profile details stay protected.
              </p>
            </div>
          </div>

          <div
            onClick={onOpenRequestModal}
            className="impact-card relative isolate overflow-hidden bg-white/70 backdrop-blur-sm rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-200/60 cursor-pointer group"
          >
            <ImpactCardGradient palette={2} />
            <div className="relative z-10">
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-neutral-900 leading-tight">
                Track Your Request
              </h3>
              <p className="mt-3 text-sm text-neutral-600 leading-7">
                Follow a request as donors pledge, coordinate and report donations. The requester can confirm each report, and only confirmed donations count toward the request’s progress and fulfillment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
