import { useEffect, useMemo, useRef, useState } from "react";
import type { GroceryItem } from "../../types/grocery";
import type { SuggestedRecipe } from "../../types/recipe";
import { getExpirationDetails } from "../../utils/expiration";
import "./RecipeSuggestions.css";

type RecipeSuggestionsProps = {
  groceries: GroceryItem[];
};

function RecipeSuggestions({
  groceries,
}: RecipeSuggestionsProps) {
  const [recipes, setRecipes] = useState<SuggestedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasRequested, setHasRequested] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const usableGroceries = useMemo(
    () =>
      groceries.filter((grocery) => {
        return (
          getExpirationDetails(grocery.expirationDate).status !==
          "expired"
        );
      }),
    [groceries],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  async function handleSuggestRecipes() {
    if (isLoading) {
      return;
    }

    if (groceries.length === 0) {
      setRecipes([]);
      setError("Add groceries before requesting recipes.");
      setHasRequested(true);
      return;
    }

    if (usableGroceries.length === 0) {
      setRecipes([]);
      setError("All groceries are expired. Add fresh groceries first.");
      setHasRequested(true);
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setRecipes([]);
    setError("");
    setHasRequested(true);

    try {
      const response = await fetch("/api/suggest-recipes", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groceries: usableGroceries.map((grocery) => ({
            name: grocery.name,
            quantity: grocery.quantity,
            quantityUnit: grocery.quantityUnit,
            expirationDate: grocery.expirationDate,
            category: grocery.category,
            storageLocation: grocery.storageLocation,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Recipe request failed.");
      }

      const data = (await response.json()) as {
        recipes?: SuggestedRecipe[];
      };

      if (!Array.isArray(data.recipes)) {
        throw new Error("Invalid recipe response.");
      }

      setRecipes(data.recipes);
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        return;
      }

      console.error(requestError);

      setError(
        "Recipe suggestions are unavailable right now.",
      );
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }

  return (
    <section
      className="recipe-suggestions"
      aria-labelledby="recipe-suggestions-heading"
      aria-busy={isLoading}
    >
      <div className="recipe-suggestions__heading">
        <div>
          <p className="recipe-suggestions__eyebrow">
            Pantry meal assistant
          </p>

          <h2 id="recipe-suggestions-heading">
            What Can I Make?
          </h2>
        </div>

        <button
          type="button"
          onClick={handleSuggestRecipes}
          disabled={isLoading || groceries.length === 0}
        >
          {isLoading
            ? "Finding Recipes..."
            : "Suggest Recipes"}
        </button>
      </div>

      {error && (
        <p role="alert" className="recipe-suggestions__error">
          {error}
        </p>
      )}

      {isLoading && (
        <div className="recipe-suggestions__grid" aria-hidden="true">
          {[0, 1, 2].map((skeletonIndex) => (
            <article
              key={`skeleton-${skeletonIndex}`}
              className="recipe-card recipe-card--skeleton"
            >
              <div className="recipe-skeleton__line recipe-skeleton__line--small" />
              <div className="recipe-skeleton__line recipe-skeleton__line--title" />
              <div className="recipe-skeleton__line" />
              <div className="recipe-skeleton__line" />
              <div className="recipe-skeleton__line recipe-skeleton__line--block" />
            </article>
          ))}
        </div>
      )}

      {!isLoading && !error && hasRequested && recipes.length === 0 && (
        <div className="recipe-suggestions__empty">
          <h3>No recipes found with your current pantry.</h3>
          <p>Try adding more ingredients and request suggestions again.</p>
        </div>
      )}

      {!isLoading && recipes.length > 0 && (
        <>
          <p className="recipe-suggestions__count">
            {recipes.length} {recipes.length === 1 ? "Recipe" : "Recipes"} Found
          </p>

        <div className="recipe-suggestions__grid">
          {recipes.map((recipe, index) => (
            <article
              key={recipe.id ?? `${recipe.title}-${index}`}
              className="recipe-card"
            >
              <p className="recipe-card__time">
                {recipe.prepTime} prep · {recipe.cookTime} cook
              </p>

              <h3>{recipe.title}</h3>
              <p>{recipe.description}</p>

              <h4>Already in your pantry</h4>
              <ul>
                {recipe.inventoryIngredients.map(
                  (ingredient) => (
                    <li key={ingredient}>
                      {ingredient}
                    </li>
                  ),
                )}
              </ul>

              <h4>You may need</h4>

              {recipe.missingIngredients.length > 0 ? (
                <ul>
                  {recipe.missingIngredients.map(
                    (ingredient) => (
                      <li key={ingredient}>
                        {ingredient}
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p>You already have everything listed.</p>
              )}

              <h4>Instructions</h4>
              <ol>
                {recipe.instructions.map(
                  (instruction, index) => (
                    <li key={`${recipe.title}-${index}`}>
                      {instruction}
                    </li>
                  ),
                )}
              </ol>
            </article>
          ))}
        </div>
        </>
      )}
    </section>
  );
}

export default RecipeSuggestions;
