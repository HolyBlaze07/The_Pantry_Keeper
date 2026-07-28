import type { GroceryItem } from "../../types/grocery";
import "./ShoppingList.css";

type ShoppingListProps = {
  groceries: GroceryItem[];
  onMarkPurchased: (groceryId: string) => void;
};

function ShoppingList({
  groceries,
  onMarkPurchased,
}: ShoppingListProps) {
  const shoppingItems = groceries
    .map((grocery) => {
      const preferredQuantity =
        grocery.preferredQuantity ?? grocery.quantity;

      const quantityNeeded = Math.max(
        preferredQuantity - grocery.quantity,
        0,
      );

      const estimatedCost =
        grocery.price !== undefined
          ? grocery.price * quantityNeeded
          : 0;

      return {
        grocery,
        preferredQuantity,
        quantityNeeded,
        estimatedCost,
      };
    })
    .filter((item) => item.quantityNeeded > 0);

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
            to restock
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
              quantityNeeded,
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
                    Need {quantityNeeded}
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
