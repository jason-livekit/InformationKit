import type { ReactNode } from 'react';
import type { BaseModalProps } from './types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TaskButton } from '@/components/ui/task-button';

export interface ConfirmDialogProps<Resolve = unknown, Reject = unknown> extends BaseModalProps<
  Resolve,
  Reject
> {
  title: ReactNode;
  description: ReactNode;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => Promise<Resolve> | Resolve;
  onCancel?: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  async function handleCancel() {
    if (props.onCancel) {
      props.onCancel();
      props.onReject();
    }
    props.onClose();
  }

  async function handleConfirm() {
    if (props.onConfirm) {
      const res = await props.onConfirm();
      props.onResolve(res);
    }
    props.onClose();
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" onClick={handleCancel}>
              {props.cancelText ?? 'Cancel'}
            </Button>
          </DialogClose>
          <TaskButton variant="destructive" onClick={handleConfirm}>
            {props.confirmText ?? 'Confirm'}
          </TaskButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
