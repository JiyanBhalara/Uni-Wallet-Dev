"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Wallet, 
  Activity, 
  Calendar, 
  Gift, 
  Target,
  LogOut 
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallets", label: "Wallets", icon: Wallet },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/budgeting", label: "Budget & Goals", icon: Target },
  { href: "/events", label: "Campus Life", icon: Calendar },
  { href: "/rewards", label: "Rewards", icon: Gift },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex md:flex-row flex-col md:items-center gap-1 sm:gap-1.5 w-full md:w-auto">
      <div className="flex md:flex-row flex-col md:items-center gap-1 sm:gap-1.5 w-full md:w-auto">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href} className="w-full md:w-auto">
              <Button
                variant={active ? "primary" : "ghost"}
                className={cn(
                  "text-[0.7rem] sm:text-xs lg:text-sm px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 whitespace-nowrap font-medium transition-all duration-200 w-full md:w-auto justify-start md:justify-center",
                  active && "shadow-sm"
                )}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                {link.label}
              </Button>
            </Link>
          );
        })}
      </div>
      
      <div className="md:ml-2 lg:ml-3 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-[rgba(40,54,24,0.08)] md:pl-2 lg:pl-3 mt-2 md:mt-0">
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-[0.7rem] sm:text-xs lg:text-sm px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 font-medium w-full md:w-auto justify-start md:justify-center"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
          Logout
        </Button>
      </div>
    </nav>
  );
}
