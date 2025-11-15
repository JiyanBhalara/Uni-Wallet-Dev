import type { Metadata } from "next";
import "./globals.css";
import { MainNav } from "@/components/main-nav";

export const metadata: Metadata = {
  title: "Smart Campus Wallet",
  description: "Campus payments, budgets and life in one place",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[var(--sc-cream)] text-[var(--sc-green-dark)]">
        <div className="min-h-screen flex justify-center px-3 sm:px-4 py-3 sm:py-4 md:py-6">
          <div className="w-full max-w-6xl space-y-3 sm:space-y-4">
            {/* Top bar with logo + nav */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 pb-2 sm:pb-2 border-b border-[rgba(40,54,24,0.08)]">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl sm:rounded-2xl bg-[var(--sc-green-dark)] text-[var(--sc-cream)] flex items-center justify-center text-[0.65rem] sm:text-xs font-semibold shadow">
                  SC
                </div>
                <div className="min-w-0">
                  <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.22em] text-[var(--sc-green)] truncate">
                    Smart Campus Wallet
                  </p>
                  <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] truncate">
                    Rutgers Newark · HackFest 2025
                  </p>
                </div>
              </div>
              <MainNav />
            </header>

            {/* Page content */}
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
