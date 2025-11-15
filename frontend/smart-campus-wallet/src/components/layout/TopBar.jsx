import React from "react";

const TopBar = ({ user }) => (
  <header className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow">
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-xl bg-emerald-400 flex items-center justify-center font-bold text-slate-900">
        SC
      </div>
      <div>
        <h1 className="text-lg font-semibold">Smart Campus Wallet</h1>
        <p className="text-xs text-slate-300">
          {user.university} · {user.semester}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-slate-300">Student</p>
      </div>
      <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-xs">
        {user.name
          .split(" ")
          .map((n) => n[0])
          .join("")}
      </div>
    </div>
  </header>
);

export default TopBar;
