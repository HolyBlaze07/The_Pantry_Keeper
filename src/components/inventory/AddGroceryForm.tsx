import { useEffect, useRef, useState } from "react";
import type {
  GroceryCategory,
  GroceryItem,
  GroceryTag,
  QuantityUnit,
  StorageLocation,
  WeightUnit,
} from "../../types/grocery";
import { GROCERY_TAG_OPTIONS } from "../../types/grocery";
import SpritePicker from "./SpritePicker";
import { suggestSpriteIdForGrocery } from "../../utils/spriteMatcher";
import { parseExpirationDate } from "../../utils/expiration";
import "./SpritePicker.css";
import "./AddGroceryForm.css";

type AddGroceryFormProps = {
  onSaveGrocery: (grocery: GroceryItem) => void;
  onClose: () => void;
  groceryToEdit?: GroceryItem | null;
};

const categories: GroceryCategory[] = [
  "Fruit",
  "Vegetable",
  "Dairy and Alternatives",
  "Meat, Fish, and Seafood",
  "Bakery and Bread",
  "Dry Goods and Grains",
  "Frozen",
  "Beverage",
  "Snack and Convenience Foods",
  "Personal Care and Household Items",
  "Other",
];

const quantityUnits: QuantityUnit[] = [
  "item",
  "items",
  "pack",
  "packs",
  "package",
  "packages",
  "bag",
  "bags",
  "box",
  "boxes",
  "bunch",
  "bunches",
  "can",
  "cans",
  "bottle",
  "bottles",
  "carton",
  "cartons",
  "container",
  "jar",
  "jars",
  "bunch",
  "bunches",
  "jug",
  "jugs",
  "dozen",
  "loaf",
  "loaves",
  "slice",
  "slices",
  "head",
  "heads",
  "pint",
  "quarts",
  "roll",
  "rolls",
];

const weightUnits: WeightUnit[] = ["oz", "lb", "g", "kg", "fl oz", "gal"];

const storageLocations: StorageLocation[] = [
  "Pantry",
  "Fridge",
  "Freezer",
  "Counter",
  "Cabinet",
];

function getInitialTags(groceryToEdit?: GroceryItem | null): GroceryTag[] {
  const initialTags = new Set<GroceryTag>(groceryToEdit?.tags ?? []);

  if (
    groceryToEdit?.organic ||
    /^organic\b/i.test(groceryToEdit?.name ?? "")
  ) {
    initialTags.add("organic");
  }

  return GROCERY_TAG_OPTIONS.filter(({ id }) => initialTags.has(id)).map(
    ({ id }) => id,
  );
}

function AddGroceryForm({
  onSaveGrocery,
  onClose,
  groceryToEdit,
}: AddGroceryFormProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const [name, setName] = useState(groceryToEdit?.name ?? "");
  const [brandName, setBrandName] = useState(
    groceryToEdit?.brandName ?? "",
  );
  const [storeName, setStoreName] = useState(
    groceryToEdit?.storeName ?? "",
  );
  const [selectedTags, setSelectedTags] = useState<GroceryTag[]>(
    getInitialTags(groceryToEdit),
  );
  const [category, setCategory] = useState<GroceryCategory>(
    groceryToEdit?.category ?? "Fruit",
  );
  const [quantity, setQuantity] = useState(groceryToEdit?.quantity ?? 1);
  const [quantityUnit, setQuantityUnit] = useState<QuantityUnit>(
    groceryToEdit?.quantityUnit ?? "item",
  );
  const [weight, setWeight] = useState(
    groceryToEdit?.weight?.toString() ?? "",
  );
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    groceryToEdit?.weightUnit ?? "oz",
  );
  const [expirationDate, setExpirationDate] = useState(
    groceryToEdit?.expirationDate ?? "",
  );
  const [price, setPrice] = useState(groceryToEdit?.price?.toString() ?? "");
  const [manualSpriteId, setManualSpriteId] = useState<string | null>(
    groceryToEdit?.spriteId ?? null,
  );
  const [storageLocation, setStorageLocation] = useState<StorageLocation>(
    groceryToEdit?.storageLocation ?? "Pantry",
  );
  const [error, setError] = useState("");
  const suggestedSpriteId = suggestSpriteIdForGrocery({
    name,
    category,
  });
  const selectedSpriteId = manualSpriteId ?? suggestedSpriteId;

  useEffect(() => {
    const focusTarget = dialogRef.current?.querySelector<HTMLElement>(
      "input, select, button, textarea",
    );

    focusTarget?.focus();
  }, []);

  function handleToggleTag(tagId: GroceryTag) {
    setSelectedTags((currentTags) => {
      if (currentTags.includes(tagId)) {
        return currentTags.filter((existingTag) => existingTag !== tagId);
      }

      return [...currentTags, tagId];
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Please enter the grocery name.");
      return;
    }

    if (quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (expirationDate && !parseExpirationDate(expirationDate)) {
      setError("Please enter a valid expiration date in YYYY-MM-DD format.");
      return;
    }

    const savedGrocery: GroceryItem = {
      id: groceryToEdit?.id ?? crypto.randomUUID(),
      name: name.trim(),
      brandName: brandName.trim() || undefined,
      storeName: storeName.trim() || undefined,
      organic: selectedTags.includes("organic"),
      tags: selectedTags,
      category,
      quantity,
      preferredQuantity: groceryToEdit?.preferredQuantity ?? quantity,
      quantityUnit,
      weight: weight ? Number(weight) : undefined,
      weightUnit: weight ? weightUnit : undefined,
      expirationDate: expirationDate || undefined,
      price: price ? Number(price) : undefined,
      spriteId: selectedSpriteId,
      storageLocation,
      isManuallyAddedToShoppingList:
        groceryToEdit?.isManuallyAddedToShoppingList,
      shoppingQuantity: groceryToEdit?.shoppingQuantity,
      usageHistory: groceryToEdit?.usageHistory,
      dateAdded:
        groceryToEdit?.dateAdded ??
        new Date().toISOString().split("T")[0],
    };

    onSaveGrocery(savedGrocery);
  }

  return (
    <div className="add-grocery-panel__backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="add-grocery-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-grocery-heading"
      >
        <div className="add-grocery-panel__header">
          <div>
            <p className="add-grocery-panel__eyebrow">
              {groceryToEdit ? "Update pantry item" : "New pantry item"}
            </p>

            <h2 id="add-grocery-heading">
              {groceryToEdit ? "Edit Grocery" : "Add a Grocery"}
            </h2>
          </div>

          <button
            type="button"
            className="add-grocery-panel__close"
            onClick={onClose}
            aria-label="Close add grocery form"
          >
            ×
          </button>
        </div>

        <form className="add-grocery-form" onSubmit={handleSubmit}>
          {error && (
            <p className="add-grocery-form__error" role="alert">
              {error}
            </p>
          )}

        <div className="form-field form-field--wide">
          <label htmlFor="grocery-name">Grocery name</label>

          <input
            id="grocery-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            placeholder="Example: Eggs"
          />
        </div>

        <div className="form-field">
          <label htmlFor="grocery-brand">
            Brand name <span>(optional)</span>
          </label>

          <input
            id="grocery-brand"
            type="text"
            value={brandName}
            onChange={(event) => setBrandName(event.target.value)}
            placeholder="Example: Simply Nature"
          />
        </div>

        <div className="form-field">
          <label htmlFor="grocery-store">
            Grocery store <span>(optional)</span>
          </label>

          <input
            id="grocery-store"
            type="text"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            placeholder="Example: Aldi"
          />
        </div>

        <div className="form-field">
          <label htmlFor="grocery-category">Category</label>

          <select
            id="grocery-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as GroceryCategory)}
          >
            {categories.map((categoryOption) => (
              <option key={categoryOption} value={categoryOption}>
                {categoryOption}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="storage-location">Storage location</label>

          <select
            id="storage-location"
            value={storageLocation}
            onChange={(event) => setStorageLocation(event.target.value as StorageLocation)}
          >
            {storageLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="grocery-quantity">Quantity</label>

          <input
            id="grocery-quantity"
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </div>

        <div className="form-field">
          <label htmlFor="quantity-unit">Quantity unit</label>

          <select
            id="quantity-unit"
            value={quantityUnit}
            onChange={(event) => setQuantityUnit(event.target.value as QuantityUnit)}
          >
            {quantityUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="grocery-weight">
            Weight <span>(optional)</span>
          </label>

          <input
            id="grocery-weight"
            type="number"
            min="0"
            step="0.01"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            placeholder="Example: 16"
          />
        </div>

        <div className="form-field">
          <label htmlFor="weight-unit">Weight unit</label>

          <select
            id="weight-unit"
            value={weightUnit}
            onChange={(event) => setWeightUnit(event.target.value as WeightUnit)}
            disabled={!weight}
          >
            {weightUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="expiration-date">
            Expiration date <span>(optional)</span>
          </label>

          <input
            id="expiration-date"
            type="date"
            value={expirationDate}
            onChange={(event) => {
              setExpirationDate(event.target.value);
              setError("");
            }}
          />
        </div>

        <div className="form-field">
          <label htmlFor="grocery-price">
            Price <span>(optional)</span>
          </label>

          <input
            id="grocery-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Example: 4.99"
          />
        </div>

        <fieldset className="form-field form-field--wide form-tags" aria-label="Item tags">
          <legend>Tags</legend>

          <div className="form-tags__grid">
            {GROCERY_TAG_OPTIONS.map((tagOption) => (
              <label key={tagOption.id} className="form-tags__option">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tagOption.id)}
                  onChange={() => handleToggleTag(tagOption.id)}
                />
                <span>{tagOption.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

          <SpritePicker
            selectedSpriteId={selectedSpriteId}
            onSelectSprite={(nextSpriteId) => {
              setManualSpriteId(nextSpriteId);
            }}
          />

          <div className="add-grocery-form__actions">
            <button type="button" className="button button--secondary" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="button button--primary">
              {groceryToEdit ? "Save Changes" : "Save Grocery"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AddGroceryForm;
