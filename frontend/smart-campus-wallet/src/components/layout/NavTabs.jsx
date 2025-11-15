import React from "react";

const NavTabs = ({ currentTab, onChange }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "wallets", label: "Wallets" },
    { id: "activity", label: "Activity" },
    { id: "events", label: "Campus Life" },
    { id: "rewards", label: "Rewards" },
  ];

  return (
    <nav className="flex gap-2 px-6 pt-4 pb-2 bg-slate-900">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
            currentTab === tab.id
              ? "bg-emerald-400 text-slate-900"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default NavTabs;
