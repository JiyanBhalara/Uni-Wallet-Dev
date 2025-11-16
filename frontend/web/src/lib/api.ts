import { Budget } from "@/types/budget";
import { EventItem } from "@/types/event";
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

  // Handle empty responses (204 No Content or empty body)
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const api = {
  getMe: (userEmail: string) => apiFetch("/api/users/me", {}, userEmail),
  getWallets: (userEmail: string) => apiFetch("/api/wallets", {}, userEmail),
  getTransactions: (userEmail: string) => apiFetch("/api/transactions", {}, userEmail),
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

  getBudgets(userEmail: string): Promise<Budget[]> {
    return apiFetch<Budget[]>("/api/budgets", {}, userEmail);
  },

  saveBudgets(userEmail: string, payload: {
    budgets: { category: string; limitAmount: number; periodType: "Monthly" | "Weekly" }[];
  }): Promise<Budget[]> {
    const mapped = payload.budgets.map((b) => ({
      category: b.category,
      limitAmount: b.limitAmount,
      periodType: b.periodType === "Monthly" ? 0 : 1,
    }));
    return apiFetch<Budget[]>("/api/budgets", {
      method: "POST",
      body: JSON.stringify({ budgets: mapped }),
    }, userEmail);
  },
  async createTransaction(
    userEmail: string,
    payload: {
      walletId: number;
      amount: number;
      merchant: string;
      paymentMethod: string;
      location: string;
      category: string;
    }
  ) {
    return apiFetch("/api/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    }, userEmail);
  },

  async uploadTransactionsCsv(userEmail: string, file: File) {
    const formData = new FormData();
    formData.append("userEmail", userEmail);
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/transactions/upload-csv`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`CSV upload failed: ${res.status}`);
    }
  },
  getEvents(userEmail: string): Promise<EventItem[]> {
    return apiFetch<EventItem[]>(`/api/events?userEmail=${encodeURIComponent(userEmail)}`);
  },

  rsvpEvent(eventId: number, userEmail: string) {
    return apiFetch<void>(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      body: JSON.stringify({ userEmail }),
    });
  },

  payAndRsvpEvent(eventId: number, userEmail: string, walletId: number) {
    return apiFetch<{ success: boolean; transactionId: string }>(`/api/events/${eventId}/pay-and-rsvp`, {
      method: "POST",
      body: JSON.stringify({ userEmail, walletId }),
    });
  },

  checkInEvent(eventId: number, userEmail: string) {
    return apiFetch<void>(`/api/events/${eventId}/checkin`, {
      method: "POST",
      body: JSON.stringify({ userEmail }),
    });
  },

  getEventAttendanceSummary(userEmail: string) {
    return apiFetch<{ totalRsvped: number; attended: number; missed: number }>(
      `/api/events/attendance-summary?userEmail=${encodeURIComponent(userEmail)}`
    );
  },
};

