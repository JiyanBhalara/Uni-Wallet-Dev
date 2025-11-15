// src/components/WalletActions.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { PaymentMethod } from "@/types/payment-method";
import AddPaymentMethodModal from "./AddPaymentMethodModal";
import TopUpWalletModal from "./TopUpWalletModal";
import {
  Plus,
  CreditCard,
  Eye,
  X,
  Trash2,
  Building2,
  Banknote,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface Props {
  walletId: number;
  paymentMethods: PaymentMethod[];
  onRefresh?: () => void;
}

export default function WalletActions({ walletId, paymentMethods, onRefresh }: Props) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [localMethods, setLocalMethods] =
    useState<PaymentMethod[]>(paymentMethods);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PaymentMethod | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL;
    
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteClick = (method: PaymentMethod) => {
    setConfirmDelete(method);
  };
    
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    
    const id = confirmDelete.id;
    const label = confirmDelete.label;
    setDeletingId(id);
    setConfirmDelete(null);
    
    try {
      const response = await fetch(`${apiUrl}/api/paymentmethods/${id}`, { 
        method: "DELETE",
        headers: {
          ...(session?.user?.email ? { "X-User-Email": session.user.email } : {})
        }
      });
      if (!response.ok) throw new Error('Failed to delete');
      
      setLocalMethods((prev) => prev.filter((m) => m.id !== id));
      showToast(`${label} has been removed successfully`, 'success');
    } catch (err) {
      console.error("Failed to delete payment method", err);
      showToast('Failed to remove payment method. Please try again.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const hasMultiple = localMethods.length >= 1;

  const handleSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2">
        {/* Add balance button */}
        <button
          onClick={() => setShowTopUpModal(true)}
          className="group relative text-[0.65rem] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[rgba(254,250,224,0.18)] hover:bg-[rgba(254,250,224,0.28)] transition-all duration-200 whitespace-nowrap font-medium shadow-sm hover:shadow-md flex items-center gap-1.5 border border-[rgba(254,250,224,0.2)] hover:border-[rgba(254,250,224,0.35)] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90 duration-200" />
          <span>Add balance</span>
        </button>

        {/* Add payment method button */}
        <button
          onClick={() => setShowAddPaymentModal(true)}
          className="group text-[0.65rem] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[rgba(254,250,224,0.35)] hover:bg-[rgba(254,250,224,0.18)] hover:border-[rgba(254,250,224,0.5)] transition-all duration-200 whitespace-nowrap font-medium shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <CreditCard className="w-3.5 h-3.5 transition-transform group-hover:scale-110 duration-200" />
          <span>Add payment method</span>
        </button>

        {/* See all payment methods */}
        {hasMultiple && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group text-[0.65rem] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[rgba(254,250,224,0.12)] hover:bg-[rgba(254,250,224,0.22)] transition-all duration-200 whitespace-nowrap font-medium shadow-sm hover:shadow-md flex items-center gap-1.5 border border-[rgba(254,250,224,0.15)] hover:border-[rgba(254,250,224,0.3)] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 transition-transform group-hover:scale-110 duration-200" />
            <span>See all ({localMethods.length})</span>
          </button>
        )}
      </div>

      {/* Modal */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          ></div>

          {/* Modal content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-3 pointer-events-none">
            <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white shadow-2xl p-4 sm:p-6 pointer-events-auto animate-in zoom-in-95 fade-in duration-200 border border-[rgba(40,54,24,0.08)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(40,54,24,0.08)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--sc-green)]/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-[var(--sc-green-dark)]" />
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--sc-green-dark)]">
                    Payment methods
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-[var(--sc-green)]/5 flex items-center justify-center transition-colors duration-200 text-[var(--sc-green)] cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              {localMethods.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--sc-green)]/5 flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-[var(--sc-green)]" />
                  </div>
                  <p className="text-sm text-[var(--sc-green)] mb-4">
                    No payment methods yet. Add one to get started.
                  </p>
                  <button
                    onClick={() => {
                      setOpen(false);
                      setShowAddPaymentModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-sm font-medium hover:bg-[var(--sc-green)] transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add payment method
                  </button>
                </div>
              ) : (
                <ul className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {localMethods.map((pm) => (
                    <li
                      key={pm.id}
                      className="group rounded-xl sm:rounded-2xl border border-[rgba(40,54,24,0.08)] hover:border-[rgba(40,54,24,0.15)] transition-all duration-200 px-3 sm:px-4 py-3 hover:shadow-md bg-white"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Icon */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--sc-green-dark)] to-[var(--sc-green)] flex items-center justify-center flex-shrink-0 shadow-sm">
                            {pm.type === 2 ? (
                              <Building2 className="w-5 h-5 text-[var(--sc-cream)]" />
                            ) : (
                              <CreditCard className="w-5 h-5 text-[var(--sc-cream)]" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-[var(--sc-green-dark)] truncate">
                              {pm.label}
                            </p>
                            <div className="flex items-center gap-1.5 text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] mt-0.5">
                              <span>{formatPaymentMethodType(pm.type)}</span>
                              {pm.brand && (
                                <>
                                  <span>·</span>
                                  <span>{pm.brand}</span>
                                </>
                              )}
                              <span>·</span>
                              <span className="font-mono">****{pm.last4}</span>
                              {pm.isDefault && (
                                <>
                                  <span>·</span>
                                  <span className="px-1.5 py-0.5 rounded bg-[var(--sc-green)]/10 text-[var(--sc-green-dark)] font-medium">
                                    Default
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(pm)}
                          disabled={deletingId === pm.id}
                          className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-all duration-200 text-[var(--sc-green)] hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 group-hover:opacity-100 opacity-0 cursor-pointer"
                          aria-label="Remove payment method"
                        >
                          {deletingId === pm.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Footer */}
              {localMethods.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[rgba(40,54,24,0.08)]">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setShowAddPaymentModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--sc-green-dark)] text-[var(--sc-cream)] text-sm font-medium hover:bg-[var(--sc-green)] transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add new payment method
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setConfirmDelete(null)}
          ></div>

          {/* Confirmation Modal */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-3 pointer-events-none">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 pointer-events-auto animate-in zoom-in-95 fade-in duration-200 border border-[rgba(40,54,24,0.08)]">
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              {/* Content */}
              <h3 className="text-base sm:text-lg font-bold text-[var(--sc-green-dark)] text-center mb-2">
                Remove Payment Method?
              </h3>
              <p className="text-xs sm:text-sm text-[var(--sc-green)] text-center mb-1">
                Are you sure you want to remove
              </p>
              <p className="text-sm font-semibold text-[var(--sc-green-dark)] text-center mb-4">
                {confirmDelete.label}?
              </p>
              <p className="text-[0.7rem] sm:text-xs text-[var(--sc-green)] text-center mb-5">
                This action cannot be undone.
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[rgba(40,54,24,0.15)] text-[var(--sc-green-dark)] text-sm font-medium hover:bg-[var(--sc-green)]/5 transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[80] animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={`rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-md border ${
            toast.type === 'success' 
              ? 'bg-white border-[var(--sc-green)]/20' 
              : 'bg-white border-red-200'
          }`}>
            {toast.type === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-[var(--sc-green)]/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[var(--sc-green-dark)]" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                toast.type === 'success' 
                  ? 'text-[var(--sc-green-dark)]' 
                  : 'text-red-900'
              }`}>
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="w-6 h-6 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors duration-200 flex-shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4 text-[var(--sc-green)]" />
            </button>
          </div>
        </div>
      )}

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

      {/* Modals */}
      <AddPaymentMethodModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onSuccess={() => {
          handleSuccess();
          showToast('Payment method added successfully', 'success');
        }}
      />

      <TopUpWalletModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={() => {
          handleSuccess();
          showToast('Balance added successfully', 'success');
        }}
        walletId={walletId}
        paymentMethods={localMethods}
        onAddPaymentMethod={() => {
          setShowTopUpModal(false);
          setShowAddPaymentModal(true);
        }}
      />
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