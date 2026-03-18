"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggleStandalone } from "@/components/custom/theme-toggle-standalone";
import { CATEGORIES } from "./components/_shared/component-registry";

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Extract the current category slug from the pathname
  // e.g. /components/buttons-actions → "buttons-actions"
  const activeSlug = pathname.split("/components/")[1]?.split("/")[0]?.split("#")[0] ?? "";

  return (
    <div className="flex h-screen bg-bg0">
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-bg1 border border-separator1 text-fg1"
        aria-label="Toggle navigation"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {mobileOpen ? (
            <path d="M5 5l10 10M15 5L5 15" />
          ) : (
            <path d="M3 5h14M3 10h14M3 15h14" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <nav
        className={`
          fixed inset-y-0 left-0 z-40 w-60 bg-bg1 border-r border-separator1
          flex flex-col overflow-hidden
          transition-transform duration-200
          md:relative md:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-separator1 shrink-0">
          <Link
            href="/"
            className="text-xs text-fg3 hover:text-fg1 transition-colors"
          >
            &larr; Back to app
          </Link>
          <span className="text-separator2">/</span>
          <Link
            href="/components"
            className="text-sm font-semibold text-fg0 hover:text-fgAccent1 transition-colors"
          >
            Components
          </Link>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {CATEGORIES.map((category) => {
            const isActiveCategory = activeSlug === category.slug;

            return (
              <div key={category.slug} className="mb-4">
                <Link
                  href={`/components/${category.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-2 mb-1 group"
                >
                  <h3
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isActiveCategory
                        ? "text-fgAccent1"
                        : "text-fg3 group-hover:text-fg1"
                    } transition-colors`}
                  >
                    {category.title}
                  </h3>
                  <span
                    className={`text-[10px] tabular-nums ${
                      isActiveCategory ? "text-fgAccent1" : "text-fg3"
                    }`}
                  >
                    {category.components.length}
                  </span>
                </Link>
                <ul className="flex flex-col">
                  {category.components.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/components/${category.slug}#${item.id}`}
                        onClick={() => setMobileOpen(false)}
                        className={`
                          block w-full text-left px-2 py-1 rounded text-sm transition-colors
                          ${
                            isActiveCategory
                              ? "text-fg1 hover:text-fgAccent1 hover:bg-bgAccent1"
                              : "text-fg2 hover:text-fg0 hover:bg-bg2"
                          }
                        `}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3 border-t border-separator1 flex items-center justify-between">
          <span className="text-xs text-fg3">Theme</span>
          <ThemeToggleStandalone />
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth">{children}</main>
    </div>
  );
}
