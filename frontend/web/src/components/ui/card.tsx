import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl sm:rounded-3xl bg-white shadow-md border border-[rgba(40,54,24,0.08)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-3 sm:px-4 pt-3 sm:pt-4 pb-2 flex items-center justify-between gap-2", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-3 sm:px-4 pb-3 sm:pb-4 pt-1", className)} {...props} />
  );
}
