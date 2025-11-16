"use client";

import { usePlaidLink } from "react-plaid-link";
import { useState, useEffect } from "react";

interface BankLinkButtonProps {
  userId: number;
  onSuccess?: () => void;
}

export function BankLinkButton({ userId, onSuccess }: BankLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSuccessPlaid = async (public_token: string) => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/plaid/exchange-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, publicToken: public_token }),
      });

      if (!response.ok) throw new Error("Failed to link account");
      
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link account");
    } finally {
      setLoading(false);
    }
  };

  const config = {
    token: linkToken,
    onSuccess: onSuccessPlaid,
  };

  const { open, ready } = usePlaidLink(config);

  // Auto-open Plaid Link when token is ready
  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  const handleClick = async () => {
    // If we already have a token and Plaid is ready, just open it
    if (linkToken && ready) {
      open();
      return;
    }

    // Otherwise, fetch the link token (useEffect will auto-open when ready)
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/plaid/create-link-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error("Failed to create link token");

      const data = await response.json();
      setLinkToken(data.link_token);
      // No need to call open() here - useEffect will handle it
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={loading || (linkToken !== null && !ready)}
        data-bank-link-trigger="true"
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--sc-green)] to-[var(--sc-green-dark)] hover:from-[var(--sc-green-dark)] hover:to-[#1a2410] text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {loading ? "Loading..." : "Link Bank Account"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
