export type SuggestedRecipe = {
  id?: string;
  title: string;
  description: string;
  inventoryIngredients: string[];
  missingIngredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
};
