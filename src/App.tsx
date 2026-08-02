import "./App.css";
import GroceryCard from "./components/cards/GroceryCard";
import InventoryFilters, {
  type InventorySort,
} from "./components/inventory/InventoryFilters";
import AddGroceryForm from "./components/inventory/AddGroceryForm";
import StockPreferenceModal from "./components/inventory/StockPreferenceModal";
import UsageReportModal from "./components/inventory/UsageReportModal";
import PantryDashboard from "./components/dashboard/PantryDashboard";
import ShoppingList from "./components/shopping/ShoppingList";
import RecipeSuggestions from "./components/recipes/RecipeSuggestions";
import ConfirmModal from "./components/ui/ConfirmModal";
import { sampleGroceries } from "./data/sampleGroceries";
import { homeInventory } from "./data/homeInventory";
import { spriteCatalog } from "./data/spriteCatalog";
import PixelBlast from "./components/backgrounds/PixelBlast";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GroceryItem } from "./types/grocery";
import { GROCERY_TAG_OPTIONS } from "./types/grocery";
import { getExpirationDetails, parseExpirationDate } from "./utils/expiration";
import { loadGroceries, saveGroceries } from "./utils/inventoryStorage";
import { remapGroceriesToBestSprites } from "./utils/spriteMatcher";

const LOCATION_DISPLAY_ORDER: GroceryItem["storageLocation"][] = [
  "Pantry",
  "Fridge",
  "Freezer",
  "Cabinet",
  "Counter",
];
const SPRITE_AUTOMAP_VERSION_STORAGE_KEY =
  "pantry-keeper-sprite-automap-version";

const SPRITE_AUTOMAP_VERSION = spriteCatalog
  .map((sprite) => sprite.id)
  .sort()
  .join("|");

function initializeGroceries() {
  const loadedGroceries = loadGroceries(sampleGroceries);

  try {
    const appliedVersion = localStorage.getItem(
      SPRITE_AUTOMAP_VERSION_STORAGE_KEY,
    );

    if (appliedVersion === SPRITE_AUTOMAP_VERSION) {
      return loadedGroceries;
    }

    const remappedGroceries = remapGroceriesToBestSprites(loadedGroceries);
    const hasChanges = remappedGroceries.some(
      (grocery, index) => grocery.spriteId !== loadedGroceries[index]?.spriteId,
    );

    localStorage.setItem(
      SPRITE_AUTOMAP_VERSION_STORAGE_KEY,
      SPRITE_AUTOMAP_VERSION,
    );

    return hasChanges ? remappedGroceries : loadedGroceries;
  } catch (error) {
    console.error("Could not run sprite automap migration:", error);
    return loadedGroceries;
  }
}

function getLocationLabel(location: GroceryItem["storageLocation"]) {
  if (location === "Fridge") {
    return "Refrigerator";
  }

  return location;
}

function applyUsageToGrocery(
  grocery: GroceryItem,
  amountUsed: number,
  source: "report-usage" | "mark-finished",
) {
  const nextQuantity = Math.max(grocery.quantity - amountUsed, 0);
  const preferredQuantity = grocery.preferredQuantity ?? 0;
  const quantityNeeded = Math.max(preferredQuantity - nextQuantity, 0);

  return {
    ...grocery,
    quantity: nextQuantity,
    shoppingQuantity:
      quantityNeeded > 0
        ? Math.max(grocery.shoppingQuantity ?? 0, quantityNeeded)
        : grocery.shoppingQuantity,
    usageHistory: [
      {
        amountUsed,
        recordedAt: new Date().toISOString(),
        previousQuantity: grocery.quantity,
        previousShoppingQuantity: grocery.shoppingQuantity,
        previousIsManuallyAddedToShoppingList:
          grocery.isManuallyAddedToShoppingList,
        source,
      },
      ...(grocery.usageHistory ?? []),
    ].slice(0, 12),
  };
}

function App() {
  const [groceries, setGroceries] = useState(() => initializeGroceries());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<InventorySort>("name-ascending");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [groceryToEdit, setGroceryToEdit] = useState<GroceryItem | null>(null);
  const [groceryToPersonalize, setGroceryToPersonalize] =
    useState<GroceryItem | null>(null);
  const [groceryToReportUsage, setGroceryToReportUsage] =
    useState<GroceryItem | null>(null);
  const [groceryPendingFinish, setGroceryPendingFinish] =
    useState<GroceryItem | null>(null);
  const [groceryPendingRemoval, setGroceryPendingRemoval] =
    useState<GroceryItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const scrollPositionRef = useRef(0);
  const [collapsedLocations, setCollapsedLocations] = useState<
    Partial<Record<GroceryItem["storageLocation"], boolean>>
  >({});
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

      const normalizedTags = new Set(grocery.tags ?? []);

      if (
        grocery.organic ||
        /^organic\b/i.test(grocery.name)
      ) {
        normalizedTags.add("organic");
      }

      const tagIsRecognized = GROCERY_TAG_OPTIONS.some(
        (tagOption) => tagOption.id === tagFilter,
      );

      const matchesTag =
        tagFilter === "all" ||
        (tagIsRecognized && normalizedTags.has(tagFilter as typeof GROCERY_TAG_OPTIONS[number]["id"]));

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
        matchesTag &&
        matchesLocation &&
        matchesStatus
      );
    });

    return [...filteredGroceries].sort((first, second) => {
      switch (sortBy) {
        case "name-descending":
          return second.name.localeCompare(first.name);

        case "expiration-soonest": {
          const firstExpiration = parseExpirationDate(first.expirationDate);
          const secondExpiration = parseExpirationDate(second.expirationDate);

          if (!firstExpiration && !secondExpiration) return 0;
          if (!firstExpiration) return 1;
          if (!secondExpiration) return -1;

          return (
            firstExpiration.getTime() - secondExpiration.getTime()
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
    tagFilter,
    locationFilter,
    statusFilter,
    sortBy,
  ]);

  const groupedVisibleGroceries = useMemo(() => {
    const groups = new Map<
      GroceryItem["storageLocation"],
      GroceryItem[]
    >();

    for (const grocery of visibleGroceries) {
      const existingGroup = groups.get(grocery.storageLocation);

      if (existingGroup) {
        existingGroup.push(grocery);
      } else {
        groups.set(grocery.storageLocation, [grocery]);
      }
    }

    return Array.from(groups.entries())
      .sort(([locationA], [locationB]) => {
        const indexA = LOCATION_DISPLAY_ORDER.indexOf(locationA);
        const indexB = LOCATION_DISPLAY_ORDER.indexOf(locationB);

        if (indexA === -1 && indexB === -1) {
          return locationA.localeCompare(locationB);
        }

        if (indexA === -1) {
          return 1;
        }

        if (indexB === -1) {
          return -1;
        }

        return indexA - indexB;
      })
      .map(([location, items]) => ({
        location,
        items,
      }));
  }, [visibleGroceries]);

  useEffect(() => {
    saveGroceries(groceries);
  }, [groceries]);

  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (groceryPendingRemoval) {
        setGroceryPendingRemoval(null);
        return;
      }

      if (groceryPendingFinish) {
        setGroceryPendingFinish(null);
        return;
      }

      if (isResetConfirmOpen) {
        setIsResetConfirmOpen(false);
        return;
      }

      if (groceryToPersonalize) {
        setGroceryToPersonalize(null);
        return;
      }

      if (groceryToReportUsage) {
        setGroceryToReportUsage(null);
        return;
      }

      if (isFormOpen) {
        setIsFormOpen(false);
        setGroceryToEdit(null);
      }
    }

    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [
    groceryPendingRemoval,
    groceryPendingFinish,
    groceryToReportUsage,
    groceryToPersonalize,
    isFormOpen,
    isResetConfirmOpen,
  ]);

  useEffect(() => {
    const modalIsOpen =
      isFormOpen ||
      groceryPendingRemoval !== null ||
      groceryPendingFinish !== null ||
      groceryToReportUsage !== null ||
      groceryToPersonalize !== null ||
      isResetConfirmOpen;

    if (!modalIsOpen) {
      return;
    }

    scrollPositionRef.current = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollPositionRef.current}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";

      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: "instant",
      });
    };
  }, [
    groceryPendingRemoval,
    groceryPendingFinish,
    groceryToReportUsage,
    groceryToPersonalize,
    isFormOpen,
    isResetConfirmOpen,
  ]);

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

      if (selectedGrocery.quantity <= 1) {
        setGroceryPendingRemoval(selectedGrocery);
        return currentGroceries;
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

  function handleSaveUsageReport(groceryId: string, amountUsed: number) {
    setGroceries((currentGroceries) =>
      currentGroceries.map((grocery) => {
        if (grocery.id !== groceryId) {
          return grocery;
        }

        return applyUsageToGrocery(grocery, amountUsed, "report-usage");
      }),
    );

    setGroceryToReportUsage(null);
  }

  function handleConfirmMarkContainerFinished() {
    if (!groceryPendingFinish) {
      return;
    }

    const groceryId = groceryPendingFinish.id;

    setGroceries((currentGroceries) =>
      currentGroceries.map((grocery) => {
        if (grocery.id !== groceryId || grocery.quantity <= 0) {
          return grocery;
        }

        return applyUsageToGrocery(
          grocery,
          grocery.quantity,
          "mark-finished",
        );
      }),
    );

    setGroceryPendingFinish(null);
  }

  function handleUndoLastUsage(groceryId: string) {
    setGroceries((currentGroceries) =>
      currentGroceries.map((grocery) => {
        if (grocery.id !== groceryId) {
          return grocery;
        }

        const latestUsage = grocery.usageHistory?.[0];

        if (!latestUsage) {
          return grocery;
        }

        const restoredQuantity =
          latestUsage.previousQuantity ??
          Math.max(grocery.quantity + latestUsage.amountUsed, 0);
        const preferredQuantity = grocery.preferredQuantity ?? 0;
        const quantityNeeded = Math.max(
          preferredQuantity - restoredQuantity,
          0,
        );

        return {
          ...grocery,
          quantity: restoredQuantity,
          isManuallyAddedToShoppingList:
            latestUsage.previousIsManuallyAddedToShoppingList ??
            grocery.isManuallyAddedToShoppingList,
          shoppingQuantity:
            latestUsage.previousShoppingQuantity !== undefined
              ? latestUsage.previousShoppingQuantity
              : quantityNeeded > 0
                ? quantityNeeded
                : undefined,
          usageHistory: grocery.usageHistory?.slice(1),
        };
      }),
    );
  }

  function handleConfirmRemoval() {
    if (!groceryPendingRemoval) {
      return;
    }

    setGroceries((currentGroceries) =>
      currentGroceries.filter(
        (grocery) => grocery.id !== groceryPendingRemoval.id,
      ),
    );

    setGroceryPendingRemoval(null);
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
    setTagFilter("all");
    setLocationFilter("all");
    setStatusFilter("all");
    setSortBy("name-ascending");
  }

  function handleToggleLocationSection(
    location: GroceryItem["storageLocation"],
  ) {
    setCollapsedLocations((currentCollapsedLocations) => ({
      ...currentCollapsedLocations,
      [location]: !currentCollapsedLocations[location],
    }));
  }

  function handleLoadHomeInventory() {
    setGroceries(homeInventory);
    setSearchQuery("");
    setCategoryFilter("all");
    setTagFilter("all");
    setLocationFilter("all");
    setStatusFilter("all");
    setSortBy("name-ascending");
    setGroceryToEdit(null);
    setIsFormOpen(false);
    setGroceryPendingRemoval(null);
    setGroceryToPersonalize(null);
  }

  function handleResetInventory() {
    setGroceries(sampleGroceries);
    setSearchQuery("");
    setCategoryFilter("all");
    setTagFilter("all");
    setLocationFilter("all");
    setStatusFilter("all");
    setSortBy("name-ascending");
    setGroceryToEdit(null);
    setIsFormOpen(false);
    setGroceryPendingRemoval(null);
    setGroceryToPersonalize(null);
  }

  function handleRefreshSpriteMatches() {
    setGroceries((currentGroceries) =>
      remapGroceriesToBestSprites(currentGroceries),
    );
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

        {groceryToReportUsage && (
          <UsageReportModal
            grocery={groceryToReportUsage}
            onSave={handleSaveUsageReport}
            onClose={() => setGroceryToReportUsage(null)}
          />
        )}

        <PantryDashboard groceries={groceries} />

        <ShoppingList
          groceries={groceries}
          onMarkPurchased={handleMarkPurchased}
          onChangeShoppingQuantity={handleChangeShoppingQuantity}
        />

        <RecipeSuggestions groceries={groceries} />

        <InventoryFilters
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          tagFilter={tagFilter}
          locationFilter={locationFilter}
          statusFilter={statusFilter}
          sortBy={sortBy}
          categories={categories}
          locations={locations}
          resultCount={visibleGroceries.length}
          onSearchChange={setSearchQuery}
          onCategoryChange={setCategoryFilter}
          onTagChange={setTagFilter}
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
            {groceries.length === 0 ? (
              <div className="inventory-empty-state">
                <p className="inventory-empty-state__eyebrow">
                  Your collection is empty
                </p>

                <h3>Start building your pantry.</h3>

                <p>
                  Add your first grocery to begin tracking stock,
                  freshness, and shopping needs.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setGroceryToEdit(null);
                    setIsFormOpen(true);
                  }}
                >
                  Add Your First Grocery
                </button>
              </div>
            ) : visibleGroceries.length === 0 ? (
              <div className="inventory-empty-state">
                <p className="inventory-empty-state__eyebrow">
                  No matches found
                </p>

                <h3>Nothing matches those filters.</h3>

                <button
                  type="button"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="collection__groups">
                {groupedVisibleGroceries.map((group) => {
                  const isCollapsed = collapsedLocations[group.location] === true;
                  const sectionId = `location-group-${group.location.toLowerCase()}`;

                  return (
                    <section
                      key={group.location}
                      className="collection-location-group"
                      aria-label={`${getLocationLabel(group.location)} groceries`}
                    >
                      <button
                        type="button"
                        className="collection-location-group__toggle"
                        aria-expanded={!isCollapsed}
                        aria-controls={sectionId}
                        onClick={() => handleToggleLocationSection(group.location)}
                      >
                        <span
                          className="collection-location-group__caret"
                          aria-hidden="true"
                        >
                          {isCollapsed ? "▸" : "▾"}
                        </span>

                        <span className="collection-location-group__title">
                          {getLocationLabel(group.location)}
                        </span>

                        <span className="collection-location-group__count">
                          ({group.items.length})
                        </span>
                      </button>

                      {!isCollapsed && (
                        <div
                          id={sectionId}
                          className="collection-location-group__grid"
                        >
                          {group.items.map((item, index) => (
                            <div
                              key={item.id}
                              className="card-animation-layer"
                            >
                              <GroceryCard
                                item={item}
                                cardNumber={index + 1}
                                totalCards={group.items.length}
                                onIncreaseQuantity={handleIncreaseQuantity}
                                onDecreaseQuantity={handleDecreaseQuantity}
                                onEditGrocery={handleEditGrocery}
                                onMarkContainerFinished={(grocery) => setGroceryPendingFinish(grocery)}
                                onReportUsage={(grocery) => setGroceryToReportUsage(grocery)}
                                onUndoLastUsage={handleUndoLastUsage}
                                onToggleShoppingList={handleToggleShoppingList}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="app-settings" aria-label="Inventory settings">
          <p className="app-settings__title">Inventory settings</p>

          <p className="app-settings__description">
            Load all 91 active items from your pantry, cabinets, seasonings,
            and fridge. This replaces the inventory currently saved in the app.
          </p>

          <button
            type="button"
            className="add-grocery-button"
            onClick={handleLoadHomeInventory}
          >
            Load My Home Inventory
          </button>

          <button
            type="button"
            className="app-settings__secondary-button"
            onClick={handleRefreshSpriteMatches}
          >
            Refresh Sprite Matches
          </button>

          <button
            type="button"
            className="app-settings__reset-button"
            onClick={() => setIsResetConfirmOpen(true)}
          >
            Reset Inventory
          </button>
        </section>
      </div>

      {groceryPendingRemoval && (
        <ConfirmModal
          title={`Remove ${groceryPendingRemoval.name}?`}
          message={`This will remove ${groceryPendingRemoval.name} from your pantry collection.`}
          confirmLabel="Remove Item"
          onCancel={() => setGroceryPendingRemoval(null)}
          onConfirm={handleConfirmRemoval}
          variant="danger"
        />
      )}

      {groceryPendingFinish && (
        <ConfirmModal
          title={`Mark ${groceryPendingFinish.name} as finished?`}
          message={`This will set ${groceryPendingFinish.name} to 0 ${groceryPendingFinish.quantityUnit} and record the remaining quantity as used.`}
          confirmLabel="Mark Finished"
          onCancel={() => setGroceryPendingFinish(null)}
          onConfirm={handleConfirmMarkContainerFinished}
          variant="default"
        />
      )}

      {isResetConfirmOpen && (
        <ConfirmModal
          title="Reset inventory?"
          message="This will replace your current pantry with the sample groceries."
          confirmLabel="Reset Inventory"
          onCancel={() => setIsResetConfirmOpen(false)}
          onConfirm={() => {
            handleResetInventory();
            setIsResetConfirmOpen(false);
          }}
          variant="danger"
        />
      )}

    </main>
  );
}

export default App;