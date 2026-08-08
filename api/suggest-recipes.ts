/// <reference types="node" />
import OpenAI from "openai";

type GroceryInput = {
  name: string;
  quantity: number;
  quantityUnit: string;
  expirationDate?: string;
  category?: string;
  storageLocation?: string;
};

type RequestBody = {
  groceries: GroceryInput[];
};

type RecipeFromModel = {
  id?: string;
  title?: string;
  description?: string;
  inventoryIngredients?: string[];
  missingIngredients?: string[];
  instructions?: string[];
  prepTime?: string;
  cookTime?: string;
};

type VercelRequest = {
  method?: string;
  body?: RequestBody;
};

type VercelResponse = {
  status: (code: number) => {
    json: (value: unknown) => void;
  };
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  console.log("API key available:", Boolean(process.env.OPENAI_API_KEY));

  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed.",
    });
  }

  let requestBody: RequestBody | undefined;

  try {
    requestBody = request.body;
  } catch (error) {
    console.error("Invalid JSON request body:", error);

    return response.status(400).json({
      error: "Invalid JSON request body.",
    });
  }

  const groceries = requestBody?.groceries;

  if (!Array.isArray(groceries) || groceries.length === 0) {
    return response.status(400).json({
      error: "A grocery inventory is required.",
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(500).json({
      error: "OPENAI_API_KEY is missing from the server.",
    });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === "string");
  }

  try {
    const inventoryText = groceries
      .map((grocery) => {
        const expiration = grocery.expirationDate
          ? `, expires ${grocery.expirationDate}`
          : "";

        const category = grocery.category
          ? `, category ${grocery.category}`
          : "";

        const location = grocery.storageLocation
          ? `, stored in ${grocery.storageLocation}`
          : "";

        return `${grocery.name}: ${grocery.quantity} ${grocery.quantityUnit}${expiration}${category}${location}`;
      })
      .join("\n");

    const aiResponse = await client.responses.create({
      model: "gpt-5-mini",
      input: `
You are a practical household recipe assistant.

Suggest exactly 3 realistic recipes based primarily on the
following grocery inventory:

${inventoryText}

Rules:
- Do not recommend using expired items.
- Prioritize ingredients that expire today first.
- Prioritize near-expiration ingredients second.
- Use fresh ingredients when helpful.
- Do not assume the user owns ingredients not listed.
- Basic water, salt, pepper, and cooking oil may be treated as pantry basics.
- Clearly separate available ingredients from missing ingredients.
- Keep recipes beginner-friendly.
- Do not claim exact nutritional or food-safety information.
- Return JSON only.

Return this structure:

{
  "recipes": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "inventoryIngredients": ["string"],
      "missingIngredients": ["string"],
      "instructions": ["string"],
      "prepTime": "string",
      "cookTime": "string"
    }
  ]
}
      `,
    });

    const parsedResult = JSON.parse(aiResponse.output_text) as {
      recipes?: RecipeFromModel[];
    };

    if (!Array.isArray(parsedResult.recipes)) {
      return response.status(502).json({
        error: "Model returned an invalid recipe payload.",
      });
    }

    const recipes = parsedResult.recipes
      .map((recipe, index) => {
        if (
          typeof recipe.title !== "string" ||
          recipe.title.trim() === ""
        ) {
          return null;
        }

        const safeId =
          typeof recipe.id === "string" && recipe.id.trim() !== ""
            ? recipe.id
            : `recipe-${index + 1}-${recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

        return {
          id: safeId,
          title: recipe.title,
          description:
            typeof recipe.description === "string"
              ? recipe.description
              : "",
          inventoryIngredients: toStringArray(recipe.inventoryIngredients),
          missingIngredients: toStringArray(recipe.missingIngredients),
          instructions: toStringArray(recipe.instructions),
          prepTime:
            typeof recipe.prepTime === "string"
              ? recipe.prepTime
              : "Unknown",
          cookTime:
            typeof recipe.cookTime === "string"
              ? recipe.cookTime
              : "Unknown",
        };
      })
      .filter((recipe): recipe is NonNullable<typeof recipe> => recipe !== null);

    return response.status(200).json({ recipes });
  } catch (error) {
    console.error("Recipe generation failed:", error);

    return response.status(500).json({
      error: "Recipes could not be generated.",
    });
  }
}
