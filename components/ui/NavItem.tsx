"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  href: string;
}

export function NavItem({ icon, label, href }: NavItemProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
  const isCollapsed = state === "collapsed";

  return (
    <Link
      href={href}
      className={cn(
        "gap-3 h-[38px] flex items-center cursor-pointer rounded-lg transition-colors",
        isCollapsed ? "justify-center px-2" : "pl-3 pr-1.5",
        isActive 
          ? "bg-bgAccent1 text-fgAccent1 font-semibold" 
          : "text-fg3 hover:bg-bg2"
      )}
    >
      {icon}
      {!isCollapsed && <span className="text-sm font-regular">{label}</span>}
    </Link>
  );
}
