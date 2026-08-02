export type LocalRecipe = {
  id: string;
  title: string;
  description: string;
  requiredIngredients: string[];
  optionalIngredients: string[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
};

export const localRecipes: LocalRecipe[] = [
  {
    id: "strawberry-french-toast",
    title: "Strawberry French Toast",
    description: "Golden French toast topped with fresh strawberries.",
    requiredIngredients: ["eggs", "milk", "bread", "strawberries"],
    optionalIngredients: ["cinnamon", "vanilla", "syrup"],
    instructions: [
      "Whisk the eggs and milk together.",
      "Dip each slice of bread into the mixture.",
      "Cook both sides until golden.",
      "Top with sliced strawberries.",
    ],
    prepTime: "10 minutes",
    cookTime: "10 minutes",
  },
  {
    id: "egg-toast",
    title: "Egg and Toast Breakfast",
    description: "A quick breakfast made with eggs and toasted bread.",
    requiredIngredients: ["eggs", "bread"],
    optionalIngredients: ["cheese", "butter"],
    instructions: [
      "Toast the bread.",
      "Cook the eggs to your preference.",
      "Serve the eggs over or beside the toast.",
    ],
    prepTime: "5 minutes",
    cookTime: "10 minutes",
  },
  {
    id: "tomato-pasta",
    title: "Simple Tomato Pasta",
    description: "Quick stovetop pasta with a light tomato base.",
    requiredIngredients: ["pasta", "tomato"],
    optionalIngredients: ["garlic", "olive oil", "parmesan"],
    instructions: [
      "Boil pasta until al dente.",
      "Warm tomatoes in a pan until saucy.",
      "Toss pasta into the pan and season to taste.",
    ],
    prepTime: "10 minutes",
    cookTime: "15 minutes",
  },
  {
    id: "veggie-rice-bowl",
    title: "Vegetable Rice Bowl",
    description: "A flexible bowl built from rice and mixed vegetables.",
    requiredIngredients: ["rice", "vegetable"],
    optionalIngredients: ["soy sauce", "egg", "sesame oil"],
    instructions: [
      "Cook rice according to package instructions.",
      "Saute chopped vegetables until tender.",
      "Combine vegetables with rice and finish with optional toppings.",
    ],
    prepTime: "10 minutes",
    cookTime: "20 minutes",
  },
];
