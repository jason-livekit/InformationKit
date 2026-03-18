export type ComponentMeta = {
  id: string;
  label: string;
  importPath: string;
};

export type Category = {
  slug: string;
  title: string;
  description: string;
  components: ComponentMeta[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "buttons-actions",
    title: "Buttons & Actions",
    description: "Interactive buttons, toggles, and action controls.",
    components: [
      { id: "button", label: "Button", importPath: "@/components/ui/button" },
      { id: "task-button", label: "TaskButton", importPath: "@/components/ui/task-button" },
      { id: "toggle", label: "Toggle", importPath: "@/components/ui/toggle" },
      { id: "segmented-control", label: "SegmentedControl", importPath: "@/components/ui/segmented-control" },
    ],
  },
  {
    slug: "forms-inputs",
    title: "Forms & Inputs",
    description: "Form controls for collecting user input.",
    components: [
      { id: "input", label: "Input", importPath: "@/components/ui/input" },
      { id: "textarea", label: "Textarea", importPath: "@/components/ui/textarea" },
      { id: "select", label: "Select", importPath: "@/components/ui/select" },
      { id: "checkbox", label: "Checkbox", importPath: "@/components/ui/checkbox" },
      { id: "radio-group", label: "RadioGroup", importPath: "@/components/ui/radio-group" },
      { id: "switch", label: "Switch", importPath: "@/components/ui/switch" },
      { id: "slider", label: "Slider", importPath: "@/components/ui/slider" },
      { id: "label", label: "Label", importPath: "@/components/ui/label" },
      { id: "input-otp", label: "InputOTP", importPath: "@/components/ui/input-otp" },
      { id: "calendar", label: "Calendar", importPath: "@/components/ui/calendar" },
    ],
  },
  {
    slug: "data-display",
    title: "Data Display",
    description: "Components for presenting data, status, and loading states.",
    components: [
      { id: "table", label: "Table", importPath: "@/components/ui/table" },
      { id: "badge", label: "Badge", importPath: "@/components/ui/badge" },
      { id: "status-indicator", label: "StatusIndicator", importPath: "@/components/ui/status-indicator" },
      { id: "avatar", label: "Avatar", importPath: "@/components/ui/avatar" },
      { id: "progress", label: "Progress", importPath: "@/components/ui/progress" },
      { id: "skeleton", label: "Skeleton", importPath: "@/components/ui/skeleton" },
      { id: "card", label: "Card", importPath: "@/components/ui/card" },
    ],
  },
  {
    slug: "feedback-overlays",
    title: "Feedback & Overlays",
    description: "Modals, sheets, popovers, and tooltips for contextual information.",
    components: [
      { id: "dialog", label: "Dialog", importPath: "@/components/ui/dialog" },
      { id: "alert-dialog", label: "AlertDialog", importPath: "@/components/ui/alert-dialog" },
      { id: "sheet", label: "Sheet", importPath: "@/components/ui/sheet" },
      { id: "drawer", label: "Drawer", importPath: "@/components/ui/drawer" },
      { id: "popover", label: "Popover", importPath: "@/components/ui/popover" },
      { id: "tooltip", label: "Tooltip", importPath: "@/components/ui/tooltip" },
      { id: "hover-card", label: "HoverCard", importPath: "@/components/ui/hover-card" },
      { id: "alert", label: "Alert", importPath: "@/components/ui/alert" },
      { id: "sonner", label: "Sonner", importPath: "@/components/ui/sonner" },
    ],
  },
  {
    slug: "navigation",
    title: "Navigation",
    description: "Components for navigating within a page or application.",
    components: [
      { id: "tabs", label: "Tabs", importPath: "@/components/ui/tabs" },
      { id: "breadcrumb", label: "Breadcrumb", importPath: "@/components/ui/breadcrumb" },
      { id: "accordion", label: "Accordion", importPath: "@/components/ui/accordion" },
      { id: "pagination", label: "Pagination", importPath: "@/components/ui/pagination" },
      { id: "dropdown-menu", label: "DropdownMenu", importPath: "@/components/ui/dropdown-menu" },
      { id: "context-menu", label: "ContextMenu", importPath: "@/components/ui/context-menu" },
      { id: "command", label: "Command", importPath: "@/components/ui/command" },
      { id: "collapsible", label: "Collapsible", importPath: "@/components/ui/collapsible" },
    ],
  },
  {
    slug: "layout-utilities",
    title: "Layout & Utilities",
    description: "Structural components and utility helpers.",
    components: [
      { id: "separator", label: "Separator", importPath: "@/components/ui/separator" },
      { id: "scroll-area", label: "ScrollArea", importPath: "@/components/ui/scroll-area" },
      { id: "spinner", label: "Spinner", importPath: "@/components/ui/spinner" },
      { id: "copy-to-clipboard", label: "CopyToClipboard", importPath: "@/components/ui/copy-to-clipboard" },
    ],
  },
];
