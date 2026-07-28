import "./App.css";
import GroceryCard from "./components/cards/GroceryCard";
import AddGroceryForm from "./components/inventory/AddGroceryForm";
import StockPreferenceModal from "./components/inventory/StockPreferenceModal";
import PantryDashboard from "./components/dashboard/PantryDashboard";
import { sampleGroceries } from "./data/sampleGroceries";
import PixelBlast from "./components/backgrounds/PixelBlast";
import { useEffect, useState } from "react";
import type { GroceryItem } from "./types/grocery";
import { loadGroceries, saveGroceries } from "./utils/inventoryStorage";

function App() {
  const [groceries, setGroceries] = useState(() =>
    loadGroceries(sampleGroceries),
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [groceryToEdit, setGroceryToEdit] = useState<GroceryItem | null>(null);
  const [groceryToPersonalize, setGroceryToPersonalize] =
    useState<GroceryItem | null>(null);
  const groceryCount = groceries.length;

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
              {groceries.length} cards
            </span>
          </div>

          <div className="collection__grid">
            {groceries.map((item, index) => (
              <GroceryCard
                key={item.id}
                item={item}
                cardNumber={index + 1}
                totalCards={groceries.length}
                onIncreaseQuantity={handleIncreaseQuantity}
                onDecreaseQuantity={handleDecreaseQuantity}
                onEditGrocery={handleEditGrocery}
              />
            ))}
          </div>
        </section>
      </div>

    </main>
  );
}

export default App;