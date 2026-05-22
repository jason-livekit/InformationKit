'use client';

import * as React from 'react';
import type { Project } from '@/lib/repo/schemas';
import { Badge } from '@/components/bytes/Badge';
import { cn } from '@/lib/bytes/utils';

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description);

  async function save(patch: { name?: string; description?: string }) {
    await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Badge variant="accent" size="medium">
          Project
        </Badge>
      </div>
      <InlineEditable
        as="h1"
        className="font-display text-fg0 text-2xl"
        value={name}
        onChange={setName}
        onCommit={(v) => v && v !== project.name && save({ name: v })}
        placeholder="Untitled project"
      />
      <InlineEditable
        as="p"
        className="text-fg3 max-w-2xl text-sm"
        value={description}
        onChange={setDescription}
        onCommit={(v) => v !== project.description && save({ description: v })}
        placeholder="Add a description…"
      />
    </div>
  );
}

interface InlineEditableProps {
  as: 'h1' | 'p';
  value: string;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
  placeholder: string;
  className?: string;
}

function InlineEditable({
  as,
  value,
  onChange,
  onCommit,
  placeholder,
  className,
}: InlineEditableProps) {
  const ref = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  if (as === 'h1') {
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onCommit(value)}
        placeholder={placeholder}
        className={cn(
          className,
          'bg-transparent border-transparent focus:border-separatorAccent focus:outline-none rounded border px-1 -mx-1 max-w-full',
        )}
      />
    );
  }
  return (
    <textarea
      ref={ref as React.RefObject<HTMLTextAreaElement>}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onCommit(value)}
      rows={1}
      placeholder={placeholder}
      className={cn(
        className,
        'bg-transparent resize-none border-transparent focus:border-separatorAccent focus:outline-none rounded border px-1 -mx-1 max-w-full',
      )}
    />
  );
}
