'use client';

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/bytes/Collapsible';
import { useSidebar } from '@/components/bytes/Sidebar';
import { cn } from '@/lib/bytes/utils';

export interface NavChildItem {
  label: string;
  href: string;
  badge?: ReactNode;
}

interface NavItemAccordionProps {
  icon: ReactNode;
  label: string;
  items: NavChildItem[];
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
  const isCollapsed = state === 'collapsed';
  const shouldReduceMotion = useReducedMotion();

  const activeChild = items.find(
    (child) => pathname === child.href || pathname.startsWith(`${child.href}/`),
  );
  const isAnyChildActive = !!activeChild;
  const [manualOpenState, setManualOpenState] = useState<boolean | null>(null);
  const isOpen = isAnyChildActive || (manualOpenState ?? defaultOpen);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setManualOpenState(true);
      return;
    }

    if (!isAnyChildActive) {
      setManualOpenState(false);
    }
  };

  const contentVariants = {
    open: {
      height: 'auto',
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            type: 'spring' as const,
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
            type: 'spring' as const,
            stiffness: 300,
            damping: 30,
            opacity: { duration: 0.15 },
          },
    },
  };

  const childVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            opacity: { duration: 0.15 },
            y: { type: 'spring' as const, stiffness: 300, damping: 30 },
          },
    },
    closed: {
      opacity: 0,
      y: -4,
      transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.1 },
    },
  };

  const chevronVariants = {
    open: {
      rotate: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 300, damping: 30 },
    },
    closed: {
      rotate: 180,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { type: 'spring' as const, stiffness: 300, damping: 30 },
    },
  };

  const handleMainClick = (event: React.MouseEvent) => {
    event.preventDefault();

    if (items.length > 0) {
      router.push(items[0].href);
      setManualOpenState(true);
    }
  };

  if (isCollapsed) {
    return (
      <Link
        href={items[0]?.href || '#'}
        className={cn(
          'flex h-[38px] cursor-pointer items-center justify-center gap-3 rounded-lg px-2 transition-colors',
          isAnyChildActive
            ? 'bg-bgAccent1 font-semibold text-fgAccent1'
            : 'text-fg3 hover:bg-bg2',
        )}
        aria-label={label}
      >
        {icon}
      </Link>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <div
        className={cn(
          'flex h-[38px] cursor-pointer items-center gap-3 rounded-lg pl-3 pr-1.5 transition-colors',
          isAnyChildActive ? 'text-fgAccent1 hover:bg-bgAccent1/50' : 'text-fg3 hover:bg-bg2',
        )}
      >
        <button
          onClick={handleMainClick}
          className="flex h-full flex-1 items-center gap-3 text-left"
          aria-label={`Navigate to ${label}`}
        >
          {icon}
          <span className={cn('text-sm', isAnyChildActive ? 'font-semibold' : 'font-normal')}>
            {label}
          </span>
        </button>

        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'rounded-md p-1.5 transition-colors hover:bg-bg3',
              isAnyChildActive ? 'text-fgAccent1' : 'text-fg4',
            )}
            onClick={(event) => event.stopPropagation()}
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
              animate={isOpen ? 'open' : 'closed'}
              initial={false}
              className="size-4"
            >
              <path d="m18 15-6-6-6 6" />
            </motion.svg>
          </button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="overflow-hidden">
        <motion.div variants={contentVariants} initial={false} animate={isOpen ? 'open' : 'closed'}>
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
                pathname === child.href || pathname.startsWith(`${child.href}/`);

              return (
                <motion.div key={child.href} variants={childVariants}>
                  <Link
                    href={child.href}
                    className={cn(
                      'flex h-[38px] cursor-pointer items-center rounded-lg pl-11 pr-3 transition-colors',
                      isChildActive
                        ? 'bg-bgAccent1 font-semibold text-fgAccent1'
                        : 'text-fg3 hover:bg-bg2',
                    )}
                  >
                    <span className="text-sm">{child.label}</span>
                    {child.badge && <span className="ml-2">{child.badge}</span>}
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

export function NavBadge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning';
}) {
  return (
    <span
      className={cn(
        'rounded px-2 py-0.5 text-[10px] font-semibold uppercase',
        variant === 'default' && 'bg-bgAccent2 text-fgAccent1',
        variant === 'success' && 'bg-bgSuccess1 text-fgSuccess',
        variant === 'warning' && 'bg-bgModerate1 text-fgModerate',
      )}
    >
      {children}
    </span>
  );
}
