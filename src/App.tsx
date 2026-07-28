import "./App.css";
import GroceryCard from "./components/cards/GroceryCard";
import InventoryFilters, {
  type InventorySort,
} from "./components/inventory/InventoryFilters";
import AddGroceryForm from "./components/inventory/AddGroceryForm";
import StockPreferenceModal from "./components/inventory/StockPreferenceModal";
import PantryDashboard from "./components/dashboard/PantryDashboard";
import ShoppingList from "./components/shopping/ShoppingList";
import { sampleGroceries } from "./data/sampleGroceries";
import PixelBlast from "./components/backgrounds/PixelBlast";
import { useEffect, useMemo, useState } from "react";
import type { GroceryItem } from "./types/grocery";
import { getExpirationDetails } from "./utils/expiration";
import { loadGroceries, saveGroceries } from "./utils/inventoryStorage";

function App() {
  const [groceries, setGroceries] = useState(() =>
    loadGroceries(sampleGroceries),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<InventorySort>("name-ascending");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [groceryToEdit, setGroceryToEdit] = useState<GroceryItem | null>(null);
  const [groceryToPersonalize, setGroceryToPersonalize] =
    useState<GroceryItem | null>(null);
  const groceryCount = groceries.length;
  const categories = useMemo(() => {
    return Array.from(
      new Set(groceries.map((grocery) => grocery.category)),
    ).sort();
  }, [groceries]);

  const locations = useMemo(() => {
    return Array.from(
      new Set(groceries.map((grocery) => grocery.storageLocation)),
    ).sort();
  }, [groceries]);

  const visibleGroceries = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filteredGroceries = groceries.filter((grocery) => {
      const matchesSearch =
        normalizedSearch === "" ||
        grocery.name.toLowerCase().includes(normalizedSearch) ||
        grocery.category.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        categoryFilter === "all" || grocery.category === categoryFilter;

      const matchesLocation =
        locationFilter === "all" || grocery.storageLocation === locationFilter;

      const expirationStatus = getExpirationDetails(grocery.expirationDate).status;

      const preferredQuantity = grocery.preferredQuantity ?? grocery.quantity;
      const stockPercentage =
        preferredQuantity > 0
          ? (grocery.quantity / preferredQuantity) * 100
          : 100;
      const isRunningLow = stockPercentage < 40;

      const matchesStatus =
        statusFilter === "all" ||
        expirationStatus === statusFilter ||
        (statusFilter === "running-low" && isRunningLow);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLocation &&
        matchesStatus
      );
    });

    return [...filteredGroceries].sort((first, second) => {
      switch (sortBy) {
        case "name-descending":
          return second.name.localeCompare(first.name);

        case "expiration-soonest": {
          if (!first.expirationDate) return 1;
          if (!second.expirationDate) return -1;

          return (
            new Date(first.expirationDate).getTime() -
            new Date(second.expirationDate).getTime()
          );
        }

        case "quantity-lowest":
          return first.quantity - second.quantity;

        case "recently-added":
          return (
            new Date(second.dateAdded).getTime() -
            new Date(first.dateAdded).getTime()
          );

        case "name-ascending":
        default:
          return first.name.localeCompare(second.name);
      }
    });
  }, [
    groceries,
    searchQuery,
    categoryFilter,
    locationFilter,
    statusFilter,
    sortBy,
  ]);

  useEffect(() => {
    saveGroceries(groceries);
  }, [groceries]);

  function handleIncreaseQuantity(groceryId: string) {
    setGroceries((currentGroceries) =>
      currentGroceries.map((grocery) =>
        grocery.id === groceryId
          ? {
              ...grocery,
              quantity: grocery.quantity + 1,
            }
          : grocery,
      ),
    );
  }

  function handleDecreaseQuantity(groceryId: string) {
    setGroceries((currentGroceries) => {
      const selectedGrocery = currentGroceries.find(
        (grocery) => grocery.id === groceryId,
      );

      if (!selectedGrocery) {
        return currentGroceries;
      }

      if (selectedGrocery.quantity === 1) {
        const shouldRemove = window.confirm(
          `${selectedGrocery.name} will reach zero. Remove it from your inventory?`,
        );

        if (!shouldRemove) {
          return currentGroceries;
        }

        return currentGroceries.filter(
          (grocery) => grocery.id !== groceryId,
        );
      }

      return currentGroceries.map((grocery) =>
        grocery.id === groceryId
          ? {
              ...grocery,
              quantity: grocery.quantity - 1,
            }
          : grocery,
      );
    });
  }

  function handleSaveGrocery(savedGrocery: GroceryItem) {
    const groceryAlreadyExists = groceries.some(
      (grocery) => grocery.id === savedGrocery.id,
    );

    if (groceryAlreadyExists) {
      setGroceries((currentGroceries) =>
        currentGroceries.map((grocery) =>
          grocery.id === savedGrocery.id ? savedGrocery : grocery,
        ),
      );

      setGroceryToEdit(null);
      setIsFormOpen(false);
      return;
    }

    setGroceries((currentGroceries) => [...currentGroceries, savedGrocery]);

    setIsFormOpen(false);
    setGroceryToPersonalize(savedGrocery);
  }

  function handleEditGrocery(grocery: GroceryItem) {
    setGroceryToEdit(grocery);
    setIsFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleSaveStockPreference(
    groceryId: string,
    preferredQuantity: number,
  ) {
    setGroceries((currentGroceries) =>
      currentGroceries.map((grocery) =>
        grocery.id === groceryId
          ? {
              ...grocery,
              preferredQuantity,
            }
          : grocery,
      ),
    );

    setGroceryToPersonalize(null);
  }

  function handleMarkPurchased(groceryId: string) {
    setGroceries((currentGroceries) =>
      currentGroceries.map((grocery) => {
        if (grocery.id !== groceryId) {
          return grocery;
        }

        const preferredQuantity =
          grocery.preferredQuantity ?? grocery.quantity;
        const automaticQuantityNeeded = Math.max(
          preferredQuantity - grocery.quantity,
          0,
        );

        const purchaseQuantity =
          grocery.shoppingQuantity ??
          Math.max(automaticQuantityNeeded, 1);

        return {
          ...grocery,
          quantity: grocery.quantity + purchaseQuantity,
          isManuallyAddedToShoppingList: false,
          shoppingQuantity: undefined,
        };
      }),
    );
  }

  function handleToggleShoppingList(groceryId: string) {
    setGroceries((currentGroceries) =>
      currentGroceries.map((grocery) =>
        grocery.id === groceryId
          ? (() => {
              const preferredQuantity =
                grocery.preferredQuantity ?? grocery.quantity;

              const automaticQuantityNeeded = Math.max(
                preferredQuantity - grocery.quantity,
                0,
              );

              const willBeAdded =
                !grocery.isManuallyAddedToShoppingList;

              return {
                ...grocery,
                isManuallyAddedToShoppingList: willBeAdded,
                shoppingQuantity: willBeAdded
                  ? Math.max(
                      grocery.shoppingQuantity ??
                        automaticQuantityNeeded,
                      1,
                    )
                  : undefined,
              };
            })()
          : grocery,
      ),
    );
  }

  function handleChangeShoppingQuantity(
    groceryId: string,
    amount: number,
  ) {
    setGroceries((currentGroceries) =>
      currentGroceries.map((grocery) => {
        if (grocery.id !== groceryId) {
          return grocery;
        }

        const preferredQuantity =
          grocery.preferredQuantity ?? grocery.quantity;

        const automaticQuantityNeeded = Math.max(
          preferredQuantity - grocery.quantity,
          1,
        );

        const currentShoppingQuantity =
          grocery.shoppingQuantity ?? automaticQuantityNeeded;

        return {
          ...grocery,
          shoppingQuantity: Math.max(
            currentShoppingQuantity + amount,
            1,
          ),
        };
      }),
    );
  }

  function handleClearFilters() {
    setSearchQuery("");
    setCategoryFilter("all");
    setLocationFilter("all");
    setStatusFilter("all");
    setSortBy("name-ascending");
  }

  return (
    <main className="app">
      <div className="app-snow" aria-hidden="true">
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#B497CF"
          patternScale={2}
          patternDensity={1}
          pixelSizeJitter={0}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid={false}
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.5}
          edgeFade={0.25}
          transparent
        />
      </div>

      <div className="app-content">
        <section className="welcome">
          <p className="eyebrow">A Smart Grocery Inventory</p>

          <h1>The Pantry Keeper</h1>

          <p className="description">
            Collect your groceries, track their freshness, and preserve every
            pantry companion inside your personalized book.
          </p>

          <p className="description">
            Loaded groceries: {groceryCount}
          </p>

          <button
            type="button"
            className="add-grocery-button"
            onClick={() => {
              setGroceryToEdit(null);
              setIsFormOpen(true);
            }}
          >
            + Add Grocery
          </button>
        </section>

        {isFormOpen && (
          <AddGroceryForm
            key={groceryToEdit?.id ?? "new-grocery"}
            groceryToEdit={groceryToEdit}
            onSaveGrocery={handleSaveGrocery}
            onClose={() => {
              setIsFormOpen(false);
              setGroceryToEdit(null);
            }}
          />
        )}

        {groceryToPersonalize && (
          <StockPreferenceModal
            grocery={groceryToPersonalize}
            onSave={handleSaveStockPreference}
            onSkip={() => setGroceryToPersonalize(null)}
          />
        )}

        <PantryDashboard groceries={groceries} />

        <ShoppingList
          groceries={groceries}
          onMarkPurchased={handleMarkPurchased}
          onChangeShoppingQuantity={handleChangeShoppingQuantity}
        />

        <InventoryFilters
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          locationFilter={locationFilter}
          statusFilter={statusFilter}
          sortBy={sortBy}
          categories={categories}
          locations={locations}
          resultCount={visibleGroceries.length}
          onSearchChange={setSearchQuery}
          onCategoryChange={setCategoryFilter}
          onLocationChange={setLocationFilter}
          onStatusChange={setStatusFilter}
          onSortChange={setSortBy}
          onClearFilters={handleClearFilters}
        />

        <section
          className="collection"
          aria-labelledby="collection-heading"
        >
          <div className="collection__heading">
            <div>
              <p className="collection__label">Pantry records</p>

              <h2 id="collection-heading">Your Grocery Collection</h2>
            </div>

            <span className="collection__total">
              {visibleGroceries.length} cards
            </span>
          </div>

          <div className="collection__grid">
            {visibleGroceries.length === 0 && (
              <div className="inventory-empty-state">
                <p className="inventory-empty-state__eyebrow">
                  No pantry records found
                </p>

                <h3>Nothing matches those filters.</h3>

                <p>
                  Try another search or clear your active filters.
                </p>

                <button
                  type="button"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {visibleGroceries.map((item, index) => (
              <GroceryCard
                key={item.id}
                item={item}
                cardNumber={index + 1}
                totalCards={visibleGroceries.length}
                onIncreaseQuantity={handleIncreaseQuantity}
                onDecreaseQuantity={handleDecreaseQuantity}
                onEditGrocery={handleEditGrocery}
                onToggleShoppingList={handleToggleShoppingList}
              />
            ))}
          </div>
        </section>
      </div>

    </main>
  );
}

export default App;