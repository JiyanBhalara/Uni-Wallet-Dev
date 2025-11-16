"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, X, Loader2, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  userId?: number;
  onClose?: () => void;
  isModal?: boolean;
}

export function AIChat({ userId = 1, onClose, isModal = false }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm FinBot, your personal financial assistant. I can help you understand your spending patterns, give budget advice, and answer questions about your transactions. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Use the .NET API endpoint
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5266";
      
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Check if the response was successful
      if (data.success) {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "AI service error");
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${
        isModal
          ? "bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-[rgba(96,108,56,0.15)]"
          : "bg-white rounded-3xl shadow-lg border border-[rgba(96,108,56,0.1)]"
      }`}
      style={{
        backgroundImage: isModal 
          ? "radial-gradient(circle at top right, rgba(254,250,224,0.4) 0%, transparent 50%)"
          : "none"
      }}
    >
      {/* Header with Glass Effect */}
      <div className="relative px-4 sm:px-6 py-3 sm:py-4 border-b border-[rgba(96,108,56,0.1)] bg-gradient-to-r from-[var(--sc-green)]/95 via-[var(--sc-green)] to-[var(--sc-green-dark)]/95 rounded-t-3xl backdrop-blur-sm">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden rounded-t-3xl opacity-20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--sc-gold)] rounded-full blur-3xl transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--sc-cream)] rounded-full blur-2xl transform -translate-x-16 translate-y-16" />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--sc-gold)] rounded-xl sm:rounded-2xl blur-md opacity-40 animate-pulse" />
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--sc-cream)] to-white text-[var(--sc-green-dark)] flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-[var(--sc-cream)] flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                FinBot
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--sc-gold)] animate-pulse" />
              </h3>
              <p className="text-[10px] sm:text-xs text-[var(--sc-cream)]/90 font-medium">AI Financial Assistant</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-[var(--sc-cream)] hover:bg-white/20 rounded-xl transition-all duration-300 hover:rotate-90"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages with Custom Scrollbar */}
      <div 
        className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4 sm:space-y-6"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(96,108,56,0.3) transparent'
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: rgba(96,108,56,0.3);
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(96,108,56,0.5);
          }
        `}</style>
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 sm:gap-3 opacity-0 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
            style={{
              animation: `slideUp 0.4s ease-out ${index * 0.1}s forwards`,
            }}
          >
            {message.role === "assistant" && (
              <div className="relative flex-shrink-0 hidden xs:block">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] rounded-xl blur-sm opacity-30" />
                <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] text-[var(--sc-cream)] flex items-center justify-center shadow-md">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            )}
            <div
              className={`group max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-md transition-all duration-300 ${
                message.role === "user"
                  ? "bg-gradient-to-br from-[var(--sc-green)] via-[var(--sc-green)] to-[var(--sc-green-dark)] text-[var(--sc-cream)] hover:shadow-lg rounded-tr-sm"
                  : "bg-gradient-to-br from-white to-[var(--sc-cream)]/30 border border-[rgba(96,108,56,0.1)] text-[var(--sc-green-dark)] hover:shadow-lg hover:border-[rgba(96,108,56,0.2)] rounded-tl-sm"
              }`}
            >
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
              <span
                className={`text-[9px] sm:text-[10px] mt-1.5 sm:mt-2 block font-medium ${
                  message.role === "user"
                    ? "text-[var(--sc-cream)]/70"
                    : "text-[var(--sc-green)]/60"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {message.role === "user" && (
              <div className="relative flex-shrink-0 hidden xs:block">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--sc-gold)] to-[var(--sc-gold-dark)] rounded-xl blur-sm opacity-30" />
                <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-[var(--sc-gold)] to-[var(--sc-gold-dark)] text-white flex items-center justify-center shadow-md">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-2 sm:gap-3 justify-start">
            <div className="relative flex-shrink-0 hidden xs:block">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] rounded-xl blur-sm opacity-30 animate-pulse" />
              <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] text-[var(--sc-cream)] flex items-center justify-center shadow-md">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-[var(--sc-cream)]/30 border border-[rgba(96,108,56,0.1)] rounded-2xl rounded-tl-sm px-4 sm:px-5 py-2.5 sm:py-3 shadow-md">
              <div className="flex gap-1.5">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <div
                    key={i}
                    className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[var(--sc-green)]"
                    style={{
                      animation: `bounce 1s ease-in-out ${delay}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Modern Design */}
      <div className="p-3 sm:p-5 border-t border-[rgba(96,108,56,0.1)] bg-gradient-to-b from-transparent to-[var(--sc-cream)]/20 rounded-b-3xl">
        <div className="relative flex gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your finances..."
              className="w-full resize-none rounded-xl sm:rounded-2xl border-2 border-[rgba(96,108,56,0.15)] px-3 py-2.5 sm:px-4 sm:py-3.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent transition-all duration-300 bg-white text-[var(--sc-green-dark)] placeholder:text-[var(--sc-green)]/40 shadow-sm hover:shadow-md"
              rows={1}
              disabled={isLoading}
              style={{
                maxHeight: '120px',
              }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] text-[var(--sc-cream)] hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>
        <p className="text-[9px] sm:text-[10px] text-[var(--sc-green)]/50 mt-2 sm:mt-3 text-center font-medium hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 bg-[var(--sc-cream)] rounded text-[var(--sc-green-dark)] border border-[rgba(96,108,56,0.2)]">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-[var(--sc-cream)] rounded text-[var(--sc-green-dark)] border border-[rgba(96,108,56,0.2)]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
