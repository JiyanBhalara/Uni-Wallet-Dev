import React from "react";
import PageShell from "../components/ui/PageShell";
import WalletCardsRow from "../components/wallet/WalletCardsRow";
import RecentTransactions from "../components/activity/RecentTransactions";
import EventsPreview from "../components/events/EventsPreview";
import RewardsSummary from "../components/rewards/RewardsSummary";
import TapToPayMock from "../components/wallet/TapToPayMock";
import Card from "../components/ui/Card";

const DashboardSection = ({ wallets, transactions, events, rewards }) => {
  const totalCampusSpend = transactions
    .filter((t) => t.isOnCampus)
    .reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);

  const totalOffCampusSpend = transactions
    .filter((t) => !t.isOnCampus)
    .reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);

  return (
    <PageShell>
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <WalletCardsRow wallets={wallets} />
          <div className="grid md:grid-cols-2 gap-4">
            <RecentTransactions transactions={transactions} />
            <EventsPreview events={events} />
          </div>
        </div>
        <div className="space-y-4">
          <RewardsSummary rewards={rewards} />
          <Card>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Campus spend snapshot
            </h2>
            <p className="text-xs text-slate-500 mb-2">
              Last few transactions (sample):
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">On-campus spend</span>
                <span className="font-semibold text-slate-900">
                  USD {totalCampusSpend.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Off-campus spend</span>
                <span className="font-semibold text-slate-900">
                  USD {totalOffCampusSpend.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
          <TapToPayMock />
        </div>
      </div>
    </PageShell>
  );
};

export default DashboardSection;
