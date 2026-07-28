import type { GroceryItem } from "../../types/grocery";
import "./ShoppingList.css";

type ShoppingListProps = {
  groceries: GroceryItem[];
  onMarkPurchased: (groceryId: string) => void;
  onChangeShoppingQuantity: (
    groceryId: string,
    amount: number,
  ) => void;
};

function ShoppingList({
  groceries,
  onMarkPurchased,
  onChangeShoppingQuantity,
}: ShoppingListProps) {
  const shoppingItems = groceries
    .map((grocery) => {
      const preferredQuantity =
        grocery.preferredQuantity ?? grocery.quantity;

      const automaticQuantityNeeded = Math.max(
        preferredQuantity - grocery.quantity,
        0,
      );

      const purchaseQuantity =
        grocery.shoppingQuantity ??
        Math.max(automaticQuantityNeeded, 1);

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
      </div>

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
      ) : (
        <div className="shopping-list__grid">
          {shoppingItems.map(
            ({
              grocery,
              preferredQuantity,
              automaticQuantityNeeded,
              purchaseQuantity,
              estimatedCost,
            }) => (
              <article
                key={grocery.id}
                className="shopping-item"
              >
                <div className="shopping-item__heading">
                  <div>
                    <p className="shopping-item__category">
                      {grocery.category}
                    </p>

                    <h3>{grocery.name}</h3>
                  </div>

                  <span className="shopping-item__need">
                    {automaticQuantityNeeded > 0
                      ? `Suggested ${automaticQuantityNeeded}`
                      : "Manually Added"}
                  </span>
                </div>

                <dl className="shopping-item__details">
                  <div>
                    <dt>Current</dt>
                    <dd>
                      {grocery.quantity} {grocery.quantityUnit}
                    </dd>
                  </div>

                  <div>
                    <dt>Preferred</dt>
                    <dd>
                      {preferredQuantity} {grocery.quantityUnit}
                    </dd>
                  </div>

                  <div className="shopping-item__quantity">
                    <span>Buy</span>

                    <div className="shopping-quantity-controls">
                      <button
                        type="button"
                        onClick={() =>
                          onChangeShoppingQuantity(grocery.id, -1)
                        }
                        aria-label={`Decrease ${grocery.name} shopping quantity`}
                      >
                        −
                      </button>

                      <strong>
                        {purchaseQuantity} {grocery.quantityUnit}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          onChangeShoppingQuantity(grocery.id, 1)
                        }
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
                        : "Not available"}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  className="shopping-item__button"
                  onClick={() =>
                    onMarkPurchased(grocery.id)
                  }
                >
                  Mark Purchased
                </button>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}

export default ShoppingList;
