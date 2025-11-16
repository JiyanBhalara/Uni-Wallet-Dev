"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { X, Wallet, Landmark } from "lucide-react";

interface Wallet {
  id: number;
  displayName: string;
  balance: number;
  type: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  diningDollarsWalletId: number;
  availableWallets: Wallet[];
}

export default function AddDiningDollarsModal({
  isOpen,
  onClose,
  onSuccess,
  diningDollarsWalletId,
  availableWallets,
}: Props) {
  const { data: session } = useSession();
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default selection when modal opens
  useEffect(() => {
    if (isOpen && availableWallets.length > 0) {
      // Prioritize campus wallet (type 0), then bank accounts (type 3)
      const campusWallet = availableWallets.find((w) => w.type === 0);
      const defaultWallet = campusWallet ?? availableWallets[0];
      setSelectedWalletId(defaultWallet.id);
    }
  }, [isOpen, availableWallets]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (availableWallets.length === 0) {
      setError("No funding sources available.");
      return;
    }
    if (!selectedWalletId) {
      setError("Select a funding source.");
      return;
    }

    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    const sourceWallet = availableWallets.find((w) => w.id === selectedWalletId);
    if (!sourceWallet) {
      setError("Invalid funding source.");
      return;
    }

    if (sourceWallet.balance < value) {
      setError("Insufficient balance in selected wallet.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5234";
      const res = await fetch(`${apiUrl}/api/wallets/${diningDollarsWalletId}/transfer`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(session?.user?.email ? { "X-User-Email": session.user.email } : {})
        },
        body: JSON.stringify({
          sourceWalletId: selectedWalletId,
          amount: value,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Transfer failed");
      }

      // Reset form
      setAmount("");
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to add dining dollars. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-3 pointer-events-none">
        <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white shadow-2xl p-4 sm:p-6 pointer-events-auto animate-in zoom-in-95 slide-in-from-bottom-4 fade-in duration-300 border border-[rgba(40,54,24,0.08)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(40,54,24,0.08)]">
            <div>
              <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] text-[var(--sc-gold)]">
                Dining Dollars
              </p>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--sc-green-dark)] mt-0.5">
                Add Dining Dollars
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[var(--sc-green)]/5 flex items-center justify-center transition-colors duration-200 text-[var(--sc-green)] cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)] mb-4">
            Transfer funds from your Campus Wallet or linked bank accounts to Dining Dollars.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                Amount
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--sc-gold)] focus:border-transparent bg-[var(--sc-cream)]/40 transition-all duration-200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 25.00"
              />
            </div>

            {/* Funding Sources */}
            <div className="space-y-1.5">
              <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                Transfer from
              </label>
              {availableWallets.length === 0 ? (
                <div className="text-center py-6 bg-[var(--sc-cream)]/30 rounded-xl border border-[rgba(40,54,24,0.08)]">
                  <p className="text-xs text-[var(--sc-green-dark)]">
                    No funding sources available. Please add funds to your Campus Wallet or link a bank account.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {availableWallets.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWalletId(w.id)}
                      className={[
                        "w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left cursor-pointer transition-all duration-200",
                        selectedWalletId === w.id
                          ? "border-[var(--sc-gold)] bg-[var(--sc-gold)]/5 shadow-sm"
                          : "border-[rgba(40,54,24,0.15)] bg-[var(--sc-cream)]/30 hover:bg-[var(--sc-cream)]/60 hover:border-[var(--sc-gold)]",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedWalletId === w.id ? 'bg-[var(--sc-gold)]' : 'bg-[var(--sc-gold)]/10'
                        }`}>
                          {w.type === 3 ? (
                            <Landmark className={`w-4 h-4 ${selectedWalletId === w.id ? 'text-white' : 'text-[var(--sc-gold-dark)]'}`} />
                          ) : (
                            <Wallet className={`w-4 h-4 ${selectedWalletId === w.id ? 'text-white' : 'text-[var(--sc-gold-dark)]'}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium text-[var(--sc-green-dark)] truncate">
                            {w.displayName}
                          </p>
                          <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)]">
                            Balance: ${w.balance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div
                          className={[
                            "h-4 w-4 rounded-full border-2 transition-all duration-200",
                            selectedWalletId === w.id
                              ? "border-[var(--sc-gold)] bg-[var(--sc-gold)]"
                              : "border-[rgba(40,54,24,0.3)] bg-transparent",
                          ].join(" ")}
                        >
                          {selectedWalletId === w.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="text-[0.7rem] sm:text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm text-[var(--sc-green)] hover:bg-[var(--sc-green)]/5 transition-colors duration-200 cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || availableWallets.length === 0}
                className="px-4 py-2 rounded-xl bg-[var(--sc-gold)] text-white text-xs sm:text-sm font-medium hover:bg-[var(--sc-gold-dark)] disabled:opacity-60 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {loading ? "Processing..." : "Add Dining Dollars"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(40, 54, 24, 0.04);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(40, 54, 24, 0.15);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(40, 54, 24, 0.25);
        }
      `}</style>
    </>
  );
}
