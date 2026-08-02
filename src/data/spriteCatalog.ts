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
    "../assets/food sprites/*.{png,jpg,jpeg,webp,gif}",
    "!../assets/food sprites/ChatGPT Image*.png",
    "!../assets/food sprites/ChatGPT Image*.jpg",
    "!../assets/food sprites/ChatGPT Image*.jpeg",
    "!../assets/food sprites/ChatGPT Image*.webp",
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

export const spriteCatalog: FoodSprite[] = Object.entries(spriteModules)
  .map(([path, image]) => {
    const fileNameWithExtension = path.split("/").pop() ?? "";
    const fileName = fileNameWithExtension.replace(/\.[^.]+$/, "");
    const legacyId = LEGACY_SPRITE_ID_BY_FILE_NAME[fileName];

    return {
      id: legacyId ?? toGeneratedId(fileName),
      name: toReadableName(fileName),
      image,
    };
  })
  .sort((first, second) => first.name.localeCompare(second.name));
