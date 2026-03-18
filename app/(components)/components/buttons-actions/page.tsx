"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskButton } from "@/components/ui/task-button";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import SegmentedControl from "@/components/ui/segmented-control";
import { ExampleCard } from "../_shared/example-card";

export default function ButtonsActionsPage() {
  const [segmentedValue, setSegmentedValue] = useState("option-1");

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-16">
      <div>
        <h2 className="text-xl font-bold text-fg0">Buttons & Actions</h2>
        <p className="text-sm text-fg3 mt-1">
          Interactive buttons, toggles, and action controls.
        </p>
      </div>

      <ExampleCard
        id="button"
        title="Button"
        description="All variants and sizes. Supports icons, disabled state, and asChild composition."
        importPath="@/components/ui/button"
      >
        <ExampleCard.Group label="Variants">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </ExampleCard.Group>
        <ExampleCard.Group label="Sizes">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" size="xl">Extra Large</Button>
          </div>
        </ExampleCard.Group>
        <ExampleCard.Group label="Disabled">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled>Disabled Primary</Button>
            <Button variant="outline" disabled>Disabled Outline</Button>
          </div>
        </ExampleCard.Group>
      </ExampleCard>

      <ExampleCard
        id="task-button"
        title="TaskButton"
        description="Async button that shows a loading spinner while the onClick promise resolves."
        importPath="@/components/ui/task-button"
      >
        <div className="flex flex-wrap gap-2">
          <TaskButton
            variant="primary"
            onClick={() => new Promise((r) => setTimeout(r, 2000))}
          >
            Click me (2s async)
          </TaskButton>
          <TaskButton
            variant="secondary"
            onClick={() => new Promise((r) => setTimeout(r, 1500))}
          >
            Save changes
          </TaskButton>
          <TaskButton variant="outline" isPending>
            Permanently pending
          </TaskButton>
        </div>
      </ExampleCard>

      <ExampleCard
        id="toggle"
        title="Toggle / ToggleGroup"
        description="Toggle buttons that maintain on/off state. Can be grouped for multi-option selection."
        importPath="@/components/ui/toggle"
      >
        <ExampleCard.Group label="Standalone">
          <div className="flex gap-2">
            <Toggle aria-label="Toggle bold">
              <span className="font-bold">B</span>
            </Toggle>
            <Toggle aria-label="Toggle italic">
              <span className="italic">I</span>
            </Toggle>
            <Toggle aria-label="Toggle underline">
              <span className="underline">U</span>
            </Toggle>
          </div>
        </ExampleCard.Group>
        <ExampleCard.Group label="Grouped (outline)">
          <ToggleGroup type="multiple" variant="outline">
            <ToggleGroupItem value="bold" aria-label="Toggle bold">
              <span className="font-bold">B</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic">
              <span className="italic">I</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Toggle underline">
              <span className="underline">U</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </ExampleCard.Group>
      </ExampleCard>

      <ExampleCard
        id="segmented-control"
        title="SegmentedControl"
        description="A button group toggle for switching between a set of related options."
        importPath="@/components/ui/segmented-control"
      >
        <div className="max-w-sm space-y-3">
          <SegmentedControl
            value={segmentedValue}
            onValueChange={setSegmentedValue}
            options={[
              { value: "option-1", label: "Daily" },
              { value: "option-2", label: "Weekly" },
              { value: "option-3", label: "Monthly" },
            ]}
          />
          <p className="text-xs text-fg3">Selected: {segmentedValue}</p>
        </div>
      </ExampleCard>
    </div>
  );
}
