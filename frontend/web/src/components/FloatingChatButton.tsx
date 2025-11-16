"use client";

import { useState } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { AIChat } from "./AIChat";
import { useSession } from "next-auth/react";

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const userId = session?.user?.id ? Number(session.user.id) : 1;

  return (
    <>
      {/* Enhanced Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 sm:bottom-8 sm:right-8 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-[var(--sc-green)] via-[var(--sc-green)] to-[var(--sc-green-dark)] text-[var(--sc-cream)] shadow-2xl hover:shadow-[0_20px_60px_rgba(96,108,56,0.4)] transition-all duration-500 flex items-center justify-center group ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        style={{
          transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        }}
        aria-label="Open AI Chat"
      >
        {/* Pulsing Ring Effect */}
        <div className="absolute inset-0 rounded-full bg-[var(--sc-green)] animate-ping opacity-20" />
        
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
        
        {/* Icon */}
        <div className="relative">
          <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
        </div>
        
        {/* Notification Badge */}
        <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-gradient-to-br from-[var(--sc-gold)] to-[var(--sc-gold-dark)] rounded-full flex items-center justify-center border-2 border-white shadow-lg">
          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
        </span>
      </button>

      {/* Chat Modal with Enhanced Backdrop */}
      {isOpen && (
        <>
          {/* Backdrop with Blur */}
          <div
            className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-md transition-all duration-500"
            style={{
              animation: 'fadeIn 0.3s ease-out',
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Container with Smooth Entry */}
          <div 
            className="fixed bottom-8 right-8 w-[calc(100vw-2rem)] sm:w-[460px] h-[calc(100vh-4rem)] sm:h-[680px] max-h-[calc(100vh-4rem)]"
            style={{
              zIndex: 100,
              animation: 'slideInUp 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            }}
          >
            <AIChat userId={userId} onClose={() => setIsOpen(false)} isModal={true} />
          </div>
        </>
      )}
    </>
  );
}
