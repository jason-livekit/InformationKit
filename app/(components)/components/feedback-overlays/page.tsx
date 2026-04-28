"use client";

import { Button } from "@/components/bytes/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/bytes/Dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/bytes/AlertDialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/bytes/Drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/bytes/Popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/bytes/Tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/bytes/HoverCard";
import { toast } from "@/components/bytes/Toaster";
import { Input } from "@/components/bytes/Input";
import { ExampleCard } from "../_shared/example-card";

export default function FeedbackOverlaysPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-16">
      <div>
        <h2 className="text-xl font-bold text-fg0">Feedback & Overlays</h2>
        <p className="text-sm text-fg3 mt-1">
          Modals, sheets, popovers, and tooltips for contextual information.
        </p>
      </div>

      <ExampleCard
        id="dialog"
        title="Dialog"
        description="Modal dialog with header, body content, and footer actions."
        importPath="@/components/bytes/Dialog"
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create new project</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input placeholder="Project name" />
              <Input placeholder="Description" />
            </div>
            <DialogFooter>
              <Button variant="primary">Create</Button>
              <Button variant="ghost">Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ExampleCard>

      <ExampleCard
        id="alert-dialog"
        title="AlertDialog"
        description="Confirmation dialog for destructive or important actions."
        importPath="@/components/bytes/AlertDialog"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete project</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project and all associated data.
            </AlertDialogDescription>
            <div className="flex justify-end gap-2 mt-2">
              <AlertDialogCancel asChild>
                <Button variant="outline">Cancel</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive">Delete</Button>
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </ExampleCard>

      <ExampleCard
        id="drawer"
        title="Drawer"
        description="Side drawer panel built on Radix Dialog, with configurable direction."
        importPath="@/components/bytes/Drawer"
      >
        <div className="flex gap-2">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Open Drawer (Right)</Button>
            </DrawerTrigger>
            <DrawerContent side="right">
              <DrawerHeader>
                <DrawerTitle>Drawer Panel</DrawerTitle>
                <DrawerDescription>
                  A side panel for supplementary content.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 space-y-3">
                <p className="text-sm text-fg2">
                  Drawer content goes here. It supports top, right, bottom, and
                  left sides.
                </p>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Open Drawer (Bottom)</Button>
            </DrawerTrigger>
            <DrawerContent side="bottom">
              <DrawerHeader>
                <DrawerTitle>Bottom Drawer</DrawerTitle>
                <DrawerDescription>
                  Slides up from the bottom of the screen.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4">
                <p className="text-sm text-fg2">
                  Great for mobile-friendly action sheets.
                </p>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </ExampleCard>

      <ExampleCard
        id="popover"
        title="Popover"
        description="Floating panel anchored to a trigger element."
        importPath="@/components/bytes/Popover"
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open Popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Dimensions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Width" />
                <Input placeholder="Height" />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </ExampleCard>

      <ExampleCard
        id="tooltip"
        title="Tooltip"
        description="Small informational popup on hover."
        importPath="@/components/bytes/Tooltip"
      >
        <TooltipProvider>
          <div className="flex gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a tooltip</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">Another one</Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Tooltip on bottom</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </ExampleCard>

      <ExampleCard
        id="hover-card"
        title="HoverCard"
        description="Rich preview card shown on hover, useful for user profiles or link previews."
        importPath="@/components/bytes/HoverCard"
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <button className="text-sm text-fgAccent1 underline underline-offset-2 cursor-pointer">
              @janedoe
            </button>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" className="w-64">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Jane Doe</h4>
              <p className="text-xs text-fg3">
                Software engineer working on design systems and component
                libraries.
              </p>
              <p className="text-xs text-fg3">Joined December 2023</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </ExampleCard>

      <ExampleCard
        id="sonner"
        title="Sonner (Toasts)"
        description="Toast notifications with semantic variants and action buttons."
        importPath="@/components/bytes/Toaster"
      >
        <ExampleCard.Group label="Variants">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Saved!", {
                  description: "Your changes have been saved.",
                })
              }
            >
              Success toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.error("Failed", {
                  description: "Could not connect to server.",
                })
              }
            >
              Error toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.warning("Warning", {
                  description: "Your trial expires in 3 days.",
                })
              }
            >
              Warning toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.info("Info", {
                  description: "A new version is available.",
                })
              }
            >
              Info toast
            </Button>
          </div>
        </ExampleCard.Group>
        <ExampleCard.Group label="With action">
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Item deleted", {
                action: {
                  label: "Undo",
                  onClick: () => toast.info("Undo successful"),
                },
              })
            }
          >
            Toast with action
          </Button>
        </ExampleCard.Group>
      </ExampleCard>
    </div>
  );
}
