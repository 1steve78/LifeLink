import AuthPage from "@/components/auth/AuthPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In / Join | LifeLink",
  description: "Verified community donation platform connecting donors and patients.",
};

export default function LoginPage() {
  return <AuthPage />;
}
