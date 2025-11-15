"use client";

import React, { useState } from "react";
import TopBar from "../layout/TopBar";
import NavTabs from "../layout/NavTabs";

import { userData } from "../../data/userData";
import { walletsData } from "../../data/walletsData";
import { transactionsData } from "../../data/transactionsData";
import { eventsData } from "../../data/eventsData";
import { rewardsData } from "../../data/rewardsData";

import DashboardSection from "../../sections/DashboardSection";
import WalletsSection from "../../sections/WalletsSection";
import ActivitySection from "../../sections/ActivitySection";
import EventsSection from "../../sections/EventsSection";
import RewardsSection from "../../sections/RewardsSection";

const AppShell = () => {
  const [tab, setTab] = useState("dashboard");

  let content = null;
  if (tab === "dashboard") {
    content = (
      <DashboardSection
        wallets={walletsData}
        transactions={transactionsData}
        events={eventsData}
        rewards={rewardsData}
      />
    );
  } else if (tab === "wallets") {
    content = <WalletsSection wallets={walletsData} />;
  } else if (tab === "activity") {
    content = <ActivitySection transactions={transactionsData} />;
  } else if (tab === "events") {
    content = <EventsSection events={eventsData} />;
  } else if (tab === "rewards") {
    content = <RewardsSection rewards={rewardsData} />;
  }
  console.log("userData:", userData);

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <TopBar user={userData} />
      <NavTabs currentTab={tab} onChange={setTab} />
      {content}
    </div>
  );
};

export default AppShell;
