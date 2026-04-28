import * as React from 'react';

import { Tooltip, TooltipContent, TooltipPortal, TooltipTrigger } from './Tooltip';

type ContentProps = Pick<React.ComponentProps<typeof TooltipContent>, 'side' | 'align'>;

type TextTooltipProps = React.PropsWithChildren<{ text: string; disabled?: boolean }> &
  ContentProps;

/**
 * A simple text tooltip that displays a tooltip on hover. The child elements are the tooltip
 * trigger.
 *
 * @remarks
 * This component is a wrapper around the {@link Tooltip} component to make it easier to use and to
 * make the overall use of tooltips more consistent across the codebase.
 * @example
 *
 * ```tsx
 * <TextTooltip text="This is a tooltip">Hover over me</TextTooltip>;
 * ```
 */
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
