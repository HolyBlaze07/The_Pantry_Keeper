import type { GroceryItem } from "../types/grocery";

const STORAGE_KEY = "pantry-keeper-groceries";

function normalizeExpirationDate(grocery: GroceryItem): GroceryItem {
  if (!/heavy whipping cream/i.test(grocery.name)) {
    return grocery;
  }

  return {
    ...grocery,
    expirationDate: "2026-09-19",
  };
}

function isGroceryItem(value: unknown): value is GroceryItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const grocery = value as Partial<GroceryItem>;

  return (
    typeof grocery.id === "string" &&
    typeof grocery.name === "string" &&
    typeof grocery.category === "string" &&
    typeof grocery.quantity === "number" &&
    typeof grocery.quantityUnit === "string" &&
    typeof grocery.spriteId === "string" &&
    typeof grocery.storageLocation === "string" &&
    typeof grocery.dateAdded === "string"
  );
}

export function loadGroceries(
  fallbackGroceries: GroceryItem[],
): GroceryItem[] {
  try {
    const savedGroceries = localStorage.getItem(STORAGE_KEY);

    if (!savedGroceries) {
      return fallbackGroceries;
    }

    const parsedGroceries = JSON.parse(savedGroceries) as GroceryItem[];

    if (
      !Array.isArray(parsedGroceries) ||
      !parsedGroceries.every(isGroceryItem)
    ) {
      return fallbackGroceries;
    }

    return parsedGroceries.map(normalizeExpirationDate);
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