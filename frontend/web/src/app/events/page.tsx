"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface EventItem {
  id: number;
  title: string;
  startsAt: string;
  location: string;
  price: number;
  currency: string;
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      if (!session?.user?.email) return;
      
      try {
        const data = await api.getEvents(session.user.email) as EventItem[];
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchEvents();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <main className="space-y-3 sm:space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[rgba(40,54,24,0.06)] rounded-xl w-48"></div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="h-32 bg-[rgba(40,54,24,0.06)] rounded-2xl"></div>
            <div className="h-32 bg-[rgba(40,54,24,0.06)] rounded-2xl"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-3 sm:space-y-4">
      <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">Campus Life</h1>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {events.map((e) => (
          <Card
            key={e.id}
            className="bg-gradient-to-b from-[var(--sc-gold)] to-[var(--sc-gold-dark)] text-[var(--sc-cream)]"
          >
            <CardHeader className="border-none">
              <div className="flex-1 min-w-0">
                <p className="text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.18em] opacity-80">
                  Event
                </p>
                <p className="text-xs sm:text-sm font-semibold truncate">{e.title}</p>
              </div>
              <span className="text-[0.7rem] sm:text-[0.75rem] font-semibold whitespace-nowrap">
                {e.price === 0
                  ? "Free"
                  : `${e.currency} ${e.price.toFixed(2)}`}
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-[0.75rem] sm:text-[0.8rem] opacity-90 truncate">
                {new Date(e.startsAt).toLocaleDateString()} • {e.location}
              </p>
              <p className="mt-2 text-[0.7rem] sm:text-[0.75rem] opacity-85">
                In final version, students can tap to pay and store tickets as
                passes in their wallet.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
