import { spriteCatalog } from "../data/spriteCatalog";
import type { GroceryCategory, GroceryItem } from "../types/grocery";

export const NO_SPRITE_ID = "none";
const MIN_CONFIDENT_SPRITE_SCORE = 4;

type MatcherInput = {
  name: string;
  category: GroceryCategory;
};

const CATEGORY_FALLBACKS: Partial<Record<GroceryCategory, string[]>> = {
  Fruit: ["fruit", "berry", "strawberry"],
  Vegetable: ["vegetable", "tomato", "carrot"],
  "Dairy and Alternatives": ["milk", "cream", "cheese", "yogurt"],
  "Meat, Fish, and Seafood": ["chicken", "fish", "tuna", "shrimp"],
  "Bakery and Bread": ["bread", "loaf", "biscuit"],
  "Dry Goods and Grains": ["pasta", "rice", "grain", "flour", "oat"],
  Frozen: ["frozen", "ice"],
  Beverage: ["water", "drink", "juice", "coffee", "tea"],
  "Snack and Convenience Foods": ["snack", "chip", "cracker"],
  "Personal Care and Household Items": ["soap", "paper", "clean"],
  Other: ["food"],
};

const TOKEN_SYNONYMS: Record<string, string[]> = {
  spaghetti: ["pasta", "noodle"],
  fettuccine: ["pasta", "noodle"],
  macaroni: ["pasta", "noodle"],
  rotini: ["pasta", "noodle"],
  farfalle: ["pasta", "noodle"],
  noodle: ["pasta"],
  oats: ["oat", "grain"],
  flour: ["grain", "bread"],
  cereal: ["grain", "oat"],
  bread: ["loaf", "grain"],
  egg: ["eggs"],
  eggs: ["egg"],
  milk: ["dairy"],
  butter: ["dairy"],
  tuna: ["fish"],
  broth: ["stock", "soup"],
  stock: ["broth", "soup"],
  tomato: ["vegetable"],
  spinach: ["vegetable"],
  carrot: ["vegetable"],
  water: ["drink", "beverage"],
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return [] as string[];
  }

  return normalized.split(" ");
}

function buildSearchTokens(input: MatcherInput) {
  const baseTokens = new Set<string>([
    ...tokenize(input.name),
    ...tokenize(input.category),
  ]);

  for (const categoryToken of CATEGORY_FALLBACKS[input.category] ?? []) {
    baseTokens.add(normalizeText(categoryToken));
  }

  for (const token of Array.from(baseTokens)) {
    for (const synonym of TOKEN_SYNONYMS[token] ?? []) {
      baseTokens.add(normalizeText(synonym));
    }
  }

  return Array.from(baseTokens).filter(Boolean);
}

function getSpriteScore(spriteId: string, spriteName: string, tokens: string[]) {
  const spriteTokens = new Set<string>([
    ...tokenize(spriteId),
    ...tokenize(spriteName),
  ]);

  let score = 0;

  for (const token of tokens) {
    if (spriteTokens.has(token)) {
      score += 4;
      continue;
    }

    if (spriteId.includes(token)) {
      score += 3;
      continue;
    }

    if (spriteName.toLowerCase().includes(token)) {
      score += 2;
      continue;
    }

    for (const spriteToken of spriteTokens) {
      if (spriteToken.includes(token) || token.includes(spriteToken)) {
        score += 1;
        break;
      }
    }
  }

  return score;
}

export function suggestSpriteIdForGrocery(input: MatcherInput) {
  const tokens = buildSearchTokens(input);

  if (tokens.length === 0) {
    return NO_SPRITE_ID;
  }

  const scored = spriteCatalog
    .map((sprite) => ({
      id: sprite.id,
      score: getSpriteScore(sprite.id, sprite.name, tokens),
    }))
    .sort((first, second) => second.score - first.score);

  if (scored.length === 0) {
    return NO_SPRITE_ID;
  }

  const bestMatch = scored[0];

  if (!bestMatch || bestMatch.score < MIN_CONFIDENT_SPRITE_SCORE) {
    return NO_SPRITE_ID;
  }

  return bestMatch.id;
}

export function remapGroceriesToBestSprites(groceries: GroceryItem[]) {
  return groceries.map((grocery) => ({
    ...grocery,
    spriteId: suggestSpriteIdForGrocery({
      name: grocery.name,
      category: grocery.category,
    }),
  }));
}

export function remapGroceriesNeedingSprites(groceries: GroceryItem[]) {
  const knownSpriteIds = new Set(spriteCatalog.map((sprite) => sprite.id));

  return groceries.map((grocery) => {
    const currentSpriteId = grocery.spriteId?.trim() ?? "";
    const hasKnownSprite = knownSpriteIds.has(currentSpriteId);
    const isExplicitNone = currentSpriteId === NO_SPRITE_ID;
    const shouldRemap = !hasKnownSprite || isExplicitNone;

    if (!shouldRemap) {
      return grocery;
    }

    return {
      ...grocery,
      spriteId: suggestSpriteIdForGrocery({
        name: grocery.name,
        category: grocery.category,
      }),
    };
  });
}
