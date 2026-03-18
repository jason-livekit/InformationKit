import * as React from 'react';

import { Tooltip, TooltipContent, TooltipPortal, TooltipTrigger } from '@/components/ui/tooltip';

type ContentProps = Pick<React.ComponentProps<typeof TooltipContent>, 'side' | 'align'>;

type TextTooltipProps = React.PropsWithChildren<{ text: string; disabled?: boolean }> &
  ContentProps;

export function TextTooltip(props: TextTooltipProps) {
  const { side = 'right' } = props;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{props.children}</TooltipTrigger>
      {!props.disabled ? (
        <TooltipPortal>
          <TooltipContent side={side}>{props.text}</TooltipContent>
        </TooltipPortal>
      ) : null}
    </Tooltip>
  );
}
