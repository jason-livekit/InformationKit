export interface BaseModalProps<Resolve = unknown, Reject = unknown> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onResolve: (value: Resolve) => void;
  onReject: (reason?: Reject) => void;
}
