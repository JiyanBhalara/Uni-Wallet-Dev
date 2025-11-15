import type { PaymentMethod } from "@/types/payment-method";
import { PaymentMethodType } from "@/types/payment-method";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5234";

async function apiFetch<T>(url: string, options: RequestInit = {}, userEmail?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(userEmail ? { "X-User-Email": userEmail } : {}),
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
  getMe: (userEmail: string) => apiFetch("/api/users/me", {}, userEmail),
  getWallets: (userEmail: string) => apiFetch("/api/wallets", {}, userEmail),
  getTransactions: (userEmail: string) => apiFetch("/api/transactions", {}, userEmail),
  getEvents: (userEmail: string) => apiFetch("/api/events", {}, userEmail),
  async getPaymentMethods(userEmail: string): Promise<PaymentMethod[]> {
    const methods = await apiFetch<any[]>("/api/paymentmethods", {}, userEmail);
    // Backend sends numeric type, we just use it directly as the enum value
    return methods.map((m) => ({
      ...m,
      type: m.type as PaymentMethodType,
    }));
  },

  async createPaymentMethod(userEmail: string, payload: {
    type: PaymentMethodType;
    label: string;
    cardOrAccountNumber: string;
    brand?: string;
    isDefault: boolean;
  }): Promise<PaymentMethod> {
    return apiFetch<PaymentMethod>("/api/paymentmethods", {
      method: "POST",
      body: JSON.stringify({
        type: payload.type,
        label: payload.label,
        cardOrAccountNumber: payload.cardOrAccountNumber,
        brand: payload.brand,
        isDefault: payload.isDefault,
      }),
    }, userEmail);
  },

  async deletePaymentMethod(userEmail: string, id: number): Promise<void> {
    await apiFetch(`/api/paymentmethods/${id}`, {
      method: "DELETE",
    }, userEmail);
  },

  async topUpWallet(userEmail: string, walletId: number, payload: {
    amount: number;
    sourceType: string;
    sourceLabel?: string;
  }): Promise<void> {
    await apiFetch(`/api/wallets/${walletId}/topup`, {
      method: "POST",
      body: JSON.stringify(payload),
    }, userEmail);
  },
};
