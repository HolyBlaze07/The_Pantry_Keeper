import type { GroceryItem } from "../../types/grocery";
import "./GroceryCard.css";

type GroceryCardProps = {
  item: GroceryItem;
  cardNumber: number;
  totalCards: number;
};

const spriteFallbacks: Record<string, string> = {
  strawberry: "fruit_strawberry.png",
  milk: "coffee_milkjug.png",
  bread: "breadloaf.png",
  apple: "fruit_apple.png",
  banana: "fruit_banana.png",
  egg: "eggs_brown.png",
  cheese: "cheese_camembert.png",
  tomato: "vegetable_tomato.png",
};

const spriteImages = import.meta.glob("../../assets/food sprites/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

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
    return "No date added";
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
}: GroceryCardProps) {
  const spriteFileName = spriteFallbacks[item.spriteId];
  const spriteSrc = spriteFileName
    ? spriteImages[`../../assets/food sprites/${spriteFileName}`]
    : undefined;

  const weight =
    item.weight !== undefined && item.weightUnit
      ? `${item.weight} ${item.weightUnit}`
      : "Not added";

  return (
    <article className="grocery-card">
      <div className="grocery-card__inner">
        <header className="grocery-card__header">
          <div>
            <p className="grocery-card__category">{item.category}</p>
            <h3 className="grocery-card__name">{item.name}</h3>
          </div>

          <div className="grocery-card__storage">
            <span>Stored in</span>
            <strong>{item.storageLocation}</strong>
          </div>
        </header>

        <div
          className="grocery-card__artwork"
          role="img"
          aria-label={`${item.name} food sprite`}
        >
          {spriteSrc ? (
            <img
              className="grocery-card__sprite"
              src={spriteSrc}
              alt=""
              aria-hidden="true"
            />
          ) : (
            <span className="grocery-card__sprite" aria-hidden="true">
              🛒
            </span>
          )}

         
        </div>

        <dl className="grocery-card__details">
          <div className="grocery-card__detail">
            <dt>Quantity</dt>
            <dd>
              {item.quantity} {item.quantityUnit}
            </dd>
          </div>

          <div className="grocery-card__detail">
            <dt>Weight</dt>
            <dd>{weight}</dd>
          </div>

          <div className="grocery-card__detail">
            <dt>Expiration</dt>
            <dd>{formatExpirationDate(item.expirationDate)}</dd>
          </div>

          <div className="grocery-card__detail">
            <dt>Price</dt>
            <dd>{formatPrice(item.price)}</dd>
          </div>
        </dl>

        <section className="grocery-card__feature">
          <p className="grocery-card__feature-title">Pantry Record</p>

          <p>
            Track this item’s quantity, storage location, and expiration
            information from your personalized grocery collection.
          </p>
        </section>

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