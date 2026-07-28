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

export type GroceryItem = {
  id: string;
  name: string;
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
};