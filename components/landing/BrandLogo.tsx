import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", size = "md" }) => {
  const iconSize = size === "sm" ? "w-6 h-6" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const textSize = size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl";

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 group transition-transform active:scale-95 ${className}`}
    >
      <div className={`relative flex items-center justify-center ${iconSize}`}>
        {/* Stylized Blood Drop Icon */}
        <svg
          viewBox="0 0 32 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        >
          {/* Main Drop Shadow & Shape */}
          <path
            d="M16 2C16 2 4 15.5 4 23.5C4 30.1274 9.37258 35 16 35C22.6274 35 28 30.1274 28 23.5C28 15.5 16 2 16 2Z"
            fill="#C81E1E"
          />
          {/* Soft inner glow / depth */}
          <path
            d="M16 4C16 4 6 16.5 6 23.5C6 29.0228 10.4772 33.5 16 33.5C21.5228 33.5 26 29.0228 26 23.5C26 16.5 16 4 16 4Z"
            fill="url(#paint0_linear)"
          />
          {/* Subtle highlight glare on the left curve */}
          <path
            d="M10.5 18C9.5 20.5 9.5 24.5 11.5 27"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
          <defs>
            <linearGradient
              id="paint0_linear"
              x1="16"
              y1="4"
              x2="16"
              y2="33.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#E02424" />
              <stop offset="1" stopColor="#9B1C1C" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <span
        className={`font-black tracking-tight text-neutral-900 ${textSize} select-none`}
      >
        Life<span className="text-[#C81E1E]">Link</span>
      </span>
    </Link>
  );
};

export default BrandLogo;
