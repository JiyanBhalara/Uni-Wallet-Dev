import { api } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Transaction {
  id: number;
  userId: number;
  walletId: number;
  amount: number;
  currency: string;
  timestamp: string;
  description: string;
  category: string;
  isOnCampus: boolean;
}

export default async function ActivityPage() {
  const transactions = (await api.getTransactions()) as Transaction[];

  return (
    <main className="space-y-3 sm:space-y-4">
      <h1 className="text-lg sm:text-xl md:text-2xl font-semibold">Full activity</h1>
      <Card>
        <CardHeader>
          <p className="text-xs sm:text-sm font-semibold text-[var(--sc-green-dark)]">
            Transactions
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[0.7rem] sm:text-xs md:text-sm min-w-[500px]">
              <thead>
                <tr className="text-left text-[0.65rem] sm:text-[0.7rem] text-[var(--sc-green)] border-b border-[rgba(40,54,24,0.06)]">
                  <th className="py-2 pr-2 font-medium">Date</th>
                  <th className="py-2 pr-2 font-medium">Description</th>
                  <th className="py-2 pr-2 font-medium hidden sm:table-cell">Category</th>
                  <th className="py-2 pr-2 font-medium">Campus</th>
                  <th className="py-2 pl-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[rgba(40,54,24,0.03)]"
                  >
                    <td className="py-2 pr-2 text-[var(--sc-green-dark)] whitespace-nowrap">
                      {t.timestamp.split("T")[0]}
                    </td>
                    <td className="py-2 pr-2 max-w-[150px] truncate">{t.description}</td>
                    <td className="py-2 pr-2 hidden sm:table-cell">{t.category}</td>
                    <td className="py-2 pr-2">
                      <span className="rounded-full px-1.5 sm:px-2 py-0.5 text-[0.6rem] sm:text-[0.65rem] bg-[rgba(96,108,56,0.08)] text-[var(--sc-green-dark)] whitespace-nowrap">
                        {t.isOnCampus ? "On" : "Off"}
                      </span>
                    </td>
                    <td
                      className={`py-2 pl-2 text-right font-semibold whitespace-nowrap ${
                        t.amount < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {t.amount < 0 ? "-" : "+"}
                      {t.currency} {Math.abs(t.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
