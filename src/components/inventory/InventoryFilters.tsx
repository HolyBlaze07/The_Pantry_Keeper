import type { ChangeEvent } from "react";
import "./InventoryFilters.css";

export type InventorySort =
  | "name-ascending"
  | "name-descending"
  | "expiration-soonest"
  | "quantity-lowest"
  | "recently-added";

type InventoryFiltersProps = {
  searchQuery: string;
  categoryFilter: string;
  locationFilter: string;
  statusFilter: string;
  sortBy: InventorySort;
  categories: string[];
  locations: string[];
  resultCount: number;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: InventorySort) => void;
  onClearFilters: () => void;
};

function InventoryFilters({
  searchQuery,
  categoryFilter,
  locationFilter,
  statusFilter,
  sortBy,
  categories,
  locations,
  resultCount,
  onSearchChange,
  onCategoryChange,
  onLocationChange,
  onStatusChange,
  onSortChange,
  onClearFilters,
}: InventoryFiltersProps) {
  const filtersAreActive =
    searchQuery !== "" ||
    categoryFilter !== "all" ||
    locationFilter !== "all" ||
    statusFilter !== "all";

  function handleSortChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    onSortChange(event.target.value as InventorySort);
  }

  return (
    <section
      className="inventory-filters"
      aria-label="Grocery collection filters"
    >
      <div className="inventory-filters__search">
        <label htmlFor="grocery-search">Search your pantry</label>

        <input
          id="grocery-search"
          type="search"
          placeholder="Search groceries..."
          value={searchQuery}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
        />
      </div>

      <div className="inventory-filters__controls">
        <div className="inventory-filter">
          <label htmlFor="category-filter">Category</label>

          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(event) =>
              onCategoryChange(event.target.value)
            }
          >
            <option value="all">All Categories</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="inventory-filter">
          <label htmlFor="location-filter">Storage</label>

          <select
            id="location-filter"
            value={locationFilter}
            onChange={(event) =>
              onLocationChange(event.target.value)
            }
          >
            <option value="all">All Locations</option>

            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        <div className="inventory-filter">
          <label htmlFor="status-filter">Status</label>

          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) =>
              onStatusChange(event.target.value)
            }
          >
            <option value="all">All Statuses</option>
            <option value="fresh">Fresh</option>
            <option value="near-expiration">Use Soon</option>
            <option value="expiring-today">Expires Today</option>
            <option value="expired">Expired</option>
            <option value="running-low">Running Low</option>
          </select>
        </div>

        <div className="inventory-filter">
          <label htmlFor="sort-filter">Sort</label>

          <select
            id="sort-filter"
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="name-ascending">Name A–Z</option>
            <option value="name-descending">Name Z–A</option>
            <option value="expiration-soonest">Expiration Soonest</option>
            <option value="quantity-lowest">Lowest Quantity</option>
            <option value="recently-added">Recently Added</option>
          </select>
        </div>
      </div>

      <div className="inventory-filters__footer">
        <p>
          Showing <strong>{resultCount} {resultCount === 1 ? "grocery" : "groceries"}</strong>
        </p>

        {filtersAreActive && (
          <button type="button" onClick={onClearFilters}>
            Clear Filters
          </button>
        )}
      </div>
    </section>
  );
}

export default InventoryFilters;