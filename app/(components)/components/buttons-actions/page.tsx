"use client";

import { Button } from "@/components/bytes/Button";
import { TaskButton } from "@/components/bytes/TaskButton";
import { ExampleCard } from "../_shared/example-card";

export default function ButtonsActionsPage() {
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
        importPath="@/components/bytes/Button"
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
        importPath="@/components/bytes/TaskButton"
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

    </div>
  );
}
