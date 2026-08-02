import { useEffect, useMemo, useRef, useState } from "react";
import type { GroceryItem } from "../../types/grocery";
import "./UsageReportModal.css";

type UsageReportModalProps = {
  grocery: GroceryItem;
  onSave: (groceryId: string, amountUsed: number) => void;
  onClose: () => void;
};

const quantityFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatQuantity(value: number) {
  return quantityFormatter.format(value);
}

function UsageReportModal({
  grocery,
  onSave,
  onClose,
}: UsageReportModalProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const suggestedAmount = useMemo(() => {
    if (grocery.quantity <= 0) {
      return 0;
    }

    if (grocery.quantity < 1) {
      return grocery.quantity;
    }

    return 1;
  }, [grocery.quantity]);
  const [amountUsed, setAmountUsed] = useState(
    suggestedAmount > 0 ? suggestedAmount.toString() : "",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const focusTarget = dialogRef.current?.querySelector<HTMLElement>(
      "input, button",
    );

    focusTarget?.focus();
  }, []);

  const parsedAmountUsed = Number(amountUsed);
  const remainingQuantity =
    Number.isFinite(parsedAmountUsed) && parsedAmountUsed >= 0
      ? Math.max(grocery.quantity - parsedAmountUsed, 0)
      : grocery.quantity;

  function handleSave() {
    if (!amountUsed.trim()) {
      setError("Enter how much you used.");
      return;
    }

    if (!Number.isFinite(parsedAmountUsed) || parsedAmountUsed <= 0) {
      setError("Usage amount must be greater than 0.");
      return;
    }

    if (parsedAmountUsed > grocery.quantity) {
      setError("You cannot use more than you currently have in stock.");
      return;
    }

    onSave(grocery.id, parsedAmountUsed);
  }

  return (
    <div className="usage-report-modal__backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="usage-report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="usage-report-heading"
      >
        <p className="usage-report-modal__eyebrow">Report usage</p>

        <h2 id="usage-report-heading">How much of {grocery.name} did you use?</h2>

        <p className="usage-report-modal__current">
          Current stock: {formatQuantity(grocery.quantity)} {grocery.quantityUnit}
        </p>

        <div className="usage-report-modal__field">
          <label htmlFor="usage-amount">Amount used</label>

          <input
            id="usage-amount"
            type="number"
            min="0.01"
            max={grocery.quantity}
            step="0.01"
            value={amountUsed}
            onChange={(event) => {
              setAmountUsed(event.target.value);
              setError("");
            }}
            placeholder="Example: 0.5"
          />
        </div>

        <p className="usage-report-modal__preview">
          Remaining after update: {formatQuantity(remainingQuantity)} {grocery.quantityUnit}
        </p>

        <p className="usage-report-modal__hint">
          Use decimals for partial bottles, jars, or packages.
        </p>

        {error && (
          <p className="usage-report-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="usage-report-modal__actions">
          <button type="button" className="button button--secondary" onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            className="button button--primary"
            onClick={handleSave}
          >
            Save Usage
          </button>
        </div>
      </section>
    </div>
  );
}

export default UsageReportModal;