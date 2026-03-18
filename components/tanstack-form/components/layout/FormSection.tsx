import type { PropsWithChildren } from 'react';

export function FormSection(props: PropsWithChildren<{ label: string; description?: string }>) {
  return (
    <section className="space-y-4">
      <hgroup className="space-y-2">
        <h3 className="text-fg1 text-sm/normal font-semibold">{props.label}</h3>
        {props.description && <p className="text-fg2 text-xs text-pretty">{props.description}</p>}
      </hgroup>
      <div className="mt-4 flex flex-col gap-4 pb-1">{props.children}</div>
    </section>
  );
}
