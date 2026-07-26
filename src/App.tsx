import "./App.css";
import GroceryCard from "./components/cards/GroceryCard";
import { sampleGroceries } from "./data/sampleGroceries";

function App() {
  const groceryCount = sampleGroceries.length;

  return (
    <main className="app">
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

        <button type="button">Open the Pantry Book</button>
      </section>

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
            {sampleGroceries.length} cards
          </span>
        </div>

        <div className="grocery-grid">
          {sampleGroceries.map((item, index) => (
            <GroceryCard
              key={item.id}
              item={item}
              cardNumber={index + 1}
              totalCards={sampleGroceries.length}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;