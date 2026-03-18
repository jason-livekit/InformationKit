"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExampleCard } from "../_shared/example-card";

export default function DataDisplayPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-16">
      <div>
        <h2 className="text-xl font-bold text-fg0">Data Display</h2>
        <p className="text-sm text-fg3 mt-1">
          Components for presenting data, status, and loading states.
        </p>
      </div>

      <ExampleCard
        id="table"
        title="Table"
        description="Data table with headers and styled rows."
        importPath="@/components/ui/table"
      >
        <div className="overflow-x-auto rounded border border-separator1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: "Alice Chen", role: "Engineer", status: "active", lastActive: "2 min ago" },
                { name: "Bob Park", role: "Designer", status: "away", lastActive: "1 hr ago" },
                { name: "Carol Liu", role: "PM", status: "offline", lastActive: "3 days ago" },
              ].map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "active"
                          ? "success"
                          : row.status === "away"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-fg3">{row.lastActive}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ExampleCard>

      <ExampleCard
        id="badge"
        title="Badge"
        description="Small status labels in all semantic variants."
        importPath="@/components/ui/badge"
      >
        <ExampleCard.Group label="Default size">
          <div className="flex flex-wrap gap-2">
            <Badge variant="muted">Muted</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
          </div>
        </ExampleCard.Group>
        <ExampleCard.Group label="Large size">
          <div className="flex flex-wrap gap-2">
            <Badge variant="muted" size="large">Large Muted</Badge>
            <Badge variant="accent" size="large">Large Accent</Badge>
          </div>
        </ExampleCard.Group>
      </ExampleCard>

      <ExampleCard
        id="status-indicator"
        title="StatusIndicator"
        description="Status dots with semantic colors and animated ping for active states."
        importPath="@/components/ui/status-indicator"
      >
        <div className="space-y-3">
          <StatusIndicator status="success" message="Connected" />
          <StatusIndicator status="warning" message="High latency" />
          <StatusIndicator status="critical" message="Disconnected" />
          <StatusIndicator status="default" message="Processing" />
          <StatusIndicator status="muted" message="Inactive" />
        </div>
      </ExampleCard>

      <ExampleCard
        id="avatar"
        title="Avatar"
        description="User avatars with initial fallback in three sizes."
        importPath="@/components/ui/avatar"
      >
        <div className="flex items-end gap-3">
          <Avatar size="sm" firstInitial="A" />
          <Avatar size="md" firstInitial="B" />
          <Avatar size="lg" firstInitial="C" />
          <Avatar size="md" />
        </div>
      </ExampleCard>

      <ExampleCard
        id="progress"
        title="Progress"
        description="Determinate progress bar."
        importPath="@/components/ui/progress"
      >
        <div className="space-y-4 max-w-sm">
          <div>
            <p className="text-xs text-fg3 mb-1">25%</p>
            <Progress value={25} />
          </div>
          <div>
            <p className="text-xs text-fg3 mb-1">60%</p>
            <Progress value={60} />
          </div>
          <div>
            <p className="text-xs text-fg3 mb-1">100%</p>
            <Progress value={100} />
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        id="skeleton"
        title="Skeleton"
        description="Loading placeholders that pulse to indicate content is loading."
        importPath="@/components/ui/skeleton"
      >
        <div className="space-y-3 max-w-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </ExampleCard>

      <ExampleCard
        id="card"
        title="Card"
        description="Structured card with title, description, body content, and footer."
        importPath="@/components/ui/card"
      >
        <ExampleCard.Group label="With form content">
          <Card
            title="Account Settings"
            description="Manage your profile and preferences."
            footer={<Button variant="primary">Save changes</Button>}
          >
            <div className="space-y-3">
              <Input placeholder="Display name" />
              <Input placeholder="Email address" />
            </div>
          </Card>
        </ExampleCard.Group>
        <ExampleCard.Group label="Minimal">
          <Card title="Quick note" description="Cards can be used for simple content grouping too." />
        </ExampleCard.Group>
      </ExampleCard>
    </div>
  );
}
