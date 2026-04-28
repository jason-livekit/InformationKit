"use client";

import { useState } from "react";
import { Input } from "@/components/bytes/Input";
import { Textarea } from "@/components/bytes/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/bytes/Select";
import { Checkbox } from "@/components/bytes/Checkbox";
import { Switch } from "@/components/bytes/Switch";
import { Label } from "@/components/bytes/Label";
import { ExampleCard } from "../_shared/example-card";

export default function FormsInputsPage() {
  const [selectValue, setSelectValue] = useState<string>("");
  const [checkbox1, setCheckbox1] = useState(true);
  const [checkbox2, setCheckbox2] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-16">
      <div>
        <h2 className="text-xl font-bold text-fg0">Forms & Inputs</h2>
        <p className="text-sm text-fg3 mt-1">
          Form controls for collecting user input.
        </p>
      </div>

      <ExampleCard
        id="input"
        title="Input"
        description="Standard text input with placeholder."
        importPath="@/components/bytes/Input"
      >
        <div className="space-y-3 max-w-sm">
          <Input placeholder="Default input" />
          <Input placeholder="Disabled input" disabled />
        </div>
      </ExampleCard>

      <ExampleCard
        id="textarea"
        title="Textarea"
        description="Multiline text area for longer content."
        importPath="@/components/bytes/Textarea"
      >
        <div className="max-w-sm">
          <Textarea placeholder="Write something here..." />
        </div>
      </ExampleCard>

      <ExampleCard
        id="select"
        title="Select"
        description="Dropdown selection from a list of options."
        importPath="@/components/bytes/Select"
      >
        <div className="max-w-sm space-y-2">
          <Select
            value={selectValue}
            onValueChange={setSelectValue}
            variant="primary"
            size="md"
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="next">Next.js</SelectItem>
              <SelectItem value="remix">Remix</SelectItem>
              <SelectItem value="astro">Astro</SelectItem>
              <SelectItem value="nuxt">Nuxt</SelectItem>
            </SelectContent>
          </Select>
          {selectValue && (
            <p className="text-xs text-fg3">Selected: {selectValue}</p>
          )}
        </div>
      </ExampleCard>

      <ExampleCard
        id="checkbox"
        title="Checkbox"
        description="Checkbox inputs with checked, unchecked, and disabled states."
        importPath="@/components/bytes/Checkbox"
      >
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-fg2 cursor-pointer">
            <Checkbox
              checked={checkbox1}
              onCheckedChange={(c) => setCheckbox1(c === true)}
            />
            Checked (interactive)
          </label>
          <label className="flex items-center gap-2 text-sm text-fg2 cursor-pointer">
            <Checkbox
              checked={checkbox2}
              onCheckedChange={(c) => setCheckbox2(c === true)}
            />
            Unchecked (interactive)
          </label>
          <label className="flex items-center gap-2 text-sm text-fg2 opacity-60 cursor-not-allowed">
            <Checkbox checked disabled />
            Checked (disabled)
          </label>
          <label className="flex items-center gap-2 text-sm text-fg2 opacity-60 cursor-not-allowed">
            <Checkbox checked={false} disabled />
            Unchecked (disabled)
          </label>
        </div>
      </ExampleCard>

      <ExampleCard
        id="switch"
        title="Switch"
        description="Toggle switch with on/off state labels."
        importPath="@/components/bytes/Switch"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
          </div>
          <div className="flex items-center gap-4">
            <Switch checked={false} disabled />
            <span className="text-sm text-fg3">Disabled</span>
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        id="label"
        title="Label"
        description="Accessible label for form controls."
        importPath="@/components/bytes/Label"
      >
        <div className="max-w-sm space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="label-demo-email">Email address</Label>
            <Input id="label-demo-email" placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="label-demo-name">Full name</Label>
            <Input id="label-demo-name" placeholder="Jane Doe" />
          </div>
        </div>
      </ExampleCard>

    </div>
  );
}
