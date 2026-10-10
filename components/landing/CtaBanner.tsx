import React from "react";
import { ArrowRight, PhoneCall, Heart, ShieldCheck } from "lucide-react";

interface CtaBannerProps {
  onOpenRequestModal?: () => void;
  onOpenDonorModal?: () => void;
}

export const CtaBanner: React.FC<CtaBannerProps> = ({
  onOpenRequestModal,
  onOpenDonorModal,
}) => {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[#B01A1A] via-[#C81E1E] to-[#801313] p-8 sm:p-14 lg:p-16 text-white overflow-hidden shadow-2xl shadow-red-900/20">
          {/* Subtle Decorative Background Rings */}
          <div
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full border-8 border-white/10 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -right-40 -bottom-40 w-[420px] h-[420px] rounded-full border-8 border-white/5 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute top-0 right-1/4 w-60 h-60 bg-red-400/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-3xl">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-white text-xs font-semibold mb-6">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Free, Open & 100% Voluntary Community</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
              Every Drop Counts.
              <br />
              Every Second Matters.
            </h2>

            <p className="mt-5 text-base sm:text-lg text-rose-100 font-normal leading-relaxed max-w-2xl">
              You could be the exact match someone is praying for right now in an emergency room.
              Join the verified LifeLink network today — it takes under 2 minutes.
            </p>

            {/* Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onOpenDonorModal}
                className="group px-7 py-4 text-base font-bold text-[#C81E1E] bg-white hover:bg-rose-50 active:scale-95 rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <Heart className="w-5 h-5 fill-[#C81E1E]" />
                <span>Register as a Donor</span>
                <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onOpenRequestModal}
                className="px-7 py-4 text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/30 active:scale-95 rounded-2xl backdrop-blur-xs transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <span>Request Emergency Blood</span>
              </button>
            </div>

            {/* Emergency Hotline strip */}
            <div className="mt-10 pt-6 border-t border-white/20 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-rose-100">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4" />
                <span>24/7 Emergency Support Desk:</span>
                <a
                  href="tel:1800-LIFELINK"
                  className="font-bold text-white underline hover:text-rose-200 ml-1"
                >
                  1800-LIFELINK (Toll Free)
                </a>
              </div>
              <div className="flex items-center gap-2 text-rose-200 text-xs">
                <span>• Hospital Integrations Active Across India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
