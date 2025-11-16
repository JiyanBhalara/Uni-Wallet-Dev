// src/components/TopUpWalletModal.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { PaymentMethod } from "@/types/payment-method";
import { X, CreditCard, Building2, Plus, Landmark } from "lucide-react";

interface LinkedAccount {
  id: number;
  name: string;
  type: string;
  mask: string;
  institution: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  walletId: number;
  paymentMethods: PaymentMethod[];
  onAddPaymentMethod: () => void;
}

export default function TopUpWalletModal({
  isOpen,
  onClose,
  onSuccess,
  walletId,
  paymentMethods,
  onAddPaymentMethod,
}: Props) {
  const { data: session } = useSession();
  const [selectedType, setSelectedType] = useState<"payment" | "bank">("payment");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);

  // Fetch linked bank accounts
  useEffect(() => {
    const fetchLinkedAccounts = async () => {
      if (!session?.user?.id) return;
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5234";
        const response = await fetch(`${apiUrl}/api/plaid/accounts/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setLinkedAccounts(data);
        }
      } catch (error) {
        console.error("Failed to fetch linked accounts:", error);
      }
    };

    if (isOpen) {
      fetchLinkedAccounts();
    }
  }, [isOpen, session?.user?.id]);

  // Set default selection when modal opens or payment methods change
  useEffect(() => {
    if (isOpen) {
      if (paymentMethods.length > 0) {
        const defaultMethod = paymentMethods.find((m) => m.isDefault) ?? paymentMethods[0];
        setSelectedType("payment");
        setSelectedId(defaultMethod.id);
      } else if (linkedAccounts.length > 0) {
        setSelectedType("bank");
        setSelectedId(linkedAccounts[0].id);
      }
    }
  }, [isOpen, paymentMethods, linkedAccounts]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethods.length === 0 && linkedAccounts.length === 0) {
      setError("No payment methods or bank accounts available.");
      return;
    }
    if (!selectedId) {
      setError("Select a payment source.");
      return;
    }

    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    let sourceLabel = "";
    if (selectedType === "payment") {
      const method = paymentMethods.find((m) => m.id === selectedId);
      if (!method) {
        setError("Invalid payment method.");
        return;
      }
      sourceLabel = note || `${formatPaymentMethodType(method.type)} ${method.brand ?? ""} ****${method.last4}`.trim();
    } else {
      const account = linkedAccounts.find((a) => a.id === selectedId);
      if (!account) {
        setError("Invalid bank account.");
        return;
      }
      sourceLabel = note || `${account.institution} ${account.name} ••${account.mask}`;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5234";
      const res = await fetch(`${apiUrl}/api/wallets/${walletId}/topup`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(session?.user?.email ? { "X-User-Email": session.user.email } : {})
        },
        body: JSON.stringify({
          amount: value,
          sourceType: selectedType === "payment" ? "PaymentMethod" : "BankAccount",
          sourceLabel: sourceLabel,
        }),
      });

      if (!res.ok) throw new Error("Top-up failed");

      // Reset form
      setAmount("");
      setNote("");
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to top up wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasPaymentMethods = paymentMethods.length > 0;
  const hasBankAccounts = linkedAccounts.length > 0;
  const hasAnySources = hasPaymentMethods || hasBankAccounts;

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
              <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] text-[var(--sc-green)]">
                Wallet
              </p>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--sc-green-dark)] mt-0.5">
                Add balance
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
            Choose an amount and a payment method to top up your Campus Wallet.
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
                className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40 transition-all duration-200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 25.00"
              />
            </div>

            {/* Payment methods list */}
            <div className="space-y-1.5">
              <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                Pay with
              </label>

              {/* Tabs */}
              {hasPaymentMethods && hasBankAccounts && (
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType("payment");
                      if (paymentMethods.length > 0) {
                        setSelectedId(paymentMethods[0].id);
                      }
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-[0.7rem] sm:text-xs font-medium transition-all duration-200 ${
                      selectedType === "payment"
                        ? "bg-[var(--sc-green-dark)] text-white"
                        : "bg-[var(--sc-cream)]/40 text-[var(--sc-green)] hover:bg-[var(--sc-cream)]/60"
                    }`}
                  >
                    Payment Methods
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType("bank");
                      if (linkedAccounts.length > 0) {
                        setSelectedId(linkedAccounts[0].id);
                      }
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-[0.7rem] sm:text-xs font-medium transition-all duration-200 ${
                      selectedType === "bank"
                        ? "bg-[var(--sc-green-dark)] text-white"
                        : "bg-[var(--sc-cream)]/40 text-[var(--sc-green)] hover:bg-[var(--sc-cream)]/60"
                    }`}
                  >
                    Bank Accounts
                  </button>
                </div>
              )}

              {!hasAnySources ? (
                <div className="text-center py-6 bg-[var(--sc-cream)]/30 rounded-xl border border-[rgba(40,54,24,0.08)]">
                  <p className="text-xs text-[var(--sc-green-dark)] mb-3">
                    No payment methods or bank accounts yet
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAddPaymentMethod();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.7rem] sm:text-xs font-medium hover:bg-[var(--sc-green)] transition-colors duration-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add payment method
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {selectedType === "payment" ? (
                    // Payment Methods
                    paymentMethods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedId(m.id)}
                        className={[
                          "w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left cursor-pointer transition-all duration-200",
                          selectedId === m.id
                            ? "border-[var(--sc-green-dark)] bg-[var(--sc-green)]/5 shadow-sm"
                            : "border-[rgba(40,54,24,0.15)] bg-[var(--sc-cream)]/30 hover:bg-[var(--sc-cream)]/60 hover:border-[var(--sc-green)]",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            selectedId === m.id ? 'bg-[var(--sc-green-dark)]' : 'bg-[var(--sc-green)]/10'
                          }`}>
                            {m.type === 2 ? (
                              <Building2 className={`w-4 h-4 ${selectedId === m.id ? 'text-white' : 'text-[var(--sc-green-dark)]'}`} />
                            ) : (
                              <CreditCard className={`w-4 h-4 ${selectedId === m.id ? 'text-white' : 'text-[var(--sc-green-dark)]'}`} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-[var(--sc-green-dark)] truncate">
                              {m.label}
                            </p>
                            <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] truncate">
                              {formatPaymentMethodType(m.type)} · {m.brand ?? "Card"} ·{" "}
                              ****{m.last4}
                              {m.isDefault && " · Default"}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div
                            className={[
                              "h-4 w-4 rounded-full border-2 transition-all duration-200",
                              selectedId === m.id
                                ? "border-[var(--sc-green-dark)] bg-[var(--sc-green-dark)]"
                                : "border-[rgba(40,54,24,0.3)] bg-transparent",
                            ].join(" ")}
                          >
                            {selectedId === m.id && (
                              <div className="w-full h-full rounded-full bg-white scale-50" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    // Bank Accounts
                    linkedAccounts.map((account) => (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => setSelectedId(account.id)}
                        className={[
                          "w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left cursor-pointer transition-all duration-200",
                          selectedId === account.id
                            ? "border-[var(--sc-green-dark)] bg-[var(--sc-green)]/5 shadow-sm"
                            : "border-[rgba(40,54,24,0.15)] bg-[var(--sc-cream)]/30 hover:bg-[var(--sc-cream)]/60 hover:border-[var(--sc-green)]",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            selectedId === account.id ? 'bg-[var(--sc-green-dark)]' : 'bg-[var(--sc-green)]/10'
                          }`}>
                            <Landmark className={`w-4 h-4 ${selectedId === account.id ? 'text-white' : 'text-[var(--sc-green-dark)]'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-[var(--sc-green-dark)] truncate">
                              {account.institution}
                            </p>
                            <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] truncate">
                              {account.name} · {account.type} · ••{account.mask}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div
                            className={[
                              "h-4 w-4 rounded-full border-2 transition-all duration-200",
                              selectedId === account.id
                                ? "border-[var(--sc-green-dark)] bg-[var(--sc-green-dark)]"
                                : "border-[rgba(40,54,24,0.3)] bg-transparent",
                            ].join(" ")}
                          >
                            {selectedId === account.id && (
                              <div className="w-full h-full rounded-full bg-white scale-50" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Optional note */}
            <div className="space-y-1.5">
              <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                Note (optional)
              </label>
              <input
                className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40 transition-all duration-200"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  selectedType === "payment" && paymentMethods.find((m) => m.id === selectedId)
                    ? `e.g. From ${formatPaymentMethodType(
                        paymentMethods.find((m) => m.id === selectedId)!.type
                      )} ****${paymentMethods.find((m) => m.id === selectedId)!.last4}`
                    : selectedType === "bank" && linkedAccounts.find((a) => a.id === selectedId)
                    ? `e.g. Transfer from ${linkedAccounts.find((a) => a.id === selectedId)!.institution}`
                    : "Optional description"
                }
              />
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
                className="px-4 py-2 rounded-xl text-[0.7rem] sm:text-xs text-[var(--sc-green)] hover:bg-[var(--sc-green)]/5 transition-colors duration-200 cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !hasAnySources}
                className="px-4 py-2 rounded-xl bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.7rem] sm:text-xs font-medium hover:bg-[var(--sc-green)] disabled:opacity-60 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {loading ? "Processing..." : "Add balance"}
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

function formatPaymentMethodType(type: number): string {
  switch (type) {
    case 0:
      return "Debit card";
    case 1:
      return "Credit card";
    case 2:
      return "Bank account";
    default:
      return "Payment method";
  }
}
