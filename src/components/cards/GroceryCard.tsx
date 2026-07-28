import type { GroceryItem } from "../../types/grocery";
import { spriteCatalog } from "../../data/spriteCatalog";
import { getExpirationDetails } from "../../utils/expiration";
import ShinyText from "../texts/ShinyText";
import "./GroceryCard.css";

type GroceryCardProps = {
  item: GroceryItem;
  cardNumber: number;
  totalCards: number;
  onIncreaseQuantity: (groceryId: string) => void;
  onDecreaseQuantity: (groceryId: string) => void;
  onEditGrocery: (grocery: GroceryItem) => void;
};

function formatPrice(price?: number) {
  if (price === undefined) {
    return "Not added";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function formatExpirationDate(expirationDate?: string) {
  if (!expirationDate) {
    return "No Expiration Date";
  }

  const date = new Date(`${expirationDate}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function GroceryCard({
  item,
  cardNumber,
  totalCards,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onEditGrocery,
}: GroceryCardProps) {
  const selectedSprite = spriteCatalog.find(
    (sprite) => sprite.id === item.spriteId,
  );
  const expirationDetails = getExpirationDetails(
    item.expirationDate,
  );
  const preferredQuantity = item.preferredQuantity ?? item.quantity;
  const safePreferredQuantity = Math.max(preferredQuantity, 1);
  const normalizedQuantity = Math.min(
    Math.max(item.quantity, 0),
    safePreferredQuantity,
  );
  const stockPercent = Math.round(
    Math.min(
      (normalizedQuantity / safePreferredQuantity) * 100,
      100,
    ),
  );
  const stockStatus =
    stockPercent === 0
      ? "Out of Stock"
      : stockPercent < 40
        ? "Running Low"
        : stockPercent < 75
          ? "Getting Low"
          : "Well Stocked";

  const weight =
    item.weight !== undefined && item.weightUnit
      ? `${item.weight} ${item.weightUnit}`
      : "Not added";

  return (
    <article
      className={`grocery-card grocery-card--${expirationDetails.status}`}
    >
      <div className="grocery-card__inner">
        <header className="grocery-card__header">
          <div>
            <p className="grocery-card__category">{item.category}</p>
            <h3 className="grocery-card__name">
              <ShinyText
                text={item.name}
                speed={2}
                delay={0}
                color="#381a0b"
                shineColor="#ffffff"
                spread={120}
                direction="left"
                yoyo={false}
                pauseOnHover={false}
                disabled={false}
              />
            </h3>
          </div>

          <div className="grocery-card__badges">
            <span
              className={`grocery-card__status grocery-card__status--${expirationDetails.status}`}
            >
              {expirationDetails.label}
            </span>

            <div className="grocery-card__storage">
              <span>Stored in</span>
              <strong>{item.storageLocation}</strong>
            </div>
          </div>
        </header>

        <div
          className="grocery-card__artwork"
          role="img"
          aria-label={`${item.name} food sprite`}
        >
          {selectedSprite ? (
            <img
              className="grocery-card__sprite"
              src={selectedSprite.image}
              alt={`${item.name} illustration`}
            />
          ) : (
            <span className="grocery-card__fallback" aria-hidden="true">
              🛒
            </span>
          )}

         
        </div>

        <dl className="grocery-card__details">
          <div className="grocery-card__detail grocery-card__detail--quantity">
            <dt>Quantity</dt>

            <dd className="quantity-controls">
              <button
                type="button"
                className="quantity-controls__button"
                onClick={() => onDecreaseQuantity(item.id)}
                aria-label={`Decrease ${item.name} quantity`}
              >
                −
              </button>

              <span className="quantity-controls__value">
                {item.quantity} {item.quantityUnit}
              </span>

              <button
                type="button"
                className="quantity-controls__button"
                onClick={() => onIncreaseQuantity(item.id)}
                aria-label={`Increase ${item.name} quantity`}
              >
                +
              </button>
            </dd>
          </div>

          <div className="grocery-card__detail">
            <dt>Weight</dt>
            <dd>{weight}</dd>
          </div>

          <div className="grocery-card__detail">
            <dt>Expiration</dt>

            <dd>
              <span>{formatExpirationDate(item.expirationDate)}</span>

              {expirationDetails.daysRemaining !== null && (
                <small className="grocery-card__expiration-message">
                  {expirationDetails.daysRemaining < 0
                    ? `${Math.abs(
                        expirationDetails.daysRemaining,
                      )} day(s) overdue`
                    : expirationDetails.daysRemaining === 0
                      ? "Today"
                      : expirationDetails.daysRemaining === 1
                        ? "1 day remaining"
                        : `${expirationDetails.daysRemaining} days remaining`}
                </small>
              )}
            </dd>
          </div>

          <div className="grocery-card__detail">
            <dt>Price</dt>
            <dd>{formatPrice(item.price)}</dd>
          </div>
        </dl>

        <section className="grocery-card__inventory">
          <p className="grocery-card__inventory-label">Stock Level</p>

          <div
            className="grocery-card__meter"
            role="progressbar"
            aria-label="Inventory level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stockPercent}
          >
            <div
              className="grocery-card__meter-fill"
              style={{ width: `${stockPercent}%` }}
            />
          </div>

          <p className="grocery-card__inventory-meta">
            {item.quantity} / {safePreferredQuantity} {item.quantityUnit} · {stockPercent}%
          </p>

          <p className="grocery-card__inventory-status">{stockStatus}</p>
        </section>

        <section className="grocery-card__feature">
          <p className="grocery-card__feature-title">Pantry Record</p>

          <p>
            Track this item’s quantity, storage location, and expiration
            information from your personalized grocery collection.
          </p>
        </section>

        <div className="grocery-card__actions">
          <button
            type="button"
            className="grocery-card__edit-button"
            onClick={() => onEditGrocery(item)}
          >
            Edit Item
          </button>
        </div>

        <footer className="grocery-card__footer">
          <span>Pantry Keeper Collection</span>

          <span>
            {String(cardNumber).padStart(3, "0")} /{" "}
            {String(totalCards).padStart(3, "0")}
          </span>
        </footer>
      </div>
    </article>
  );
}

export default GroceryCard;