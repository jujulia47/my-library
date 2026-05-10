"use client";

import { ConfirmDialog } from "@/components/ui";

interface ConfirmationPopUpProps {
  message: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const ConfirmationPopUp = ({
  message,
  onConfirm,
  onCancel,
}: ConfirmationPopUpProps) => {
  return (
    <ConfirmDialog
      open
      onClose={onCancel}
      title={message}
      onConfirm={onConfirm}
      confirmLabel="Sim, excluir"
      cancelLabel="Cancelar"
      variant="destructive"
    />
  );
};

export default ConfirmationPopUp;
