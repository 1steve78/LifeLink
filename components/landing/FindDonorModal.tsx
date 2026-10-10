"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, MapPin, Droplet, CheckCircle2, ShieldCheck, Heart } from "lucide-react";

interface FindDonorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NearbyDonor {
  id: string;
  name: string;
  bloodGroup: string;
  distance: string;
  lastDonation: string;
  avatarUrl?: string;
  initials?: string;
  verified: boolean;
}

const mockNearbyDonors: NearbyDonor[] = [
  {
    id: "d1",
    name: "Rahul S.",
    bloodGroup: "O+",
    distance: "2.4 km away",
    lastDonation: "4 months ago (Eligible)",
    avatarUrl: "/images/rahul-avatar.jpg",
    verified: true,
  },
  {
    id: "d2",
    name: "Priya Menon",
    bloodGroup: "B+",
    distance: "3.1 km away",
    lastDonation: "5 months ago (Eligible)",
    initials: "PM",
    verified: true,
  },
  {
    id: "d3",
    name: "Vikram Teja",
    bloodGroup: "O-",
    distance: "4.8 km away",
    lastDonation: "3 months ago (Eligible)",
    initials: "VT",
    verified: true,
  },
  {
    id: "d4",
    name: "Dr. Ananya Roy",
    bloodGroup: "A+",
    distance: "5.2 km away",
    lastDonation: "6 months ago (Eligible)",
    initials: "AR",
    verified: true,
  },
];

export const FindDonorModal: React.FC<FindDonorModalProps> = ({ isOpen, onClose }) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [notifiedMap, setNotifiedMap] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const bloodGroups = ["All", "O+", "O-", "A+", "B+", "AB+"];

  const filtered =
    selectedGroup === "All"
      ? mockNearbyDonors
      : mockNearbyDonors.filter((d) => d.bloodGroup === selectedGroup);

  const handleNotify = (id: string) => {
    setNotifiedMap((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#C81E1E] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#C81E1E]" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">
                Find Verified Donors Near You
              </h3>
              <p className="text-xs text-neutral-500">
                Geospatial radar active within 5 km radius
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="px-6 py-4 bg-white border-b border-neutral-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-neutral-500 whitespace-nowrap">
            Filter Blood:
          </span>
          {bloodGroups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedGroup === group
                  ? "bg-[#C81E1E] text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {group}
            </button>
          ))}
        </div>

        {/* List of donors */}
        <div className="p-6 overflow-y-auto space-y-4">
          {filtered.map((donor) => {
            const isNotified = notifiedMap[donor.id];

            return (
              <div
                key={donor.id}
                className="bg-neutral-50/70 rounded-2xl p-4 border border-neutral-200/70 hover:border-red-200 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  {donor.avatarUrl ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-neutral-200 shrink-0">
                      <Image
                        src={donor.avatarUrl}
                        alt={donor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-red-100 text-[#C81E1E] font-bold text-sm flex items-center justify-center shrink-0 border border-red-200">
                      {donor.initials}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-neutral-900 text-sm">
                        {donor.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 bg-red-50 text-[#C81E1E] border border-red-200 text-xs font-bold px-2 py-0.5 rounded-full">
                        <Droplet className="w-2.5 h-2.5 fill-[#C81E1E]" />
                        {donor.bloodGroup}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        {donor.distance}
                      </span>
                      <span>•</span>
                      <span>{donor.lastDonation}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleNotify(donor.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isNotified
                        ? "bg-emerald-600 text-white"
                        : "bg-[#C81E1E] hover:bg-[#B01A1A] text-white shadow-xs"
                    }`}
                  >
                    {isNotified ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Notified</span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-3.5 h-3.5" />
                        <span>Notify Donor</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Identity and eligibility checked via UIDAI</span>
          </div>
          <button
            onClick={onClose}
            className="font-semibold text-neutral-700 hover:text-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindDonorModal;
