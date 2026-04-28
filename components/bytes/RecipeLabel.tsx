'use client';

import { cn } from '@/lib/bytes/utils';

export type RecipeVariant =
  | 'vision'
  | 'telephony'
  | 'functions'
  | 'data'
  | 'audio'
  | 'basics'
  | 'default'
  | 'primary'
  | 'secondary'
  | 'agents'
  | 'deployment'
  | 'webrtc-transport'
  | 'frontends'
  | 'performance'
  | 'security'
  | 'getting-started'
  | 'other';

const variantStyles: Record<RecipeVariant, string> = {
  default: 'bg-bg2 text-fg3',
  primary: 'bg-fgAccent1/15 text-fgAccent1',
  secondary: 'bg-fgAccent2/15 text-fgAccent2',
  agents: 'bg-violet-900 text-violet-300',
  telephony: 'bg-amber-900 text-amber-300',
  deployment: 'bg-green-900 text-green-300',
  'webrtc-transport': 'bg-cyan-900 text-cyan-300',
  frontends: 'bg-pink-900 text-pink-300',
  performance: 'bg-orange-900 text-orange-300',
  security: 'bg-red-900 text-red-300',
  'getting-started': 'bg-teal-900 text-teal-300',
  vision: 'bg-indigo-900 text-indigo-300',
  functions: 'bg-cyan-900 text-cyan-300',
  data: 'bg-lime-900 text-lime-300',
  audio: 'bg-rose-900 text-rose-300',
  basics: 'bg-slate-700 text-slate-300',
  other: 'bg-zinc-700 text-zinc-300',
};

export interface RecipeLabelProps {
  text: string;
  variant?: RecipeVariant;
  className?: string;
}

export const RecipeLabel = ({ text, variant = 'default', className }: RecipeLabelProps) => {
  return (
    <span
      className={cn(
        'text-xxs cursor-pointer rounded-md px-2 py-1.5 font-mono leading-none font-bold tracking-wide uppercase',
        variantStyles[variant],
        className,
      )}
    >
      {text}
    </span>
  );
};
