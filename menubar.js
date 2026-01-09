import { renderer, withActiveSprite } from "./main.js";
import { Sprite, spriteManager } from "./pixel-editor-core.js";
import { displaySpriteBar } from "./spritewindow.js";
import { renderFrames, renderLayers } from "./timeline.js";

const menuBtn = document.querySelector(".menu-btn");
const dropdown = document.getElementById("menu-file");
const widthInput = document.getElementById("newFileWidthInput");
const heightInput = document.getElementById("newFileHeightInput");
const nameInput = document.getElementById("newFileNameInput");
const createNewFileButton = document.getElementById("createNewFile");

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  // toggle
  dropdown.classList.toggle("hidden");

  // position under button
  const rect = menuBtn.getBoundingClientRect();
  dropdown.style.left = `${rect.left}px`;
  dropdown.style.top = `${rect.bottom}px`;
});

// click outside → close
document.addEventListener("click", () => {
  dropdown.classList.add("hidden");
});

// Esc → close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    dropdown.classList.add("hidden");
  }
});

// function to open create new file dialog
newFile.addEventListener("click", () => {
  openCreateFileDialog();
});
export async function openCreateFileDialog() {
  newFileDialog.classList.remove("hidden");
  const name = nameInput.value.trim();
  const width = widthInput.value;
  const height = heightInput.value;
  function create() {
    const sprite = new Sprite({ width: width, height: height, name: name });
    spriteManager.sprites.push(sprite);
    spriteManager.activeSpriteId = sprite.id;
    withActiveSprite((sprite) => {
      sprite.addLayer("Layer 1");
      sprite.addFrame();
      renderLayers(sprite);
      renderFrames(sprite);
      renderer.resize(sprite.width, sprite.height);
    });
    displaySpriteBar();
    close();
  }
  function close() {
    newFileDialog.classList.add("hidden");
    createNewFileButton.removeEventListener("click", create);
    cancelNewFile.removeEventListener("click", close);
  }

  createNewFileButton.addEventListener("click", create);
  cancelNewFile.addEventListener("click", close);
}
