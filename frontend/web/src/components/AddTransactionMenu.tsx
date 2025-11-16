// src/components/AddTransactionMenu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, Upload } from "lucide-react";

const CATEGORY_OPTIONS = [
  "Dining",
  "Groceries",
  "Transport",
  "Books",
  "Events",
  "Entertainment",
  "Fees & tuition",
  "Other",
];

interface WalletLite {
  id: number;
  displayName: string;
  currency: string;
}

interface Props {
  userEmail: string;
  wallets: WalletLite[];
  defaultWalletId: number;
  onCreated: () => void;
}

export default function AddTransactionMenu({
  userEmail,
  wallets,
  defaultWalletId,
  onCreated,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCsv, setShowCsv] = useState(false);

  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [walletId, setWalletId] = useState<number>(defaultWalletId);
  const [location, setLocation] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Campus Card");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const openForm = () => {
    setMenuOpen(false);
    setShowForm(true);
    setError(null);
  };

  const openCsv = () => {
    setMenuOpen(false);
    setShowCsv(true);
    setCsvError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }

    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) {
      setError("Select a valid wallet.");
      return;
    }

    const signedAmount = type === "expense" ? -numericAmount : numericAmount;

    setSaving(true);
    try {
      await api.createTransaction(userEmail, {
        walletId,
        amount: signedAmount,
        merchant: merchant || `${category} transaction`,
        paymentMethod,
        location: location || "Unknown",
        category,
      });

      // Reset
      setMerchant("");
      setAmount("");
      setType("expense");
      setLocation("");
      setPaymentMethod("Campus Card");
      setShowForm(false);

      onCreated();
    } catch (err) {
      console.error(err);
      setError("Failed to add transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setCsvError(null);

    if (!csvFile) {
      setCsvError("Choose a CSV file first.");
      return;
    }

    setUploading(true);
    try {
      await api.uploadTransactionsCsv(userEmail, csvFile);
      setCsvFile(null);
      setShowCsv(false);
      onCreated();
    } catch (err) {
      console.error(err);
      setCsvError("CSV upload failed. Make sure the file format is valid.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Button + dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.65rem] sm:text-xs font-medium hover:bg-[var(--sc-green)] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add transaction</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg border border-[rgba(40,54,24,0.08)] text-xs z-30">
            <button
              type="button"
              onClick={openForm}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[rgba(40,54,24,0.03)] text-[var(--sc-green-dark)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add single transaction</span>
            </button>
            <button
              type="button"
              onClick={openCsv}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[rgba(40,54,24,0.03)] text-[var(--sc-green-dark)] border-t border-[rgba(40,54,24,0.05)]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Add transaction modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-[var(--sc-green-dark)]">
                Add transaction
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-[0.7rem] text-[var(--sc-green)] hover:underline"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                  Merchant
                </label>
                <input
                  className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40"
                  placeholder="e.g. Starbucks, Campus Bookstore"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                    Category
                  </label>
                  <select
                    className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm bg-[var(--sc-cream)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                    Amount
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm bg-[var(--sc-cream)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                    Type
                  </span>
                  <div className="flex gap-2 text-[0.7rem] sm:text-xs">
                    <button
                      type="button"
                      onClick={() => setType("expense")}
                      className={[
                        "flex-1 px-2.5 py-1.5 rounded-full border",
                        type === "expense"
                          ? "bg-[var(--sc-green-dark)] text-[var(--sc-cream)] border-[var(--sc-green-dark)]"
                          : "bg-[var(--sc-cream)]/40 text-[var(--sc-green-dark)] border-[rgba(40,54,24,0.2)]",
                      ].join(" ")}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("income")}
                      className={[
                        "flex-1 px-2.5 py-1.5 rounded-full border",
                        type === "income"
                          ? "bg-[var(--sc-green-dark)] text-[var(--sc-cream)] border-[var(--sc-green-dark)]"
                          : "bg-[var(--sc-cream)]/40 text-[var(--sc-green-dark)] border-[rgba(40,54,24,0.2)]",
                      ].join(" ")}
                    >
                      Top-up / income
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                    Wallet
                  </label>
                  <select
                    className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm bg-[var(--sc-cream)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent"
                    value={walletId}
                    onChange={(e) => setWalletId(Number(e.target.value))}
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.displayName} ({w.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                    Location
                  </label>
                  <input
                    className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm bg-[var(--sc-cream)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent"
                    placeholder="e.g. Campus Center, Downtown"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                    Payment Method
                  </label>
                  <select
                    className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm bg-[var(--sc-cream)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Campus Card">Campus Card</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Meal Plan">Meal Plan</option>
                    <option value="Dining Dollars">Dining Dollars</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-[0.7rem] sm:text-xs text-red-600">{error}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-[0.7rem] sm:text-xs text-[var(--sc-green)] hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.7rem] sm:text-xs font-medium hover:bg-[var(--sc-green)] disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV upload modal */}
      {showCsv && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-semibold text-[var(--sc-green-dark)]">
                Upload transactions CSV
              </h2>
              <button
                type="button"
                onClick={() => setShowCsv(false)}
                className="text-[0.7rem] text-[var(--sc-green)] hover:underline"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUploadCsv} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                  CSV file
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setCsvFile(file);
                  }}
                  className="block w-full text-[0.7rem] sm:text-xs text-[var(--sc-green-dark)]"
                />
                <p className="text-[0.6rem] sm:text-[0.65rem] text-[var(--sc-green)]">
                  Expected columns: Date, Description, Amount, Currency,
                  Category, IsOnCampus, WalletId.
                </p>
              </div>

              {csvError && (
                <p className="text-[0.7rem] sm:text-xs text-red-600">
                  {csvError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.7rem] sm:text-xs font-medium hover:bg-[var(--sc-green)] disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Upload CSV"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
