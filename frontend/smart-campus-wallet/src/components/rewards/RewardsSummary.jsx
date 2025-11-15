import React from "react";

const RewardsSummary = ({ rewards }) => {
  const progress =
    rewards && rewards.nextTierAt
      ? Math.min(100, (rewards.points / rewards.nextTierAt) * 100)
      : 0;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
      <h2 className="text-sm font-semibold mb-1">Rewards</h2>
      <p className="text-xs text-slate-300 mb-3">
        Earn points by using your campus wallet and joining events.
      </p>
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">
            Current points
          </p>
          <p className="text-2xl font-semibold">{rewards.points}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-300">Tier: {rewards.tier}</p>
          <p className="text-[0.7rem] text-slate-400">
            Next tier at {rewards.nextTierAt} pts
          </p>
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden mb-1">
        <div
          className="h-full bg-emerald-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[0.7rem] text-slate-400">
        {Math.max(rewards.nextTierAt - rewards.points, 0)} pts to the next
        level.
      </p>
    </div>
  );
};

export default RewardsSummary;
