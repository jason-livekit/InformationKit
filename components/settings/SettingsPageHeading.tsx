import type { ReactNode } from 'react';

export interface SettingsPageHeadingProps {
  title: string;
  description?: string | ReactNode | (string | ReactNode)[];
}

export function SettingsPageHeading({ title, description }: SettingsPageHeadingProps) {
  return (
    <hgroup className="space-y-2">
      <h1 className="text-fg0 text-xl font-semibold">{title}</h1>
      {description &&
        (Array.isArray(description) ? description : [description]).map((paragraph, index) => (
          <p key={index} className="text-fg3 max-w-2xl text-sm">
            {paragraph}
          </p>
        ))}
    </hgroup>
  );
}
