import type { GroceryItem } from "../../types/grocery";
import { getExpirationDetails } from "../../utils/expiration";
import "./PantryDashboard.css";

type PantryDashboardProps = {
  groceries: GroceryItem[];
};

function PantryDashboard({ groceries }: PantryDashboardProps) {
  const totalCards = groceries.length;

  const totalQuantity = groceries.reduce(
    (total, grocery) => total + grocery.quantity,
    0,
  );

  const freshCount = groceries.filter((grocery) => {
    return (
      getExpirationDetails(grocery.expirationDate).status === "fresh"
    );
  }).length;

  const useSoonCount = groceries.filter((grocery) => {
    return (
      getExpirationDetails(grocery.expirationDate).status ===
      "near-expiration"
    );
  }).length;

  const expiringTodayCount = groceries.filter((grocery) => {
    return (
      getExpirationDetails(grocery.expirationDate).status ===
      "expiring-today"
    );
  }).length;

  const expiredCount = groceries.filter((grocery) => {
    return (
      getExpirationDetails(grocery.expirationDate).status === "expired"
    );
  }).length;

  const runningLowCount = groceries.filter((grocery) => {
    const preferredQuantity = grocery.preferredQuantity ?? grocery.quantity;

    if (preferredQuantity <= 0) {
      return false;
    }

    const stockPercentage = (grocery.quantity / preferredQuantity) * 100;

    return stockPercentage < 40;
  }).length;

  const dashboardStats = [
    {
      id: "total-cards",
      label: "Grocery Items",
      value: totalCards,
      detail: "Different pantry records",
      status: "neutral",
    },
    {
      id: "total-quantity",
      label: "Total Quantity",
      value: totalQuantity,
      detail: "Combined item count",
      status: "neutral",
    },
    {
      id: "fresh",
      label: "Fresh",
      value: freshCount,
      detail: "No immediate action",
      status: "fresh",
    },
    {
      id: "use-soon",
      label: "Use Soon",
      value: useSoonCount,
      detail: "Expires within 3 days",
      status: "soon",
    },
    {
      id: "today",
      label: "Expires Today",
      value: expiringTodayCount,
      detail: "Use as soon as possible",
      status: "today",
    },
    {
      id: "expired",
      label: "Expired",
      value: expiredCount,
      detail: "Review and remove",
      status: "expired",
    },
    {
      id: "running-low",
      label: "Running Low",
      value: runningLowCount,
      detail: "Below 40% preferred stock",
      status: "low",
    },
  ];

  return (
    <section
      className="pantry-dashboard"
      aria-labelledby="pantry-dashboard-heading"
    >
      <div className="pantry-dashboard__heading">
        <div>
          <p className="pantry-dashboard__eyebrow">Pantry overview</p>

          <h2 id="pantry-dashboard-heading">Inventory at a Glance</h2>
        </div>

        <p className="pantry-dashboard__summary">
          See what is stocked, running low, or needs to be used soon.
        </p>
      </div>

      <div className="pantry-dashboard__grid">
        {dashboardStats.map((stat) => (
          <article
            key={stat.id}
            className={`pantry-stat pantry-stat--${stat.status}`}
          >
            <p className="pantry-stat__label">{stat.label}</p>

            <p className="pantry-stat__value">{stat.value}</p>

            <p className="pantry-stat__detail">{stat.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PantryDashboard;