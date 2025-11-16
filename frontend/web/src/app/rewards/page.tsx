"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Trophy,
  TrendingUp,
  Gift,
  Calendar,
  MapPin,
  DollarSign,
  Sparkles,
  ArrowRight,
  Wallet as WalletIcon,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RewardsBalance {
  points: number;
  tier: string;
  nextTierAt: number;
}

interface RewardEvent {
  id: number;
  userId: number;
  occurredAt: string;
  pointsDelta: number;
  reason: string;
}

interface RecommendedEvent {
  id: number;
  eventCode: string;
  name: string;
  category: string;
  location: string;
  startTime: string;
  endTime: string;
  cost: number;
  recommendationReason: string;
}

interface WalletItem {
  id: number;
  type: number;
  displayName: string;
  balance: number;
  currency: string;
}

export default function RewardsPage() {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState<RewardsBalance | null>(null);
  const [history, setHistory] = useState<RewardEvent[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedEvent[]>([]);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [rsvping, setRsvping] = useState<number | null>(null);

  const userEmail = session?.user?.email ?? "";

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    if (!userEmail) return;
    try {
      const [balanceData, historyData, recommendationsData, walletsData] = await Promise.all([
        api.getRewardsBalance(userEmail),
        api.getRewardsHistory(userEmail),
        api.getRecommendedEvents(userEmail),
        api.getWallets(userEmail),
      ]);
      setBalance(balanceData);
      setHistory(historyData);
      setRecommendations(recommendationsData);
      // Filter out meal plan and dining dollars
      setWallets(walletsData.filter((w: WalletItem) => w.type !== 1 && w.type !== 2));
    } catch (error) {
      console.error("Failed to fetch rewards data:", error);
      showToast("Failed to load rewards data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userEmail]);

  const handleRedeem = async () => {
    if (!userEmail || !selectedWalletId || !redeemAmount) return;

    const points = parseInt(redeemAmount);
    if (isNaN(points) || points < 10) {
      showToast("Minimum redemption is 10 points", "error");
      return;
    }

    if (balance && points > balance.points) {
      showToast("Insufficient points", "error");
      return;
    }

    setRedeeming(true);
    try {
      const result = await api.redeemPoints(userEmail, selectedWalletId, points);
      showToast(
        `Successfully redeemed ${result.pointsRedeemed} points for $${result.cashbackAmount.toFixed(2)}!`,
        "success"
      );
      setShowRedeemModal(false);
      setRedeemAmount("");
      await fetchData();
    } catch (error) {
      console.error("Redemption failed:", error);
      showToast("Redemption failed. Please try again.", "error");
    } finally {
      setRedeeming(false);
    }
  };

  const handleRsvp = async (eventId: number) => {
    if (!userEmail) return;
    setRsvping(eventId);
    try {
      await api.rsvpEvent(eventId, userEmail);
      showToast("Successfully RSVPed!", "success");
      // Remove from recommendations
      setRecommendations((prev) => prev.filter((e) => e.id !== eventId));
      await fetchData();
    } catch (error) {
      console.error("RSVP failed:", error);
      showToast("RSVP failed. Please try again.", "error");
    } finally {
      setRsvping(null);
    }
  };

  if (loading) {
    return (
      <main className="space-y-3 sm:space-y-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Rewards</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--sc-green-dark)] mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading your rewards...</p>
          </div>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="space-y-3 sm:space-y-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Rewards</h1>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-600">Please sign in to view your rewards.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const progress = balance ? Math.min(100, (balance.points / balance.nextTierAt) * 100) : 0;
  const cashbackValue = balance ? (balance.points / 10).toFixed(2) : "0.00";

  return (
    <main className="space-y-4 sm:space-y-6 pb-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg animate-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          <p className="font-medium">{toast.message}</p>
        </div>
      )}

      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Rewards</h1>

      {/* Points Overview Card */}
      <Card className="bg-gradient-to-br from-[var(--sc-green-dark)] via-[#2a3d1a] to-[var(--sc-green-dark)] text-[var(--sc-cream)] shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--sc-gold)] opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--sc-gold)] opacity-10 rounded-full -ml-24 -mb-24"></div>
        
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[var(--sc-gold)]" />
            <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-[rgba(254,250,224,0.8)] font-semibold">
              Your Rewards
            </p>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Points Section */}
            <div>
              <p className="text-xs sm:text-sm text-[rgba(254,250,224,0.7)] mb-2">
                Total Points
              </p>
              <div className="flex items-baseline gap-3 mb-2">
                <p className="text-4xl sm:text-5xl font-bold text-[var(--sc-gold)]">
                  {balance?.points ?? 0}
                </p>
                <p className="text-sm text-[rgba(254,250,224,0.8)]">
                  ≈ ${cashbackValue}
                </p>
              </div>
              <p className="text-xs text-[rgba(254,250,224,0.7)]">
                10 points = $1.00 cashback
              </p>
            </div>

            {/* Tier Section */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-xs sm:text-sm text-[rgba(254,250,224,0.7)] mb-2">
                  Current Tier
                </p>
                <p className="text-2xl sm:text-3xl font-bold mb-1">{balance?.tier ?? "Bronze"}</p>
                <p className="text-xs text-[rgba(254,250,224,0.8)]">
                  {balance && balance.points < balance.nextTierAt
                    ? `${balance.nextTierAt - balance.points} points to ${getTierName(balance.tier)}`
                    : "Maximum tier achieved!"}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-3 rounded-full bg-[rgba(254,250,224,0.15)] overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[var(--sc-gold)] to-yellow-400 transition-all duration-700 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-[rgba(254,250,224,0.8)]">
                Progress to next tier
              </p>
              <p className="text-xs font-semibold text-[var(--sc-gold)]">
                {progress.toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Redeem Button */}
          <Button
            onClick={() => setShowRedeemModal(true)}
            disabled={!balance || balance.points < 10}
            className="w-full mt-6 bg-[var(--sc-gold)] text-[var(--sc-green-dark)] hover:bg-yellow-400 font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Gift className="h-5 w-5 mr-2" />
            Redeem Points for Cashback
          </Button>
        </CardContent>
      </Card>

      {/* How to Earn Points */}
      <Card className="border-2 border-[var(--sc-green-dark)]/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--sc-gold)]" />
            <h2 className="text-lg sm:text-xl font-semibold">How to Earn Points</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Pay for Events</p>
                <p className="text-xs text-gray-600">+5 points</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 border border-purple-100">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Attend Events</p>
                <p className="text-xs text-gray-600">+5 points</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Events */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--sc-green-dark)]" />
              <h2 className="text-lg sm:text-xl font-semibold">Recommended for You</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Based on your interests, earn more points by attending these events
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {recommendations.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border-2 border-gray-100 hover:border-[var(--sc-green-dark)]/30 hover:shadow-md transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-[var(--sc-green-dark)]/10 text-[var(--sc-green-dark)]">
                        {event.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base mb-1 truncate">{event.name}</h3>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(event.startTime).toLocaleDateString()}</span>
                      </div>
                      {event.cost > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>${event.cost.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[var(--sc-green-dark)] italic">
                      {event.recommendationReason}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleRsvp(event.id)}
                    disabled={rsvping === event.id}
                    className="bg-[var(--sc-green-dark)] hover:bg-[var(--sc-green)] text-white whitespace-nowrap"
                  >
                    {rsvping === event.id ? (
                      "Processing..."
                    ) : (
                      <>
                        RSVP Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[var(--sc-green-dark)]" />
            <h2 className="text-lg sm:text-xl font-semibold">Recent Activity</h2>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No activity yet</p>
              <p className="text-sm">Start earning points by RSVPing to events!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.occurredAt).toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`flex-shrink-0 px-3 py-1 rounded-full font-semibold text-sm ${
                      event.pointsDelta > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {event.pointsDelta > 0 ? "+" : ""}
                    {event.pointsDelta} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[var(--sc-gold)]/20 flex items-center justify-center">
                <Gift className="h-6 w-6 text-[var(--sc-gold)]" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Redeem Points</h3>
                <p className="text-sm text-gray-600">Convert points to cashback</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Select Wallet
                </label>
                <select
                  value={selectedWalletId ?? ""}
                  onChange={(e) => setSelectedWalletId(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--sc-green-dark)] focus:outline-none"
                >
                  <option value="">Choose wallet...</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.displayName} (${wallet.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Points to Redeem (min 10)
                </label>
                <input
                  type="number"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  min="10"
                  max={balance?.points ?? 0}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[var(--sc-green-dark)] focus:outline-none"
                  placeholder="Enter points amount"
                />
                {redeemAmount && parseInt(redeemAmount) >= 10 && (
                  <p className="text-sm text-green-600 mt-2">
                    You'll receive ${(parseInt(redeemAmount) / 10).toFixed(2)} cashback
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-2">Your Balance</p>
                <p className="text-lg font-semibold text-[var(--sc-green-dark)]">
                  {balance?.points ?? 0} points available
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowRedeemModal(false);
                  setRedeemAmount("");
                }}
                variant="outline"
                className="flex-1"
                disabled={redeeming}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRedeem}
                disabled={
                  !selectedWalletId ||
                  !redeemAmount ||
                  parseInt(redeemAmount) < 10 ||
                  redeeming
                }
                className="flex-1 bg-[var(--sc-gold)] hover:bg-yellow-400 text-[var(--sc-green-dark)] font-semibold"
              >
                {redeeming ? "Processing..." : "Confirm Redemption"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function getTierName(currentTier: string): string {
  const tiers = { Bronze: "Silver", Silver: "Gold", Gold: "Platinum", Platinum: "Platinum" };
  return tiers[currentTier as keyof typeof tiers] || "Silver";
}
