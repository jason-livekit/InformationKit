"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion, useReducedMotion } from "motion/react";

export interface NavChildItem {
  label: string;
  href: string;
  badge?: ReactNode;
}

interface NavItemAccordionProps {
  icon: ReactNode;
  label: string;
  items: NavChildItem[];
  /** Whether the accordion starts expanded. Defaults to false - will auto-expand if a child route is active */
  defaultOpen?: boolean;
}

export function NavItemAccordion({
  icon,
  label,
  items,
  defaultOpen = false,
}: NavItemAccordionProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const shouldReduceMotion = useReducedMotion();

  // Check if any child is active
  const activeChild = items.find(
    (child) =>
      pathname === child.href || pathname.startsWith(child.href + "/")
  );
  const isAnyChildActive = !!activeChild;

  // Track if user has manually opened this accordion (should persist across navigation)
  // Note: Each accordion manages its own independent state, allowing multiple
  // accordions to be open simultaneously. Opening one does not close others.
  const [manualOpenState, setManualOpenState] = useState<boolean | null>(() => {
    // null means user hasn't interacted yet, so we'll use defaultOpen
    // true/false means user has manually opened/closed
    return null;
  });

  // Derive open state declaratively from route state and manual interactions
  // Priority: active child route > manual user interaction > defaultOpen prop
  const isOpen = isAnyChildActive || (manualOpenState ?? defaultOpen);

  // Track manual opens to persist them across navigation
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Mark as manually opened so it stays open during navigation
      setManualOpenState(true);
    } else {
      // Only clear the manual flag if user explicitly closes AND no child is active
      if (!isAnyChildActive) {
        setManualOpenState(false);
      }
    }
  };

  // Animation variants for accordion content
  const contentVariants = {
    open: {
      height: "auto",
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            type: "spring" as const,
            stiffness: 300,
            damping: 30,
            opacity: { duration: 0.15 },
          },
    },
    closed: {
      height: 0,
      opacity: 0,
      y: -8,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            type: "spring" as const,
            stiffness: 300,
            damping: 30,
            opacity: { duration: 0.15 },
          },
    },
  };

  // Animation variants for child items (stagger)
  const childVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            opacity: { duration: 0.15 },
            y: { type: "spring" as const, stiffness: 300, damping: 30 },
          },
    },
    closed: {
      opacity: 0,
      y: -4,
      transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.1 },
    },
  };

  // Chevron rotation animation
  const chevronVariants = {
    open: {
      rotate: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 300, damping: 30 },
    },
    closed: {
      rotate: 180,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 300, damping: 30 },
    },
  };

  // Handle clicking the main area (label/icon) - navigate to first child
  const handleMainClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (items.length > 0) {
      // Navigate to first child - accordion will auto-open via isAnyChildActive derivation
      router.push(items[0].href);
      // Mark as manually opened to persist state
      setManualOpenState(true);
    }
  };

  // In collapsed sidebar mode, just show icon with tooltip behavior
  if (isCollapsed) {
    return (
      <Link
        href={items[0]?.href || "#"}
        className={cn(
          "gap-3 h-[38px] flex items-center cursor-pointer rounded-lg transition-colors justify-center px-2",
          isAnyChildActive
            ? "bg-bgAccent1 text-fgAccent1 font-semibold"
            : "text-fg3 hover:bg-bg2"
        )}
        aria-label={label}
      >
        {icon}
      </Link>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      {/* Parent row */}
      <div
        className={cn(
          "gap-3 h-[38px] flex items-center cursor-pointer rounded-lg transition-colors pl-3 pr-1.5",
          isAnyChildActive 
            ? "text-fgAccent1 hover:bg-bgAccent1/50" 
            : "text-fg3 hover:bg-bg2"
        )}
      >
        {/* Main clickable area - navigates to first child */}
        <button
          onClick={handleMainClick}
          className="flex items-center gap-3 flex-1 h-full text-left"
          aria-label={`Navigate to ${label}`}
        >
          {icon}
          <span
            className={cn(
              "text-sm",
              isAnyChildActive ? "font-semibold" : "font-normal"
            )}
          >
            {label}
          </span>
        </button>

        {/* Chevron toggle - only expands/collapses */}
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "p-1.5 rounded-md transition-colors hover:bg-bg3",
              isAnyChildActive ? "text-fgAccent1" : "text-fg4"
            )}
            onClick={(e) => e.stopPropagation()}
            aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`}
          >
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={chevronVariants}
              animate={isOpen ? "open" : "closed"}
              initial={false}
              className="size-4"
            >
              <path d="m18 15-6-6-6 6" />
            </motion.svg>
          </button>
        </CollapsibleTrigger>
      </div>

      {/* Child items */}
      <CollapsibleContent className="overflow-hidden">
        <motion.div
          variants={contentVariants}
          initial={false}
          animate={isOpen ? "open" : "closed"}
        >
          <motion.div
            className="flex flex-col gap-0.5 pt-0.5"
            variants={{
              open: {
                transition: {
                  staggerChildren: shouldReduceMotion ? 0 : 0.03,
                  delayChildren: shouldReduceMotion ? 0 : 0.05,
                },
              },
            }}
          >
            {items.map((child) => {
              const isChildActive =
                pathname === child.href ||
                pathname.startsWith(child.href + "/");

              return (
                <motion.div
                  key={child.href}
                  variants={childVariants}
                >
                  <Link
                    href={child.href}
                    className={cn(
                      "h-[38px] flex items-center cursor-pointer rounded-lg transition-colors pl-11 pr-3",
                      isChildActive
                        ? "bg-bgAccent1 text-fgAccent1 font-semibold"
                        : "text-fg3 hover:bg-bg2"
                    )}
                  >
                    <span className="text-sm">{child.label}</span>
                    {child.badge && (
                      <span className="ml-2">{child.badge}</span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Badge component for navigation items
export function NavBadge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[10px] font-semibold uppercase rounded",
        variant === "default" && "bg-bgAccent2 text-fgAccent1",
        variant === "success" && "bg-bgSuccess1 text-fgSuccess",
        variant === "warning" && "bg-bgModerate1 text-fgModerate"
      )}
    >
      {children}
    </span>
  );
}
