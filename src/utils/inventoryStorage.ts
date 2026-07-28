import type { GroceryItem } from "../types/grocery";

const STORAGE_KEY = "pantry-keeper-groceries";

export function loadGroceries(
  fallbackGroceries: GroceryItem[],
): GroceryItem[] {
  try {
    const savedGroceries = localStorage.getItem(STORAGE_KEY);

    if (!savedGroceries) {
      return fallbackGroceries;
    }

    const parsedGroceries = JSON.parse(savedGroceries) as GroceryItem[];

    if (!Array.isArray(parsedGroceries)) {
      return fallbackGroceries;
    }

    return parsedGroceries;
  } catch (error) {
    console.error("Could not load pantry inventory:", error);
    return fallbackGroceries;
  }
}

export function saveGroceries(groceries: GroceryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groceries));
  } catch (error) {
    console.error("Could not save pantry inventory:", error);
  }
}

export function clearSavedGroceries(): void {
  localStorage.removeItem(STORAGE_KEY);
}