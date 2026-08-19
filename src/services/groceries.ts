import { supabase } from "../lib/supabase";
import type { GroceryItem } from "../types/grocery";

type GroceryRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  preferred_quantity: number | null;
  quantity_unit: string;
  weight: number | null;
  weight_unit: string | null;
  expiration_date: string | null;
  price: number | null;
  sprite_id: string | null;
  storage_location: string;
  brand: string | null;
  purchased_at: string | null;
  date_added: string | null;
};

function toSupabaseRow(userId: string, grocery: GroceryItem): GroceryRow {
  return {
    id: grocery.id,
    user_id: userId,
    name: grocery.name,
    category: grocery.category,
    quantity: grocery.quantity,
    preferred_quantity: grocery.preferredQuantity ?? null,
    quantity_unit: grocery.quantityUnit,
    weight: grocery.weight ?? null,
    weight_unit: grocery.weightUnit ?? null,
    expiration_date: grocery.expirationDate ?? null,
    price: grocery.price ?? null,
    sprite_id: grocery.spriteId,
    storage_location: grocery.storageLocation,
    brand: grocery.brandName ?? null,
    purchased_at: grocery.storeName ?? null,
    date_added: grocery.dateAdded,
  };
}

function fromSupabaseRow(row: GroceryRow): GroceryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as GroceryItem["category"],
    quantity: row.quantity,
    preferredQuantity: row.preferred_quantity ?? undefined,
    quantityUnit: row.quantity_unit as GroceryItem["quantityUnit"],
    weight: row.weight ?? undefined,
    weightUnit: row.weight_unit as GroceryItem["weightUnit"] | undefined,
    expirationDate: row.expiration_date ?? undefined,
    price: row.price ?? undefined,
    spriteId: row.sprite_id ?? "",
    storageLocation: row.storage_location as GroceryItem["storageLocation"],
    dateAdded: row.date_added ?? new Date().toISOString(),
    brandName: row.brand ?? undefined,
    storeName: row.purchased_at ?? undefined,
  };
}

export async function getGroceries(userId: string): Promise<GroceryItem[]> {
  const { data, error } = await supabase
    .from("groceries")
    .select("*")
    .eq("user_id", userId)
    .order("date_added", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as GroceryRow[]).map(fromSupabaseRow);
}

export async function addGrocery(userId: string, grocery: GroceryItem): Promise<void> {
  const { error } = await supabase.from("groceries").insert(toSupabaseRow(userId, grocery));

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateGrocery(userId: string, grocery: GroceryItem): Promise<void> {
  const { error } = await supabase
    .from("groceries")
    .update(toSupabaseRow(userId, grocery))
    .eq("id", grocery.id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteGrocery(userId: string, groceryId: string): Promise<void> {
  const { error } = await supabase
    .from("groceries")
    .delete()
    .eq("id", groceryId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function importGroceries(
  userId: string,
  groceries: GroceryItem[],
): Promise<void> {
  if (groceries.length === 0) {
    return;
  }

  const rows = groceries.map((grocery) => toSupabaseRow(userId, grocery));
  const { error } = await supabase
    .from("groceries")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncGroceriesSnapshot(
  userId: string,
  groceries: GroceryItem[],
): Promise<void> {
  const { data, error } = await supabase
    .from("groceries")
    .select("id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const localIds = new Set(groceries.map((grocery) => grocery.id));
  const remoteIds = (data as { id: string }[]).map((row) => row.id);
  const idsToDelete = remoteIds.filter((id) => !localIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("groceries")
      .delete()
      .eq("user_id", userId)
      .in("id", idsToDelete);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  await importGroceries(userId, groceries);
}
