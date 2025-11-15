import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Wallet {
  id: number;
  userId: number;
  type: number;
  displayName: string;
  balance: number;
  currency: string;
  isPrimary: boolean;
}

function walletTypeLabel(type: number): string {
  switch (type) {
    case 0:
      return "Campus Wallet";
    case 1:
      return "Meal Plan";
    case 2:
      return "Dining Dollars";
    case 3:
      return "Linked Bank";
    default:
      return "Wallet";
  }
}

export default async function WalletsPage() {
  const wallets = (await api.getWallets()) as Wallet[];

  return (
    <main className="space-y-3 sm:space-y-4">
      <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">
        Your wallets & balances
      </h1>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {wallets.map((w) => (
          <Card key={w.id}>
            <CardHeader>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--sc-green)]">
                  {walletTypeLabel(w.type)}
                </p>
                <p className="text-sm font-semibold text-[var(--sc-green-dark)]">
                  {w.displayName}
                </p>
              </div>
              {w.isPrimary && (
                <span className="text-[0.7rem] rounded-full bg-[rgba(40,54,24,0.08)] px-3 py-1">
                  Default
                </span>
              )}
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div>
                <p className="text-[0.7rem] text-[var(--sc-green)]">Balance</p>
                <p className="text-xl font-semibold text-[var(--sc-gold-dark)]">
                  {w.currency === "SWIPES"
                    ? `${w.balance} swipes`
                    : `${w.currency} ${w.balance.toFixed(2)}`}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
