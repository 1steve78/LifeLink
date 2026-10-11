import React from "react";
import Link from "next/link";
import { Heart, Mail, PhoneCall } from "lucide-react";

const footerLinks = [
  { label: "Home", href: "#hero" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Safety", href: "#services" },
  { label: "Our impact", href: "#impact" },
  { label: "Join LifeLink", href: "/login" },
];

export const Footer: React.FC = () => {
  return (
    <footer className="relative isolate bg-transparent px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8">
      <div
        className="relative mx-auto min-h-[390px] max-w-[1440px] overflow-hidden rounded-[2rem] border border-white/20 px-7 pb-5 pt-8 shadow-[0_30px_70px_rgba(0,0,0,0.2)] sm:min-h-[430px] sm:px-10 sm:pt-10 lg:px-12"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 12% 100%, rgba(113, 58, 255, 0.75), transparent 45%), radial-gradient(ellipse at 45% 110%, rgba(236, 40, 132, 0.72), transparent 48%), radial-gradient(ellipse at 78% 105%, rgba(255, 116, 73, 0.68), transparent 45%), radial-gradient(ellipse at 100% 100%, rgba(255, 218, 105, 0.72), transparent 40%), linear-gradient(112deg, #5623bd 0%, #a523b4 28%, #d52b77 52%, #e65c4c 74%, #d6ab52 100%)",
        }}
      >
        <div className="relative z-10 flex flex-col justify-between gap-10 sm:flex-row sm:gap-8">
          <nav aria-label="Footer navigation">
            <ul className="space-y-2">
              {footerLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-lg font-medium tracking-[-0.03em] text-white/90 transition-colors hover:text-white sm:text-xl"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-5 text-left text-sm text-white/75 sm:items-end sm:text-right">
            <div className="flex flex-col gap-3">
              <a
                href="mailto:support@lifelink.org.in"
                className="inline-flex items-center gap-2 transition-colors hover:text-white sm:justify-end"
              >
                <Mail className="h-4 w-4 text-white/90" aria-hidden="true" />
                support@lifelink.org.in
              </a>
              <a
                href="tel:1800543354655"
                className="inline-flex items-center gap-2 transition-colors hover:text-white sm:justify-end"
              >
                <PhoneCall className="h-4 w-4 text-white/90" aria-hidden="true" />
                1800-LIFELINK · 24/7 toll free
              </a>
            </div>
            <p className="max-w-sm leading-relaxed text-white/80">
              India&apos;s emergency blood and platelet coordination platform.
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[-0.12em] select-none whitespace-nowrap text-center text-[clamp(5rem,22vw,20rem)] font-semibold leading-[0.78] tracking-[-0.085em] text-white/[0.075]"
        >
          LifeLink
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-2 pb-2 pt-6 text-[11px] leading-relaxed text-neutral-600 sm:px-4 sm:pt-7">
        <div className="flex flex-col gap-2 border-t border-neutral-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1.5 text-neutral-600">
            © {new Date().getFullYear()} LifeLink Network. Built with
            <Heart
              className="h-3.5 w-3.5 fill-[#FD113F] text-[#FD113F]"
              aria-hidden="true"
            />
            for human lives.
          </span>
          <span className="inline-flex items-center gap-2 text-emerald-700">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
