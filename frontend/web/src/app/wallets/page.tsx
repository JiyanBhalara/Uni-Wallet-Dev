"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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

export default function WalletsPage() {
  const { data: session, status } = useSession();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWallets() {
      if (!session?.user?.email) return;
      
      try {
        const data = await api.getWallets(session.user.email) as Wallet[];
        setWallets(data);
      } catch (error) {
        console.error("Failed to fetch wallets:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchWallets();
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
