import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", size = "md" }) => {
  const dotScale = size === "sm" ? "scale-75" : size === "lg" ? "scale-125" : "";
  const textSize = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 group transition-transform active:scale-95 ${className}`}
    >
      <div className={`flex items-center gap-1.5 shrink-0 ${dotScale}`}>
        <div className="w-2.5 h-2.5 rounded-full bg-[#E23B42] group-hover:scale-110 transition-transform" />
        <div className="w-3.5 h-3.5 rounded-full bg-[#E23B42] group-hover:scale-110 transition-transform" />
      </div>

      <div className="flex flex-col">
        <span className={`font-bold ${textSize} text-neutral-900 tracking-tight leading-none`}>
          Life<span className="text-[#E23B42]">Link</span>
        </span>
        <span className="text-[10px] text-neutral-500 font-normal tracking-tight mt-0.5">
          Verified Community Donation Platform
        </span>
      </div>
    </Link>
  );
};

export default BrandLogo;
