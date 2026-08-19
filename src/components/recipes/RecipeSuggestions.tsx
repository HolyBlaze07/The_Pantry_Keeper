import { useEffect, useMemo, useRef, useState } from "react";
import type { GroceryItem } from "../../types/grocery";
import type { SuggestedRecipe } from "../../types/recipe";
import { localRecipes } from "../../data/recipes";
import { getExpirationDetails } from "../../utils/expiration";
import "./RecipeSuggestions.css";

type RecipeSuggestionsProps = {
  groceries: GroceryItem[];
};

type RecipeSource = "ai" | "local";

type SavedRecipeBatch = {
  id: string;
  createdAt: string;
  source: RecipeSource;
  recipes: SuggestedRecipe[];
};

type SavedRecipeEntry = {
  id: string;
  recipe: SuggestedRecipe;
  source: RecipeSource;
  savedAt: string;
  userRating: 1 | 2 | 3 | 4 | 5 | null;
  cookingNotes: string;
};

type RecipeBankDraft = {
  userRating: 1 | 2 | 3 | 4 | 5 | null;
  cookingNotes: string;
};

const RECIPE_HISTORY_STORAGE_KEY = "pantry-keeper-recipe-history";
const RECIPE_BANK_STORAGE_KEY = "pantry-keeper-recipe-bank";
const MAX_SAVED_RECIPE_BATCHES = 10;
const MAX_SAVED_RECIPE_BANK_ITEMS = 40;

function isSuggestedRecipe(value: unknown): value is SuggestedRecipe {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const recipe = value as Partial<SuggestedRecipe>;

  return (
    typeof recipe.title === "string" &&
    typeof recipe.description === "string" &&
    typeof recipe.prepTime === "string" &&
    typeof recipe.cookTime === "string" &&
    Array.isArray(recipe.inventoryIngredients) &&
    recipe.inventoryIngredients.every((ingredient) => typeof ingredient === "string") &&
    Array.isArray(recipe.missingIngredients) &&
    recipe.missingIngredients.every((ingredient) => typeof ingredient === "string") &&
    Array.isArray(recipe.instructions) &&
    recipe.instructions.every((instruction) => typeof instruction === "string")
  );
}

function isSavedRecipeBatch(value: unknown): value is SavedRecipeBatch {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const batch = value as Partial<SavedRecipeBatch>;

  return (
    typeof batch.id === "string" &&
    typeof batch.createdAt === "string" &&
    (batch.source === "ai" || batch.source === "local") &&
    Array.isArray(batch.recipes) &&
    batch.recipes.every(isSuggestedRecipe)
  );
}

function isSavedRecipeEntry(value: unknown): value is SavedRecipeEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const recipeEntry = value as Partial<SavedRecipeEntry>;

  return (
    typeof recipeEntry.id === "string" &&
    isSuggestedRecipe(recipeEntry.recipe) &&
    (recipeEntry.source === "ai" || recipeEntry.source === "local") &&
    typeof recipeEntry.savedAt === "string" &&
    (recipeEntry.userRating === null ||
      recipeEntry.userRating === 1 ||
      recipeEntry.userRating === 2 ||
      recipeEntry.userRating === 3 ||
      recipeEntry.userRating === 4 ||
      recipeEntry.userRating === 5) &&
    typeof recipeEntry.cookingNotes === "string"
  );
}

function formatBatchTimestamp(timestamp: string) {
  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Saved recipe set";
  }

  return parsedDate.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getRecipeIdentity(source: RecipeSource, recipe: SuggestedRecipe) {
  return `${source}|${recipe.title.toLowerCase().trim()}`;
}

function RecipeSuggestions({
  groceries,
}: RecipeSuggestionsProps) {
  const [recipes, setRecipes] = useState<SuggestedRecipe[]>([]);
  const [recipeSource, setRecipeSource] = useState<RecipeSource | null>(null);
  const [savedRecipeBatches, setSavedRecipeBatches] = useState<SavedRecipeBatch[]>([]);
  const [activeSavedBatchId, setActiveSavedBatchId] = useState<string | null>(null);
  const [savedRecipeBank, setSavedRecipeBank] = useState<SavedRecipeEntry[]>([]);
  const [recipeBankDrafts, setRecipeBankDrafts] = useState<Record<string, RecipeBankDraft>>({});
  const [editingRecipeBankEntryId, setEditingRecipeBankEntryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasRequested, setHasRequested] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  function saveRecipeBatch(source: RecipeSource, nextRecipes: SuggestedRecipe[]) {
    const recipeBatch: SavedRecipeBatch = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      source,
      recipes: nextRecipes,
    };

    setSavedRecipeBatches((currentBatches) => {
      const nextBatches = [recipeBatch, ...currentBatches].slice(0, MAX_SAVED_RECIPE_BATCHES);

      try {
        localStorage.setItem(RECIPE_HISTORY_STORAGE_KEY, JSON.stringify(nextBatches));
      } catch (saveError) {
        console.error("Could not save recipe history:", saveError);
      }

      return nextBatches;
    });

    setActiveSavedBatchId(recipeBatch.id);
  }

  function persistRecipeBank(nextRecipeBank: SavedRecipeEntry[]) {
    try {
      localStorage.setItem(RECIPE_BANK_STORAGE_KEY, JSON.stringify(nextRecipeBank));
    } catch (saveError) {
      console.error("Could not save recipe bank:", saveError);
    }
  }

  function buildDraftMap(recipeBank: SavedRecipeEntry[]) {
    return recipeBank.reduce<Record<string, RecipeBankDraft>>((draftMap, recipeEntry) => {
      draftMap[recipeEntry.id] = {
        userRating: recipeEntry.userRating,
        cookingNotes: recipeEntry.cookingNotes,
      };

      return draftMap;
    }, {});
  }

  function handleSaveRecipeToBank(recipe: SuggestedRecipe) {
    if (!recipeSource) {
      return;
    }

    setSavedRecipeBank((currentRecipeBank) => {
      const existingEntry = currentRecipeBank.find(
        (recipeEntry) =>
          getRecipeIdentity(recipeEntry.source, recipeEntry.recipe) ===
          getRecipeIdentity(recipeSource, recipe),
      );

      const savedAt = new Date().toISOString();

      const nextRecipeEntry: SavedRecipeEntry = existingEntry
        ? {
            ...existingEntry,
            recipe,
            source: recipeSource,
            savedAt,
          }
        : {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            recipe,
            source: recipeSource,
            savedAt,
            userRating: null,
            cookingNotes: "",
          };

      const withoutCurrent = currentRecipeBank.filter(
        (recipeEntry) => recipeEntry.id !== nextRecipeEntry.id,
      );

      const nextRecipeBank = [nextRecipeEntry, ...withoutCurrent].slice(
        0,
        MAX_SAVED_RECIPE_BANK_ITEMS,
      );

      persistRecipeBank(nextRecipeBank);
      setRecipeBankDrafts(buildDraftMap(nextRecipeBank));
      return nextRecipeBank;
    });
  }

  function handleBeginEditRecipeBankEntry(recipeEntry: SavedRecipeEntry) {
    setEditingRecipeBankEntryId(recipeEntry.id);
    setRecipeBankDrafts((currentDrafts) => ({
      ...currentDrafts,
      [recipeEntry.id]: {
        userRating: recipeEntry.userRating,
        cookingNotes: recipeEntry.cookingNotes,
      },
    }));
  }

  function handleDraftRecipeRating(recipeEntryId: string, rating: 1 | 2 | 3 | 4 | 5) {
    setRecipeBankDrafts((currentDrafts) => ({
      ...currentDrafts,
      [recipeEntryId]: {
        userRating: rating,
        cookingNotes: currentDrafts[recipeEntryId]?.cookingNotes ?? "",
      },
    }));
  }

  function handleDraftRecipeNotes(recipeEntryId: string, notes: string) {
    setRecipeBankDrafts((currentDrafts) => ({
      ...currentDrafts,
      [recipeEntryId]: {
        userRating: currentDrafts[recipeEntryId]?.userRating ?? null,
        cookingNotes: notes,
      },
    }));
  }

  function handleSaveRecipeBankEntry(recipeEntryId: string) {
    const draft = recipeBankDrafts[recipeEntryId];

    if (!draft) {
      setEditingRecipeBankEntryId(null);
      return;
    }

    setSavedRecipeBank((currentRecipeBank) => {
      const nextRecipeBank = currentRecipeBank.map((recipeEntry) =>
        recipeEntry.id === recipeEntryId
          ? {
              ...recipeEntry,
              userRating: draft.userRating,
              cookingNotes: draft.cookingNotes,
            }
          : recipeEntry,
      );

      persistRecipeBank(nextRecipeBank);
      return nextRecipeBank;
    });

    setEditingRecipeBankEntryId(null);
  }

  function handleRemoveRecipeFromBank(recipeEntryId: string) {
    setSavedRecipeBank((currentRecipeBank) => {
      const nextRecipeBank = currentRecipeBank.filter(
        (recipeEntry) => recipeEntry.id !== recipeEntryId,
      );

      persistRecipeBank(nextRecipeBank);
      setRecipeBankDrafts(buildDraftMap(nextRecipeBank));

      if (editingRecipeBankEntryId === recipeEntryId) {
        setEditingRecipeBankEntryId(null);
      }

      return nextRecipeBank;
    });
  }

  function handleClearRecipeBank() {
    setSavedRecipeBank([]);
    setRecipeBankDrafts({});
    setEditingRecipeBankEntryId(null);
    localStorage.removeItem(RECIPE_BANK_STORAGE_KEY);
  }

  function handleScrollToRecipeBank() {
    document.getElementById("recipe-bank")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function getLocalRecipeSuggestions(
    pantryGroceries: GroceryItem[],
  ): SuggestedRecipe[] {
    const inventoryNames = pantryGroceries.map((grocery) =>
      grocery.name.toLowerCase(),
    );

    return localRecipes
      .map((recipe) => {
        const inventoryIngredients = recipe.requiredIngredients.filter(
          (ingredient) =>
            inventoryNames.some((inventoryName) =>
              inventoryName.includes(ingredient),
            ),
        );

        const missingIngredients = recipe.requiredIngredients.filter(
          (ingredient) =>
            !inventoryNames.some((inventoryName) =>
              inventoryName.includes(ingredient),
            ),
        );

        const matchPercentage =
          inventoryIngredients.length / recipe.requiredIngredients.length;

        return {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          inventoryIngredients,
          missingIngredients,
          instructions: recipe.instructions,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          matchPercentage,
        };
      })
      .filter((recipe) => recipe.matchPercentage >= 0.5)
      .sort(
        (firstRecipe, secondRecipe) =>
          secondRecipe.matchPercentage - firstRecipe.matchPercentage,
      )
      .slice(0, 3)
      .map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        inventoryIngredients: recipe.inventoryIngredients,
        missingIngredients: recipe.missingIngredients,
        instructions: recipe.instructions,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
      }));
  }

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

  useEffect(() => {
    try {
      const savedRecipeBankRaw = localStorage.getItem(RECIPE_BANK_STORAGE_KEY);

      if (!savedRecipeBankRaw) {
        return;
      }

      const parsedRecipeBank = JSON.parse(savedRecipeBankRaw) as unknown;

      if (!Array.isArray(parsedRecipeBank)) {
        return;
      }

      const validatedRecipeBank = parsedRecipeBank
        .filter(isSavedRecipeEntry)
        .slice(0, MAX_SAVED_RECIPE_BANK_ITEMS);

      setSavedRecipeBank(validatedRecipeBank);
      setRecipeBankDrafts(buildDraftMap(validatedRecipeBank));
    } catch (loadError) {
      console.error("Could not load recipe bank:", loadError);
    }
  }, []);

  const savedRecipeIdentityLookup = useMemo(() => {
    return new Set(
      savedRecipeBank.map((recipeEntry) =>
        getRecipeIdentity(recipeEntry.source, recipeEntry.recipe),
      ),
    );
  }, [savedRecipeBank]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(RECIPE_HISTORY_STORAGE_KEY);

      if (!savedHistory) {
        return;
      }

      const parsedHistory = JSON.parse(savedHistory) as unknown;

      if (!Array.isArray(parsedHistory)) {
        return;
      }

      const validatedHistory = parsedHistory
        .filter(isSavedRecipeBatch)
        .slice(0, MAX_SAVED_RECIPE_BATCHES);

      setSavedRecipeBatches(validatedHistory);

      if (validatedHistory.length > 0) {
        setRecipes(validatedHistory[0].recipes);
        setRecipeSource(validatedHistory[0].source);
        setHasRequested(true);
        setActiveSavedBatchId(validatedHistory[0].id);
      }
    } catch (loadError) {
      console.error("Could not load recipe history:", loadError);
    }
  }, []);

  function handleLoadSavedBatch(batchId: string) {
    const selectedBatch = savedRecipeBatches.find((batch) => batch.id === batchId);

    if (!selectedBatch) {
      return;
    }

    setRecipes(selectedBatch.recipes);
    setRecipeSource(selectedBatch.source);
    setHasRequested(true);
    setError("");
    setActiveSavedBatchId(selectedBatch.id);
  }

  function handleClearSavedBatches() {
    setSavedRecipeBatches([]);
    setActiveSavedBatchId(null);
    localStorage.removeItem(RECIPE_HISTORY_STORAGE_KEY);
  }

  async function handleSuggestRecipes() {
    if (isLoading) {
      return;
    }

    if (groceries.length === 0) {
      setRecipes([]);
      setRecipeSource(null);
      setError("Add groceries before requesting recipes.");
      setHasRequested(true);
      return;
    }

    if (usableGroceries.length === 0) {
      setRecipes([]);
      setRecipeSource(null);
      setError("All groceries are expired. Add fresh groceries first.");
      setHasRequested(true);
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setRecipes([]);
    setRecipeSource(null);
    setActiveSavedBatchId(null);
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
      setRecipeSource("ai");
      saveRecipeBatch("ai", data.recipes);
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      ) {
        return;
      }

      console.error(requestError);

      const fallbackRecipes = getLocalRecipeSuggestions(usableGroceries);

      if (fallbackRecipes.length > 0) {
        setRecipes(fallbackRecipes);
        setRecipeSource("local");
        saveRecipeBatch("local", fallbackRecipes);
        setError(
          "AI suggestions are unavailable right now, so Pantry Keeper is using local recipe matches.",
        );
      } else {
        setRecipes([]);
        setRecipeSource(null);
        setError(
          "AI recipe suggestions are temporarily unavailable. Add more groceries for local matches.",
        );
      }
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

        <div className="recipe-suggestions__actions">
          <button
            type="button"
            onClick={handleSuggestRecipes}
            disabled={isLoading || groceries.length === 0}
          >
            {isLoading
              ? "Finding Recipes..."
              : "Suggest Recipes"}
          </button>

          <button
            type="button"
            className="recipe-suggestions__secondary-action"
            onClick={handleScrollToRecipeBank}
            disabled={savedRecipeBank.length === 0}
          >
            Go To Recipe Bank
          </button>
        </div>
      </div>

      {savedRecipeBatches.length > 0 && (
        <section className="recipe-history" aria-label="Saved recipe suggestions">
          <div className="recipe-history__header">
            <p className="recipe-history__title">Saved recipe sets</p>

            <button
              type="button"
              className="recipe-history__clear"
              onClick={handleClearSavedBatches}
            >
              Clear History
            </button>
          </div>

          <div className="recipe-history__list">
            {savedRecipeBatches.map((batch) => (
              <button
                key={batch.id}
                type="button"
                className={`recipe-history__item ${activeSavedBatchId === batch.id ? "is-active" : ""}`}
                onClick={() => handleLoadSavedBatch(batch.id)}
              >
                <span>{formatBatchTimestamp(batch.createdAt)}</span>
                <span>
                  {batch.recipes.length} {batch.recipes.length === 1 ? "recipe" : "recipes"} · {batch.source === "ai" ? "AI" : "Local"}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

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
          {recipeSource === "ai" && (
            <p className="recipe-suggestions__source">
              AI-assisted pantry suggestions
            </p>
          )}

          {recipeSource === "local" && (
            <p className="recipe-suggestions__source">
              Pantry-matched recipe suggestions
            </p>
          )}

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

              <button
                type="button"
                className="recipe-card__save"
                onClick={() => handleSaveRecipeToBank(recipe)}
                disabled={
                  !recipeSource ||
                  savedRecipeIdentityLookup.has(
                    getRecipeIdentity(recipeSource, recipe),
                  )
                }
              >
                {!recipeSource
                  ? "Save Unavailable"
                  : savedRecipeIdentityLookup.has(
                      getRecipeIdentity(recipeSource, recipe),
                    )
                    ? "Saved To Recipe Bank"
                    : "Save To Recipe Bank"}
              </button>

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

      <section
        id="recipe-bank"
        className="recipe-bank"
        aria-label="Recipe suggestion bank"
      >
        <div className="recipe-bank__header">
          <div>
            <p className="recipe-bank__eyebrow">Your personal cookbook shelf</p>
            <h3>Recipe Suggestion Bank</h3>
          </div>

          {savedRecipeBank.length > 0 && (
            <button
              type="button"
              className="recipe-bank__clear"
              onClick={handleClearRecipeBank}
            >
              Clear Recipe Bank
            </button>
          )}
        </div>

        {savedRecipeBank.length === 0 ? (
          <p className="recipe-bank__empty">
            Save a recipe from suggestions, then rate it after you cook it and keep notes about tweaks.
          </p>
        ) : (
          <div className="recipe-bank__grid">
            {savedRecipeBank.map((recipeEntry) => (
              <article key={recipeEntry.id} className="recipe-bank-card">
                {(() => {
                  const isEditing = editingRecipeBankEntryId === recipeEntry.id;
                  const draft = recipeBankDrafts[recipeEntry.id];
                  const displayedRating = isEditing
                    ? draft?.userRating ?? recipeEntry.userRating
                    : recipeEntry.userRating;
                  const displayedNotes = isEditing
                    ? draft?.cookingNotes ?? recipeEntry.cookingNotes
                    : recipeEntry.cookingNotes;

                  return (
                    <>
                <p className="recipe-bank-card__meta">
                  {formatBatchTimestamp(recipeEntry.savedAt)} · {recipeEntry.source === "ai" ? "AI" : "Local"}
                </p>

                <h4>{recipeEntry.recipe.title}</h4>
                <p>{recipeEntry.recipe.description}</p>

                <div className="recipe-bank-card__actions">
                  {isEditing ? (
                    <button
                      type="button"
                      className="recipe-bank-card__save"
                      onClick={() => handleSaveRecipeBankEntry(recipeEntry.id)}
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="recipe-bank-card__edit"
                      onClick={() => handleBeginEditRecipeBankEntry(recipeEntry)}
                    >
                      Edit
                    </button>
                  )}
                </div>

                <div className="recipe-bank-card__ratings" role="group" aria-label={`Rate ${recipeEntry.recipe.title}`}>
                  <span>Rating:</span>

                  {[1, 2, 3, 4, 5].map((ratingNumber) => (
                    <button
                      key={`${recipeEntry.id}-${ratingNumber}`}
                      type="button"
                      className={`recipe-bank-card__star ${displayedRating !== null && displayedRating >= ratingNumber ? "is-active" : ""}`}
                      onClick={() =>
                        handleDraftRecipeRating(
                          recipeEntry.id,
                          ratingNumber as 1 | 2 | 3 | 4 | 5,
                        )
                      }
                      disabled={!isEditing}
                      aria-label={`${ratingNumber} star${ratingNumber === 1 ? "" : "s"}`}
                    >
                      {ratingNumber}
                    </button>
                  ))}
                </div>

                <label className="recipe-bank-card__notes-label" htmlFor={`recipe-notes-${recipeEntry.id}`}>
                  Notes after cooking
                </label>
                <textarea
                  id={`recipe-notes-${recipeEntry.id}`}
                  value={displayedNotes}
                  onChange={(event) => handleDraftRecipeNotes(recipeEntry.id, event.target.value)}
                  placeholder="Example: Loved the pancakes. Made the berry and peach compote more tart than sweet."
                  rows={3}
                  readOnly={!isEditing}
                />

                <button
                  type="button"
                  className="recipe-bank-card__remove"
                  onClick={() => handleRemoveRecipeFromBank(recipeEntry.id)}
                >
                  Remove From Bank
                </button>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default RecipeSuggestions;
