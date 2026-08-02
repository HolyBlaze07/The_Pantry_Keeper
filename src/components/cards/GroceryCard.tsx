import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { GroceryItem } from "../../types/grocery";
import { GROCERY_TAG_OPTIONS } from "../../types/grocery";
import { spriteCatalog } from "../../data/spriteCatalog";
import { getExpirationDetails, parseExpirationDate } from "../../utils/expiration";
import ShinyText from "../texts/ShinyText";
import "./GroceryCard.css";

type CardInsight = {
  title: string;
  message: string;
  status:
    | "expired"
    | "expires-today"
    | "use-soon"
    | "running-low"
    | "well-stocked"
    | "normal";
};

function getKitchenNote(grocery: GroceryItem): string {
  const itemName = grocery.name.toLowerCase();

  if (itemName.includes("oat") || itemName.includes("cereal")) {
    return "A versatile breakfast staple that can also be used in baking, granola, and meal preparation.";
  }

  if (itemName.includes("flour") || itemName.includes("cornmeal")) {
    return "Keep sealed in a cool, dry place. Useful for baking, breading, and homemade recipes.";
  }

  if (
    itemName.includes("pasta") ||
    itemName.includes("spaghetti") ||
    itemName.includes("fettuccine") ||
    itemName.includes("macaroni")
  ) {
    return "A dependable meal staple for quick dinners, casseroles, soups, and pasta dishes.";
  }

  if (itemName.includes("milk") || itemName.includes("cream")) {
    return "Keep refrigerated and use for breakfast, baking, sauces, smoothies, or drinks.";
  }

  if (itemName.includes("egg")) {
    return "A versatile refrigerator staple for breakfast, baking, breading, and meal preparation.";
  }

  if (itemName.includes("bean") || itemName.includes("lentil")) {
    return "A filling pantry staple that works well in soups, rice dishes, casseroles, and side dishes.";
  }

  if (itemName.includes("tuna") || itemName.includes("chicken")) {
    return "A convenient protein option for sandwiches, salads, casseroles, soups, and quick meals.";
  }

  if (itemName.includes("broth") || itemName.includes("stock")) {
    return "Use as a flavorful base for soups, rice, gravy, sauces, and slow-cooked meals.";
  }

  if (
    itemName.includes("tomato") ||
    itemName.includes("spinach") ||
    itemName.includes("carrot") ||
    grocery.category === "Vegetable"
  ) {
    return "A versatile ingredient for soups, sauces, casseroles, side dishes, and meal preparation.";
  }

  if (
    itemName.includes("sugar") ||
    itemName.includes("honey") ||
    itemName.includes("syrup")
  ) {
    return "Use for baking, drinks, sauces, breakfast recipes, and homemade desserts.";
  }

  if (
    itemName.includes("seasoning") ||
    itemName.includes("spice") ||
    itemName.includes("salt") ||
    itemName.includes("pepper") ||
    itemName.includes("cumin") ||
    itemName.includes("paprika")
  ) {
    return "Use to build flavor in everyday meals. Keep tightly sealed and store away from heat and moisture.";
  }

  if (grocery.storageLocation === "Fridge") {
    return "Keep refrigerated and check its freshness regularly after opening.";
  }

  if (grocery.storageLocation === "Freezer") {
    return "Keep frozen until ready to use. Reseal carefully to help prevent freezer burn.";
  }

  return `Stored in the ${grocery.storageLocation.toLowerCase()}. Keep the package sealed and check its quantity and freshness regularly.`;
}

function getCardInsight(grocery: GroceryItem): CardInsight {
  const currentQuantity = Number(grocery.quantity) || 0;
  const preferredQuantity = Number(grocery.preferredQuantity) || 0;

  const expirationDate = parseExpirationDate(grocery.expirationDate);

  if (expirationDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    expirationDate.setHours(0, 0, 0, 0);
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / millisecondsPerDay,
    );

    if (daysUntilExpiration < 0) {
      return {
        title: "Freshness Alert",
        message: `This item expired ${Math.abs(daysUntilExpiration)} day${
          Math.abs(daysUntilExpiration) === 1 ? "" : "s"
        } ago. Review and remove it if it is no longer safe to use.`,
        status: "expired",
      };
    }

    if (daysUntilExpiration === 0) {
      return {
        title: "Use Today",
        message: "This item expires today. Plan to use it as soon as possible.",
        status: "expires-today",
      };
    }

    if (daysUntilExpiration <= 3) {
      return {
        title: "Freshness Alert",
        message: `This item expires in ${daysUntilExpiration} day${
          daysUntilExpiration === 1 ? "" : "s"
        }. Consider using it in your next meal.`,
        status: "use-soon",
      };
    }
  }

  if (preferredQuantity > 0 && currentQuantity < preferredQuantity) {
    const amountNeeded = preferredQuantity - currentQuantity;

    return {
      title: "Restock Reminder",
      message: `You currently have ${currentQuantity} ${grocery.quantityUnit}. Add ${amountNeeded} more to reach your preferred stock of ${preferredQuantity}.`,
      status: "running-low",
    };
  }

  if (preferredQuantity > 0 && currentQuantity >= preferredQuantity) {
    return {
      title: "Well Stocked",
      message: `You have reached your preferred stock level of ${preferredQuantity} ${grocery.quantityUnit}. No restock is needed right now.`,
      status: "well-stocked",
    };
  }

  return {
    title: "Kitchen Notes",
    message: getKitchenNote(grocery),
    status: "normal",
  };
}

type GroceryCardProps = {
  item: GroceryItem;
  cardNumber: number;
  totalCards: number;
  onIncreaseQuantity: (groceryId: string) => void;
  onDecreaseQuantity: (groceryId: string) => void;
  onEditGrocery: (grocery: GroceryItem) => void;
  onMarkContainerFinished: (grocery: GroceryItem) => void;
  onReportUsage: (grocery: GroceryItem) => void;
  onUndoLastUsage: (groceryId: string) => void;
  onToggleShoppingList: (groceryId: string) => void;
};

const quantityFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatQuantity(value: number) {
  return quantityFormatter.format(value);
}

function formatUsageDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getUsageHistorySummary(item: GroceryItem) {
  const usageHistory = item.usageHistory ?? [];

  if (usageHistory.length === 0) {
    return {
      title: "Usage Pace",
      summary: `No usage history yet. Use Report Usage to start tracking how quickly you go through this ${item.quantityUnit}.`,
      details: [] as string[],
    };
  }

  const totalUsed = usageHistory.reduce(
    (total, entry) => total + entry.amountUsed,
    0,
  );
  const latestEntry = usageHistory[0];
  const oldestEntry = usageHistory[usageHistory.length - 1];
  const latestDate = latestEntry ? new Date(latestEntry.recordedAt) : null;
  const oldestDate = oldestEntry ? new Date(oldestEntry.recordedAt) : null;

  let weeklyRate: number | null = null;

  if (
    latestDate &&
    oldestDate &&
    !Number.isNaN(latestDate.getTime()) &&
    !Number.isNaN(oldestDate.getTime())
  ) {
    const daySpan = Math.max(
      (latestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24),
      1,
    );
    weeklyRate = (totalUsed / daySpan) * 7;
  }

  const details = [
    `Last used ${formatQuantity(latestEntry.amountUsed)} ${item.quantityUnit} on ${formatUsageDate(latestEntry.recordedAt)}.`,
    `Tracked ${formatQuantity(totalUsed)} ${item.quantityUnit} across ${usageHistory.length} usage ${usageHistory.length === 1 ? "report" : "reports"}.`,
  ];

  if (weeklyRate !== null) {
    details.push(
      `Current pace: about ${formatQuantity(weeklyRate)} ${item.quantityUnit} per week.`,
    );
  }

  return {
    title: "Usage Pace",
    summary:
      weeklyRate !== null
        ? `You are going through this item at about ${formatQuantity(weeklyRate)} ${item.quantityUnit} per week.`
        : `You have recorded ${usageHistory.length} usage ${usageHistory.length === 1 ? "entry" : "entries"} so far.`,
    details,
  };
}

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
  const parsedExpirationDate = parseExpirationDate(expirationDate);

  if (!parsedExpirationDate) {
    return "No Expiration Date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedExpirationDate);
}

function formatDateLabel(value?: string) {
  if (!value) {
    return "Not added";
  }

  const date = parseExpirationDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getDisplayTags(item: GroceryItem) {
  const configuredTags = new Set(item.tags ?? []);

  if (item.organic || /^organic\b/i.test(item.name)) {
    configuredTags.add("organic");
  }

  return GROCERY_TAG_OPTIONS.filter((tagOption) =>
    configuredTags.has(tagOption.id),
  );
}

function GroceryCard({
  item,
  cardNumber,
  totalCards,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onEditGrocery,
  onMarkContainerFinished,
  onReportUsage,
  onUndoLastUsage,
  onToggleShoppingList,
}: GroceryCardProps) {
  const [isBackVisible, setIsBackVisible] = useState(false);
  const cardInsight = getCardInsight(item);
  const cardRef = useRef<HTMLElement | null>(null);
  const targetRotateXRef = useRef(0);
  const targetRotateYRef = useRef(0);
  const currentRotateXRef = useRef(0);
  const currentRotateYRef = useRef(0);
  const targetRatioXRef = useRef(0);
  const targetRatioYRef = useRef(0);
  const currentRatioXRef = useRef(0);
  const currentRatioYRef = useRef(0);

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
  const brandName = item.brandName?.trim() || "Not added";
  const storeName = item.storeName?.trim() || "Not added";
  const displayTags = getDisplayTags(item);
  const preferredQuantityLabel =
    item.preferredQuantity !== undefined
      ? `${item.preferredQuantity} ${item.quantityUnit}`
      : "Not added";
  const shoppingNotes = [
    storeName !== "Not added"
      ? `Usually purchased from ${storeName}.`
      : "Store preference has not been added yet.",
    item.preferredQuantity !== undefined
      ? `Buy when fewer than ${item.preferredQuantity} ${item.quantityUnit} remain.`
      : "Set a preferred quantity to generate a restock target.",
  ];
  const usageHistorySummary = getUsageHistorySummary(item);
  const latestUsageEntry = item.usageHistory?.[0];
  const undoUsageLabel =
    latestUsageEntry?.source === "mark-finished"
      ? "Undo Mark Finished"
      : "Undo Last Usage";

  useEffect(() => {
    let animationFrameId = 0;

    function animate() {
      const cardElement = cardRef.current;

      if (cardElement) {
        currentRotateXRef.current +=
          (targetRotateXRef.current - currentRotateXRef.current) * 0.12;
        currentRotateYRef.current +=
          (targetRotateYRef.current - currentRotateYRef.current) * 0.12;
        currentRatioXRef.current +=
          (targetRatioXRef.current - currentRatioXRef.current) * 0.12;
        currentRatioYRef.current +=
          (targetRatioYRef.current - currentRatioYRef.current) * 0.12;

        cardElement.style.setProperty(
          "--rotate-x",
          `${currentRotateXRef.current}deg`,
        );
        cardElement.style.setProperty(
          "--rotate-y",
          `${currentRotateYRef.current}deg`,
        );
        cardElement.style.setProperty(
          "--ratio-x",
          `${currentRatioXRef.current}`,
        );
        cardElement.style.setProperty(
          "--ratio-y",
          `${currentRatioYRef.current}`,
        );
      }

      animationFrameId = window.requestAnimationFrame(animate);
    }

    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;

    const normalizedX = (event.clientX - (rect.x + halfWidth)) / halfWidth;
    const normalizedY = (event.clientY - (rect.y + halfHeight)) / halfHeight;
    const maxTilt = 24;

    targetRotateYRef.current = Math.max(
      -maxTilt,
      Math.min(maxTilt, normalizedX * maxTilt),
    );
    targetRotateXRef.current = Math.max(
      -maxTilt,
      Math.min(maxTilt, -normalizedY * maxTilt),
    );
    targetRatioXRef.current = Math.max(-2.6, Math.min(2.6, normalizedX * 2.6));
    targetRatioYRef.current = Math.max(-2.6, Math.min(2.6, normalizedY * 2.6));
  }

  function handlePointerLeave() {
    targetRotateXRef.current = 0;
    targetRotateYRef.current = 0;
    targetRatioXRef.current = 0;
    targetRatioYRef.current = 0;
  }

  function handleToggleCardFace() {
    setIsBackVisible((currentValue) => !currentValue);
  }

  function handleCardClick(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;

    if (
      target.closest(
        "button, a, input, select, textarea, label, [role='button']",
      )
    ) {
      return;
    }

    handleToggleCardFace();
  }

  return (
    <article
      ref={cardRef}
      className={`grocery-card grocery-card--${expirationDetails.status} ${
        isBackVisible ? "grocery-card--back-visible" : ""
      }`}
      onClick={handleCardClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="grocery-card__shadow" aria-hidden="true" />
      <div className="grocery-card__circles" aria-hidden="true" />
      <div className="grocery-card__holo-bg" aria-hidden="true" />
      <div className="grocery-card__holo-lines" aria-hidden="true" />
      <div
        className="grocery-card__logo"
        data-logo="PANTRY"
        aria-hidden="true"
      />

      <div className="grocery-card__inner">
        {!isBackVisible ? (
          <>
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

                {displayTags.length > 0 && (
                  <div className="grocery-card__tag-list" aria-label="Item tags">
                    {displayTags.map((tagOption) => (
                      <span
                        key={tagOption.id}
                        className="grocery-card__badge grocery-card__badge--tag"
                      >
                        {tagOption.label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grocery-card__storage">
                  <span>Stored in</span>
                  <strong>{item.storageLocation}</strong>
                </div>
              </div>
            </header>

            <button
              type="button"
              className="grocery-card__artwork grocery-card__artwork-button"
              onClick={handleToggleCardFace}
              aria-label={`Flip ${item.name} card to product details`}
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
            </button>

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
                    {formatQuantity(item.quantity)} {item.quantityUnit}
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
                {formatQuantity(item.quantity)} / {formatQuantity(safePreferredQuantity)} {item.quantityUnit} · {stockPercent}%
              </p>

              <p className="grocery-card__inventory-status">{stockStatus}</p>
            </section>

            <section
              className={`grocery-card__feature grocery-card__insight grocery-card__insight--${cardInsight.status}`}
            >
              <h3 className="grocery-card__feature-title">{cardInsight.title}</h3>

              <p>{cardInsight.message}</p>
            </section>

            <p className="grocery-card__flip-hint">Click anywhere to flip</p>

            <div className="grocery-card__actions">
              <button
                type="button"
                className="grocery-card__flip-button"
                onClick={handleToggleCardFace}
              >
                Flip Card
              </button>
            </div>
          </>
        ) : (
          <>
            <header className="grocery-card__header grocery-card__header--back">
              <div>
                <p className="grocery-card__category">Product Details</p>
                <h3 className="grocery-card__name">{item.name}</h3>
              </div>

              <div className="grocery-card__badges">
                <button
                  type="button"
                  className="grocery-card__flip-button grocery-card__flip-button--compact"
                  onClick={handleToggleCardFace}
                >
                  Front
                </button>
              </div>
            </header>

            <dl className="grocery-card__details grocery-card__details--back">
              <div className="grocery-card__detail">
                <dt>Brand</dt>
                <dd>{brandName}</dd>
              </div>

              <div className="grocery-card__detail">
                <dt>Purchased At</dt>
                <dd>{storeName}</dd>
              </div>

              <div className="grocery-card__detail">
                <dt>Last Price</dt>
                <dd className="grocery-card__price-stack">
                  <span>{formatPrice(item.price)}</span>
                </dd>
              </div>

              <div className="grocery-card__detail">
                <dt>Package Size</dt>
                <dd>{weight}</dd>
              </div>

              <div className="grocery-card__detail">
                <dt>Date Added</dt>
                <dd>{formatDateLabel(item.dateAdded)}</dd>
              </div>

              <div className="grocery-card__detail">
                <dt>Preferred Quantity</dt>
                <dd>{preferredQuantityLabel}</dd>
              </div>
            </dl>

            <section className="grocery-card__feature grocery-card__feature--notes">
              <h3 className="grocery-card__feature-title">Shopping Notes</h3>

              <p>{shoppingNotes[0]}</p>
              <p>{shoppingNotes[1]}</p>
            </section>

            <section className="grocery-card__feature grocery-card__feature--usage">
              <h3 className="grocery-card__feature-title">
                {usageHistorySummary.title}
              </h3>

              <p>{usageHistorySummary.summary}</p>

              {usageHistorySummary.details.map((detail) => (
                <p key={detail}>{detail}</p>
              ))}

              {latestUsageEntry && (
                <button
                  type="button"
                  className="grocery-card__undo-button"
                  onClick={() => onUndoLastUsage(item.id)}
                >
                  {undoUsageLabel}
                </button>
              )}
            </section>

            <p className="grocery-card__flip-hint">Click anywhere to return</p>

            <div className="grocery-card__actions">
              <button
                type="button"
                className="grocery-card__usage-button"
                onClick={() => onReportUsage(item)}
              >
                Report Usage
              </button>

              <button
                type="button"
                className="grocery-card__finish-button"
                onClick={() => onMarkContainerFinished(item)}
                disabled={item.quantity <= 0}
              >
                Mark Finished
              </button>

              <button
                type="button"
                className="grocery-card__shopping-button"
                onClick={() => onToggleShoppingList(item.id)}
                aria-pressed={item.isManuallyAddedToShoppingList ?? false}
                aria-label={
                  item.isManuallyAddedToShoppingList
                    ? `Remove ${item.name} from shopping list`
                    : `Add ${item.name} to shopping list`
                }
                title={
                  item.isManuallyAddedToShoppingList
                    ? "Remove from Shopping List"
                    : "Add to Shopping List"
                }
              >
                {item.isManuallyAddedToShoppingList ? "✓ Listed" : "+ List"}
              </button>

              <button
                type="button"
                className="grocery-card__edit-button"
                onClick={() => onEditGrocery(item)}
              >
                Edit Item
              </button>
            </div>
          </>
        )}

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