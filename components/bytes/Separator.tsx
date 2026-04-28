import * as React from 'react';
import { Separator as SeparatorRoot } from '@radix-ui/react-separator';

import { cn } from '@/lib/bytes/utils';

/** @see {@link https://www.radix-ui.com/primitives/docs/components/separator} */
const Separator = React.forwardRef<
  React.ComponentRef<typeof SeparatorRoot>,
  React.ComponentPropsWithoutRef<typeof SeparatorRoot>
>(({ className, ...props }, ref) => (
  <SeparatorRoot
    ref={ref}
    decorative
    className={cn(
      'bg-separator1 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
      className,
    )}
    {...props}
  />
));

export { Separator };
