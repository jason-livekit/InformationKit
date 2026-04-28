import React, { useCallback, useState } from 'react';

import type { ButtonProps } from './Button';
import { Button } from './Button';
import { Spinner } from './Spinner';

interface TaskButtonProps extends ButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => Promise<unknown>;
  isPending?: boolean;
}

/**
 * The `TaskButton` component is a button that can be in a pending state while an asynchronous
 * `onClick` task is being performed.
 */
export function TaskButton(props: TaskButtonProps) {
  const [taskState, setTaskState] = useState<'idle' | 'pending'>('idle');
  const { onClick, isPending, ...rest } = props;
  const _onClick: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    async (event) => {
      if (typeof onClick === 'function') {
        setTaskState('pending');
        await onClick(event);
        setTaskState('idle');
      }
    },
    [onClick],
  );
  return (
    <Button
      onClick={_onClick}
      disabled={isPending === true || (isPending === undefined && taskState === 'pending')}
      data-pending={isPending === true || (isPending === undefined && taskState === 'pending')}
      {...rest}
    >
      {props.children && (
        <span className="transition-opacity group-data-[pending=true]:opacity-0">
          {props.children}
        </span>
      )}
      <div
        aria-hidden
        className="absolute top-0 left-0 flex h-full w-full items-center justify-center group-data-[pending=false]:opacity-0 group-data-[pending=true]:opacity-100"
      >
        <Spinner />
      </div>
    </Button>
  );
}
