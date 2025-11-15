import React from "react";

const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
