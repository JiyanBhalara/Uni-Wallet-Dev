"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/wallets", label: "Wallets" },
  { href: "/activity", label: "Activity" },
  { href: "/events", label: "Campus Life" },
  { href: "/rewards", label: "Rewards" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto scrollbar-hide">
      {links.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);

        return (
          <Link key={link.href} href={link.href}>
            <Button
              variant={active ? "primary" : "ghost"}
              className={cn(
                "text-[0.7rem] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 whitespace-nowrap",
                active && "shadow"
              )}
            >
              {link.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
}
