import React from "react";
import Image from "next/image";
import { Quote, Star } from "lucide-react";

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: "Dr. Arvind Menon",
      role: "Head of Emergency Medicine, Max Healthcare",
      quote:
        "In critical trauma and post-partum hemorrhage, blood is needed within 20 minutes. LifeLink's 3-step verification eliminates fake calls and brings verified donors directly to our blood bank before it's too late.",
      tag: "Physician Endorsement",
      initials: "AM",
      avatarBg: "bg-blue-100 text-blue-700",
    },
    {
      name: "Ananya Deshmukh",
      role: "Daughter & Caregiver, New Delhi",
      quote:
        "When my father needed 3 units of rare B- blood for emergency surgery at 11 PM, panic set in. Through LifeLink, two verified donors reached the hospital within 35 minutes. They gave my dad a second chance at life.",
      tag: "Recipient Family",
      initials: "AD",
      avatarBg: "bg-rose-100 text-rose-700",
    },
    {
      name: "Rahul Sharma",
      role: "Regular O+ Donor (6 Donations via LifeLink)",
      quote:
        "Before LifeLink, I hesitated responding to WhatsApp forwards because many were expired or touts. LifeLink’s Aadhaar check and hospital document scan gave me 100% confidence. Knowing exactly where to go is empowering.",
      tag: "Verified LifeLink Donor",
      avatarUrl: "/images/rahul-avatar.jpg",
      initials: "RS",
    },
  ];

  return (
    <section id="about" className="py-20 sm:py-28 bg-[#FFFBFB] border-t border-rose-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#C81E1E]">
            STORIES OF HOPE
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">
            Real People. Real Minutes. Real Saves.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-600">
            Hear from the emergency doctors, families, and everyday heroes powering India&apos;s fastest emergency blood network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-neutral-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header: Star Rating & Tag */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-[#C81E1E] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                    {item.tag}
                  </span>
                </div>

                <Quote className="w-8 h-8 text-neutral-200 mb-3" />
                <p className="text-neutral-700 text-sm sm:text-[15px] leading-relaxed italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Author Row */}
              <div className="mt-8 pt-5 border-t border-neutral-100 flex items-center gap-3.5">
                {item.avatarUrl ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-neutral-200 shrink-0">
                    <Image
                      src={item.avatarUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full ${item.avatarBg} font-bold text-sm flex items-center justify-center shrink-0 border border-neutral-200`}
                  >
                    {item.initials}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm sm:text-base leading-tight">
                    {item.name}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
