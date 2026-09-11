import { useState } from "react";
import { spriteCatalog } from "../../data/spriteCatalog";
import "./SpritePicker.css";
import { NO_SPRITE_ID } from "../../utils/spriteMatcher";

type SpritePickerProps = {
  selectedSpriteId: string;
  onSelectSprite: (spriteId: string) => void;
};

function SpritePicker({ selectedSpriteId, onSelectSprite }: SpritePickerProps) {
  const [isExpanded, setIsExpanded] = useState(() =>
    typeof window === "undefined"
      ? true
      : !window.matchMedia("(max-width: 700px)").matches,
  );

  return (
    <details
      className="sprite-picker"
      open={isExpanded}
      onToggle={(event) => setIsExpanded(event.currentTarget.open)}
    >
      <summary className="sprite-picker__summary">
        <span>Choose a food sprite</span>
        <span aria-hidden="true">{isExpanded ? "▴" : "▾"}</span>
      </summary>

      <fieldset className="sprite-picker__fieldset">
        <legend className="sprite-picker__legend">Food sprite options</legend>

        <div className="sprite-picker__grid">
        <button
          type="button"
          className={`sprite-picker__option sprite-picker__option--none ${
            selectedSpriteId === NO_SPRITE_ID ? "sprite-picker__option--selected" : ""
          }`}
          onClick={() => onSelectSprite(NO_SPRITE_ID)}
          aria-pressed={selectedSpriteId === NO_SPRITE_ID}
          aria-label="Choose no sprite"
        >
          <span className="sprite-picker__none-label">None</span>

          {selectedSpriteId === NO_SPRITE_ID && (
            <span className="sprite-picker__check" aria-hidden="true">
              ✓
            </span>
          )}
        </button>

        {spriteCatalog.map((sprite) => {
          const isSelected = sprite.id === selectedSpriteId;

          return (
            <button
              key={sprite.id}
              type="button"
              className={`sprite-picker__option ${
                isSelected ? "sprite-picker__option--selected" : ""
              }`}
              onClick={() => onSelectSprite(sprite.id)}
              aria-pressed={isSelected}
              aria-label={`Choose ${sprite.name} sprite`}
            >
              <img
                className="sprite-picker__image"
                src={sprite.image}
                alt=""
                width={72}
                height={72}
              />
              <span className="sprite-picker__name">{sprite.name}</span>

              {isSelected && (
                <span className="sprite-picker__check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
        </div>
      </fieldset>
    </details>
  );
}

export default SpritePicker;
