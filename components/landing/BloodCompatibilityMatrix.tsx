"use client";

import React, { useState } from "react";
import { Droplet, ArrowUpRight, ArrowDownLeft, Info, Heart } from "lucide-react";

interface CompatibilityData {
  canDonateTo: string[];
  canReceiveFrom: string[];
  rarityIndia: string;
  badge?: string;
  notes: string;
}

const compatibilityMap: Record<string, CompatibilityData> = {
  "O-": {
    canDonateTo: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    canReceiveFrom: ["O-"],
    rarityIndia: "1.4%",
    badge: "Universal Red Cell Donor",
    notes:
      "O- is the emergency blood type used in trauma rooms when there is no time to test a patient's blood.",
  },
  "O+": {
    canDonateTo: ["O+", "A+", "B+", "AB+"],
    canReceiveFrom: ["O+", "O-"],
    rarityIndia: "32.5%",
    badge: "Most In-Demand Type",
    notes: "O+ red blood cells are needed daily for surgical and emergency transfusions.",
  },
  "A+": {
    canDonateTo: ["A+", "AB+"],
    canReceiveFrom: ["A+", "A-", "O+", "O-"],
    rarityIndia: "21.8%",
    badge: "Common & Essential",
    notes: "A+ is one of the most vital types for cancer and trauma patients.",
  },
  "A-": {
    canDonateTo: ["A+", "A-", "AB+", "AB-"],
    canReceiveFrom: ["A-", "O-"],
    rarityIndia: "0.9%",
    badge: "High Emergency Need",
    notes: "A- is scarce; rare blood emergency calls regularly seek A- donors.",
  },
  "B+": {
    canDonateTo: ["B+", "AB+"],
    canReceiveFrom: ["B+", "B-", "O+", "O-"],
    rarityIndia: "38.2%",
    badge: "Most Prevalent in India",
    notes: "B+ accounts for the single largest proportion of hospital blood requests in India.",
  },
  "B-": {
    canDonateTo: ["B+", "B-", "AB+", "AB-"],
    canReceiveFrom: ["B-", "O-"],
    rarityIndia: "1.1%",
    badge: "Very Rare Type",
    notes: "Due to scarcity, B- units are frequently needed for emergency replacement.",
  },
  "AB+": {
    canDonateTo: ["AB+"],
    canReceiveFrom: ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    rarityIndia: "3.7%",
    badge: "Universal Recipient & Plasma Hero",
    notes:
      "Can receive from any blood group. AB+ plasma is also universal and saves burn & trauma victims.",
  },
  "AB-": {
    canDonateTo: ["AB+", "AB-"],
    canReceiveFrom: ["AB-", "A-", "B-", "O-"],
    rarityIndia: "0.4%",
    badge: "Rarest Blood Group",
    notes: "Less than 1 in 200 people are AB-. Registering makes you a critical lifesaver.",
  },
};

const allGroups = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

interface BloodCompatibilityMatrixProps {
  onOpenDonorModal?: () => void;
}

export const BloodCompatibilityMatrix: React.FC<BloodCompatibilityMatrixProps> = ({
  onOpenDonorModal,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("O-");

  const current = compatibilityMap[selectedGroup];

  return (
    <section className="py-20 sm:py-24 bg-[#FFFBFB] border-t border-rose-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#C81E1E] text-xs font-semibold mb-3">
            <Heart className="w-3.5 h-3.5 fill-[#C81E1E]" />
            Compatibility Intelligence
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Who Can You Help Today?
          </h2>
          <p className="mt-3 text-neutral-600 text-sm sm:text-base">
            Select your blood group to see your biological lifesaving superpower and compatibility reach.
          </p>
        </div>

        {/* Group Selector Pill Grid */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap max-w-3xl mx-auto mb-10">
          {allGroups.map((group) => {
            const isSelected = selectedGroup === group;
            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  isSelected
                    ? "bg-[#C81E1E] text-white shadow-lg shadow-red-500/25 scale-105"
                    : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80"
                }`}
              >
                <Droplet
                  className={`w-3.5 h-3.5 ${isSelected ? "fill-white" : "fill-[#C81E1E] text-[#C81E1E]"}`}
                />
                <span>{group}</span>
              </button>
            );
          })}
        </div>

        {/* Compatibility Cards Grid */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-lg shadow-neutral-900/5">
          {/* Top highlight bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-[#C81E1E] font-black text-2xl shadow-xs">
                {selectedGroup}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-neutral-900">
                    Blood Group {selectedGroup}
                  </h3>
                  {current.badge && (
                    <span className="text-[11px] font-bold bg-red-50 text-[#C81E1E] px-2.5 py-0.5 rounded-full border border-red-100">
                      {current.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Prevalence in India: <span className="font-semibold text-neutral-800">{current.rarityIndia}</span> of population
                </p>
              </div>
            </div>

            <button
              onClick={onOpenDonorModal}
              className="px-5 py-2.5 rounded-xl bg-[#C81E1E] text-white text-xs sm:text-sm font-semibold hover:bg-[#B01A1A] transition-all shadow-xs self-start sm:self-center"
            >
              Register as {selectedGroup} Donor
            </button>
          </div>

          {/* Matrix Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            {/* Can Donate To */}
            <div className="bg-[#FFF9F9] rounded-2xl p-5 border border-red-100">
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <span>You Can Donate Red Cells To ({current.canDonateTo.length} Types)</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {current.canDonateTo.map((target) => (
                  <span
                    key={target}
                    className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 font-bold text-xs border border-emerald-200 shadow-2xs"
                  >
                    {target}
                  </span>
                ))}
              </div>
            </div>

            {/* Can Receive From */}
            <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200/70">
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 mb-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                </div>
                <span>You Can Receive Red Cells From ({current.canReceiveFrom.length} Types)</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {current.canReceiveFrom.map((source) => (
                  <span
                    key={source}
                    className="px-3 py-1.5 rounded-xl bg-white text-blue-800 font-bold text-xs border border-blue-200 shadow-2xs"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Clinical Note Footer */}
          <div className="mt-6 pt-5 border-t border-neutral-100 flex items-start gap-2.5 text-xs text-neutral-500">
            <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{current.notes}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BloodCompatibilityMatrix;
