import React from "react";
import PageShell from "../components/ui/PageShell";
import ActivityTable from "../components/activity/ActivityTable";

const ActivitySection = ({ transactions }) => (
  <PageShell>
    <h2 className="text-base font-semibold text-slate-900 mb-4">
      Full activity
    </h2>
    <ActivityTable transactions={transactions} />
  </PageShell>
);

export default ActivitySection;
