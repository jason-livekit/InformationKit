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
      { id: "button", label: "Button", importPath: "@/components/bytes/Button" },
      { id: "task-button", label: "TaskButton", importPath: "@/components/bytes/TaskButton" },
    ],
  },
  {
    slug: "forms-inputs",
    title: "Forms & Inputs",
    description: "Form controls for collecting user input.",
    components: [
      { id: "input", label: "Input", importPath: "@/components/bytes/Input" },
      { id: "textarea", label: "Textarea", importPath: "@/components/bytes/Textarea" },
      { id: "select", label: "Select", importPath: "@/components/bytes/Select" },
      { id: "checkbox", label: "Checkbox", importPath: "@/components/bytes/Checkbox" },
      { id: "switch", label: "Switch", importPath: "@/components/bytes/Switch" },
      { id: "label", label: "Label", importPath: "@/components/bytes/Label" },
    ],
  },
  {
    slug: "data-display",
    title: "Data Display",
    description: "Components for presenting data, status, and loading states.",
    components: [
      { id: "table", label: "Table", importPath: "@/components/bytes/Table" },
      { id: "badge", label: "Badge", importPath: "@/components/bytes/Badge" },
      { id: "status-indicator", label: "StatusIndicator", importPath: "@/components/bytes/StatusIndicator" },
      { id: "avatar", label: "Avatar", importPath: "@/components/bytes/Avatar" },
      { id: "skeleton", label: "Skeleton", importPath: "@/components/bytes/Skeleton" },
      { id: "card", label: "Card", importPath: "@/components/bytes/Card" },
    ],
  },
  {
    slug: "charts",
    title: "Charts",
    description: "Time series charts and data visualizations from the LiveKit cloud app.",
    components: [
      { id: "line-chart", label: "LineChart", importPath: "@/components/charts/LineChart" },
      { id: "line-chart-trend", label: "LineChartTrendGraph", importPath: "@/components/charts/LineChartTrendGraph" },
      { id: "histogram", label: "Histogram", importPath: "@/components/charts/Histogram" },
      { id: "histogram-trend", label: "HistogramTrendGraph", importPath: "@/components/charts/HistogramTrendGraph" },
    ],
  },
  {
    slug: "feedback-overlays",
    title: "Feedback & Overlays",
    description: "Modals, sheets, popovers, and tooltips for contextual information.",
    components: [
      { id: "dialog", label: "Dialog", importPath: "@/components/bytes/Dialog" },
      { id: "alert-dialog", label: "AlertDialog", importPath: "@/components/bytes/AlertDialog" },
      { id: "drawer", label: "Drawer", importPath: "@/components/bytes/Drawer" },
      { id: "popover", label: "Popover", importPath: "@/components/bytes/Popover" },
      { id: "tooltip", label: "Tooltip", importPath: "@/components/bytes/Tooltip" },
      { id: "hover-card", label: "HoverCard", importPath: "@/components/bytes/HoverCard" },
      { id: "toaster", label: "Toaster", importPath: "@/components/bytes/Toaster" },
    ],
  },
  {
    slug: "navigation",
    title: "Navigation",
    description: "Components for navigating within a page or application.",
    components: [
      { id: "tabs", label: "Tabs", importPath: "@/components/bytes/Tabs" },
      { id: "dropdown-menu", label: "DropdownMenu", importPath: "@/components/bytes/DropdownMenu" },
      { id: "command", label: "Command", importPath: "@/components/bytes/Command" },
      { id: "collapsible", label: "Collapsible", importPath: "@/components/bytes/Collapsible" },
    ],
  },
  {
    slug: "layout-utilities",
    title: "Layout & Utilities",
    description: "Structural components and utility helpers.",
    components: [
      { id: "separator", label: "Separator", importPath: "@/components/bytes/Separator" },
      { id: "scroll-area", label: "ScrollArea", importPath: "@/components/bytes/ScrollArea" },
      { id: "spinner", label: "Spinner", importPath: "@/components/bytes/Spinner" },
      { id: "copy-to-clipboard", label: "CopyToClipboard", importPath: "@/components/bytes/CopyToClipboard" },
    ],
  },
];
