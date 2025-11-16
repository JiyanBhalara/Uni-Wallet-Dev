"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BankLinkButton } from "@/components/bank-link-button";

interface LinkedAccount {
  id: number;
  name: string;
  type: string;
  mask: string;
  institution: string;
  linkedAt: string;
  lastSynced: string | null;
}

export default function LinkedAccountsPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<number | null>(null);

  const fetchAccounts = async () => {
    if (!session?.user?.id) return;

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/plaid/accounts/${session.user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [session?.user?.id]);

  const handleSync = async (accountId: number) => {
    setSyncing(accountId);
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/plaid/sync/${accountId}`,
        { method: "POST" }
      );

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchAccounts();
      } else {
        alert("Failed to sync transactions");
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("Failed to sync transactions");
    } finally {
      setSyncing(null);
    }
  };

  const handleUnlink = async (accountId: number) => {
    if (!confirm("Are you sure you want to unlink this account?")) return;

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/plaid/unlink/${accountId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        alert("Account unlinked successfully");
        fetchAccounts();
      } else {
        alert("Failed to unlink account");
      }
    } catch (error) {
      console.error("Unlink error:", error);
      alert("Failed to unlink account");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Linked Bank Accounts</h1>
        <p className="text-gray-600">
          Connect your bank accounts to automatically import transactions
        </p>
      </div>

      <div className="mb-8">
        {session?.user?.id && (
          <BankLinkButton
            userId={Number(session.user.id)}
            onSuccess={fetchAccounts}
          />
        )}
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🏦</div>
          <h2 className="text-xl font-semibold mb-2">No Linked Accounts</h2>
          <p className="text-gray-600">
            Link your first bank account to get started with automatic transaction tracking
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-[var(--sc-gold)] bg-opacity-10 flex items-center justify-center text-2xl">
                      🏦
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {account.institution}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {account.name} •••• {account.mask}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-500 mt-3">
                    <span>Type: {account.type}</span>
                    <span>
                      Linked: {new Date(account.linkedAt).toLocaleDateString()}
                    </span>
                    {account.lastSynced && (
                      <span>
                        Last synced:{" "}
                        {new Date(account.lastSynced).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(account.id)}
                    disabled={syncing === account.id}
                    className="px-4 py-2 bg-[var(--sc-green)] hover:bg-[var(--sc-green-dark)] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {syncing === account.id ? "Syncing..." : "Sync"}
                  </button>
                  <button
                    onClick={() => handleUnlink(account.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
