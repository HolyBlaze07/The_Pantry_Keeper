import { useEffect, useRef } from "react";
import "./ConfirmModal.css";

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const focusTarget = dialogRef.current?.querySelector<HTMLElement>(
      "button",
    );

    focusTarget?.focus();
  }, []);

  return (
    <div className="confirm-modal__backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-heading"
      >
        <h2 id="confirm-modal-heading">{title}</h2>

        <p>{message}</p>

        <div className="confirm-modal__actions">
          <button
            type="button"
            className="confirm-modal__button confirm-modal__button--cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className={`confirm-modal__button confirm-modal__button--confirm confirm-modal__button--${variant}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmModal;
