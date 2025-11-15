"use client";

import "./globals.css";
import { MainNav } from "@/components/main-nav";
import { Providers } from "@/components/providers";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Wallet } from "lucide-react";
import { useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-[var(--sc-cream)] via-[var(--sc-cream)] to-[#f5f1e3] text-[var(--sc-green-dark)] antialiased">
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex justify-center px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
      <div className="w-full max-w-7xl space-y-4 sm:space-y-5 lg:space-y-6">
        
        {/* ===== HEADER ===== */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-sm border border-[rgba(40,54,24,0.08)] px-4 sm:px-5 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 group">
              <div className="h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--sc-green-dark)] to-[var(--sc-green)] text-[var(--sc-cream)] flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5" />
              </div>
              <div className="min-w-0 hidden xs:block">
                <p className="text-[0.65rem] sm:text-xs lg:text-sm uppercase tracking-[0.2em] text-[var(--sc-green-dark)] font-bold truncate leading-tight">
                  Smart Campus
                </p>
                <p className="text-[0.6rem] sm:text-[0.7rem] lg:text-xs text-[var(--sc-green)] truncate">
                  Rutgers Newark · HackFest 2025
                </p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center flex-1 justify-end">
              {isAuthenticated ? (
                <MainNav />
              ) : (
                <div className="flex gap-2 lg:gap-3">
                  <Link href="/login">
                    <Button 
                      variant="ghost" 
                      className="text-xs lg:text-sm px-4 lg:px-5 py-2 lg:py-2.5 font-medium hover:bg-[var(--sc-green)]/5 transition-colors duration-200"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button 
                      variant="primary" 
                      className="text-xs lg:text-sm px-4 lg:px-5 py-2 lg:py-2.5 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--sc-green)]/5 hover:bg-[var(--sc-green)]/10 transition-colors duration-200 text-[var(--sc-green-dark)] cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Mobile Auth Buttons (when not authenticated) */}
            {!isAuthenticated && (
              <div className="flex md:hidden gap-2">
                <Link href="/login">
                  <Button 
                    variant="ghost" 
                    className="text-[0.7rem] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 font-medium"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    variant="primary" 
                    className="text-[0.7rem] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 font-medium shadow-sm"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation Menu */}
          {isAuthenticated && mobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-[rgba(40,54,24,0.08)] animate-in slide-in-from-top-2 fade-in duration-200">
              <MainNav />
            </div>
          )}
        </header>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1">
          {children}
        </main>

        {/* ===== FOOTER ===== */}
        <footer className="mt-auto pt-6 sm:pt-8 pb-4 border-t border-[rgba(40,54,24,0.06)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
            <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)] font-medium">
              © 2025 Smart Campus Wallet. Built for HackFest 2025.
            </p>
            <div className="flex items-center gap-3 sm:gap-4 text-[0.7rem] sm:text-xs">
              <Link 
                href="/privacy" 
                className="text-[var(--sc-green)] hover:text-[var(--sc-green-dark)] transition-colors duration-200 font-medium"
              >
                Privacy
              </Link>
              <Link 
                href="/terms" 
                className="text-[var(--sc-green)] hover:text-[var(--sc-green-dark)] transition-colors duration-200 font-medium"
              >
                Terms
              </Link>
              <Link 
                href="/support" 
                className="text-[var(--sc-green)] hover:text-[var(--sc-green-dark)] transition-colors duration-200 font-medium"
              >
                Support
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
