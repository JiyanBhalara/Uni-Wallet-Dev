"use client";

import "./globals.css";
import { MainNav } from "@/components/main-nav";
import { Providers } from "@/components/providers";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, Wallet } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  // Hide navigation on landing page
  if (isLandingPage) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      {/* ===== MOBILE HEADER ===== */}
      <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-lg shadow-sm border-b border-[rgba(40,54,24,0.08)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 p-2">
              <Image src="/unipay-logo.png" alt="UniWallet" width={40} height={40} className="object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--sc-green-dark)] font-bold truncate leading-tight">
                UniWallet
              </p>
              <p className="text-xs text-[var(--sc-green)] truncate">
                Smarter Wallet, Smarter You
              </p>
            </div>
          </Link>

          {/* Mobile Menu Button */}
          {isAuthenticated && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--sc-green)]/5 hover:bg-[var(--sc-green)]/10 transition-colors duration-200 text-[var(--sc-green-dark)] cursor-pointer"
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
            <div className="flex gap-2">
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  className="text-[0.7rem] px-3 py-1.5 font-medium"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  variant="primary" 
                  className="text-[0.7rem] px-3 py-1.5 font-medium shadow-sm"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="mt-3 pt-3 border-t border-[rgba(40,54,24,0.08)] animate-in slide-in-from-top-2 fade-in duration-200">
            <MainNav />
          </div>
        )}
      </header>

      {/* ===== MOBILE MAIN CONTENT ===== */}
      <main className="md:hidden flex-1 p-3 sm:p-4 bg-gradient-to-br from-[var(--sc-cream)] via-[var(--sc-cream)] to-[#f5f1e3] min-h-screen">
        {children}
      </main>

      {/* ===== MOBILE FOOTER ===== */}
      <footer className="md:hidden pt-6 pb-4 px-3 sm:px-4 border-t border-[rgba(40,54,24,0.06)] bg-gradient-to-br from-[var(--sc-cream)] via-[var(--sc-cream)] to-[#f5f1e3]">
        <div className="flex flex-col items-center justify-between gap-3 text-center">
          <p className="text-xs text-[var(--sc-green)] font-medium">
            © 2025 UniWallet. Smarter Wallet, Smarter You.
          </p>
          <div className="flex items-center gap-4 text-xs">
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

      {/* ===== DESKTOP LAYOUT WITH SIDEBAR ===== */}
      <div className="hidden md:flex min-h-screen">
        {/* Left Sidebar */}
        {isAuthenticated && (
          <aside className="fixed left-0 top-0 h-screen w-64 bg-white/80 backdrop-blur-lg border-r border-[rgba(40,54,24,0.08)] p-4 flex flex-col">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 p-1.5">
                <Image src="/unipay-logo.png" alt="UniWallet" width={40} height={40} className="object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--sc-green-dark)] font-bold truncate leading-tight">
                  UniWallet
                </p>
                <p className="text-xs text-[var(--sc-green)] truncate">
                  Smarter Wallet, Smarter You
                </p>
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto">
              <MainNav />
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <div className={cn(
          "flex-1 flex flex-col",
          isAuthenticated ? "ml-64" : "ml-0"
        )}>
          {/* Desktop Header (for non-authenticated users) */}
          {!isAuthenticated && (
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg shadow-sm border-b border-[rgba(40,54,24,0.08)] px-6 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 p-1.5">
                    <Image src="/unipay-logo.png" alt="UniWallet" width={40} height={40} className="object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--sc-green-dark)] font-bold truncate leading-tight">
                      UniWallet
                    </p>
                    <p className="text-xs text-[var(--sc-green)] truncate">
                      Smarter Wallet, Smarter You
                    </p>
                  </div>
                </Link>

                <div className="flex gap-3">
                  <Link href="/login">
                    <Button 
                      variant="ghost" 
                      className="text-sm px-5 py-2.5 font-medium hover:bg-[var(--sc-green)]/5 transition-colors duration-200"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button 
                      variant="primary" 
                      className="text-sm px-5 py-2.5 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className="flex-1 p-6 bg-gradient-to-br from-[var(--sc-cream)] via-[var(--sc-cream)] to-[#f5f1e3]">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="mt-auto pt-8 pb-4 px-6 border-t border-[rgba(40,54,24,0.06)] bg-gradient-to-br from-[var(--sc-cream)] via-[var(--sc-cream)] to-[#f5f1e3]">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <p className="text-xs text-[var(--sc-green)] font-medium">
                © 2025 UniWallet. Smarter Wallet, Smarter You.
              </p>
              <div className="flex items-center gap-4 text-xs">
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

      {/* ===== FLOATING AI CHAT ===== */}
      {isAuthenticated && <FloatingChatButton />}
    </div>
  );
}
