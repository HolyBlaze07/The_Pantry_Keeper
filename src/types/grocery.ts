export type StorageLocation =
  | "Pantry"
  | "Fridge"
  | "Freezer"
  | "Counter"
  | "Cabinet";

export type GroceryCategory =
  | "Fruit"
  | "Vegetable"
  | "Dairy and Alternatives"
  | "Meat, Fish, and Seafood"
  | "Bakery and Bread"
  | "Dry Goods and Grains"
  | "Frozen"
  | "Beverage"
  | "Snack and Convenience Foods"
  | "Personal Care and Household Items"

  | "Other";

export type QuantityUnit =
  | "item"
  | "items"
  | "pack"
  | "packs"
  | "package"
  | "packages"
  | "bag"
  | "bags"
  | "box"
  | "boxes"
  | "can"
  | "cans"
  | "bottle"
  | "bottles"
  | "carton"
  | "cartons"
  | "container"
  | "jar"
  | "jars"
  |"bunch"
  | "bunches"
  | "jug"
  | "jugs"
  | "dozen"
  | "loaf"
  | "loaves"
  | "slice"
  | "slices"
  | "head"
  | "heads"
  | "pint"
  | "quarts"
  |"box"
  | "boxes"
  | "roll"
  | "rolls"

export type WeightUnit =
  | "oz"
  | "lb"
  | "g"
  | "kg"
  | "fl oz"
  | "gal";

export type GroceryTag =
  | "organic"
  | "non-gmo"
  | "gluten-free"
  | "soy-free"
  | "natural"
  | "pasture-raised"
  | "allergn"
  | "soy";

export type GroceryTagOption = {
  id: GroceryTag;
  label: string;
};

export const GROCERY_TAG_OPTIONS: readonly GroceryTagOption[] = [
  { id: "organic", label: "Organic" },
  { id: "non-gmo", label: "Non-GMO" },
  { id: "gluten-free", label: "Gluten Free" },
  { id: "soy-free", label: "Soy Free" },
  { id: "natural", label: "Natural" },
  { id: "pasture-raised", label: "Pasture-Raised" },
  { id: "allergn", label: "Allergn" },
  { id: "soy", label: "Soy" },
] as const;

export type GroceryUsageEntry = {
  amountUsed: number;
  recordedAt: string;
  previousQuantity?: number;
  previousShoppingQuantity?: number;
  previousIsManuallyAddedToShoppingList?: boolean;
  source?: "report-usage" | "mark-finished";
};

export type GroceryItem = {
  id: string;
  name: string;
  brandName?: string;
  storeName?: string;
  organic?: boolean;
  tags?: GroceryTag[];
  category: GroceryCategory;
  quantity: number;
  preferredQuantity?: number;
  isManuallyAddedToShoppingList?: boolean;
  shoppingQuantity?: number;
  quantityUnit: QuantityUnit;
  weight?: number;
  weightUnit?: WeightUnit;
  expirationDate?: string;
  price?: number;
  spriteId: string;
  storageLocation: StorageLocation;
  dateAdded: string;
  usageHistory?: GroceryUsageEntry[];
};