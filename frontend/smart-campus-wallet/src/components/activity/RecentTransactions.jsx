import React from "react";
import Card from "../ui/Card";

const RecentTransactions = ({ transactions, limit = 5 }) => {
  const sliced = transactions.slice(0, limit);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Recent activity
        </h2>
        <span className="text-xs text-slate-500">{sliced.length} items</span>
      </div>
      <ul className="space-y-2">
        {sliced.map((tx) => (
          <li
            key={tx.id}
            className="flex items-center justify-between text-xs py-1.5"
          >
            <div>
              <p className="font-medium text-slate-800">{tx.description}</p>
              <p className="text-[0.7rem] text-slate-500">
                {tx.date} · {tx.category} ·{" "}
                {tx.isOnCampus ? "On-campus" : "Off-campus"}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`font-semibold ${
                  tx.amount < 0 ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                {tx.amount < 0 ? "-" : "+"}
                {tx.currency} {Math.abs(tx.amount).toFixed(2)}
              </p>
              <p className="text-[0.65rem] text-slate-400">
                {tx.walletId === "bank-linked" ? "Bank" : "Campus"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default RecentTransactions;
