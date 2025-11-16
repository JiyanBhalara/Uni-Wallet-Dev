import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RewardsPage() {
  // placeholder values (later: fetch from backend)
  const points = 320;
  const tier = "Silver";
  const nextTierAt = 500;
  const progress = Math.min(100, (points / nextTierAt) * 100);

  return (
    <main className="space-y-3 sm:space-y-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Rewards</h1>
      <Card className="bg-[var(--sc-green-dark)] text-[var(--sc-cream)]">
        <CardHeader>
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-[rgba(254,250,224,0.7)]">
              Wallet Rewards
            </p>
            <p className="text-sm sm:text-base font-semibold">Your progress</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between mb-3 sm:mb-4 gap-3">
            <div>
              <p className="text-xs sm:text-sm text-[rgba(254,250,224,0.7)]">
                Current points
              </p>
              <p className="text-3xl sm:text-4xl font-semibold">{points}</p>
            </div>
            <div className="text-right text-xs sm:text-sm text-[rgba(254,250,224,0.8)]">
              <p>Tier: {tier}</p>
              <p className="whitespace-nowrap">Next: {nextTierAt} pts</p>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-[rgba(254,250,224,0.18)] overflow-hidden mb-2">
            <div
              className="h-full bg-[var(--sc-gold)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs sm:text-sm text-[rgba(254,250,224,0.85)]">
            {nextTierAt - points} points to reach the next level. Earn more by
            paying on-campus and joining events.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
