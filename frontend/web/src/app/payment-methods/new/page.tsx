// app/payment-methods/new/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentMethodType } from "@/types/payment-method";

export default function NewPaymentMethodPage() {
  const router = useRouter();
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: type,
          label,
          cardOrAccountNumber: number.replace(/\s+/g, ""),
          brand: brand || null,
          isDefault,
        }),
      });

      if (!res.ok) throw new Error("Failed to create payment method");

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--sc-cream)] flex justify-center px-3 sm:px-4 py-6 sm:py-8 md:py-10">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white shadow-md border border-[rgba(40,54,24,0.08)] p-4 sm:p-6 space-y-4">
        <header className="space-y-1">
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-[var(--sc-green)]">
            Payment methods
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--sc-green-dark)]">
            Add a new payment method
          </h1>
          <p className="text-sm sm:text-base text-[var(--sc-green)]">
            Use this to top up your Campus Wallet. We only store masked details.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-medium text-[var(--sc-green-dark)]">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
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
                    "rounded-full border px-2.5 py-1.5 text-center cursor-pointer",
                    type === value
                      ? "bg-[var(--sc-green-dark)] text-[var(--sc-cream)] border-[var(--sc-green-dark)]"
                      : "bg-white text-[var(--sc-green-dark)] border-[rgba(40,54,24,0.15)]",
                  ].join(" ")}
                >
                  {labelText}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-medium text-[var(--sc-green-dark)]">
              Display label
            </label>
            <input
              className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40"
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
            <label className="block text-xs sm:text-sm font-medium text-[var(--sc-green-dark)]">
              Brand (optional)
            </label>
            <input
              className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40"
              placeholder={
                type === PaymentMethodType.BankAccount ? "e.g. Chase" : "e.g. Visa, Mastercard"
              }
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-medium text-[var(--sc-green-dark)]">
              {type === PaymentMethodType.BankAccount
                ? "Account number"
                : "Card number"}
            </label>
            <input
              className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40"
              placeholder={
                type === PaymentMethodType.BankAccount
                  ? "Enter account number"
                  : "1234 5678 9012 3456"
              }
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              inputMode="numeric"
            />
            <p className="text-xs sm:text-sm text-[var(--sc-green)]">
              We’ll only store a masked version (****1234) in this hackathon
              build.
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs sm:text-sm text-[var(--sc-green-dark)]">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-3.5 w-3.5 rounded border border-[rgba(40,54,24,0.3)]"
            />
            Set as default for top-ups
          </label>

          {error && (
            <p className="text-xs sm:text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-xs sm:text-sm text-[var(--sc-green)] hover:underline cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-xs sm:text-sm font-medium hover:bg-[var(--sc-green)] disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Saving..." : "Save payment method"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
