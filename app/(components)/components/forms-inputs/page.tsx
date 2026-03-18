"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Calendar } from "@/components/ui/calendar";
import { ExampleCard } from "../_shared/example-card";

export default function FormsInputsPage() {
  const [selectValue, setSelectValue] = useState<string>("");
  const [checkbox1, setCheckbox1] = useState(true);
  const [checkbox2, setCheckbox2] = useState(false);
  const [radioValue, setRadioValue] = useState("option-1");
  const [switchOn, setSwitchOn] = useState(true);
  const [sliderValue, setSliderValue] = useState([40]);
  const [otpValue, setOtpValue] = useState("");
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(
    new Date()
  );

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
        importPath="@/components/ui/input"
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
        importPath="@/components/ui/textarea"
      >
        <div className="max-w-sm">
          <Textarea placeholder="Write something here..." />
        </div>
      </ExampleCard>

      <ExampleCard
        id="select"
        title="Select"
        description="Dropdown selection from a list of options."
        importPath="@/components/ui/select"
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
        importPath="@/components/ui/checkbox"
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
        id="radio-group"
        title="RadioGroup"
        description="Radio buttons for single selection from a set of options."
        importPath="@/components/ui/radio-group"
      >
        <div className="space-y-2">
          <RadioGroup value={radioValue} onValueChange={setRadioValue}>
            {[
              { value: "option-1", label: "Default option" },
              { value: "option-2", label: "Comfortable spacing" },
              { value: "option-3", label: "Compact layout" },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm text-fg2 cursor-pointer"
              >
                <RadioGroupItem value={opt.value} />
                {opt.label}
              </label>
            ))}
          </RadioGroup>
          <p className="text-xs text-fg3">Selected: {radioValue}</p>
        </div>
      </ExampleCard>

      <ExampleCard
        id="switch"
        title="Switch"
        description="Toggle switch with on/off state labels."
        importPath="@/components/ui/switch"
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
        id="slider"
        title="Slider"
        description="Range input for selecting a numeric value."
        importPath="@/components/ui/slider"
      >
        <div className="max-w-sm space-y-3">
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={100}
            step={1}
          />
          <p className="text-xs text-fg3">Value: {sliderValue[0]}</p>
        </div>
      </ExampleCard>

      <ExampleCard
        id="label"
        title="Label"
        description="Accessible label for form controls."
        importPath="@/components/ui/label"
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

      <ExampleCard
        id="input-otp"
        title="InputOTP"
        description="One-time password input with grouped digit slots."
        importPath="@/components/ui/input-otp"
      >
        <div className="space-y-3">
          <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {otpValue && (
            <p className="text-xs text-fg3">Value: {otpValue}</p>
          )}
        </div>
      </ExampleCard>

      <ExampleCard
        id="calendar"
        title="Calendar"
        description="Date picker calendar with single date selection."
        importPath="@/components/ui/calendar"
      >
        <div className="space-y-3">
          <Calendar
            mode="single"
            selected={calendarDate}
            onSelect={setCalendarDate}
            className="rounded-md border border-separator1 w-fit"
          />
          {calendarDate && (
            <p className="text-xs text-fg3">
              Selected: {calendarDate.toLocaleDateString()}
            </p>
          )}
        </div>
      </ExampleCard>
    </div>
  );
}
