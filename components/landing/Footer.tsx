import React from "react";
import { BrandLogo } from "./BrandLogo";
import { Heart, PhoneCall, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-950 text-neutral-400 text-sm border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-neutral-800/80">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <BrandLogo className="brightness-125" />
            </div>
            <p className="mt-4 text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm">
              India&apos;s real-time emergency blood and platelet coordination platform.
              Powered by UIDAI-compliant verification, AI document vision, and geospatial donor dispatch.
            </p>

            <div className="mt-6 flex flex-col gap-2 text-xs text-neutral-300">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#C81E1E]" />
                <span>Emergency Helpline: 1800-LIFELINK (24/7 Toll Free)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C81E1E]" />
                <span>support@lifelink.org.in</span>
              </div>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a href="#hero" className="hover:text-white transition-colors">
                  Create Blood Request
                </a>
              </li>
              <li>
                <a href="#hero" className="hover:text-white transition-colors">
                  Find Nearby Donors
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#impact" className="hover:text-white transition-colors">
                  Impact & Statistics
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  Hospital Partner Network
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Safety & AI */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Verification Gates
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  Gate 1: Aadhaar OTP
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  Gate 2: Hospital Doc Vision
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  Gate 3: Claude AI Screening
                </a>
              </li>
              <li>
                <span className="text-neutral-500">Trafficking Prevention</span>
              </li>
              <li>
                <span className="text-neutral-500">NBTC Ethical Protocols</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Regulatory & Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Legal & Trust
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  NBTC Compliance
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  NOTTO Guidelines
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Zero Commercialization
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory Disclaimer Notice */}
        <div className="py-6 border-b border-neutral-900 text-neutral-500 text-[11px] leading-relaxed">
          <p>
            <strong className="text-neutral-400">Important Disclaimer:</strong> LifeLink is a voluntary coordination platform that bridges communication between genuine patient attendants and voluntary blood donors. LifeLink does not buy, sell, store, or broker blood or human organs. All donations are 100% voluntary and must take place at licensed hospital blood banks in accordance with the Drugs and Cosmetics Act, 1940 and National Blood Transfusion Council (NBTC) norms.
          </p>
        </div>

        {/* Bottom copyright row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} LifeLink Network. Built with</span>
            <Heart className="w-3.5 h-3.5 text-[#C81E1E] fill-[#C81E1E]" />
            <span>for human lives.</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
