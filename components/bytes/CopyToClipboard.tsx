import { useCallback } from 'react';
import * as React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Button,
  ChainLink3Icon,
  Checkmark2SmallIcon,
  cn,
  CodeBracketsSolidIcon,
  SquareBehindSquare1Icon,
  type ButtonProps,
} from '@/components/bytes';

interface CopyToClipboardProps {
  className?: string;
  textToCopy: string | (() => string);
  label?: string;
  /** Text displayed to the user when hovering the button. */
  promptText?: string;
  icon?: 'squares' | 'chain-link' | 'code';
  withPortal?: boolean;
  disabled?: boolean;
  onCopy?: () => void;
  variant?: ButtonProps['variant'];
}

export function CopyToClipboard({
  className,
  textToCopy,
  promptText,
  icon = 'squares',
  withPortal = true,
  disabled,
  onCopy = () => {},
  label,
  variant = 'ghost',
}: CopyToClipboardProps) {
  const timeout = React.useRef<number | undefined>(undefined);
  const [copyState, setCopyState] = React.useState<'idle' | 'copied'>('idle');
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const text = typeof textToCopy === 'function' ? textToCopy() : textToCopy;
      navigator.clipboard.writeText(text).then(
        () => {
          if (timeout.current) {
            window.clearTimeout(timeout.current);
          }
          setCopyState('copied');
          timeout.current = window.setTimeout(() => {
            setCopyState('idle');
          }, 1000);
        },
        (err) => {
          console.error(err);
        },
      );
      onCopy();
    },
    [textToCopy, onCopy],
  );

  const Icon =
    icon === 'code'
      ? CodeBracketsSolidIcon
      : icon === 'chain-link'
        ? ChainLink3Icon
        : SquareBehindSquare1Icon;
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            aria-label="Copy to clipboard"
            type="button"
            variant={variant}
            onClick={handleClick}
            data-state={copyState}
            className={cn(
              'data-[state=copied]:bg-bgSuccess1 data-[state=copied]:text-fgSuccess data-[state=copied]:hover:bg-bgSuccess1!',
              'flex items-center justify-center rounded px-2 outline-hidden',
              className,
            )}
            disabled={disabled}
            leftIcon={
              copyState === 'idle' ? (
                <Icon className="size-4" />
              ) : (
                <Checkmark2SmallIcon className="text-fgSuccess size-4" />
              )
            }
          >
            {label && <span>{label}</span>}
          </Button>
        </Tooltip.Trigger>
        {withPortal ? (
          <Tooltip.Portal>
            <Tooltip.Content
              className="border-separator2 bg-bg3 text-fg1 z-40 rounded border px-4 py-2 text-xs will-change-[transform,opacity] select-none"
              sideOffset={5}
            >
              {promptText || 'Copy to clipboard'}
            </Tooltip.Content>
          </Tooltip.Portal>
        ) : (
          <Tooltip.Content
            className="border-separator2 bg-bg3 text-fg1 rounded border px-4 py-2 text-xs will-change-[transform,opacity] select-none"
            sideOffset={5}
          >
            {promptText || 'Copy to clipboard'}
          </Tooltip.Content>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
