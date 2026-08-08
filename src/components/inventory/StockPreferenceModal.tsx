import { useEffect, useMemo, useRef, useState } from "react";
import type { GroceryItem } from "../../types/grocery";
import "./StockPreferenceModal.css";

type StockPreferenceModalProps = {
  grocery: GroceryItem;
  onSave: (groceryId: string, preferredQuantity: number) => void;
  onSkip: () => void;
};

function StockPreferenceModal({
  grocery,
  onSave,
  onSkip,
}: StockPreferenceModalProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const quantityInputRef = useRef<HTMLInputElement | null>(null);
  const initialPreferredQuantity = useMemo(
    () => Math.max(grocery.quantity, 1),
    [grocery.quantity],
  );
  const [preferredQuantity, setPreferredQuantity] = useState(
    initialPreferredQuantity,
  );
  const [preferredQuantityInput, setPreferredQuantityInput] = useState(
    String(initialPreferredQuantity),
  );

  function updatePreferredQuantity(nextValue: number) {
    const normalizedValue = Math.max(1, Math.round(nextValue));
    setPreferredQuantity(normalizedValue);
    setPreferredQuantityInput(String(normalizedValue));
  }

  useEffect(() => {
    quantityInputRef.current?.focus();
  }, []);

  useEffect(() => {
    setPreferredQuantity(initialPreferredQuantity);
    setPreferredQuantityInput(String(initialPreferredQuantity));
  }, [initialPreferredQuantity]);

  return (
    <div className="stock-preference-modal__backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="stock-preference-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-preference-heading"
      >
        <p className="stock-preference-modal__eyebrow">Personalize stock</p>

        <h2 id="stock-preference-heading">
          How much of {grocery.name} do you like to keep stocked?
        </h2>

        <p className="stock-preference-modal__current">
          Current quantity: {grocery.quantity} {grocery.quantityUnit}
        </p>

        <div className="stock-preference-modal__controls" aria-label="Preferred stock controls">
          <button
            type="button"
            className="stock-preference-modal__stepper"
            onClick={() => updatePreferredQuantity(preferredQuantity - 1)}
            aria-label="Decrease preferred stock"
          >
            −
          </button>

          <div className="stock-preference-modal__value">
            <input
              ref={quantityInputRef}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              className="stock-preference-modal__input"
              value={preferredQuantityInput}
              onChange={(event) => {
                const nextValue = event.target.value;

                if (!/^\d*$/.test(nextValue)) {
                  return;
                }

                setPreferredQuantityInput(nextValue);

                if (nextValue === "") {
                  return;
                }

                const parsedValue = Number.parseInt(nextValue, 10);

                if (Number.isNaN(parsedValue)) {
                  return;
                }

                setPreferredQuantity(Math.max(1, parsedValue));
              }}
              onBlur={() => {
                const parsedValue = Number.parseInt(preferredQuantityInput, 10);

                if (Number.isNaN(parsedValue)) {
                  updatePreferredQuantity(preferredQuantity);
                  return;
                }

                updatePreferredQuantity(parsedValue);
              }}
              aria-label="Preferred stock quantity"
            />
            <span>{grocery.quantityUnit}</span>
          </div>

          <button
            type="button"
            className="stock-preference-modal__stepper"
            onClick={() => updatePreferredQuantity(preferredQuantity + 1)}
            aria-label="Increase preferred stock"
          >
            +
          </button>
        </div>

        <p className="stock-preference-modal__hint">Then the card can calculate your stock level automatically.</p>

        <div className="stock-preference-modal__actions">
          <button type="button" className="button button--secondary" onClick={onSkip}>
            Skip
          </button>

          <button
            type="button"
            className="button button--primary"
            onClick={() => onSave(grocery.id, preferredQuantity)}
          >
            Save Preference
          </button>
        </div>
      </section>
    </div>
  );
}

export default StockPreferenceModal;