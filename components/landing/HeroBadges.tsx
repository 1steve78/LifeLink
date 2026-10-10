import React from "react";
import { ShieldCheck, Users, Brain, Zap } from "lucide-react";

interface HeroBadgeItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const HeroBadges: React.FC = () => {
  const items: HeroBadgeItem[] = [
    {
      icon: (
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#C81E1E] shrink-0 border border-red-100/60">
          <ShieldCheck className="w-5 h-5 stroke-[2]" />
        </div>
      ),
      title: "Verified Requests",
      description: "3-step verification",
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#C81E1E] shrink-0 border border-red-100/60">
          <Users className="w-5 h-5 stroke-[2]" />
        </div>
      ),
      title: "Real-Time Donors",
      description: "Location based matching",
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#C81E1E] shrink-0 border border-red-100/60">
          <Brain className="w-5 h-5 stroke-[2]" />
        </div>
      ),
      title: "AI Screening",
      description: "Fraud & risk detection",
    },
    {
      icon: (
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#C81E1E] shrink-0 border border-red-100/60">
          <Zap className="w-5 h-5 stroke-[2]" />
        </div>
      ),
      title: "Faster Help",
      description: "Push + SMS alerts",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-7 sm:pt-8 mt-1">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-2 group transition-transform hover:-translate-y-0.5"
        >
          {item.icon}
          <div className="min-w-0">
            <h4 className="text-[10px] sm:text-[11px] font-bold text-neutral-900 tracking-tight leading-tight group-hover:text-[#C81E1E] transition-colors">
              {item.title}
            </h4>
            <p className="text-[9px] sm:text-[10px] text-neutral-500 font-normal truncate mt-0.5">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HeroBadges;
