import React from "react";
import PageShell from "../components/ui/PageShell";
import RewardsSummary from "../components/rewards/RewardsSummary";

const RewardsSection = ({ rewards }) => (
  <PageShell>
    <h2 className="text-base font-semibold text-slate-900 mb-4">
      Rewards & incentives
    </h2>
    <div className="max-w-md">
      <RewardsSummary rewards={rewards} />
    </div>
    <p className="mt-3 text-xs text-slate-500">
      Future idea: earn extra points for attending wellbeing events, using
      public transit, or staying within personal budgets.
    </p>
  </PageShell>
);

export default RewardsSection;
