import type {
  GroceryCategory,
  GroceryItem,
  QuantityUnit,
  StorageLocation,
} from "../types/grocery";
import { NO_SPRITE_ID } from "./spriteMatcher";

import pantryNotesRaw from "../../my pantry?raw";

const STORE_OR_SECTION_HEADERS = new Set([
  "THE FRESH MARKET",
  "ALDIS",
  "SAMS",
  "THRIVE MARKET",
  "WALMART",
  "MISC",
  "SEASONINGS",
  "EXPIRED FOODS",
  "FRIDGE",
  "PANTRY",
  "CABINET",
]);

const LOCATION_BY_HEADER: Partial<Record<string, StorageLocation>> = {
  PANTRY: "Pantry",
  FRIDGE: "Fridge",
  CABINET: "Cabinet",
};

const QUANTITY_UNIT_PATTERN =
  /^(\d+(?:\.\d+)?)\s*(items?|bags?|boxes?|cans?|bottles?|cartons?|containers?|packs?|jars?|bunches?|jugs?|dozen|loaves?|slices?|heads?|pints?|rolls?|ct)\b/i;

function normalizeLine(line: string) {
  return line.replace(/\s+/g, " ").trim();
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapUnit(rawUnit: string): QuantityUnit {
  const normalized = rawUnit.toLowerCase();

  if (normalized === "ct") return "items";
  if (normalized.startsWith("item")) return normalized === "item" ? "item" : "items";
  if (normalized.startsWith("bag")) return normalized === "bag" ? "bag" : "bags";
  if (normalized.startsWith("box")) return normalized === "box" ? "box" : "boxes";
  if (normalized.startsWith("can")) return normalized === "can" ? "can" : "cans";
  if (normalized.startsWith("bottle")) return normalized === "bottle" ? "bottle" : "bottles";
  if (normalized.startsWith("carton")) return normalized === "carton" ? "carton" : "cartons";
  if (normalized.startsWith("container")) {
    return "container";
  }
  if (normalized.startsWith("pack")) return normalized === "pack" ? "pack" : "packs";
  if (normalized.startsWith("jar")) return normalized === "jar" ? "jar" : "jars";
  if (normalized.startsWith("bunch")) return normalized === "bunch" ? "bunch" : "bunches";
  if (normalized.startsWith("jug")) return normalized === "jug" ? "jug" : "jugs";
  if (normalized.startsWith("dozen")) return "dozen";
  if (normalized.startsWith("loaf")) return normalized === "loaf" ? "loaf" : "loaves";
  if (normalized.startsWith("slice")) return normalized === "slice" ? "slice" : "slices";
  if (normalized.startsWith("head")) return normalized === "head" ? "head" : "heads";
  if (normalized.startsWith("pint")) return "pint";
  if (normalized.startsWith("roll")) return normalized === "roll" ? "roll" : "rolls";

  return "item";
}

function inferCategory(location: StorageLocation): GroceryCategory {
  if (location === "Fridge") {
    return "Dairy and Alternatives";
  }

  if (location === "Pantry") {
    return "Dry Goods and Grains";
  }

  return "Other";
}

function parseExpirationDate(value: string): string | undefined {
  const fullDateMatch = value.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);

  if (fullDateMatch) {
    const month = Number(fullDateMatch[1]);
    const day = Number(fullDateMatch[2]);
    const rawYear = Number(fullDateMatch[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;

    if (
      Number.isInteger(month) &&
      Number.isInteger(day) &&
      Number.isInteger(year) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31 &&
      year >= 2000 &&
      year <= 2100
    ) {
      return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const monthYearMatch = value.match(/\b(\d{1,2})\/(\d{4})\b/);

  if (monthYearMatch) {
    const month = Number(monthYearMatch[1]);
    const year = Number(monthYearMatch[2]);

    if (
      Number.isInteger(month) &&
      Number.isInteger(year) &&
      month >= 1 &&
      month <= 12 &&
      year >= 2000 &&
      year <= 2100
    ) {
      return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
    }
  }

  return undefined;
}

function looksLikeHeader(line: string) {
  return STORE_OR_SECTION_HEADERS.has(line.toUpperCase());
}

export function buildGroceriesFromPantryNotes(): GroceryItem[] {
  const lines = pantryNotesRaw
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((line) => line.length > 0);

  const dateAdded = new Date().toISOString().split("T")[0];
  let currentLocation: StorageLocation = "Pantry";
  const groceries: GroceryItem[] = [];

  for (const rawLine of lines) {
    const locationFromHeader = LOCATION_BY_HEADER[rawLine.toUpperCase()];

    if (locationFromHeader) {
      currentLocation = locationFromHeader;
      continue;
    }

    if (looksLikeHeader(rawLine)) {
      continue;
    }

    let quantity = 1;
    let quantityUnit: QuantityUnit = "item";
    let cleanedLine = rawLine;

    const quantityMatch = cleanedLine.match(QUANTITY_UNIT_PATTERN);

    if (quantityMatch) {
      quantity = Number(quantityMatch[1]);
      quantityUnit = mapUnit(quantityMatch[2]);
      cleanedLine = cleanedLine.slice(quantityMatch[0].length).trim();
    }

    const expirationDate = parseExpirationDate(rawLine);

    cleanedLine = cleanedLine
      .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, " ")
      .replace(/\b\d{1,2}\/\d{4}\b/g, " ")
      .replace(/\b\d+(?:\.\d+)?\s*(oz|lb|lbs|fl\s?oz|ct)\b/gi, " ")
      .replace(/\bbrand\s*:\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanedLine.length < 3) {
      continue;
    }

    const normalizedName = cleanedLine
      .replace(/^[^a-z0-9]+/i, "")
      .trim();

    if (normalizedName.length < 3) {
      continue;
    }

    const entry: GroceryItem = {
      id: `notes-${toSlug(`${currentLocation}-${normalizedName}-${groceries.length + 1}`)}`,
      name: normalizedName,
      category: inferCategory(currentLocation),
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      preferredQuantity:
        Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      quantityUnit,
      storageLocation: currentLocation,
      expirationDate,
      spriteId: NO_SPRITE_ID,
      dateAdded,
      tags: /\borganic\b/i.test(normalizedName) ? ["organic"] : undefined,
      organic: /\borganic\b/i.test(normalizedName),
    };

    groceries.push(entry);
  }

  return groceries;
}