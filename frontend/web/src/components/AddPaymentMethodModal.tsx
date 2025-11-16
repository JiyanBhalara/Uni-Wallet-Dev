// src/components/AddPaymentMethodModal.tsx
"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { PaymentMethodType } from "@/types/payment-method";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPaymentMethodModal({ isOpen, onClose, onSuccess }: Props) {
  const { data: session } = useSession();
  const [type, setType] = useState<PaymentMethodType>(PaymentMethodType.DebitCard);
  const [label, setLabel] = useState("");
  const [brand, setBrand] = useState("");
  const [number, setNumber] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!label.trim() || !number.trim()) {
      setError("Label and number are required.");
      return;
    }

    if (number.replace(/\s+/g, "").length < 4) {
      setError("Enter a valid card or account number.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5234";
      const res = await fetch(`${apiUrl}/api/paymentmethods`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(session?.user?.email ? { "X-User-Email": session.user.email } : {})
        },
        body: JSON.stringify({
          type: type,
          label,
          cardOrAccountNumber: number.replace(/\s+/g, ""),
          brand: brand || null,
          isDefault,
        }),
      });

      if (!res.ok) throw new Error("Failed to create payment method");

      // Reset form
      setLabel("");
      setBrand("");
      setNumber("");
      setType(PaymentMethodType.DebitCard);
      setIsDefault(true);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
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
              <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] text-[var(--sc-green)]">
                Payment methods
              </p>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--sc-green-dark)] mt-0.5">
                Add a new payment method
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
            Use this to top up your Campus Wallet. We only store masked details.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                Type
              </label>
              <div className="grid grid-cols-3 gap-2 text-[0.65rem] sm:text-[0.7rem]">
                {([
                  [PaymentMethodType.DebitCard, "Debit card"],
                  [PaymentMethodType.CreditCard, "Credit card"],
                  [PaymentMethodType.BankAccount, "Bank account"],
                ] as [PaymentMethodType, string][]).map(([value, labelText]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={[
                      "rounded-full border px-2.5 py-1.5 text-center cursor-pointer transition-all duration-200",
                      type === value
                        ? "bg-[var(--sc-green-dark)] text-[var(--sc-cream)] border-[var(--sc-green-dark)] shadow-sm"
                        : "bg-white text-[var(--sc-green-dark)] border-[rgba(40,54,24,0.15)] hover:border-[var(--sc-green)] hover:bg-[var(--sc-green)]/5",
                    ].join(" ")}
                  >
                    {labelText}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                Display label
              </label>
              <input
                className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40 transition-all duration-200"
                placeholder={
                  type === PaymentMethodType.BankAccount
                    ? "e.g. Chase Checking"
                    : "e.g. Chase Debit • Personal"
                }
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                Brand (optional)
              </label>
              <input
                className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40 transition-all duration-200"
                placeholder={
                  type === PaymentMethodType.BankAccount ? "e.g. Chase" : "e.g. Visa, Mastercard"
                }
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                {type === PaymentMethodType.BankAccount
                  ? "Account number"
                  : "Card number"}
              </label>
              <input
                className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40 transition-all duration-200"
                placeholder={
                  type === PaymentMethodType.BankAccount
                    ? "Enter account number"
                    : "1234 5678 9012 3456"
                }
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                inputMode="numeric"
              />
              <p className="text-[0.6rem] sm:text-[0.65rem] text-[var(--sc-green)]">
                We'll only store a masked version (****1234) in this hackathon build.
              </p>
            </div>

            <label className="flex items-center gap-2 text-[0.7rem] sm:text-xs text-[var(--sc-green-dark)] cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-3.5 w-3.5 rounded border border-[rgba(40,54,24,0.3)] cursor-pointer"
              />
              Set as default for top-ups
            </label>

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
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.7rem] sm:text-xs font-medium hover:bg-[var(--sc-green)] disabled:opacity-60 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {loading ? "Saving..." : "Save payment method"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
