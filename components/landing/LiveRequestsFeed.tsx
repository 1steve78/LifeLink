"use client";

import React, { useState } from "react";
import { Droplet, MapPin, Clock, Building2, ShieldCheck, Heart, Share2, Check } from "lucide-react";

interface RequestItem {
  id: string;
  patientName: string;
  bloodGroup: string;
  unitsNeeded: number;
  hospital: string;
  city: string;
  distance: string;
  urgency: "critical" | "urgent" | "moderate";
  timeAgo: string;
  verified: boolean;
  pledgesCount: number;
}

const mockRequests: RequestItem[] = [
  {
    id: "req-1",
    patientName: "Aarav Sharma (ICU Ward 4)",
    bloodGroup: "B+",
    unitsNeeded: 2,
    hospital: "City Care Hospital",
    city: "Connaught Place",
    distance: "2.8 km",
    urgency: "critical",
    timeAgo: "2 mins ago",
    verified: true,
    pledgesCount: 1,
  },
  {
    id: "req-2",
    patientName: "Meera Kulkarni (Emergency OT)",
    bloodGroup: "O-",
    unitsNeeded: 3,
    hospital: "Apex Super Specialty",
    city: "Koramangala",
    distance: "4.1 km",
    urgency: "critical",
    timeAgo: "7 mins ago",
    verified: true,
    pledgesCount: 2,
  },
  {
    id: "req-3",
    patientName: "Deepak Verma (Post-Op Care)",
    bloodGroup: "A+",
    unitsNeeded: 1,
    hospital: "Apollo Health City",
    city: "Jubilee Hills",
    distance: "5.6 km",
    urgency: "urgent",
    timeAgo: "14 mins ago",
    verified: true,
    pledgesCount: 0,
  },
  {
    id: "req-4",
    patientName: "Pooja Nair (Platelet Apheresis)",
    bloodGroup: "AB+",
    unitsNeeded: 2,
    hospital: "Fortis Escorts Institute",
    city: "Okhla",
    distance: "6.2 km",
    urgency: "urgent",
    timeAgo: "22 mins ago",
    verified: true,
    pledgesCount: 1,
  },
];

export const LiveRequestsFeed: React.FC = () => {
  const [selectedBlood, setSelectedBlood] = useState<string>("All");
  const [pledgedIds, setPledgedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const bloodFilters = ["All", "O-", "O+", "A+", "A-", "B+", "B-", "AB+"];

  const filteredRequests =
    selectedBlood === "All"
      ? mockRequests
      : mockRequests.filter((r) => r.bloodGroup === selectedBlood);

  const handlePledge = (id: string) => {
    setPledgedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleShare = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="py-20 sm:py-24 bg-white border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#C81E1E] text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-[#C81E1E] animate-ping" />
              Live Emergency Pulse
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              Urgent Requests in Your Radius
            </h2>
            <p className="mt-2 text-neutral-600 text-sm sm:text-base">
              Verified clinical demands matching nearby active donors right now.
            </p>
          </div>

          {/* Blood Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {bloodFilters.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedBlood(group)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedBlood === group
                    ? "bg-[#C81E1E] text-white shadow-sm shadow-red-500/20"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70"
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredRequests.map((req) => {
            const isPledged = pledgedIds[req.id];

            return (
              <div
                key={req.id}
                className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs hover:shadow-xl hover:border-red-200 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Blood Group Pill & Urgency */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1.5 bg-red-50 text-[#C81E1E] border border-red-200/70 rounded-full px-3 py-1 font-bold text-sm">
                      <Droplet className="w-3.5 h-3.5 fill-[#C81E1E]" />
                      <span>{req.bloodGroup}</span>
                      <span className="text-[11px] font-normal text-red-600/80 ml-0.5">
                        ({req.unitsNeeded} units)
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        req.urgency === "critical"
                          ? "bg-red-100/80 text-red-700 animate-pulse"
                          : "bg-amber-100/80 text-amber-700"
                      }`}
                    >
                      {req.urgency}
                    </span>
                  </div>

                  {/* Patient & Hospital */}
                  <h3 className="font-bold text-neutral-900 text-base leading-snug group-hover:text-[#C81E1E] transition-colors">
                    {req.patientName}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-neutral-600">
                    <Building2 className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="truncate">{req.hospital}</span>
                  </div>

                  {/* Distance & Time */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      {req.distance} • {req.city}
                    </span>
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Clock className="w-3 h-3" />
                      {req.timeAgo}
                    </span>
                  </div>

                  {/* Verification Pill */}
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>3-Gate Clinical Verified</span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center gap-2">
                  <button
                    onClick={() => handlePledge(req.id)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isPledged
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-[#C81E1E] hover:bg-[#B01A1A] text-white shadow-xs"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isPledged ? "fill-white" : ""}`} />
                    <span>{isPledged ? "Pledge Sent!" : "Pledge to Donate"}</span>
                  </button>

                  <button
                    onClick={() => handleShare(req.id)}
                    title="Share Request"
                    className="p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors"
                  >
                    {copiedId === req.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LiveRequestsFeed;
