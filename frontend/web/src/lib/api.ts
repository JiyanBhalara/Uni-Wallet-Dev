import { auth } from "@/app/api/auth/[...nextauth]/route";
import type { PaymentMethod } from "@/types/payment-method";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5234";

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const session = await auth();
  
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session?.user?.email ? { "X-User-Email": session.user.email } : {}),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  getMe: () => apiFetch("/api/users/me"),
  getWallets: () => apiFetch("/api/wallets"),
  getTransactions: () => apiFetch("/api/transactions"),
  getEvents: () => apiFetch("/api/events"),
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const methods = await apiFetch<any[]>("/api/paymentmethods");
    // Convert backend numeric type to frontend string type
    const typeMap: Record<number, PaymentMethod["type"]> = {
      0: "DEBIT_CARD",
      1: "CREDIT_CARD",
      2: "BANK_ACCOUNT",
    };
    return methods.map((m) => ({
      ...m,
      type: typeMap[m.type] || "DEBIT_CARD",
    }));
  },

  async createPaymentMethod(payload: {
    type: "DEBIT_CARD" | "CREDIT_CARD" | "BANK_ACCOUNT";
    label: string;
    cardOrAccountNumber: string;
    brand?: string;
    isDefault: boolean;
  }): Promise<PaymentMethod> {
    // Map string type → backend enum index
    const typeMap: Record<string, number> = {
      DEBIT_CARD: 0,
      CREDIT_CARD: 1,
      BANK_ACCOUNT: 2,
    };

    return apiFetch<PaymentMethod>("/api/paymentmethods", {
      method: "POST",
      body: JSON.stringify({
        type: typeMap[payload.type],
        label: payload.label,
        cardOrAccountNumber: payload.cardOrAccountNumber,
        brand: payload.brand,
        isDefault: payload.isDefault,
      }),
    });
  },

  async deletePaymentMethod(id: number): Promise<void> {
    await fetch(`${API_BASE}/api/paymentmethods/${id}`, {
      method: "DELETE",
    });
  },

  async topUpWallet(walletId: number, payload: {
    amount: number;
    sourceType: string;
    sourceLabel?: string;
  }): Promise<void> {
    await apiFetch(`/api/wallets/${walletId}/topup`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
