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

export default async function EventsPage() {
  const events = (await api.getEvents()) as EventItem[];

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
