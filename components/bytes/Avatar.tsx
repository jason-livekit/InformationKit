import * as React from 'react';

import { People2Icon } from '@/icons/react';

type AvatarProps = {
  firstInitial?: string;
  size?: 'sm' | 'md' | 'lg';
};

const DIMENSIONS: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'min-w-5 w-5 min-h-5 h-5',
  md: 'min-w-8 w-8 min-h-8 h-8',
  lg: 'min-w-12 w-12 min-h-12 h-12',
};

const FONT_SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-lg',
  lg: 'text-2xl',
};

export function Avatar(props: AvatarProps): React.ReactElement {
  const { firstInitial, size = 'md' } = props;

  return (
    <div
      className={`${DIMENSIONS[size]} ${FONT_SIZES[size]} bg-bgAccent1 text-fgAccent1 flex items-center justify-center rounded px-1.5 py-1 font-mono`}
    >
      {firstInitial?.[0] ?? <People2Icon width="1em" height="1em" />}
    </div>
  );
}
