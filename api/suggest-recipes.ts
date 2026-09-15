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
      .filter((grocery) => grocery.quantity > 0)
      .map((grocery) => {
        const expiration = grocery.expirationDate
          ? ` | expires: ${grocery.expirationDate}`
          : "";

        return `${grocery.name} | ${grocery.quantity} ${grocery.quantityUnit}${expiration}`;
      })
      .join("\n");

    const aiResponse = await client.responses.create({
      model: "gpt-5.4-mini",
      reasoning: {
        effort: "none",
      },
      max_output_tokens: 1400,
      instructions: `
You are Amealy, a practical household recipe assistant.

Create exactly 3 realistic, beginner-friendly recipes.

RULES:
- Never use expired ingredients.
- Prioritize ingredients expiring today.
- Prioritize near-expiration ingredients next.
- Prefer ingredients already available.
- Water, salt, pepper, and cooking oil are pantry basics.
      `,
      input: `Available grocery inventory:\n\n${inventoryText}`,
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "recipe_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recipes: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    inventoryIngredients: {
                      type: "array",
                      items: { type: "string" },
                    },
                    missingIngredients: {
                      type: "array",
                      items: { type: "string" },
                    },
                    instructions: {
                      type: "array",
                      maxItems: 6,
                      items: { type: "string" },
                    },
                    prepTime: { type: "string" },
                    cookTime: { type: "string" },
                  },
                  required: [
                    "id",
                    "title",
                    "description",
                    "inventoryIngredients",
                    "missingIngredients",
                    "instructions",
                    "prepTime",
                    "cookTime",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["recipes"],
            additionalProperties: false,
          },
        },
      },
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

    console.log("Recipe AI usage:", {
      inputTokens: aiResponse.usage?.input_tokens,
      outputTokens: aiResponse.usage?.output_tokens,
      totalTokens: aiResponse.usage?.total_tokens,
    });

    return response.status(200).json({ recipes });
  } catch (error) {
    console.error("Recipe generation failed:", error);

    return response.status(500).json({
      error: "Recipes could not be generated.",
    });
  }
}
