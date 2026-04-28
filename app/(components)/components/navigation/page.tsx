"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/bytes/Tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/bytes/DropdownMenu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/bytes/Command";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/bytes/Collapsible";
import { Button } from "@/components/bytes/Button";
import { ExampleCard } from "../_shared/example-card";

export default function NavigationPage() {
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [commandValue, setCommandValue] = useState("");

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-16">
      <div>
        <h2 className="text-xl font-bold text-fg0">Navigation</h2>
        <p className="text-sm text-fg3 mt-1">
          Components for navigating within a page or application.
        </p>
      </div>

      <ExampleCard
        id="tabs"
        title="Tabs"
        description="Three tab variants: default, segmented, and underline."
        importPath="@/components/bytes/Tabs"
      >
        <ExampleCard.Group label="Default">
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Overview</TabsTrigger>
              <TabsTrigger value="tab2">Analytics</TabsTrigger>
              <TabsTrigger value="tab3">Settings</TabsTrigger>
            </TabsList>
            <TabsContent
              value="tab1"
              className="p-4 bg-bg2 rounded text-sm text-fg2"
            >
              Overview content
            </TabsContent>
            <TabsContent
              value="tab2"
              className="p-4 bg-bg2 rounded text-sm text-fg2"
            >
              Analytics content
            </TabsContent>
            <TabsContent
              value="tab3"
              className="p-4 bg-bg2 rounded text-sm text-fg2"
            >
              Settings content
            </TabsContent>
          </Tabs>
        </ExampleCard.Group>
        <ExampleCard.Group label="Segmented">
          <Tabs defaultValue="tab1">
            <TabsList variant="segmented">
              <TabsTrigger value="tab1">Daily</TabsTrigger>
              <TabsTrigger value="tab2">Weekly</TabsTrigger>
              <TabsTrigger value="tab3">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent
              value="tab1"
              className="p-4 bg-bg2 rounded text-sm text-fg2"
            >
              Daily view
            </TabsContent>
            <TabsContent
              value="tab2"
              className="p-4 bg-bg2 rounded text-sm text-fg2"
            >
              Weekly view
            </TabsContent>
            <TabsContent
              value="tab3"
              className="p-4 bg-bg2 rounded text-sm text-fg2"
            >
              Monthly view
            </TabsContent>
          </Tabs>
        </ExampleCard.Group>
        <ExampleCard.Group label="Underline">
          <Tabs defaultValue="tab1">
            <TabsList variant="underline">
              <TabsTrigger value="tab1">General</TabsTrigger>
              <TabsTrigger value="tab2">Security</TabsTrigger>
              <TabsTrigger value="tab3">Billing</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="p-4 text-sm text-fg2">
              General settings
            </TabsContent>
            <TabsContent value="tab2" className="p-4 text-sm text-fg2">
              Security settings
            </TabsContent>
            <TabsContent value="tab3" className="p-4 text-sm text-fg2">
              Billing info
            </TabsContent>
          </Tabs>
        </ExampleCard.Group>
      </ExampleCard>

      <ExampleCard
        id="dropdown-menu"
        title="DropdownMenu"
        description="Menu that opens from a trigger button with items, groups, and sub-menus."
        importPath="@/components/bytes/DropdownMenu"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ExampleCard>

      <ExampleCard
        id="command"
        title="Command"
        description="Command palette / search interface for quick access to actions."
        importPath="@/components/bytes/Command"
      >
        <div className="rounded-md border border-separator1 max-w-md">
          <Command>
            <CommandInput
              placeholder="Search commands..."
              value={commandValue}
              onValueChange={setCommandValue}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem value="calendar">
                  Calendar
                  <CommandShortcut>⌘K</CommandShortcut>
                </CommandItem>
                <CommandItem value="search">
                  Search
                  <CommandShortcut>⌘F</CommandShortcut>
                </CommandItem>
                <CommandItem value="settings">Settings</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Actions">
                <CommandItem value="new-project">New project</CommandItem>
                <CommandItem value="new-file">New file</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </ExampleCard>

      <ExampleCard
        id="collapsible"
        title="Collapsible"
        description="Simple expand/collapse container for hiding content."
        importPath="@/components/bytes/Collapsible"
      >
        <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen}>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {collapsibleOpen ? "Hide" : "Show"} 3 more items
              </Button>
            </CollapsibleTrigger>
          </div>
          <div className="mt-2 rounded-md border border-separator1 px-4 py-2 text-sm text-fg2">
            Always visible item
          </div>
          <CollapsibleContent className="space-y-2 mt-2">
            <div className="rounded-md border border-separator1 px-4 py-2 text-sm text-fg2">
              Hidden item 1
            </div>
            <div className="rounded-md border border-separator1 px-4 py-2 text-sm text-fg2">
              Hidden item 2
            </div>
            <div className="rounded-md border border-separator1 px-4 py-2 text-sm text-fg2">
              Hidden item 3
            </div>
          </CollapsibleContent>
        </Collapsible>
      </ExampleCard>
    </div>
  );
}
