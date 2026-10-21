"use client";

import { useState } from "react";
import Modal from "./Modal";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

export default function ConfirmDialog({ open, title, message, confirmLabel = "Удалить", onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p>{message}</p>
      <div className="modal-actions">
        <button className="btn secondary" type="button" onClick={onClose} data-autofocus>
          Отмена
        </button>
        <button className="btn danger" type="button" onClick={confirm} disabled={busy}>
          {busy ? "Удаление..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
