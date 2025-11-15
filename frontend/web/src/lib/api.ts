const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
};
