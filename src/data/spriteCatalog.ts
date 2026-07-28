import strawberrySprite from "../assets/food sprites/fruit_strawberry.png";
import milkSprite from "../assets/food sprites/coffee_milkjug.png";
import breadSprite from "../assets/food sprites/breadloaf.png";
import butterSprite from "../assets/food sprites/yellowbutterstick.png";
import eggSprite from "../assets/food sprites/eggs_brown.png";

export type FoodSprite = {
  id: string;
  name: string;
  image: string;
};

export const spriteCatalog: FoodSprite[] = [
  {
    id: "strawberry",
    name: "Strawberry",
    image: strawberrySprite,
  },
  {
    id: "milk",
    name: "Milk",
    image: milkSprite,
  },
  {
    id: "bread",
    name: "Bread",
    image: breadSprite,
  },
  {
    id: "butter",
    name: "Butter",
    image: butterSprite,
  },
  {
    id: "egg",
    name: "Eggs",
    image: eggSprite,
  },
];
