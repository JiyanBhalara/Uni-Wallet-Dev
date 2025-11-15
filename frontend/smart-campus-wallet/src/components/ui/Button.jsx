import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "sm",
  className = "",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-full font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 focus:ring-offset-slate-900";

  const variants = {
    primary: "bg-emerald-400 text-slate-900 hover:bg-emerald-300",
    ghost: "bg-slate-800 text-slate-100 hover:bg-slate-700",
    outline:
      "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
