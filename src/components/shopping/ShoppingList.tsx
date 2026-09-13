import { useState } from "react";
import type { GroceryItem } from "../../types/grocery";
import "./ShoppingList.css";

type ShoppingListGroupBy = "none" | "store";

type ShoppingListProps = {
  groceries: GroceryItem[];
  groupBy: ShoppingListGroupBy;
  onGroupByChange: (value: ShoppingListGroupBy) => void;
  onMarkPurchased: (groceryId: string) => void;
  onChangeShoppingQuantity: (
    groceryId: string,
    amount: number,
  ) => void;
};

function roundQuantity(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatQuantity(value: number) {
  const roundedValue = roundQuantity(value);

  if (Number.isInteger(roundedValue)) {
    return String(roundedValue);
  }

  return roundedValue.toFixed(2).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function ShoppingList({
  groceries,
  groupBy,
  onGroupByChange,
  onMarkPurchased,
  onChangeShoppingQuantity,
}: ShoppingListProps) {
  const [isExpanded, setIsExpanded] = useState(() =>
    typeof window === "undefined"
      ? true
      : !window.matchMedia("(max-width: 700px)").matches,
  );

  const shoppingItems = groceries
    .map((grocery) => {
      const preferredQuantity =
        grocery.preferredQuantity ?? grocery.quantity;

      const automaticQuantityNeeded = roundQuantity(
        Math.max(preferredQuantity - grocery.quantity, 0),
      );

      const purchaseQuantity = roundQuantity(
        grocery.shoppingQuantity ??
          Math.max(automaticQuantityNeeded, 1),
      );

      const estimatedCost =
        grocery.price !== undefined
          ? grocery.price * purchaseQuantity
          : 0;

      return {
        grocery,
        preferredQuantity,
        automaticQuantityNeeded,
        purchaseQuantity,
        estimatedCost,
      };
    })
    .filter(
      ({ grocery, automaticQuantityNeeded }) =>
        automaticQuantityNeeded > 0 ||
        grocery.isManuallyAddedToShoppingList === true,
    );

  const totalEstimatedCost = shoppingItems.reduce(
    (total, item) => total + item.estimatedCost,
    0,
  );

  const groupedShoppingItems = Array.from(
    shoppingItems.reduce((groups, item) => {
      const storeLabel =
        item.grocery.storeName?.trim() || "Unspecified store";

      const existingGroup = groups.get(storeLabel);

      if (existingGroup) {
        existingGroup.items.push(item);
        existingGroup.totalCost += item.estimatedCost;
        return groups;
      }

      groups.set(storeLabel, {
        label: storeLabel,
        items: [item],
        totalCost: item.estimatedCost,
      });

      return groups;
    }, new Map<string, { label: string; items: typeof shoppingItems; totalCost: number }>()),
  ).sort((first, second) => first[0].localeCompare(second[0]));

  const renderShoppingItem = ({
    grocery,
    preferredQuantity,
    automaticQuantityNeeded,
    purchaseQuantity,
    estimatedCost,
  }: (typeof shoppingItems)[number]) => (
    <article key={grocery.id} className="shopping-item">
      <div className="shopping-item__header">
        <div>
          <p className="shopping-item__category">{grocery.category}</p>
          <h3>{grocery.name}</h3>
        </div>

        <span className="shopping-item__suggested">
          {automaticQuantityNeeded > 0
            ? `Suggested ${formatQuantity(automaticQuantityNeeded)}`
            : "Manual"}
        </span>
      </div>

      <dl className="shopping-item__details">
        <div>
          <dt>Current</dt>
          <dd>
            {formatQuantity(grocery.quantity)} {grocery.quantityUnit}
          </dd>
        </div>

        <div>
          <dt>Preferred</dt>
          <dd>
            {formatQuantity(preferredQuantity)} {grocery.quantityUnit}
          </dd>
        </div>

        <div className="shopping-item__buy-row">
          <span>Buy</span>

          <div className="shopping-quantity-controls">
            <button
              type="button"
              onClick={() => onChangeShoppingQuantity(grocery.id, -1)}
              aria-label={`Decrease ${grocery.name} shopping quantity`}
            >
              −
            </button>

            <strong>
              {formatQuantity(purchaseQuantity)} {grocery.quantityUnit}
            </strong>

            <button
              type="button"
              onClick={() => onChangeShoppingQuantity(grocery.id, 1)}
              aria-label={`Increase ${grocery.name} shopping quantity`}
            >
              +
            </button>
          </div>
        </div>

        <div>
          <dt>Estimated cost</dt>
          <dd>
            {grocery.price !== undefined
              ? `$${estimatedCost.toFixed(2)}`
              : "N/A"}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        className="shopping-item__button"
        onClick={() => onMarkPurchased(grocery.id)}
      >
        Mark Purchased
      </button>
    </article>
  );

  return (
    <section
      className="shopping-list"
      aria-labelledby="shopping-list-heading"
    >
      <div className="shopping-list__heading">
        <div>
          <p className="shopping-list__eyebrow">
            Automatic restock guide
          </p>

          <h2 id="shopping-list-heading">
            Shopping List
          </h2>
        </div>

        <div className="shopping-list__summary">
          <p>
            <strong>{shoppingItems.length}</strong>{" "}
            {shoppingItems.length === 1
              ? "item"
              : "items"}{" "}
            on your list
          </p>

          <p>
            Estimated cost: {" "}
            <strong>
              ${totalEstimatedCost.toFixed(2)}
            </strong>
          </p>
        </div>

        <div className="shopping-list__filter-row">
          <label htmlFor="shopping-list-grouping" className="shopping-list__filter-label">
            Group by
          </label>

          <select
            id="shopping-list-grouping"
            className="shopping-list__filter"
            value={groupBy}
            onChange={(event) =>
              onGroupByChange(event.target.value as ShoppingListGroupBy)
            }
          >
            <option value="none">No grouping</option>
            <option value="store">Store</option>
          </select>
        </div>

        <button
          type="button"
          className="shopping-list__toggle"
          aria-controls="shopping-list-content"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
        >
          {isExpanded ? "Hide List" : "Show List"}
          <span aria-hidden="true">{isExpanded ? "▴" : "▾"}</span>
        </button>
      </div>

      {isExpanded && (
        <div id="shopping-list-content">
          {shoppingItems.length === 0 ? (
            <div className="shopping-list__empty">
              <p className="shopping-list__empty-icon">
                ✓
              </p>

              <h3>Your pantry is fully stocked.</h3>

              <p>
                Nothing currently needs to be added to your
                shopping list.
              </p>
            </div>
          ) : groupBy === "store" ? (
            <div className="shopping-store-groups">
              {groupedShoppingItems.map(([storeLabel, group]) => (
                <div key={storeLabel} className="shopping-store-group">
                  <div className="shopping-store-group__header">
                    <h3>{storeLabel}</h3>
                    <span>
                      {group.items.length} {group.items.length === 1 ? "item" : "items"} · ${group.totalCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="shopping-list__grid">
                    {group.items.map((item) => renderShoppingItem(item))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="shopping-list__grid">
              {shoppingItems.map((item) => renderShoppingItem(item))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ShoppingList;



