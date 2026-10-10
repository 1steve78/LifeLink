import React from "react";
import { Users, Heart, Zap, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";

export const ImpactSection: React.FC = () => {
  const stats = [
    {
      value: "18,450+",
      label: "Active Verified Donors",
      detail: "Ready across 42+ Indian cities",
      icon: Users,
    },
    {
      value: "7,820+",
      label: "Critical Units Coordinated",
      detail: "Across 280+ partner hospitals",
      icon: Heart,
    },
    {
      value: "8.4 Mins",
      label: "Average Match Time",
      detail: "From request creation to first pledge",
      icon: Zap,
    },
    {
      value: "100%",
      label: "Clinically Verified",
      detail: "Zero spam or unauthorized requisitions",
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="impact" className="py-20 sm:py-28 bg-white border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#C81E1E]">
            MEASURABLE IMPACT
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">
            Every Second Saved is a Life Preserved
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-600">
            Real metrics from the ground demonstrating how automated verification and geospatial pulse matching transform emergency blood supply.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-20">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="bg-[#FFF9F9] rounded-3xl p-6 sm:p-8 border border-rose-100 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-white text-[#C81E1E] flex items-center justify-center mb-6 shadow-xs border border-red-100">
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight">
                    {stat.value}
                  </div>
                  <h4 className="mt-2 text-sm sm:text-base font-bold text-neutral-800">
                    {stat.label}
                  </h4>
                  <p className="mt-1 text-xs text-neutral-500">{stat.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contrast Comparison Box: Traditional vs LifeLink */}
        <div className="max-w-4xl mx-auto bg-neutral-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
              The Critical Difference
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-1">
              Traditional Search vs LifeLink Pulse
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Way */}
            <div className="bg-neutral-800/80 rounded-2xl p-5 border border-neutral-700/60">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-4">
                <XCircle className="w-5 h-5 shrink-0" />
                <span>The Frantic Old Way (2 - 6 Hours)</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-neutral-300">
                <li className="flex items-start gap-2">
                  <span className="text-neutral-500">•</span>
                  <span>Panic calling family, friends, and WhatsApp forwards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-500">•</span>
                  <span>Spam numbers, expired contacts, non-eligible volunteers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-500">•</span>
                  <span>High risk of black-market touts preying on panic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neutral-500">•</span>
                  <span>Physical travel to distant blood banks without stock certainty</span>
                </li>
              </ul>
            </div>

            {/* The LifeLink Way */}
            <div className="bg-gradient-to-br from-red-950/40 to-neutral-800/90 rounded-2xl p-5 border border-red-500/30">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-4">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>The LifeLink Way (&lt; 15 Minutes)</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-neutral-200">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Instant 5km geospatial notification to verified matching donors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Aadhaar OTP + AI hospital document validation prevents scams</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>One-tap pledge with live hospital route navigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>100% voluntary, zero middlemen, strictly NBTC compliant</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
