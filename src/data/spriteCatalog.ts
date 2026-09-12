export type FoodSprite = {
  id: string;
  name: string;
  image: string;
};

const LEGACY_SPRITE_ID_BY_FILE_NAME: Record<string, string> = {
  fruit_strawberry: "strawberry",
  coffee_milkjug: "milk",
  breadloaf: "bread",
  yellowbutterstick: "butter",
  eggs_brown: "egg",
  waterbottle: "water",
  vegetable_tomato: "tomato",
};

const spriteModules = import.meta.glob(
  [
    "../assets/food sprites/**/*.{png,jpg,jpeg,webp,gif}",
    "!../assets/food sprites/**/ChatGPT Image*.png",
    "!../assets/food sprites/**/ChatGPT Image*.jpg",
    "!../assets/food sprites/**/ChatGPT Image*.jpeg",
    "!../assets/food sprites/**/ChatGPT Image*.webp",
  ],
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

function toReadableName(fileName: string) {
  return fileName
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function toGeneratedId(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function shouldPreferSprite(existing: FoodSprite, candidate: FoodSprite) {
  const existingIsNested = existing.image.includes("/FreePixelFood/");
  const candidateIsNested = candidate.image.includes("/FreePixelFood/");

  if (existingIsNested && !candidateIsNested) {
    return true;
  }

  if (!existingIsNested && candidateIsNested) {
    return false;
  }

  return existing.name.length > candidate.name.length;
}

export const spriteCatalog: FoodSprite[] = Array.from(
  Object.entries(spriteModules)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .reduce((catalog, [path, image]) => {
      const fileNameWithExtension = path.split("/").pop() ?? "";
      const fileName = fileNameWithExtension.replace(/\.[^.]+$/, "");
      const legacyId = LEGACY_SPRITE_ID_BY_FILE_NAME[fileName];

      const sprite: FoodSprite = {
        id: legacyId ?? toGeneratedId(fileName),
        name: toReadableName(fileName),
        image,
      };

      const existing = catalog.get(sprite.id);

      if (!existing || shouldPreferSprite(existing, sprite)) {
        catalog.set(sprite.id, sprite);
      }

      return catalog;
    }, new Map<string, FoodSprite>())
    .values(),
).sort((first, second) => first.name.localeCompare(second.name));
