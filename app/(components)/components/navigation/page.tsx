"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbId,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
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
        importPath="@/components/ui/tabs"
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
        id="breadcrumb"
        title="Breadcrumb"
        description="Navigation trail with BreadcrumbId pill for IDs."
        importPath="@/components/ui/breadcrumb"
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Sessions</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbId href="#">RM_dTTtaqrTdUJt</BreadcrumbId>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Participants</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ExampleCard>

      <ExampleCard
        id="accordion"
        title="Accordion"
        description="Collapsible sections for organizing related content."
        importPath="@/components/ui/accordion"
      >
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is this starter kit?</AccordionTrigger>
            <AccordionContent>
              A curated set of components for rapid prototyping with Next.js,
              Tailwind, and Radix UI.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How do I add new components?</AccordionTrigger>
            <AccordionContent>
              Add them to the{" "}
              <code className="text-xs bg-bg2 px-1 py-0.5 rounded">
                components/ui/
              </code>{" "}
              directory following the existing patterns.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Can I use this in production?</AccordionTrigger>
            <AccordionContent>
              This kit is optimized for prototyping. For production, use the
              Bites & Bytes component library.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ExampleCard>

      <ExampleCard
        id="pagination"
        title="Pagination"
        description="Page navigation with previous, next, and numbered links."
        importPath="@/components/ui/pagination"
      >
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </ExampleCard>

      <ExampleCard
        id="dropdown-menu"
        title="DropdownMenu"
        description="Menu that opens from a trigger button with items, groups, and sub-menus."
        importPath="@/components/ui/dropdown-menu"
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
        id="context-menu"
        title="ContextMenu"
        description="Right-click context menu with items and keyboard shortcuts."
        importPath="@/components/ui/context-menu"
      >
        <ContextMenu>
          <ContextMenuTrigger className="flex h-32 w-full items-center justify-center rounded-md border border-dashed border-separator1 text-sm text-fg3">
            Right-click here
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem>
              Back
              <ContextMenuShortcut>⌘[</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Forward
              <ContextMenuShortcut>⌘]</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Reload
              <ContextMenuShortcut>⌘R</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>View source</ContextMenuItem>
            <ContextMenuItem>Inspect</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </ExampleCard>

      <ExampleCard
        id="command"
        title="Command"
        description="Command palette / search interface for quick access to actions."
        importPath="@/components/ui/command"
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
        importPath="@/components/ui/collapsible"
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
