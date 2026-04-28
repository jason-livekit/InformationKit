"use client";

import { Separator } from "@/components/bytes/Separator";
import { ScrollArea } from "@/components/bytes/ScrollArea";
import { Spinner } from "@/components/bytes/Spinner";
import { CopyToClipboard } from "@/components/bytes/CopyToClipboard";
import { ExampleCard } from "../_shared/example-card";

export default function LayoutUtilitiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-16">
      <div>
        <h2 className="text-xl font-bold text-fg0">Layout & Utilities</h2>
        <p className="text-sm text-fg3 mt-1">
          Structural components and utility helpers.
        </p>
      </div>

      <ExampleCard
        id="separator"
        title="Separator"
        description="Visual divider between content sections."
        importPath="@/components/bytes/Separator"
      >
        <ExampleCard.Group label="Horizontal">
          <div>
            <p className="text-sm text-fg2">Content above</p>
            <Separator className="my-3" />
            <p className="text-sm text-fg2">Content below</p>
          </div>
        </ExampleCard.Group>
        <ExampleCard.Group label="Vertical">
          <div className="flex items-center gap-3 h-6">
            <span className="text-sm text-fg2">Left</span>
            <Separator orientation="vertical" />
            <span className="text-sm text-fg2">Center</span>
            <Separator orientation="vertical" />
            <span className="text-sm text-fg2">Right</span>
          </div>
        </ExampleCard.Group>
      </ExampleCard>

      <ExampleCard
        id="scroll-area"
        title="ScrollArea"
        description="Custom scrollable container with styled scrollbar."
        importPath="@/components/bytes/ScrollArea"
      >
        <ScrollArea className="h-48 w-full rounded border border-separator1 p-4">
          <div className="space-y-3">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-fg2"
              >
                <span className="font-mono text-xs text-fg3 w-6">
                  {(i + 1).toString().padStart(2, "0")}
                </span>
                <span>List item {i + 1}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </ExampleCard>

      <ExampleCard
        id="spinner"
        title="Spinner"
        description="Loading indicator in different sizes."
        importPath="@/components/bytes/Spinner"
      >
        <div className="flex items-end gap-4">
          <div className="text-center">
            <Spinner diameter={16} strokeWidth={3} className="text-fg3" />
            <p className="text-xs text-fg3 mt-2">16px</p>
          </div>
          <div className="text-center">
            <Spinner
              diameter={20}
              strokeWidth={4}
              className="text-fgAccent1"
            />
            <p className="text-xs text-fg3 mt-2">20px</p>
          </div>
          <div className="text-center">
            <Spinner
              diameter={32}
              strokeWidth={4}
              className="text-fgAccent1"
            />
            <p className="text-xs text-fg3 mt-2">32px</p>
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        id="copy-to-clipboard"
        title="CopyToClipboard"
        description="Button that copies text to clipboard with success feedback."
        importPath="@/components/bytes/CopyToClipboard"
      >
        <div className="flex flex-wrap gap-3">
          <CopyToClipboard textToCopy="Hello, clipboard!" label="Copy text" />
          <CopyToClipboard
            textToCopy="https://example.com/api/v1"
            label="Copy URL"
            icon="chain-link"
          />
          <CopyToClipboard
            textToCopy="RM_dTTtaqrTdUJt"
            promptText="Copy session ID"
          />
        </div>
      </ExampleCard>
    </div>
  );
}
