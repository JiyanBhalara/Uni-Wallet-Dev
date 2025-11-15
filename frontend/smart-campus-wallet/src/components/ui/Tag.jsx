import React from "react";

const Tag = ({ children, variant = "default" }) => {
  const base = "inline-flex px-2 py-0.5 rounded-full text-[0.65rem]";
  const styles =
    variant === "success"
      ? "bg-emerald-50 text-emerald-700"
      : variant === "muted"
      ? "bg-slate-100 text-slate-600"
      : "bg-slate-800 text-slate-100";

  return <span className={`${base} ${styles}`}>{children}</span>;
};

export default Tag;
