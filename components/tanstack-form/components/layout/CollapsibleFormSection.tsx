import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { ChevronBottomIcon } from '@/icons/react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function CollapsibleFormSection(
  props: PropsWithChildren<{ label: ReactNode; description?: ReactNode; defaultOpen?: boolean }>,
) {
  const [open, setOpen] = useState(props.defaultOpen ?? false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="text-fg1 group flex w-full items-center gap-1 text-sm font-semibold">
        <ChevronBottomIcon className="hover:text-fg2 size-3 transition-transform group-data-[state=closed]:-rotate-90 group-data-[state=open]:rotate-0" />
        <span className="text-sm font-semibold">{props.label}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp ps-4 data-[state=closed]:overflow-hidden">
        {props.description && (
          <div className="text-fg2 mt-1 text-xs text-pretty">{props.description}</div>
        )}
        <div className="mt-4 flex flex-col gap-4 pb-1">{props.children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
