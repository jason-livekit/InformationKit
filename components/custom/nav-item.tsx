'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useSidebar } from '@/components/bytes/Sidebar';
import { cn } from '@/lib/bytes/utils';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  href: string;
}

export function NavItem({ icon, label, href }: NavItemProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  const isCollapsed = state === 'collapsed';

  return (
    <Link
      href={href}
      className={cn(
        'flex h-[38px] cursor-pointer items-center gap-3 rounded-lg transition-colors',
        isCollapsed ? 'justify-center px-2' : 'pl-3 pr-1.5',
        isActive ? 'bg-bgAccent1 font-semibold text-fgAccent1' : 'text-fg3 hover:bg-bg2',
      )}
    >
      {icon}
      {!isCollapsed && <span className="text-sm font-regular">{label}</span>}
    </Link>
  );
}
