import "./App.css";
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
    </main>
  );
}

export default App;