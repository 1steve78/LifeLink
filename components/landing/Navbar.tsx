"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { Menu, X, ArrowRight } from "lucide-react";

interface NavbarProps {
  onOpenRequestModal?: () => void;
  onOpenDonorModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRequestModal,
  onOpenDonorModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "#hero", active: true },
    { label: "About", href: "#community", active: false },
    { label: "How It Works", href: "#how-it-works", active: false },
    { label: "Find Donors", href: "#services", active: false },
    { label: "Stories", href: "#companion", active: false },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <BrandLogo />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm tracking-normal transition-colors ${
                link.active
                  ? "text-[#E23B42] font-semibold"
                  : "text-neutral-600 hover:text-neutral-900 font-medium"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right CTA Actions: Exactly 'Get Started ->' */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={onOpenRequestModal}
            className="group px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#DC2626] to-[#E23B42] hover:opacity-95 rounded-full shadow-md shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <span>Get Started</span>
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 bg-white px-6 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-3 pb-4 border-b border-neutral-100">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 text-base ${
                  link.active ? "text-[#E23B42] font-semibold" : "text-neutral-700 font-medium"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRequestModal?.();
              }}
              className="w-full py-3 text-center text-sm font-semibold text-white bg-[#E23B42] rounded-full shadow-sm"
            >
              Create a Blood Request
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDonorModal?.();
              }}
              className="w-full py-3 text-center text-sm font-semibold text-neutral-800 bg-neutral-100 rounded-full"
            >
              Find Donors Near You
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
