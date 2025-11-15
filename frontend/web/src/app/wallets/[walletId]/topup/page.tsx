// app/wallets/[walletId]/topup/page.tsx
"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import type { PaymentMethod } from "@/types/payment-method";

export default function TopUpPage() {
  const { walletId } = useParams<{ walletId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load payment methods on mount
  useEffect(() => {
    const load = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5234";
        const res = await fetch(`${apiUrl}/api/paymentmethods`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch payment methods");
        const data: PaymentMethod[] = await res.json();

        if (!data || data.length === 0) {
          // No methods -> send user to create page
          const redirectUrl = `/payment-methods/new?from=topup&walletId=${walletId}`;
          router.replace(redirectUrl);
          return;
        }

        setMethods(data);
        // Default selection: default method, else first
        const defaultMethod = data.find((m) => m.isDefault) ?? data[0];
        setSelectedId(defaultMethod.id);
      } catch (err) {
        console.error(err);
        setError("Failed to load payment methods.");
      } finally {
        setLoadingMethods(false);
      }
    };

    load();
  }, [walletId, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!methods || methods.length === 0) {
      setError("No payment methods available.");
      return;
    }
    if (!selectedId) {
      setError("Select a payment method.");
      return;
    }

    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    const method = methods.find((m) => m.id === selectedId);
    if (!method) {
      setError("Invalid payment method.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5234";
      const res = await fetch(`${apiUrl}/api/wallets/${walletId}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          sourceType: "PaymentMethod",
          sourceLabel:
            note ||
            `${formatPaymentMethodType(method.type)} ${method.brand ?? ""} ****${
              method.last4
            }`.trim(),
        }),
      });

      if (!res.ok) throw new Error("Top-up failed");

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to top up wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state while fetching payment methods / before redirect
  if (loadingMethods) {
    return (
      <main className="min-h-screen bg-[var(--sc-cream)] flex justify-center px-3 sm:px-4 py-6 sm:py-8 md:py-10">
        <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white shadow-md border border-[rgba(40,54,24,0.08)] p-4 sm:p-6 space-y-3">
          <div className="h-4 w-24 bg-[rgba(40,54,24,0.06)] rounded-full" />
          <div className="h-6 w-40 bg-[rgba(40,54,24,0.06)] rounded-full" />
          <div className="h-10 w-full bg-[rgba(40,54,24,0.06)] rounded-xl" />
          <div className="h-10 w-full bg-[rgba(40,54,24,0.06)] rounded-xl" />
        </div>
      </main>
    );
  }

  // If we got here with methods still null (and not loading), show fallback
  if (!methods || methods.length === 0) {
    // In theory we already redirected, this is just safety
    return (
      <main className="min-h-screen bg-[var(--sc-cream)] flex justify-center px-3 sm:px-4 py-6 sm:py-8 md:py-10">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-md border border-[rgba(40,54,24,0.08)] p-4 sm:p-6 space-y-3">
          <p className="text-sm text-[var(--sc-green-dark)] font-semibold">
            No payment methods found
          </p>
          <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)]">
            You need to add a payment method before you can top up this wallet.
          </p>
          <button
            type="button"
            onClick={() =>
              router.push(`/payment-methods/new?from=topup&walletId=${walletId}`)
            }
            className="mt-2 px-4 py-2 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.7rem] sm:text-xs font-medium hover:bg-[var(--sc-green)]"
          >
            Add payment method
          </button>
        </div>
      </main>
    );
  }

  const selectedMethod = methods.find((m) => m.id === selectedId) ?? methods[0];

  return (
    <main className="min-h-screen bg-[var(--sc-cream)] flex justify-center px-3 sm:px-4 py-6 sm:py-8 md:py-10">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white shadow-md border border-[rgba(40,54,24,0.08)] p-4 sm:p-6 space-y-4">
        <header className="space-y-1">
          <p className="text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] text-[var(--sc-green)]">
            Wallet
          </p>
          <h1 className="text-lg sm:text-xl font-semibold text-[var(--sc-green-dark)]">
            Add balance
          </h1>
          <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)]">
            Choose an amount and a payment method to top up your Campus Wallet.
          </p>
        </header>

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
              className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40"
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
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={[
                    "w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left",
                    selectedId === m.id
                      ? "border-[var(--sc-green-dark)] bg-[var(--sc-cream)]/60"
                      : "border-[rgba(40,54,24,0.15)] bg-[var(--sc-cream)]/30 hover:bg-[var(--sc-cream)]/60",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[var(--sc-green-dark)] truncate">
                      {m.label}
                    </p>
                    <p className="text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] truncate">
                      {formatPaymentMethodType(m.type)} · {m.brand ?? "Card"} ·{" "}
                      ****{m.last4}
                      {m.isDefault && " · Default"}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div
                      className={[
                        "h-3.5 w-3.5 rounded-full border",
                        selectedId === m.id
                          ? "border-[var(--sc-green-dark)] bg-[var(--sc-green-dark)]"
                          : "border-[rgba(40,54,24,0.3)] bg-transparent",
                      ].join(" ")}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional note */}
          <div className="space-y-1.5">
            <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
              Note (optional)
            </label>
            <input
              className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                selectedMethod
                  ? `e.g. From ${formatPaymentMethodType(
                      selectedMethod.type
                    )} ****${selectedMethod.last4}`
                  : "Optional description"
              }
            />
          </div>

          {error && (
            <p className="text-[0.7rem] sm:text-xs text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-[0.7rem] sm:text-xs text-[var(--sc-green)] hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.7rem] sm:text-xs font-medium hover:bg-[var(--sc-green)] disabled:opacity-60"
            >
              {loading ? "Processing..." : "Add balance"}
            </button>
          </div>
        </form>
      </div>
    </main>
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
