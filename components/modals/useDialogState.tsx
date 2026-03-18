'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * A custom hook to manage the state of a dialog.
 *
 * @see {@link useDialogStateWithConfirmationBeforeClose} for a version that requires user
 * confirmation before closing the dialog.
 */
export function useDialogState(
  open: boolean,
  onClose: () => void,
): {
  /**
   * Flag to indicate whether the dialog is open. This should be passed to the `<Dialog/>`
   * component.
   */
  open: boolean;
  /** Callback to pass to the `<Dialog/>` component. */
  onOpenChange: (open: boolean) => void;
} {
  const handleOpenChanged = useCallback(
    (open: boolean) => {
      if (open === false) {
        onClose();
      }
    },
    [onClose],
  );

  return {
    open: open,
    onOpenChange: handleOpenChanged,
  };
}

/**
 * A custom hook to manage the state of a dialog with accidental close prevention.
 *
 * @remarks
 * You have to call `activateConfirmation` once to show the confirmation UI at all. This is helpful
 * if you want to show the confirmation UI only when the user has made some changes.
 * @see {@link ConfirmationOverlay} for the confirmation UI.
 * @see {@link useDialogState} for a version that does not require user confirmation before closing.
 */
export function useDialogStateWithConfirmationBeforeClose(
  open: boolean,
  onClose: () => void,
): {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Once this is called, the confirmation UI will be shown. */
  activateConfirmation: () => void;
  showConfirmationUi: boolean;
  onConfirmationConfirm: () => void;
  onConfirmationCancel: () => void;
} {
  const skipConfirmation = useRef(true);
  const userHasConfirmedClose = useRef(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const handleOpenChanged = useCallback(
    (open: boolean) => {
      if (skipConfirmation.current === true) {
        if (open === false) {
          onClose();
        }
      } else {
        if (open === false && userHasConfirmedClose.current === true) {
          onClose();
        } else {
          setShowCloseConfirmation(true);
        }
      }
    },
    [onClose],
  );

  const onConfirm = useCallback(() => {
    userHasConfirmedClose.current = true;
    handleOpenChanged(false);
  }, [handleOpenChanged]);

  const onCancel = useCallback(() => {
    setShowCloseConfirmation(false);
    userHasConfirmedClose.current = false;
  }, []);

  const activateConfirmation = useCallback(() => {
    skipConfirmation.current = false;
  }, []);

  return {
    open: open,
    onOpenChange: handleOpenChanged,
    showConfirmationUi: showCloseConfirmation,
    onConfirmationConfirm: onConfirm,
    onConfirmationCancel: onCancel,
    activateConfirmation,
  };
}
