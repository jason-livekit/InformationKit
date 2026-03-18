'use client';

import { Button } from '@/components/ui/button';
import * as m from 'motion/react-m';

export interface ConfirmationOverlayProps {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationOverlay(props: ConfirmationOverlayProps) {
  const title = props.title ?? 'Are you sure?';
  const description =
    props.description ?? "If you leave, you will lose all the changes you've made.";
  const confirmText = props.confirmText ?? 'Yes, discard changes';
  const cancelText = props.cancelText ?? 'No, go back';

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-bg1/70 absolute inset-0 z-50 col-[full]! grid place-items-center rounded backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-fg0 text-lg font-semibold">{title}</h1>
        <p className="text-fg1 text-sm">{description}</p>
        <div className="flex gap-2">
          <Button onClick={props.onConfirm}>{confirmText}</Button>
          <Button variant="primary" onClick={props.onCancel}>
            {cancelText}
          </Button>
        </div>
      </div>
    </m.div>
  );
}
