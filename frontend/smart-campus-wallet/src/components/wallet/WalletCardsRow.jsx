import React from "react";

const WalletCardsRow = ({ wallets }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mb-6">
      {wallets.map((w) => (
        <div
          key={w.id}
          className={`relative overflow-hidden rounded-2xl p-4 shadow-sm border border-slate-200 bg-gradient-to-br ${
            w.type === "CAMPUS"
              ? "from-slate-900 to-slate-800 text-white"
              : w.type === "BANK"
              ? "from-sky-500 to-sky-600 text-white"
              : "from-emerald-50 to-emerald-100 text-slate-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-80">
                {w.type === "CAMPUS"
                  ? "Campus Wallet"
                  : w.type === "MEAL_PLAN"
                  ? "Meal Plan"
                  : w.type === "DINING_DOLLARS"
                  ? "Dining Dollars"
                  : "Linked Bank"}
              </p>
              <h3 className="mt-1 text-sm font-semibold">{w.displayName}</h3>
            </div>
            <div className="text-right">
              <p className="text-[0.65rem] uppercase tracking-wide opacity-70">
                Balance
              </p>
              <p className="text-lg font-semibold">
                {w.currency === "SWIPES"
                  ? `${w.balance} swipes`
                  : `${w.currency} ${w.balance.toFixed(2)}`}
              </p>
            </div>
          </div>
          {w.type === "CAMPUS" && (
            <p className="mt-3 text-[0.7rem] opacity-80">
              Default for Tap &amp; Pay on campus.
            </p>
          )}
          {w.type === "MEAL_PLAN" && (
            <p className="mt-3 text-[0.7rem] opacity-80">
              Swipes reset every Sunday midnight.
            </p>
          )}
          {w.type === "BANK" && (
            <p className="mt-3 text-[0.7rem] opacity-80">
              Read-only balance synced from your bank.
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default WalletCardsRow;
