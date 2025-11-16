// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Wallet, Sparkles, TrendingUp } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // If user is already logged in, show landing page for 3 seconds then redirect to dashboard
    if (status === "authenticated") {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Otherwise, show loading animation and redirect to signup after 2 seconds
    if (status === "unauthenticated") {
      const timer = setTimeout(() => {
        router.push("/signup");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [router, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--sc-green-dark)] via-[#2a3d1a] to-[var(--sc-green-dark)]">
      <div className="text-center px-6">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--sc-gold)] rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
              <Wallet className="w-16 h-16 text-[var(--sc-green-dark)]" />
            </div>
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          Uni<span className="text-[var(--sc-gold)]">Wallet</span>
        </h1>
        <p className="text-xl md:text-2xl text-[var(--sc-cream)] mb-8 font-light">
          Smarter Wallet, Smarter You
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Sparkles className="w-4 h-4 text-[var(--sc-gold)]" />
            <span className="text-sm text-white">Smart Rewards</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <TrendingUp className="w-4 h-4 text-[var(--sc-gold)]" />
            <span className="text-sm text-white">Budget Insights</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Wallet className="w-4 h-4 text-[var(--sc-gold)]" />
            <span className="text-sm text-white">Campus Payments</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--sc-gold)] to-yellow-300 rounded-full animate-loading-bar"></div>
          </div>
          <p className="text-sm text-[var(--sc-cream)]/70">Loading your experience...</p>
        </div>
      </div>
      <style jsx>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
