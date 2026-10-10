"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { Menu, X, HeartHandshake } from "lucide-react";

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
    { label: "How It Works", href: "#how-it-works", active: false },
    { label: "Impact", href: "#impact", active: false },
    { label: "About", href: "#about", active: false },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <BrandLogo />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-9">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-xs lg:text-[13px] font-medium transition-colors ${
                link.active
                  ? "text-[#C81E1E] font-semibold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200/80 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-xs"
          >
            Sign In
          </Link>
          <button
            onClick={onOpenRequestModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#C81E1E] rounded-xl hover:bg-[#B01A1A] active:scale-95 transition-all shadow-sm shadow-red-500/20 flex items-center gap-1.5"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-neutral-200 bg-white px-5 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col space-y-3 pb-4 border-b border-neutral-100">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`py-2 text-base font-medium ${
                  link.active ? "text-[#C81E1E] font-semibold" : "text-neutral-700"
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
              className="w-full py-3 text-center text-sm font-semibold text-white bg-[#C81E1E] rounded-xl shadow-sm"
            >
              Create a Blood Request
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDonorModal?.();
              }}
              className="w-full py-3 text-center text-sm font-semibold text-neutral-800 bg-neutral-100 rounded-xl flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-4 h-4 text-[#C81E1E]" />
              Find Donors Near You
            </button>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
