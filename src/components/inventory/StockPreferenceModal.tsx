import { useMemo, useState } from "react";
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
  const initialPreferredQuantity = useMemo(
    () => Math.max(grocery.quantity, 1),
    [grocery.quantity],
  );
  const [preferredQuantity, setPreferredQuantity] = useState(
    initialPreferredQuantity,
  );

  return (
    <div className="stock-preference-modal__backdrop" role="presentation">
      <section
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
            onClick={() =>
              setPreferredQuantity((currentValue) => Math.max(1, currentValue - 1))
            }
            aria-label="Decrease preferred stock"
          >
            −
          </button>

          <div className="stock-preference-modal__value">
            <strong>{preferredQuantity}</strong>
            <span>{grocery.quantityUnit}</span>
          </div>

          <button
            type="button"
            className="stock-preference-modal__stepper"
            onClick={() => setPreferredQuantity((currentValue) => currentValue + 1)}
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