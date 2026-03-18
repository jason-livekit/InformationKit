"use client";

import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-fg3 hover:text-fg1 transition-colors shrink-0"
      aria-label="Copy import"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 8.5l3.5 3.5 6.5-8" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M10.5 5.5V3a1.5 1.5 0 00-1.5-1.5H3A1.5 1.5 0 001.5 3v6A1.5 1.5 0 003 10.5h2.5" />
        </svg>
      )}
    </button>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-fg3 uppercase tracking-wider">
        {label}
      </p>
      {children}
    </div>
  );
}

export function ExampleCard({
  children,
  title,
  description,
  id,
  importPath,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  id: string;
  importPath?: string;
}) {
  return (
    <div id={id} className="scroll-mt-20">
      <h3 className="text-base font-semibold text-fg0">{title}</h3>
      <p className="text-sm text-fg3 mt-1 mb-3">{description}</p>
      {importPath && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-bg2 rounded-md font-mono text-xs text-fg3 w-fit">
          <span>
            import {"{ ... }"} from &quot;{importPath}&quot;
          </span>
          <CopyButton text={`import { ${title} } from "${importPath}"`} />
        </div>
      )}
      <div className="bg-bg1 border border-separator1 rounded-lg p-6 space-y-6">
        {children}
      </div>
    </div>
  );
}

ExampleCard.Group = Group;
