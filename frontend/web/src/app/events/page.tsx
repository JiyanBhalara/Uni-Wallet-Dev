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
    <main className="space-y-4">
      <h1 className="text-xl md:text-2xl font-semibold">Campus Life</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {events.map((e) => (
          <Card
            key={e.id}
            className="bg-gradient-to-b from-[var(--sc-gold)] to-[var(--sc-gold-dark)] text-[var(--sc-cream)]"
          >
            <CardHeader className="border-none">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] opacity-80">
                  Event
                </p>
                <p className="text-sm font-semibold">{e.title}</p>
              </div>
              <span className="text-[0.75rem] font-semibold">
                {e.price === 0
                  ? "Free"
                  : `${e.currency} ${e.price.toFixed(2)}`}
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-[0.8rem] opacity-90">
                {new Date(e.startsAt).toLocaleDateString()} • {e.location}
              </p>
              <p className="mt-2 text-[0.75rem] opacity-85">
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
