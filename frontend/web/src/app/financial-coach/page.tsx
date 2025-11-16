"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Send,
  Loader2,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Message {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

export default function FinancialCoachPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userId, setUserId] = useState<number>(1);
  const [isPlanGenerated, setIsPlanGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.id) {
      setUserId(Number(session.user.id));
    }
  }, [status, session, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateFinancialPlan = async () => {
    setIsGenerating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5266";
      
      const response = await fetch(`${API_URL}/api/financial-plan/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate financial plan");
      }

      const data = await response.json();

      if (data.success) {
        const planMessage: Message = {
          role: "assistant",
          content: data.plan,
          timestamp: new Date(),
        };
        setMessages([planMessage]);
        setIsPlanGenerated(true);
      } else {
        throw new Error(data.error || "Failed to generate plan");
      }
    } catch (error) {
      console.error("Error generating financial plan:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I couldn't generate your financial plan right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendMessage = async () => {
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5266";
      
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(`${API_URL}/api/financial-plan/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          message: userMessage.content,
          conversationHistory
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

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
        content: "Sorry, I couldn't process your question. Please try again.",
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
      sendMessage();
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--sc-green)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--sc-cream)] via-white to-[var(--sc-cream)] p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href="/">
            <Button
              variant="ghost"
              className="text-[var(--sc-green-dark)] hover:bg-white/70 rounded-xl transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {!isPlanGenerated && !isGenerating ? (
          /* Welcome Screen */
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 text-center px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--sc-green)] rounded-full blur-3xl opacity-20 animate-pulse" />
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] flex items-center justify-center shadow-2xl">
                <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-[var(--sc-cream)]" />
              </div>
            </div>

            <div className="space-y-4 max-w-2xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--sc-green-dark)] flex items-center justify-center gap-3 flex-wrap">
                AI Financial Coach
                <Sparkles className="h-8 w-8 text-[var(--sc-gold)]" />
              </h1>
              
              <p className="text-base sm:text-lg text-[var(--sc-green)]/80 leading-relaxed">
                Your Personal Financial Guide to Smart Money Management
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8">
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[rgba(96,108,56,0.1)]">
                  <TrendingUp className="h-8 w-8 text-[var(--sc-green)] mb-3 mx-auto" />
                  <h3 className="font-semibold text-[var(--sc-green-dark)] mb-2">Spending Analysis</h3>
                  <p className="text-sm text-[var(--sc-green)]/70">Deep insights into your spending patterns</p>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[rgba(96,108,56,0.1)]">
                  <Target className="h-8 w-8 text-[var(--sc-green)] mb-3 mx-auto" />
                  <h3 className="font-semibold text-[var(--sc-green-dark)] mb-2">Personalized Goals</h3>
                  <p className="text-sm text-[var(--sc-green)]/70">Tailored financial recommendations</p>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[rgba(96,108,56,0.1)]">
                  <Lightbulb className="h-8 w-8 text-[var(--sc-green)] mb-3 mx-auto" />
                  <h3 className="font-semibold text-[var(--sc-green-dark)] mb-2">Smart Tips</h3>
                  <p className="text-sm text-[var(--sc-green)]/70">Actionable money-saving strategies</p>
                </div>
              </div>
            </div>

            <Button
              onClick={generateFinancialPlan}
              className="bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] text-[var(--sc-cream)] hover:shadow-2xl hover:scale-105 transition-all duration-300 px-8 py-6 text-lg rounded-2xl"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Generate My Financial Plan
            </Button>

            <p className="text-sm text-[var(--sc-green)]/60 max-w-md">
              Based on your budget, recent transactions, and spending habits, 
              I'll create a comprehensive financial plan just for you! 💰
            </p>
          </div>
        ) : isGenerating ? (
          /* Generating State */
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--sc-green)] rounded-full blur-2xl opacity-30 animate-pulse" />
              <Loader2 className="relative h-16 w-16 sm:h-20 sm:w-20 animate-spin text-[var(--sc-green)]" />
            </div>
            
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--sc-green-dark)]">
                Generating Your Financial Plan...
              </h2>
              <p className="text-[var(--sc-green)]/70 max-w-md mx-auto px-4">
                Analyzing your spending patterns, budgets, and transactions to create 
                a personalized financial roadmap for you. This may take a moment.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-6">
              {["Analyzing spending", "Reviewing budgets", "Creating recommendations"].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-[rgba(96,108,56,0.1)]"
                  style={{
                    animation: `pulse 2s ease-in-out ${i * 0.3}s infinite`
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 text-[var(--sc-green)]" />
                  <span className="text-sm text-[var(--sc-green-dark)]">{step}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <div className="bg-white rounded-3xl shadow-xl border border-[rgba(96,108,56,0.1)] overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[var(--sc-green)] to-[var(--sc-green-dark)] px-4 sm:px-6 py-4 text-[var(--sc-cream)]">
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 sm:h-8 sm:w-8" />
                <div>
                  <h2 className="font-bold text-lg sm:text-xl">Your Financial Plan</h2>
                  <p className="text-xs sm:text-sm opacity-90">Ask me anything about your plan!</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[calc(100vh-20rem)] sm:h-[600px] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] text-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 shadow-md ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] text-[var(--sc-cream)]"
                        : "bg-gradient-to-br from-[var(--sc-cream)] to-white border border-[rgba(96,108,56,0.1)] text-[var(--sc-green-dark)]"
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <span className={`text-[9px] sm:text-[10px] mt-2 block ${
                      message.role === "user" ? "text-[var(--sc-cream)]/70" : "text-[var(--sc-green)]/60"
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {message.role === "user" && (
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[var(--sc-gold)] to-[var(--sc-gold-dark)] text-white flex items-center justify-center flex-shrink-0 shadow-md text-xs sm:text-sm font-bold">
                      {session?.user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="bg-gradient-to-br from-[var(--sc-cream)] to-white border border-[rgba(96,108,56,0.1)] rounded-2xl px-5 py-3 shadow-md">
                    <div className="flex gap-1.5">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <div
                          key={i}
                          className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[var(--sc-green)]"
                          style={{ animation: `bounce 1s ease-in-out ${delay}s infinite` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-[rgba(96,108,56,0.1)] bg-[var(--sc-cream)]/30">
              <div className="flex gap-2 sm:gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about your financial plan..."
                  className="flex-1 resize-none rounded-xl sm:rounded-2xl border-2 border-[rgba(96,108,56,0.15)] px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent transition-all bg-white text-[var(--sc-green-dark)] placeholder:text-[var(--sc-green)]/40"
                  rows={1}
                  disabled={isLoading}
                  style={{ maxHeight: "120px" }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--sc-green)] to-[var(--sc-green-dark)] text-[var(--sc-cream)] hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
