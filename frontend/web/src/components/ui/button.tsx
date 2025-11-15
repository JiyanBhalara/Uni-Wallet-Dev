"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-full text-xs sm:text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sc-cream)] disabled:opacity-60 disabled:pointer-events-none px-3 sm:px-4 py-1.5 sm:py-2";

    const variants: Record<ButtonVariant, string> = {
      primary:
        "bg-[var(--sc-green-dark)] text-[var(--sc-cream)] hover:bg-[var(--sc-green)] shadow-sm",
      ghost:
        "bg-transparent text-[var(--sc-green-dark)] hover:bg-[rgba(40,54,24,0.06)]",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
