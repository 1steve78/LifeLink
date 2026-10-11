import type { Metadata } from "next";
import localFont from "next/font/local";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
// NOTE: leaflet/dist/leaflet.css is intentionally NOT imported here.
// It is imported directly inside the individual map components (RequestMap, RequesterNearbyMap)
// that actually use Leaflet, so it is only loaded on pages that render those components.
import AppNavbar from "@/components/layout/AppNavbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Self-hosted via next/font — no render-blocking external request
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LifeLink — Emergency Blood & Platelet Support Network",
  description:
    "LifeLink connects blood requesters with verified donors in real-time, making emergency help faster, safer, and smarter using AI and location-based technology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${plusJakartaSans.variable} antialiased`}>
        <AppNavbar />
        {children}
      </body>
    </html>
  );
}

