// src/components/AddTransactionMenu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, Upload, AlertTriangle, PartyPopper, CheckCircle2 } from "lucide-react";
import { Budget } from "@/types/budget";

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
  balance: number;
}

interface Transaction {
  id: string;
  userId: number;
  walletId: number;
  amount: number;
  merchant: string;
  paymentMethod: string;
  location: string;
  date: string;
  category: string;
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showZeroBalanceWarning, setShowZeroBalanceWarning] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  
  // Budget warning states
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);
  const [budgetWarningData, setBudgetWarningData] = useState<{
    percentage: number;
    isOverBudget: boolean;
    limitAmount: number;
    currentSpent: number;
    transactionAmount: number;
  } | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showAvoidedMessage, setShowAvoidedMessage] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Fetch budgets when component mounts
  useEffect(() => {
    async function fetchBudgets() {
      try {
        const budgetsData = await api.getBudgets(userEmail);
        setBudgets(budgetsData);
      } catch (error) {
        console.error("Failed to fetch budgets:", error);
      }
    }
    fetchBudgets();
  }, [userEmail]);

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

  // Calculate budget usage for a category
  const checkBudgetUsage = async (category: string, transactionAmount: number): Promise<{
    percentage: number;
    isOverBudget: boolean;
    limitAmount: number;
    currentSpent: number;
  } | null> => {
    const budget = budgets.find(b => b.category === category && b.isActive);
    if (!budget) return null;

    try {
      // Fetch all transactions for this user to calculate current spending
      const transactions = await api.getTransactions(userEmail) as Transaction[];
      
      // Get current month start/end
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Calculate spending for this category in current month
      const currentSpent = transactions
        .filter((t: Transaction) => {
          const tDate = new Date(t.date);
          return t.category === category && 
                 t.amount < 0 && 
                 tDate >= monthStart && 
                 tDate <= monthEnd;
        })
        .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);

      const totalAfterTransaction = currentSpent + transactionAmount;
      const percentage = (totalAfterTransaction / budget.limitAmount) * 100;
      const isOverBudget = totalAfterTransaction >= budget.limitAmount;

      return {
        percentage,
        isOverBudget,
        limitAmount: budget.limitAmount,
        currentSpent,
      };
    } catch (error) {
      console.error("Failed to check budget:", error);
      return null;
    }
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

    // Check balance before creating expense transaction
    if (type === "expense") {
      if (wallet.balance === 0) {
        showToast("Cannot make a transaction with zero balance in this wallet.", "error");
        return;
      }
      
      if (wallet.balance < numericAmount) {
        showToast(
          `Insufficient balance. Available: ${wallet.currency} ${wallet.balance.toFixed(2)}, Required: ${wallet.currency} ${numericAmount.toFixed(2)}`,
          "error"
        );
        return;
      }

      // Check if transaction would make balance exactly 0
      if (wallet.balance === numericAmount) {
        setPendingTransaction({
          walletId,
          amount: signedAmount,
          merchant: merchant || `${category} transaction`,
          paymentMethod,
          location: location || "Unknown",
          category,
        });
        setShowZeroBalanceWarning(true);
        return;
      }

      // Check budget usage for expense transactions
      const budgetCheck = await checkBudgetUsage(category, numericAmount);
      if (budgetCheck) {
        const { percentage, isOverBudget, limitAmount, currentSpent } = budgetCheck;

        // If 80% or more budget used, show warning
        if (percentage >= 80) {
          setPendingTransaction({
            walletId,
            amount: signedAmount,
            merchant: merchant || `${category} transaction`,
            paymentMethod,
            location: location || "Unknown",
            category,
          });
          setBudgetWarningData({
            percentage,
            isOverBudget,
            limitAmount,
            currentSpent,
            transactionAmount: numericAmount,
          });
          setShowBudgetWarning(true);
          return;
        }
      }
    }

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

      showToast("Transaction added successfully!", "success");
      onCreated();
    } catch (err) {
      console.error(err);
      
      // Try to extract error message from backend
      let errorMessage = "Failed to add transaction. Please try again.";
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (response?.data) {
          errorMessage = typeof response.data === 'string' ? response.data : errorMessage;
        }
      }
      
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmBudgetTransaction = async () => {
    if (!pendingTransaction || !budgetWarningData) return;

    setShowBudgetWarning(false);
    setSaving(true);
    
    try {
      await api.createTransaction(userEmail, pendingTransaction);

      // Reset
      setMerchant("");
      setAmount("");
      setType("expense");
      setLocation("");
      setPaymentMethod("Campus Card");
      setShowForm(false);
      setPendingTransaction(null);
      setBudgetWarningData(null);

      // Show overspent message if applicable
      if (budgetWarningData.isOverBudget || budgetWarningData.percentage >= 100) {
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 4000);
      } else {
        showToast("Transaction added successfully!", "success");
      }
      
      onCreated();
    } catch (err) {
      console.error(err);
      
      let errorMessage = "Failed to add transaction. Please try again.";
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (response?.data) {
          errorMessage = typeof response.data === 'string' ? response.data : errorMessage;
        }
      }
      
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const cancelBudgetTransaction = () => {
    setShowBudgetWarning(false);
    setPendingTransaction(null);
    setBudgetWarningData(null);
    
    // Show avoided message
    setShowAvoidedMessage(true);
    setTimeout(() => setShowAvoidedMessage(false), 3000);
  };

  const confirmZeroBalanceTransaction = async () => {
    if (!pendingTransaction) return;

    setShowZeroBalanceWarning(false);
    setSaving(true);
    
    try {
      await api.createTransaction(userEmail, pendingTransaction);

      // Reset
      setMerchant("");
      setAmount("");
      setType("expense");
      setLocation("");
      setPaymentMethod("Campus Card");
      setShowForm(false);
      setPendingTransaction(null);

      showToast("Transaction added successfully!", "success");
      onCreated();
    } catch (err) {
      console.error(err);
      
      let errorMessage = "Failed to add transaction. Please try again.";
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        } else if (response?.data) {
          errorMessage = typeof response.data === 'string' ? response.data : errorMessage;
        }
      }
      
      showToast(errorMessage, "error");
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
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold text-sm ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Button + dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.65rem] sm:text-xs font-medium hover:bg-[var(--sc-green)] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add transaction</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg border border-[rgba(40,54,24,0.08)] text-xs z-30">
            <button
              type="button"
              onClick={openForm}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[rgba(40,54,24,0.03)] text-[var(--sc-green-dark)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add single transaction</span>
            </button>
            <button
              type="button"
              onClick={openCsv}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[rgba(40,54,24,0.03)] text-[var(--sc-green-dark)] border-t border-[rgba(40,54,24,0.05)] cursor-pointer"
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
                className="text-[0.7rem] text-[var(--sc-green)] hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                  Merchant <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent bg-[var(--sc-cream)]/40"
                  placeholder="e.g. Starbucks, Campus Bookstore"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
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
                    Amount <span className="text-red-600">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={0.01}
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
                        "flex-1 px-2.5 py-1.5 rounded-full border cursor-pointer",
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
                        "flex-1 px-2.5 py-1.5 rounded-full border cursor-pointer",
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
                    Wallet <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
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
                    Location <span className="text-red-600">*</span>
                  </label>
                  <input
                    required
                    className="w-full rounded-xl border border-[rgba(40,54,24,0.15)] px-3 py-2 text-xs sm:text-sm bg-[var(--sc-cream)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--sc-green)] focus:border-transparent"
                    placeholder="e.g. Campus Center, Downtown"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[0.7rem] sm:text-xs font-medium text-[var(--sc-green-dark)]">
                    Payment Method <span className="text-red-600">*</span>
                  </label>
                  <select
                    required
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
                  className="text-[0.7rem] sm:text-xs text-[var(--sc-green)] hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.7rem] sm:text-xs font-medium hover:bg-[var(--sc-green)] disabled:opacity-60 cursor-pointer"
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
                className="text-[0.7rem] text-[var(--sc-green)] hover:underline cursor-pointer"
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
                  className="px-4 py-2 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-[0.7rem] sm:text-xs font-medium hover:bg-[var(--sc-green)] disabled:opacity-60 cursor-pointer"
                >
                  {uploading ? "Uploading..." : "Upload CSV"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zero Balance Warning Dialog */}
      {showZeroBalanceWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[var(--sc-green-dark)] mb-2">
                  Balance Will Reach Zero
                </h3>
                <p className="text-sm text-gray-600">
                  This transaction will reduce your wallet balance to $0.00. You won't be able to make any further transactions from this wallet until you add more funds.
                </p>
                <p className="text-sm text-gray-700 font-medium mt-3">
                  Do you want to proceed with this transaction?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowZeroBalanceWarning(false);
                  setPendingTransaction(null);
                }}
                className="px-5 py-2 rounded-full border border-[var(--sc-green)] text-[var(--sc-green-dark)] text-sm font-medium hover:bg-[var(--sc-cream)]/50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmZeroBalanceTransaction}
                disabled={saving}
                className="px-5 py-2 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-sm font-medium hover:bg-[var(--sc-green)] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {saving ? "Processing..." : "Yes, Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Warning Dialog */}
      {showBudgetWarning && budgetWarningData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--sc-gold)]/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-[var(--sc-gold-dark)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[var(--sc-green-dark)] mb-2">
                  {budgetWarningData.percentage >= 100 ? 'Budget Exceeded!' : 'Budget Warning'}
                </h3>
                
                {budgetWarningData.percentage >= 80 && budgetWarningData.percentage < 100 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      You have used <span className="font-bold text-[var(--sc-gold-dark)]">{budgetWarningData.percentage.toFixed(1)}%</span> of your monthly budget for <span className="font-semibold">{pendingTransaction?.category}</span>.
                    </p>
                    <div className="bg-[var(--sc-cream)] rounded-lg p-3 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--sc-green)]">Current Spent:</span>
                        <span className="font-semibold text-[var(--sc-green-dark)]">${budgetWarningData.currentSpent.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--sc-green)]">This Transaction:</span>
                        <span className="font-semibold text-[var(--sc-gold-dark)]">+${budgetWarningData.transactionAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[var(--sc-green)]/20">
                        <span className="text-[var(--sc-green)] font-medium">Budget Limit:</span>
                        <span className="font-bold text-[var(--sc-green-dark)]">${budgetWarningData.limitAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {budgetWarningData.percentage >= 100 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      This transaction will {budgetWarningData.isOverBudget ? 'exceed' : 'use up'} your monthly budget for <span className="font-semibold">{pendingTransaction?.category}</span>.
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-red-700">Current Spent:</span>
                        <span className="font-semibold text-red-900">${budgetWarningData.currentSpent.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">This Transaction:</span>
                        <span className="font-semibold text-red-900">+${budgetWarningData.transactionAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Total:</span>
                        <span className="font-bold text-red-900">${(budgetWarningData.currentSpent + budgetWarningData.transactionAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-red-300">
                        <span className="text-red-700 font-medium">Budget Limit:</span>
                        <span className="font-bold text-red-900">${budgetWarningData.limitAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-red-700 font-bold">Over Budget:</span>
                        <span className="font-bold text-red-900">${((budgetWarningData.currentSpent + budgetWarningData.transactionAmount) - budgetWarningData.limitAmount).toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-red-700 font-medium mt-3">
                      ⚠️ Please consider avoiding this transaction to prevent overspending.
                    </p>
                  </div>
                )}

                <p className="text-sm text-gray-700 font-medium mt-4">
                  Do you still want to proceed?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cancelBudgetTransaction}
                className="px-5 py-2.5 rounded-full border-2 border-[var(--sc-green)] text-[var(--sc-green-dark)] text-sm font-semibold hover:bg-[var(--sc-cream)] transition-colors cursor-pointer"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={confirmBudgetTransaction}
                disabled={saving}
                className="px-5 py-2.5 rounded-full bg-[var(--sc-gold-dark)] text-white text-sm font-semibold hover:bg-[var(--sc-gold)] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {saving ? "Processing..." : "Yes, Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overspent Success Message */}
      {showSuccessMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 text-center space-y-4 animate-bounce-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-[var(--sc-green-dark)]">
              Budget Overspent!
            </h3>
            <p className="text-sm text-gray-700">
              You have exceeded your budget for this category this month. Please be mindful of your spending going forward.
            </p>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="mt-4 px-6 py-2.5 rounded-full bg-[var(--sc-green-dark)] text-white text-sm font-semibold hover:bg-[var(--sc-green)] transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Transaction Avoided Message */}
      {showAvoidedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 text-center space-y-4 animate-scale-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-[var(--sc-green)]/10 flex items-center justify-center relative">
              <CheckCircle2 className="w-12 h-12 text-[var(--sc-green)]" />
              <PartyPopper className="w-6 h-6 text-[var(--sc-gold-dark)] absolute -top-2 -right-2 animate-spin-slow" />
            </div>
            <h3 className="text-xl font-bold text-[var(--sc-green)]">
              Great Decision! 🎉
            </h3>
            <p className="text-sm text-gray-700">
              You've made a smart choice by avoiding this transaction. Your budget thanks you for being financially responsible!
            </p>
            <button
              onClick={() => setShowAvoidedMessage(false)}
              className="mt-4 px-6 py-2.5 rounded-full bg-[var(--sc-green)] text-white text-sm font-semibold hover:bg-[var(--sc-green-dark)] transition-colors cursor-pointer"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
