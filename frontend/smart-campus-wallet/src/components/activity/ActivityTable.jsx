import React from "react";
import Card from "../ui/Card";
import Tag from "../ui/Tag";

const ActivityTable = ({ transactions }) => {
  return (
    <Card>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[0.7rem] text-slate-500 border-b border-slate-100">
            <th className="py-2">Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Campus</th>
            <th className="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-slate-50">
              <td className="py-1.5 text-slate-600">{tx.date}</td>
              <td className="py-1.5 text-slate-800">{tx.description}</td>
              <td className="py-1.5 text-slate-600">{tx.category}</td>
              <td className="py-1.5">
                <Tag variant={tx.isOnCampus ? "success" : "muted"}>
                  {tx.isOnCampus ? "On-campus" : "Off-campus"}
                </Tag>
              </td>
              <td
                className={`py-1.5 text-right font-semibold ${
                  tx.amount < 0 ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                {tx.amount < 0 ? "-" : "+"}
                {tx.currency} {Math.abs(tx.amount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default ActivityTable;
