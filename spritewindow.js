import { getActiveSprite, renderer, withActiveSprite } from "./main.js";
import { spriteManager } from "./pixel-editor-core.js";
import { renderFrames, renderLayers } from "./timeline.js";

const spriteWindow = document.getElementById("sprite-window");

export function displaySpriteBar() {
  spriteWindow.innerHTML = "";
  spriteManager.sprites.forEach((s) => {
    const spriteEl = document.createElement("div");
    spriteEl.classList.add("sprite-name");
    spriteEl.dataset.spriteId = s.id;
    if (s.id === spriteManager.activeSpriteId) {
      spriteEl.classList.add("active");
    }
    const nameTag = document.createElement("span");
    nameTag.classList.add("tagName");
    nameTag.innerText = s.name;

    const crossButton = document.createElement("button");
    crossButton.classList.add("cross-button");
    crossButton.innerText = "X";

    spriteEl.addEventListener("click", () => {
      spriteManager.activeSpriteId = s.id;
      displaySpriteBar();
      withActiveSprite((sprite) => {
        renderLayers(sprite);
        renderFrames(sprite);
        renderer.resize(sprite.width, sprite.height);
      });
    });
    crossButton.addEventListener("click", (e) => {
      e.stopPropagation();

      const closedId = s.id;

      // 1. Remove sprite
      spriteManager.sprites = spriteManager.sprites.filter(
        (sprite) => sprite.id !== closedId
      );

      // 2. Fix active sprite if needed
      if (spriteManager.activeSpriteId === closedId) {
        spriteManager.activeSpriteId = spriteManager.sprites[0]?.id ?? null;
      }

      // 3. Update UI
      displaySpriteBar();

      // 4. Update editor state immediately
      withActiveSprite((sprite) => {
        renderLayers(sprite);
        renderFrames(sprite);
        renderer.resize(sprite.width, sprite.height);
      });
    });
    spriteEl.appendChild(nameTag);
    spriteEl.appendChild(crossButton);
    spriteWindow.appendChild(spriteEl);
  });
}
