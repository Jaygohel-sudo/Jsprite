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
    spriteEl.appendChild(nameTag);
    spriteEl.appendChild(crossButton);
    spriteWindow.appendChild(spriteEl);
  });
}
