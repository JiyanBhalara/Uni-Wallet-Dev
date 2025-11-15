import React from "react";

const PageShell = ({ children }) => (
  <div className="px-6 py-4 bg-slate-50 min-h-[calc(100vh-112px)]">
    {children}
  </div>
);

export default PageShell;
