"use client";

import React, { useState } from "react";
import { Droplet, MapPin, Building2 } from "lucide-react";

interface RequestItem {
  id: string;
  bloodGroup: string;
  unitsNeeded: number;
  hospital: string;
  city: string;
  urgency: "critical" | "urgent" | "moderate";
}

const mockRequests: RequestItem[] = [
  {
    id: "req-1",
    bloodGroup: "B+",
    unitsNeeded: 2,
    hospital: "City Care Hospital",
    city: "Connaught Place",
    urgency: "critical",
  },
  {
    id: "req-2",
    bloodGroup: "O-",
    unitsNeeded: 3,
    hospital: "Apex Super Specialty",
    city: "Koramangala",
    urgency: "critical",
  },
  {
    id: "req-3",
    bloodGroup: "A+",
    unitsNeeded: 1,
    hospital: "Apollo Health City",
    city: "Jubilee Hills",
    urgency: "urgent",
  },
  {
    id: "req-4",
    bloodGroup: "AB+",
    unitsNeeded: 2,
    hospital: "Fortis Escorts Institute",
    city: "Okhla",
    urgency: "urgent",
  },
];

export const LiveRequestsFeed: React.FC = () => {
  const [selectedBlood, setSelectedBlood] = useState<string>("All");

  const bloodFilters = ["All", "O-", "O+", "A+", "A-", "B+", "B-", "AB+"];

  const filteredRequests =
    selectedBlood === "All"
      ? mockRequests
      : mockRequests.filter((r) => r.bloodGroup === selectedBlood);

  return (
    <section className="py-20 sm:py-24 bg-white border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#C81E1E] text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-[#C81E1E] animate-ping" />
              Example request cards
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              A privacy-safe request preview
            </h2>
            <p className="mt-2 text-neutral-600 text-sm sm:text-base">
              Sample content only. Real requests are shared only after verification and moderator approval.
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

                  {/* Public request preview: no patient or requester identity. */}
                  <h3 className="font-bold text-neutral-900 text-base leading-snug group-hover:text-[#C81E1E] transition-colors">
                    Blood request
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-neutral-600">
                    <Building2 className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="truncate">{req.hospital}</span>
                  </div>

                  {/* Area only; never show an individual donor distance. */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      {req.city}
                    </span>
                  </div>

                  <div className="mt-3 inline-flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11px] font-semibold text-neutral-600">
                    Sample preview · not a live request
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
                  Live request links will appear here after that feature is available.
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
